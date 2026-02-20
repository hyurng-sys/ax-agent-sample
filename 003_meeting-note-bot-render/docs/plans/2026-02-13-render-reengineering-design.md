# Meeting Note Bot - Render Reengineering Design

**Date:** 2026-02-13
**Status:** Approved
**Original Project:** 005_meeting_note (Railway)
**New Project:** 005-1_meeting_note_render

---

## 1. Background

기존 Discord 회의록 봇을 Railway에서 Render로 마이그레이션하면서 아키텍처를 개선한다.

### 기존 시스템
- Discord 봇 (discord.py) + AI 분석 (LangChain/Gemini) + Notion 저장 + Make.com 이메일
- Railway Background Worker 배포 (Docker, $5/월 크레딧)
- 환경변수 직접 관리, 기본 로깅

### 변경 동기
- Railway 대비 Render 무료 플랜 활용
- 환경변수/로깅/에러핸들링 등 코드 품질 개선
- 인프라를 코드로 관리 (render.yaml)

---

## 2. Architecture

### 2.1 Deployment: Render Web Service + Self-ping

Discord 봇은 WebSocket 기반이라 HTTP 포트가 불필요하지만, Render Web Service(무료)는 포트 바인딩이 필요하다. aiohttp로 경량 HTTP 서버를 병행하여 두 가지 문제를 해결한다:

1. **Render 포트 바인딩 요구사항 충족** — `PORT` 환경변수로 바인딩
2. **15분 sleep 방지** — 13분 간격 self-ping으로 keep-alive

```
main.py (asyncio event loop)
├── Discord Bot (WebSocket)
└── aiohttp Server (:PORT)
    ├── GET /       → 봇 상태 JSON (uptime, 처리 건수)
    ├── GET /health → 200 OK
    └── self-ping task → 13분 간격 자체 요청
```

### 2.2 Config Management: Pydantic BaseSettings

```python
class Settings(BaseSettings):
    # Required
    discord_bot_token: str
    notion_api_key: str
    notion_database_id: str
    llm_provider: str = "google"
    google_api_key: str | None = None
    openai_api_key: str | None = None

    # Optional
    make_webhook_url: str | None = None
    channel_notion_map: dict | None = None

    # Server
    port: int = 10000
    self_ping_interval: int = 780  # 13분 (초)
    render_external_url: str | None = None

    model_config = SettingsConfigDict(env_file=".env")
```

- 시작 시 필수 값 검증 (토큰, API 키)
- LLM 프로바이더에 따른 API 키 존재 여부 확인
- 타입 자동 변환 (str → int, JSON → dict)

### 2.3 Structured Logging

```python
# JSON 포맷 로깅 — Render 로그 대시보드 호환
{
    "timestamp": "2026-02-13T14:30:00Z",
    "level": "INFO",
    "logger": "meeting_bot",
    "message": "Meeting analysis completed",
    "extra": {"file": "meeting_0213.txt", "duration_ms": 4500}
}
```

- 서비스별 named logger (meeting_bot, agent, notion, email, server)
- INFO: 정상 처리 흐름
- WARNING: 선택적 기능 실패 (이메일 등)
- ERROR: 핵심 기능 실패 + 스택 트레이스

### 2.4 Error Handling

기존: try/except + Discord 메시지
개선:
- 서비스별 커스텀 예외 클래스 (AnalysisError, NotionError 등)
- 재시도 로직 (AI 분석 1회 재시도)
- graceful degradation: Notion 실패 시 Discord에 결과 텍스트 직접 전송

---

## 3. Project Structure

```
005-1_meeting_note_render/
├── main.py                    # Entry: 봇 + HTTP 서버 동시 실행
├── server.py                  # aiohttp 웹서버 + self-ping
├── config.py                  # Pydantic BaseSettings
├── requirements.txt
├── Dockerfile
├── render.yaml                # Render Blueprint
├── .env.example
├── .gitignore
│
├── cogs/
│   └── meeting_bot.py         # 기존 + 에러핸들링/로깅 강화
│
├── services/
│   ├── agent_service.py       # AI 분석 (기존 로직 유지)
│   ├── notion_service.py      # Notion 연동 (기존 로직 유지)
│   └── email_service.py       # Make.com (기존 로직 유지)
│
├── utils/
│   ├── logger.py              # JSON 구조화 로깅
│   └── exceptions.py          # 커스텀 예외 클래스
│
├── temp/                      # 임시 파일 (gitignore)
│
└── docs/
    └── plans/
        └── 2026-02-13-render-reengineering-design.md
```

---

## 4. Key Files Detail

### 4.1 main.py
- `asyncio.gather()`로 Discord 봇 + HTTP 서버 동시 실행
- Settings 로드 및 검증
- 로거 초기화
- graceful shutdown 핸들링 (SIGTERM/SIGINT)

### 4.2 server.py
- aiohttp Application 생성
- 라우트: `/`, `/health`
- self-ping: `RENDER_EXTERNAL_URL` 사용하여 자기 자신에게 요청
- 봇 통계 카운터 (처리 건수, 마지막 처리 시각)

### 4.3 render.yaml
```yaml
services:
  - type: web
    name: meeting-note-bot
    runtime: docker
    dockerfilePath: ./Dockerfile
    plan: free
    envVars:
      - key: DISCORD_BOT_TOKEN
        sync: false
      - key: NOTION_API_KEY
        sync: false
      - key: GOOGLE_API_KEY
        sync: false
      # ... 기타 환경변수
```

### 4.4 Dockerfile
- 기존과 동일한 python:3.11-slim 베이스
- `PORT` 환경변수 EXPOSE
- health check 추가

---

## 5. Migration Path

1. 005 프로젝트에서 services/, cogs/ 파일 복사
2. 새 파일 생성: config.py, server.py, utils/
3. main.py 재작성 (HTTP 서버 병행)
4. meeting_bot.py에 로깅/에러핸들링 추가
5. render.yaml + Dockerfile 작성
6. 로컬 테스트 (docker-compose)
7. Render 배포

---

## 6. Cost & Trade-offs

| 항목 | Railway (기존) | Render (신규) |
|------|---------------|--------------|
| 비용 | $5/월 크레딧 | 무료 (self-ping) |
| Sleep | 없음 | self-ping으로 방지 |
| 배포 | git push 자동 | git push 자동 |
| Docker | 지원 | 지원 |
| 로그 | 기본 | 대시보드 제공 |
| 복잡도 | 단순 | HTTP 서버 추가 |

**Trade-off:** 무료를 위해 HTTP 서버를 추가하는 약간의 복잡도 증가. 하지만 health check/모니터링 기능도 함께 얻는 이점이 있음.
