# Discord-Notion 지식 베이스 에이전트

디스코드 채팅방에 아티클 링크나 메모를 남기면, 로컬의 Claude Code가 이를 분석하여 노션(Notion) 데이터베이스에 자동으로 정리해주는 에이전트입니다.

## 📂 프로젝트 구조

```
004_discord_notion_kb/
├── config/
│   └── kb-prompt.md       # Claude에게 부여된 역할 및 처리 지침
├── scripts/
│   └── discord_bot.js     # 디스코드 메시지를 감지하고 Claude를 실행하는 봇
├── .env                   # [필수] API 토큰 설정 파일
├── package.json
└── README.md
```

## 🚀 시작하기

### 1. 사전 준비

1.  **Node.js 패키지 설치**
    ```bash
    cd 004_discord_notion_kb
    npm install
    ```

2.  **환경 변수 설정 (`.env`)**
    `.env` 파일을 열고 다음 정보를 입력하세요:
    - `DISCORD_TOKEN`: [Discord Developer Portal](https://discord.com/developers/applications)에서 봇 생성 후 발급받은 토큰. (Privileged Gateway Intents 중 **MESSAGE CONTENT INTENT**를 꼭 켜야 합니다!)
    - `DISCORD_CHANNEL_ID`: 봇이 활동할 채널 ID (우클릭 -> ID 복사).
    - `NOTION_DATABASE_ID`: 데이터가 저장될 노션 데이터베이스 ID.

### 2. 노션 데이터베이스 준비

노션에 새 데이터베이스를 만들고 다음 속성(Property)을 추가하세요:

| 속성명 | 유형 | 비고 |
|---|---|---|
| **Name** | Title | 페이지 제목 |
| **Category** | Select | [기술, 디자인, 비즈니스, 뉴스, 메모] 등 |
| **Tags** | Multi-select | 핵심 키워드 |
| **URL** | URL | 원본 링크 |
| **Status** | Select | 기본값 'To Read' |

### 3. 실행

```bash
node scripts/discord_bot.js
```

### 4. 사용법

디스코드 채널에서 다음과 같이 입력하세요:

- **링크 저장**: `!kb https://example.com/interesting-article`
- **메모 저장**: `!kb 다음 주 회의 아이디어: AI 에이전트 고도화 방안`

봇이 "Processing..." 이라고 응답한 후, 잠시 뒤 노션 저장 결과 링크를 회신합니다.

---

## ⚠️ 주의사항

- 이 봇은 **로컬 컴퓨터**에서 `claude` 명령어를 실행합니다. 컴퓨터가 켜져 있어야 동작합니다.
- `claude` CLI가 설치되어 있고, 로그인이 되어 있어야 합니다 (`claude login`).
- Notion MCP 서버가 `claude`에 등록되어 있어야 합니다 (`claude mcp list`로 확인).
