# 디스코드 봇 토큰 발급 가이드

디스코드 봇을 만들고 토큰을 발급받는 과정을 단계별로 설명합니다.

## 1단계: 디스코드 개발자 포털 접속
1. [Discord Developer Portal](https://discord.com/developers/applications)에 접속합니다.
2. 우측 상단의 **New Application** 버튼을 클릭합니다.
3. **Name**에 봇 이름(예: `MyKnowledgeBot`)을 입력하고 체크박스에 동의한 뒤 **Create**를 클릭합니다.

## 2단계: 봇 생성
1. 왼쪽 메뉴에서 **Bot**을 클릭합니다.
2. **Reset Token** 버튼이 보이면 이미 봇이 생성된 상태입니다. 만약 _"Add Bot"_ 버튼이 보이면 클릭하여 봇을 생성합니다.
3. `Username` 항목에서 봇의 이름을 수정할 수 있습니다.

## 3단계: 토큰 발급 (가장 중요!)
1. **Build-A-Bot** 섹션의 **Token** 항목 아래에 있는 **Reset Token** 버튼을 클릭합니다.
2. "Yes, do it!"을 클릭하여 토큰을 재설정합니다.
3. 생성된 **긴 문자열(Token)**을 복사합니다. **이것이 `.env` 파일의 `DISCORD_TOKEN`에 들어갈 값입니다.**
   - *주의: 이 화면을 벗어나면 토큰을 다시 볼 수 없으니 즉시 복사해서 저장하세요.*

## 4단계: 권한 설정 (Intents) - 필수!
1. 같은 **Bot** 페이지에서 스크롤을 아래로 내립니다.
2. **Privileged Gateway Intents** 섹션을 찾습니다.
3. 다음 세 가지 항목을 **모두 활성화(체크)**합니다:
   - ✅ **PRESENCE INTENT**
   - ✅ **SERVER MEMBERS INTENT**
   - ✅ **MESSAGE CONTENT INTENT** (이것이 꺼져 있으면 봇이 메시지를 읽지 못합니다!)
4. 하단의 **Save Changes** 버튼을 클릭하여 저장합니다.

## 5단계: 서버에 봇 초대하기
1. 왼쪽 메뉴에서 **OAuth2** -> **URL Generator**를 클릭합니다.
2. **SCOPES** 항목에서 `bot`을 체크합니다.
3. **BOT PERMISSIONS** 항목이 나타나면 다음 권한을 체크합니다:
   - `Read Messages/View Channels`
   - `Send Messages`
   - `Embed Links` (링크 미리보기용)
   - `Attach Files` (필요시)
   - `Read Message History`
4. 맨 아래에 생성된 **Generated URL**을 복사합니다.
5. 브라우저 주소창에 이 URL을 붙여넣고 엔터를 칩니다.
6. 봇을 초대할 서버(채널이 있는 서버)를 선택하고 **Authorize**를 클릭합니다.

이제 `.env` 파일의 `DISCORD_TOKEN` 부분에 복사한 토큰을 붙여넣으시면 됩니다.
