# Meeting Note Bot (Render Edition)

Discord 파일 업로드 → AI 분석 → Notion 회의록 자동 생성 봇

## 주요 기능

- Discord 채널에 `.txt` / `.md` 파일 업로드 시 자동 감지
- Google Gemini 2.0-Flash (또는 OpenAI GPT-4) 기반 AI 회의록 분석
- Notion 페이지 자동 생성 (채널별 맞춤 설정 가능)
- Make.com 웹훅 이메일 알림 (선택)
- Render 무료 플랜 배포 (self-ping으로 24/7 가동)

## 아키텍처

```
main.py (asyncio event loop)
├── Discord Bot (WebSocket) ─── cogs/meeting_bot.py
│   ├── services/agent_service.py   (AI 분석)
│   ├── services/notion_service.py  (Notion 저장)
│   └── services/email_service.py   (Make.com 이메일)
└── aiohttp Server (:PORT)
    ├── GET /       → 봇 상태 JSON
    ├── GET /health → 200 OK (Render health check)
    └── self-ping   → 13분 간격 keep-alive
```

## 프로젝트 구조

```
005-1_meeting_note_render/
├── main.py              # Entry point
├── config.py            # Pydantic BaseSettings 환경변수 관리
├── server.py            # HTTP 서버 + self-ping
├── requirements.txt
├── Dockerfile
├── render.yaml          # Render Blueprint
├── docker-compose.yml   # 로컬 개발용
├── .env.example
│
├── cogs/
│   └── meeting_bot.py   # Discord 이벤트 핸들러
├── services/
│   ├── agent_service.py # AI 분석 (LangChain)
│   ├── notion_service.py# Notion API
│   └── email_service.py # Make.com 웹훅
├── utils/
│   ├── logger.py        # JSON 구조화 로깅
│   └── exceptions.py    # 커스텀 예외
└── temp/                # 임시 파일
```

## 로컬 개발

### 사전 준비

1. Python 3.11+
2. `.env` 파일 생성 (`.env.example` 참고)

### 실행

```bash
# 직접 실행
pip install -r requirements.txt
python main.py

# Docker로 실행
docker-compose up --build
```

### 환경변수

| 변수 | 필수 | 설명 |
|------|------|------|
| `DISCORD_BOT_TOKEN` | O | Discord 봇 토큰 |
| `NOTION_API_KEY` | O | Notion Integration 키 |
| `NOTION_DATABASE_ID` | O | Notion 페이지 ID |
| `LLM_PROVIDER` | O | `google` 또는 `openai` |
| `GOOGLE_API_KEY` | △ | LLM_PROVIDER=google일 때 필수 |
| `OPENAI_API_KEY` | △ | LLM_PROVIDER=openai일 때 필수 |
| `MAKE_WEBHOOK_URL` | X | Make.com 웹훅 URL |
| `CHANNEL_NOTION_MAP` | X | 채널별 Notion 매핑 (JSON) |
| `PORT` | X | HTTP 서버 포트 (기본: 10000) |
| `RENDER_EXTERNAL_URL` | X | Render 자동 설정, self-ping용 |
| `SELF_PING_INTERVAL` | X | Self-ping 간격 초 (기본: 780) |

## Render 배포

### 방법 1: Blueprint (추천)

1. GitHub에 코드 push
2. Render Dashboard → **New** → **Blueprint**
3. 리포지토리 연결 → `render.yaml` 자동 감지
4. 환경변수 입력
5. 배포 완료

### 방법 2: 수동 배포

1. Render Dashboard → **New** → **Web Service**
2. GitHub 리포지토리 연결
3. **Environment**: `Docker`
4. **Plan**: `Free`
5. **Health Check Path**: `/health`
6. 환경변수 설정
7. 배포

### 배포 후 확인

- `https://your-app.onrender.com/health` → `OK`
- `https://your-app.onrender.com/` → 봇 상태 JSON
- Discord 채널에 파일 업로드 테스트

## 비용

| 항목 | 비용 |
|------|------|
| Render (Free Plan) | 무료 |
| Google Gemini API | 무료 티어 (1,500 req/day) |
| Discord | 무료 |
| Notion | 무료 |
| Make.com | 무료 티어 |

## 트러블슈팅

### 봇이 응답하지 않음
- Render 로그 확인 (`Dashboard → Logs`)
- `DISCORD_BOT_TOKEN` 유효한지 확인
- Discord Developer Portal에서 MESSAGE CONTENT INTENT 활성화 확인

### Notion 저장 실패
- `NOTION_API_KEY`와 `NOTION_DATABASE_ID` 확인
- Notion Integration이 해당 페이지에 연결되어 있는지 확인

### Self-ping 실패
- `RENDER_EXTERNAL_URL`이 자동 설정되지 않으면 수동 입력
- 형식: `https://your-app-name.onrender.com`

### 15분 후 봇 꺼짐
- `RENDER_EXTERNAL_URL` 환경변수 확인
- Render 로그에서 "Self-ping" 로그 확인

## 기존 Railway 프로젝트와의 차이

| 항목 | Railway (005) | Render (005-1) |
|------|--------------|----------------|
| 배포 방식 | Background Worker | Web Service + self-ping |
| 비용 | $5/월 크레딧 | 무료 |
| 환경변수 관리 | os.getenv() | Pydantic BaseSettings |
| 로깅 | 기본 format | JSON 구조화 |
| 에러핸들링 | 단일 try/except | 서비스별 커스텀 예외 |
| Health Check | 없음 | /health 엔드포인트 |
| 모니터링 | Railway 대시보드 | / 엔드포인트 + Render 로그 |
