# Project: AX Agent Sample

혈당 관리 웹 애플리케이션

## Superpowers 활성화

이 프로젝트는 **Superpowers 스킬셋**을 사용합니다.

### 핵심 원칙

1. **스킬 우선 실행**: 작업을 시작하기 전에 관련 스킬이 있는지 확인하고 반드시 사용
2. **테스트 주도 개발(TDD)**: 코드 작성 전 테스트 작성
3. **체계적 접근**: 임시방편이 아닌 체계적인 프로세스 사용
4. **검증 우선**: 주장보다 증거를 우선

### 사용 가능한 스킬

프로젝트의 `.claude/skills/` 디렉토리에 다음 스킬들이 설치되어 있습니다:

#### 🧠 기획 및 협업
- **brainstorming** - 코드 작성 전 요구사항 정리 및 설계
- **writing-plans** - 구현 계획 수립
- **executing-plans** - 계획 실행
- **dispatching-parallel-agents** - 병렬 서브에이전트 워크플로우
- **subagent-driven-development** - 서브에이전트 기반 빠른 개발

#### 🧪 개발 및 테스트
- **test-driven-development** - RED-GREEN-REFACTOR 사이클
- **verification-before-completion** - 완료 전 검증

#### 🔍 디버깅
- **systematic-debugging** - 체계적인 디버깅 프로세스

#### 👥 코드 리뷰
- **requesting-code-review** - 코드 리뷰 요청
- **receiving-code-review** - 코드 리뷰 피드백 대응

#### 🌿 Git 워크플로우
- **using-git-worktrees** - Git worktree 활용
- **finishing-a-development-branch** - 브랜치 완료 처리

#### 📚 메타
- **using-superpowers** - Superpowers 시스템 소개
- **writing-skills** - 새로운 스킬 작성

### 워크플로우

1. **요구사항 수집** → `brainstorming` 스킬
2. **계획 수립** → `writing-plans` 스킬
3. **개발** → `test-driven-development` + `subagent-driven-development` 스킬
4. **디버깅** → `systematic-debugging` 스킬
5. **코드 리뷰** → `requesting-code-review` 스킬
6. **완료** → `finishing-a-development-branch` 스킬

### 규칙

**스킬 사용은 선택이 아닙니다.**

- 관련 스킬이 있다면 반드시 사용
- 1%라도 해당될 가능성이 있으면 스킬 확인
- 질문이나 응답 전에 먼저 스킬 체크
- "간단한 작업이라" 건너뛰지 않기

## 프로젝트 정보

**기술 스택:**
- HTML, CSS, JavaScript (Vanilla)
- localStorage (클라이언트 사이드 데이터 저장)
- Canvas API (차트 시각화)

**배포:**
- GitHub: https://github.com/hyurng-sys/ax-agent-sample
- Vercel: https://ax-agent-sample.vercel.app

**자동 배포:**
- main 브랜치에 푸시하면 Vercel이 자동으로 재배포
