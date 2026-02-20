# Meeting Note Bot Render Reengineering Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Railway 기반 Discord 회의록 봇을 Render Web Service로 마이그레이션하면서 config 관리, 로깅, 에러핸들링을 개선한다.

**Architecture:** Discord 봇과 aiohttp HTTP 서버를 하나의 asyncio 이벤트 루프에서 병행 실행. HTTP 서버는 Render 포트 바인딩 요구사항을 충족하고, 13분 간격 self-ping으로 무료 플랜의 15분 sleep을 방지한다. Pydantic BaseSettings로 환경변수를 중앙 관리하고, JSON 구조화 로깅을 적용한다.

**Tech Stack:** Python 3.11, discord.py, aiohttp, LangChain, Pydantic BaseSettings, Docker, Render

**Source Project:** `/Users/hh/Library/CloudStorage/GoogleDrive-davidlikessangria@gmail.com/My Drive/Python/000_Deploy/005_meeting_note/`
**Target Project:** `/Users/hh/Library/CloudStorage/GoogleDrive-davidlikessangria@gmail.com/My Drive/Python/005-1_meeting_note_render/`

---

## Task 1: Project Scaffolding

**Files:**
- Create: `005-1_meeting_note_render/` directory structure
- Copy: `services/agent_service.py`, `services/notion_service.py`, `services/email_service.py`, `cogs/meeting_bot.py` from source

**Step 1: Create directory structure**

```bash
cd "/Users/hh/Library/CloudStorage/GoogleDrive-davidlikessangria@gmail.com/My Drive/Python"
mkdir -p 005-1_meeting_note_render/{cogs,services,utils,temp}
touch 005-1_meeting_note_render/utils/__init__.py
touch 005-1_meeting_note_render/services/__init__.py
touch 005-1_meeting_note_render/cogs/__init__.py
touch 005-1_meeting_note_render/temp/.gitkeep
```

**Step 2: Copy service files from source project**

```bash
SRC="000_Deploy/005_meeting_note"
DST="005-1_meeting_note_render"

cp "$SRC/services/agent_service.py" "$DST/services/"
cp "$SRC/services/notion_service.py" "$DST/services/"
cp "$SRC/services/email_service.py" "$DST/services/"
cp "$SRC/cogs/meeting_bot.py" "$DST/cogs/"
```

---

## Task 2: Config Module (config.py)

**Files:**
- Create: `config.py`

**Step 1: Create config.py with Pydantic BaseSettings**

```python
import json
import logging
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator, model_validator

logger = logging.getLogger("Config")


class Settings(BaseSettings):
    """Central configuration with validation."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Discord
    discord_bot_token: str

    # Notion
    notion_api_key: str
    notion_database_id: str

    # LLM
    llm_provider: str = "google"
    google_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None

    # Make.com (optional)
    make_webhook_url: Optional[str] = None

    # Channel mapping (optional)
    channel_notion_map: Optional[str] = None

    # Server / Render
    port: int = 10000
    render_external_url: Optional[str] = None
    self_ping_interval: int = 780  # 13 minutes in seconds

    @model_validator(mode="after")
    def validate_llm_keys(self):
        if self.llm_provider == "google" and not self.google_api_key:
            raise ValueError("GOOGLE_API_KEY is required when LLM_PROVIDER=google")
        if self.llm_provider == "openai" and not self.openai_api_key:
            raise ValueError("OPENAI_API_KEY is required when LLM_PROVIDER=openai")
        return self

    def get_channel_notion_map(self) -> dict:
        if not self.channel_notion_map:
            return {}
        try:
            return json.loads(self.channel_notion_map)
        except json.JSONDecodeError:
            logger.warning("Invalid CHANNEL_NOTION_MAP JSON, using empty mapping")
            return {}


# Singleton
_settings: Optional[Settings] = None


def get_settings() -> Settings:
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings
```

**Step 2: Add pydantic-settings to requirements**

Note: `pydantic-settings` is a separate package from `pydantic>=2.0`.

---

## Task 3: Structured Logging (utils/logger.py)

**Files:**
- Create: `utils/logger.py`

**Step 1: Create JSON structured logger**

```python
import logging
import json
import sys
from datetime import datetime, timezone


class JsonFormatter(logging.Formatter):
    """JSON log formatter for Render dashboard compatibility."""

    def format(self, record):
        log_data = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if record.exc_info and record.exc_info[0]:
            log_data["exception"] = self.formatException(record.exc_info)
        if hasattr(record, "extra_data"):
            log_data["extra"] = record.extra_data
        return json.dumps(log_data, ensure_ascii=False)


def setup_logging(level: str = "INFO"):
    """Configure root logger with JSON formatter."""
    root = logging.getLogger()
    root.setLevel(getattr(logging, level.upper(), logging.INFO))

    # Clear existing handlers
    root.handlers.clear()

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonFormatter())
    root.addHandler(handler)

    # Suppress noisy libraries
    logging.getLogger("discord").setLevel(logging.WARNING)
    logging.getLogger("aiohttp").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
```

---

## Task 4: Custom Exceptions (utils/exceptions.py)

**Files:**
- Create: `utils/exceptions.py`

**Step 1: Create exception classes**

```python
class MeetingBotError(Exception):
    """Base exception for Meeting Bot."""
    pass


class AnalysisError(MeetingBotError):
    """AI analysis failed."""
    pass


class NotionError(MeetingBotError):
    """Notion API operation failed."""
    pass


class EmailError(MeetingBotError):
    """Email/webhook delivery failed."""
    pass


class ConfigError(MeetingBotError):
    """Configuration validation failed."""
    pass
```

---

## Task 5: HTTP Server + Self-ping (server.py)

**Files:**
- Create: `server.py`

**Step 1: Create aiohttp web server with health check and self-ping**

```python
import asyncio
import logging
import time
from aiohttp import web, ClientSession

logger = logging.getLogger("Server")

# Bot statistics (updated by meeting_bot cog)
bot_stats = {
    "start_time": None,
    "meetings_processed": 0,
    "last_processed_at": None,
    "bot_ready": False,
}


async def handle_root(request):
    uptime = None
    if bot_stats["start_time"]:
        uptime = int(time.time() - bot_stats["start_time"])
    return web.json_response({
        "service": "meeting-note-bot",
        "status": "running",
        "bot_ready": bot_stats["bot_ready"],
        "uptime_seconds": uptime,
        "meetings_processed": bot_stats["meetings_processed"],
        "last_processed_at": bot_stats["last_processed_at"],
    })


async def handle_health(request):
    return web.Response(text="OK", status=200)


async def self_ping(url: str, interval: int):
    """Periodically ping own URL to prevent Render free plan sleep."""
    logger.info(f"Self-ping started: interval={interval}s, url={url}")
    await asyncio.sleep(60)  # Wait 1 min after startup
    async with ClientSession() as session:
        while True:
            try:
                await asyncio.sleep(interval)
                async with session.get(f"{url}/health") as resp:
                    logger.info(f"Self-ping: status={resp.status}")
            except asyncio.CancelledError:
                logger.info("Self-ping task cancelled")
                break
            except Exception as e:
                logger.warning(f"Self-ping failed: {e}")


def create_app() -> web.Application:
    app = web.Application()
    app.router.add_get("/", handle_root)
    app.router.add_get("/health", handle_health)
    return app


async def start_server(port: int, render_url: str = None, ping_interval: int = 780):
    """Start HTTP server and optional self-ping task."""
    app = create_app()
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, "0.0.0.0", port)
    await site.start()
    logger.info(f"HTTP server started on port {port}")

    bot_stats["start_time"] = time.time()

    # Start self-ping if Render URL is available
    ping_task = None
    if render_url:
        ping_task = asyncio.create_task(self_ping(render_url, ping_interval))

    return runner, ping_task
```

---

## Task 6: Main Entry Point (main.py)

**Files:**
- Create: `main.py`

**Step 1: Rewrite main.py to run bot + HTTP server concurrently**

```python
import asyncio
import signal
import logging
import discord
from discord.ext import commands

from config import get_settings, Settings
from utils.logger import setup_logging
from server import start_server

logger = logging.getLogger("Main")


async def main():
    # 1. Setup logging
    setup_logging()

    # 2. Load & validate config
    try:
        settings = get_settings()
        logger.info("Configuration loaded and validated")
    except Exception as e:
        logger.error(f"Configuration error: {e}")
        return

    # 3. Start HTTP server (for Render port binding + health check)
    runner, ping_task = await start_server(
        port=settings.port,
        render_url=settings.render_external_url,
        ping_interval=settings.self_ping_interval,
    )

    # 4. Setup Discord bot
    intents = discord.Intents.default()
    intents.message_content = True
    bot = commands.Bot(command_prefix="!", intents=intents)

    await bot.load_extension("cogs.meeting_bot")
    logger.info("Starting Meeting Note Bot...")

    # 5. Graceful shutdown
    loop = asyncio.get_running_loop()
    shutdown_event = asyncio.Event()

    def handle_signal():
        logger.info("Shutdown signal received")
        shutdown_event.set()

    for sig in (signal.SIGTERM, signal.SIGINT):
        loop.add_signal_handler(sig, handle_signal)

    # 6. Run bot
    try:
        async with bot:
            bot_task = asyncio.create_task(bot.start(settings.discord_bot_token))
            shutdown_task = asyncio.create_task(shutdown_event.wait())

            done, pending = await asyncio.wait(
                [bot_task, shutdown_task],
                return_when=asyncio.FIRST_COMPLETED,
            )

            for task in pending:
                task.cancel()
    finally:
        if ping_task:
            ping_task.cancel()
        await runner.cleanup()
        logger.info("Cleanup complete")


if __name__ == "__main__":
    asyncio.run(main())
```

---

## Task 7: Update meeting_bot.py (Error Handling + Logging + Stats)

**Files:**
- Modify: `cogs/meeting_bot.py`

**Step 1: Update imports and add stats tracking**

Changes to apply on top of the copied file:

1. Add import for `server.bot_stats`
2. Add import for custom exceptions
3. Update `on_ready` to set `bot_stats["bot_ready"] = True`
4. Wrap AI analysis in `AnalysisError`
5. Wrap Notion save in `NotionError`
6. Wrap email in `EmailError` (non-fatal)
7. Increment `bot_stats["meetings_processed"]` on success
8. Add structured logging with context (filename, channel, duration)

Key changes:

```python
# At top of file, add:
import time
from server import bot_stats
from utils.exceptions import AnalysisError, NotionError, EmailError

# In on_ready:
async def on_ready(self):
    bot_stats["bot_ready"] = True
    logger.info("Meeting Note Bot Cog loaded and ready.")

# In on_message try block, wrap each step:
# AI Analysis
try:
    analysis_result = await self.agent_service.analyze_meeting(content, combined_prompt)
except Exception as e:
    raise AnalysisError(f"AI analysis failed: {e}") from e

# Notion Save
try:
    notion_url = await self.notion_service.create_page(analysis_result, str(message.channel.id))
except Exception as e:
    raise NotionError(f"Notion save failed: {e}") from e

# Email (non-fatal, catch separately)
try:
    make_success, make_msg = await self.email_service.send_email(analysis_result, notion_url)
except Exception as e:
    logger.warning(f"Email failed (non-fatal): {e}")
    make_success, make_msg = False, str(e)

# After success:
bot_stats["meetings_processed"] += 1
bot_stats["last_processed_at"] = datetime.now().isoformat()

# In except block, differentiate errors:
except AnalysisError as e:
    logger.error(f"Analysis failed for {attachment.filename}: {e}", exc_info=True)
    await status_msg.edit(content=f"❌ AI 분석 실패: {str(e)[:100]}")
    await message.add_reaction("❌")
except NotionError as e:
    logger.error(f"Notion save failed for {attachment.filename}: {e}", exc_info=True)
    await status_msg.edit(content=f"❌ Notion 저장 실패: {str(e)[:100]}")
    await message.add_reaction("❌")
except Exception as e:
    logger.error(f"Unexpected error for {attachment.filename}: {e}", exc_info=True)
    await status_msg.edit(content=f"❌ Error: {str(e)[:100]}")
    await message.add_reaction("❌")
```

---

## Task 8: Update services to use config module

**Files:**
- Modify: `services/agent_service.py` — replace `os.getenv` with `get_settings()`
- Modify: `services/notion_service.py` — replace `os.getenv` with `get_settings()`
- Modify: `services/email_service.py` — replace `os.getenv` with `get_settings()`

**Step 1: agent_service.py**

Replace `__init__` of `AgentService`:
```python
from config import get_settings

class AgentService:
    def __init__(self):
        settings = get_settings()
        self.llm_provider = settings.llm_provider

        if self.llm_provider == "google":
            self.llm = ChatGoogleGenerativeAI(
                model="gemini-2.0-flash",
                google_api_key=settings.google_api_key,
                temperature=0.1,
            )
        elif self.llm_provider == "openai":
            self.llm = ChatOpenAI(
                model="gpt-4-turbo",
                api_key=settings.openai_api_key,
                temperature=0.1,
            )
        else:
            raise ValueError(f"Invalid LLM_PROVIDER: {self.llm_provider}")

        self.parser = PydanticOutputParser(pydantic_object=MeetingAnalysis)
        self.email_parser = PydanticOutputParser(pydantic_object=EmailSummary)
```

**Step 2: notion_service.py**

Replace `__init__` of `NotionService`:
```python
from config import get_settings

class NotionService:
    def __init__(self):
        settings = get_settings()
        self.default_api_key = settings.notion_api_key
        self.default_page_id = settings.notion_database_id
        self.default_client = AsyncClient(auth=self.default_api_key)
        self.channel_map = settings.get_channel_notion_map()
        logger.info(f"Loaded channel mapping: {len(self.channel_map)} channels")
```

Remove `_load_channel_mapping` method (logic moved to `config.py`).

**Step 3: email_service.py**

Replace `__init__` of `EmailService`:
```python
from config import get_settings

class EmailService:
    def __init__(self):
        settings = get_settings()
        self.webhook_url = settings.make_webhook_url
        logger.info(f"EmailService initialized: webhook_url_set={bool(self.webhook_url)}")
        if not self.webhook_url:
            logger.warning("MAKE_WEBHOOK_URL is not set. Email service will not work.")
```

---

## Task 9: Dockerfile for Render

**Files:**
- Create: `Dockerfile`

**Step 1: Write Render-optimized Dockerfile**

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# System dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# App code
COPY . .

# Temp directory
RUN mkdir -p temp

ENV PYTHONUNBUFFERED=1

# Render provides PORT env var
EXPOSE ${PORT:-10000}

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:${PORT:-10000}/health')" || exit 1

CMD ["python", "main.py"]
```

---

## Task 10: Render Blueprint (render.yaml)

**Files:**
- Create: `render.yaml`

**Step 1: Write render.yaml**

```yaml
services:
  - type: web
    name: meeting-note-bot
    runtime: docker
    dockerfilePath: ./Dockerfile
    plan: free
    healthCheckPath: /health
    envVars:
      - key: DISCORD_BOT_TOKEN
        sync: false
      - key: NOTION_API_KEY
        sync: false
      - key: NOTION_DATABASE_ID
        sync: false
      - key: LLM_PROVIDER
        value: google
      - key: GOOGLE_API_KEY
        sync: false
      - key: OPENAI_API_KEY
        sync: false
      - key: MAKE_WEBHOOK_URL
        sync: false
      - key: CHANNEL_NOTION_MAP
        sync: false
      - key: RENDER_EXTERNAL_URL
        fromService:
          type: web
          name: meeting-note-bot
          property: host
```

---

## Task 11: Supporting Files

**Files:**
- Create: `requirements.txt`
- Create: `.env.example`
- Create: `.gitignore`
- Create: `.dockerignore`

**Step 1: requirements.txt**

```
discord.py>=2.0.0
python-dotenv>=1.0.0
notion-client>=2.0.0
langchain>=0.1.0
langchain-core>=0.1.0
langchain-google-genai>=1.0.0
langchain-openai>=0.1.0
pydantic>=2.0.0
pydantic-settings>=2.0.0
aiohttp>=3.9.0
```

**Step 2: .env.example**

```
# Discord Bot
DISCORD_BOT_TOKEN=your_discord_bot_token_here

# Notion
NOTION_API_KEY=your_notion_api_key_here
NOTION_DATABASE_ID=your_notion_page_id_here

# AI (google or openai)
LLM_PROVIDER=google
GOOGLE_API_KEY=your_google_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# Make.com Email (optional)
MAKE_WEBHOOK_URL=your_make_webhook_url_here

# Channel-specific Notion mapping (optional, JSON)
# CHANNEL_NOTION_MAP={"channel_id":{"api_key":"...","page_id":"..."}}

# Render (auto-set by Render, or set manually for local dev)
# PORT=10000
# RENDER_EXTERNAL_URL=https://your-app.onrender.com
# SELF_PING_INTERVAL=780
```

**Step 3: .gitignore**

```
# Environment
.env
.env.production
.env.local

# Python
__pycache__/
*.pyc
*.pyo
*.egg-info/
dist/
build/
*.egg

# Temp files
temp/*
!temp/.gitkeep
*.log

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Docker
docker-compose.override.yml
```

**Step 4: .dockerignore**

```
.git
.gitignore
.env*
!.env.example
__pycache__
*.pyc
.DS_Store
temp/*
!temp/.gitkeep
*.md
docs/
```

---

## Task 12: Local Development docker-compose.yml

**Files:**
- Create: `docker-compose.yml`

**Step 1: Write docker-compose.yml**

```yaml
services:
  meeting-bot:
    build: .
    restart: always
    env_file: .env
    environment:
      - PORT=10000
    ports:
      - "10000:10000"
    volumes:
      - ./temp:/app/temp
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
```

---

## Task 13: Deploy Guide (README.md)

**Files:**
- Create: `README.md`

**Step 1: Write deployment guide**

Include sections:
1. 프로젝트 개요
2. 로컬 개발 환경 설정 (`docker-compose up`)
3. Render 배포 방법 (Blueprint 또는 수동)
4. 환경변수 설명
5. 아키텍처 다이어그램
6. 트러블슈팅

---

## Execution Order

1. Task 1: Scaffolding (copy files)
2. Task 2: config.py
3. Task 3: utils/logger.py
4. Task 4: utils/exceptions.py
5. Task 5: server.py
6. Task 6: main.py
7. Task 7: meeting_bot.py 수정
8. Task 8: services 수정 (config 연동)
9. Task 9: Dockerfile
10. Task 10: render.yaml
11. Task 11: requirements.txt, .env.example, .gitignore, .dockerignore
12. Task 12: docker-compose.yml
13. Task 13: README.md
