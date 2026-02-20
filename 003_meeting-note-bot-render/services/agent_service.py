import logging
from config import get_settings
from typing import List, Optional
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field

logger = logging.getLogger("AgentService")

# --- Pydantic Models ---

class DiscussionTopic(BaseModel):
    topic_title: str = Field(description="핵심 논점 제목")
    content: str = Field(description="해당 논점에 대한 서술형 요약. 배경/맥락, 논의 내용, 사업적 의미, 리스크를 자연스럽게 녹여서 팩트 기반으로 작성. 소제목 없이 문단 형태로.")

class DecisionStructureItem(BaseModel):
    category: str = Field(description="구분")
    subject: str = Field(description="주체")
    influence: str = Field(description="영향력")
    criteria: str = Field(description="기준")
    comment: str = Field(description="코멘트")

class ActionItem(BaseModel):
    subject: str = Field(description="주체 (담당자)")
    action: str = Field(description="액션 내용")
    due_date: str = Field(description="기한 (없으면 '미정')")
    purpose: str = Field(description="목적")
    risk: str = Field(description="리스크")

# --- 이메일용 간결한 요약 모델 ---
class EmailActionItem(BaseModel):
    task: str = Field(description="할 일")
    assignee: str = Field(description="담당자")

class EmailSummary(BaseModel):
    meeting_title: str = Field(description="회의 제목")
    meeting_date: str = Field(description="회의 일시")
    executive_summary: str = Field(description="핵심 요약 (2-3문장)")
    key_points: List[str] = Field(description="핵심 포인트 3-5개 (한 줄씩)")
    decisions: List[str] = Field(description="주요 결정사항")
    next_actions: List[EmailActionItem] = Field(description="Next Action 항목")

    def to_email_body(self) -> str:
        """이메일 본문용 마크다운 형식 생성"""
        body = f"# {self.meeting_title}\n\n"
        body += f"**일시:** {self.meeting_date}\n\n"
        body += "---\n\n"

        body += "## 핵심 요약\n\n"
        body += f"{self.executive_summary}\n\n"

        body += "---\n\n"
        body += "## 핵심 포인트\n\n"
        for point in self.key_points:
            body += f"- {point}\n"

        body += "\n---\n\n"
        body += "## 결정사항\n\n"
        if self.decisions:
            for decision in self.decisions:
                body += f"- {decision}\n"
        else:
            body += "- 없음\n"

        body += "\n---\n\n"
        body += "## Next Action\n\n"
        if self.next_actions:
            for item in self.next_actions:
                body += f"- [ ] {item.task} (@{item.assignee})\n"
        else:
            body += "- 없음\n"

        return body

class MeetingAnalysis(BaseModel):
    meeting_title: str = Field(description="회의 제목. 형식: YYYYMMDD_고객명_회의내용1줄요약 관련 회의. 고객명 우선순위: 사용자입력>파일명>내용추론. 추론 불가시에만 '고객사명미기재' 사용.")
    meeting_date: str = Field(description="회의 일시")
    attendees: List[str] = Field(description="참석자 목록")
    meeting_purpose: str = Field(description="회의 목적")

    executive_summary: List[str] = Field(description="핵심 요약 (10-15줄 전략 요약. 사업적 의미, 승부 포인트, 주요 리스크, 향후 분기점 포함)")

    discussions: List[DiscussionTopic] = Field(description="주요 논의 내용 (논점별 분리, 각 논점마다 배경/고객vs내부/사업적의미/리스크 포함)")

    decision_structure: List[DecisionStructureItem] = Field(default=[], description="의사결정 구조 및 평가 기준 (있는 경우)")

    key_risks: List[str] = Field(description="핵심 리스크 목록")

    decisions: List[str] = Field(description="결정사항 (확정 사항, 방향성 합의, 미확정이나 유력한 방향)")

    action_items: List[ActionItem] = Field(description="Next Action (주체/액션/기한/목적/리스크)")

    def to_markdown(self) -> str:
        """Converts the analysis to the strategic meeting note Markdown format."""
        md = f"# {self.meeting_title}\n\n"

        # 1. 회의 개요
        md += "## 1. 회의 개요 (Meeting Overview)\n\n"
        md += "| 항목 | 내용 |\n| --- | --- |\n"
        md += f"| 회의 제목 | {self.meeting_title} |\n"
        md += f"| 회의 일시 | {self.meeting_date} |\n"
        md += f"| 참석자 | {', '.join(self.attendees)} |\n"
        md += f"| 회의 목적 | {self.meeting_purpose} |\n\n"

        # 2. 핵심 요약
        md += "## 2. 핵심 요약 (Executive Summary)\n\n"
        for point in self.executive_summary:
            md += f"- {point}\n"
        md += "\n"

        # 3. 주요 논의 내용
        md += "## 3. 주요 논의 내용 (Discussion Summary)\n\n"
        for i, topic in enumerate(self.discussions, 1):
            md += f"### 주제 {i}: {topic.topic_title}\n\n"
            md += f"{topic.content}\n\n"

        # 4. 의사결정 구조
        md += "## 4. 의사결정 구조 및 평가 기준 (Decision Structure)\n\n"
        if self.decision_structure:
            md += "| 구분 | 주체 | 영향력 | 기준 | 코멘트 |\n"
            md += "|------|------|--------|------|--------|\n"
            for item in self.decision_structure:
                md += f"| {item.category} | {item.subject} | {item.influence} | {item.criteria} | {item.comment} |\n"
        else:
            md += "- 해당 없음\n"
        md += "\n"

        # 5. 핵심 리스크
        md += "## 5. 핵심 리스크 (Key Risks)\n\n"
        if self.key_risks:
            for risk in self.key_risks:
                md += f"- {risk}\n"
        else:
            md += "- 없음\n"
        md += "\n"

        # 6. 결정사항
        md += "## 6. 결정사항 (Decisions)\n\n"
        if self.decisions:
            for decision in self.decisions:
                md += f"- {decision}\n"
        else:
            md += "- 없음\n"
        md += "\n"

        # 7. Next Action
        md += "## 7. Next Action\n\n"
        if self.action_items:
            for item in self.action_items:
                md += f"- [ ] {item.action} (@{item.subject} / ~{item.due_date}) - 목적: {item.purpose}\n"
        else:
            md += "- 없음\n"

        return md

    def to_plain_text(self) -> str:
        """Converts the analysis to plain text format for email body (no markdown syntax)."""
        text = f"{self.meeting_title}\n"
        text += "=" * 50 + "\n\n"

        text += "1. 회의 개요\n"
        text += f"   일시: {self.meeting_date}\n"
        text += f"   참석자: {', '.join(self.attendees)}\n"
        text += f"   회의 목적: {self.meeting_purpose}\n\n"

        text += "2. 핵심 요약\n"
        for point in self.executive_summary:
            text += f"   - {point}\n"
        text += "\n"

        text += "3. 주요 논의 내용\n"
        for i, topic in enumerate(self.discussions, 1):
            text += f"   주제 {i}: {topic.topic_title}\n"
            text += f"   {topic.content}\n\n"

        text += "4. 핵심 리스크\n"
        for risk in self.key_risks:
            text += f"   - {risk}\n"
        text += "\n"

        text += "5. 결정사항\n"
        if self.decisions:
            for decision in self.decisions:
                text += f"   - {decision}\n"
        else:
            text += "   - 없음\n"
        text += "\n"

        text += "6. Next Action\n"
        if self.action_items:
            for item in self.action_items:
                text += f"   - [ ] {item.action} (담당: {item.subject} / 기한: {item.due_date})\n"
        else:
            text += "   - 없음\n"

        return text

    def to_html(self) -> str:
        """Converts the analysis to HTML format for email body (proper formatting in email clients)."""
        html = f"""
<div style="font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; color: #333;">
    <h1 style="color: #1a1a1a; border-bottom: 3px solid #2563eb; padding-bottom: 10px; margin-bottom: 20px;">{self.meeting_title}</h1>

    <h2 style="color: #2563eb; margin-top: 25px;">1. 회의 개요 (Meeting Overview)</h2>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr><td style="padding: 8px 0; color: #666; width: 100px;"><strong>회의 제목</strong></td><td style="padding: 8px 0;">{self.meeting_title}</td></tr>
        <tr><td style="padding: 8px 0; color: #666;"><strong>일시</strong></td><td style="padding: 8px 0;">{self.meeting_date}</td></tr>
        <tr><td style="padding: 8px 0; color: #666;"><strong>참석자</strong></td><td style="padding: 8px 0;">{', '.join(self.attendees)}</td></tr>
        <tr><td style="padding: 8px 0; color: #666;"><strong>회의 목적</strong></td><td style="padding: 8px 0;">{self.meeting_purpose}</td></tr>
    </table>

    <h2 style="color: #2563eb; margin-top: 25px;">2. 핵심 요약 (Executive Summary)</h2>
    <ul style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 15px 15px 15px 35px; margin-bottom: 20px; list-style-type: disc;">
"""
        for point in self.executive_summary:
            html += f'        <li style="margin: 5px 0;">{point}</li>\n'
        html += """    </ul>

    <h2 style="color: #2563eb; margin-top: 25px;">3. 주요 논의 내용 (Discussion Summary)</h2>
"""
        for i, topic in enumerate(self.discussions, 1):
            html += f'    <h3 style="color: #1e40af; margin-top: 15px;">주제 {i}: {topic.topic_title}</h3>\n'
            html += f'    <p style="margin-bottom: 15px; line-height: 1.7;">{topic.content}</p>\n'

        # 4. 의사결정 구조
        if self.decision_structure:
            html += """
    <h2 style="color: #2563eb; margin-top: 25px;">4. 의사결정 구조 및 평가 기준</h2>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr style="background-color: #f1f5f9;">
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">구분</th>
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">주체</th>
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">영향력</th>
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">기준</th>
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">코멘트</th>
        </tr>
"""
            for item in self.decision_structure:
                html += f'        <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">{item.category}</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">{item.subject}</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">{item.influence}</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">{item.criteria}</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">{item.comment}</td></tr>\n'
            html += "    </table>\n"

        # 5. 핵심 리스크
        html += """
    <h2 style="color: #2563eb; margin-top: 25px;">5. 핵심 리스크 (Key Risks)</h2>
    <ul style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px 15px 15px 35px; margin-bottom: 20px;">
"""
        for risk in self.key_risks:
            html += f'        <li style="margin: 5px 0;">{risk}</li>\n'
        html += "    </ul>\n"

        # 6. 결정사항
        html += """
    <h2 style="color: #2563eb; margin-top: 25px;">6. 결정사항 (Decisions)</h2>
    <ul style="margin: 10px 0; padding-left: 20px;">
"""
        if self.decisions:
            for decision in self.decisions:
                html += f'        <li style="margin: 5px 0;"><strong>{decision}</strong></li>\n'
        else:
            html += '        <li style="margin: 5px 0; color: #666;">없음</li>\n'
        html += "    </ul>\n"

        # 7. Next Action (체크박스)
        html += """
    <h2 style="color: #2563eb; margin-top: 25px;">7. Next Action</h2>
    <ul style="list-style-type: none; padding-left: 5px; margin-bottom: 20px;">
"""
        if self.action_items:
            for item in self.action_items:
                html += f'        <li style="margin: 8px 0;">&#9744; {item.action} <span style="color: #666; font-size: 0.9em;">(@{item.subject} / ~{item.due_date})</span></li>\n'
        else:
            html += '        <li style="margin: 5px 0; color: #666;">없음</li>\n'
        html += """    </ul>

    <hr style="margin-top: 30px; border: none; border-top: 1px solid #e2e8f0;">
    <p style="color: #9ca3af; font-size: 12px; text-align: center;">이 회의록은 AI에 의해 자동 생성되었습니다.</p>
</div>
"""
        return html

# --- Agent Service ---

class AgentService:
    def __init__(self):
        settings = get_settings()
        self.llm_provider = settings.llm_provider

        if self.llm_provider == "google":
            self.llm = ChatGoogleGenerativeAI(
                model="gemini-2.5-flash",
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

    async def analyze_meeting(self, transcript: str, user_prompt: str = None) -> MeetingAnalysis:
        logger.info(f"Starting LLM analysis... (user_prompt: {bool(user_prompt)})")

        system_prompt = """
        당신은 전략 컨설턴트 수준의 회의 기록 전문가입니다.
        아래 회의 내용을 기반으로, 임원 보고 및 사업 의사결정에 활용 가능한
        구조화된 고급 미팅노트를 작성하세요.

        ────────────────────────
        [작성 원칙]
        ────────────────────────
        1. 단순 대화 요약이 아니라 맥락, 의사결정 구조, 이해관계, 리스크, 사업적 함의를 반영한 전략 문서 수준으로 정리할 것
        2. 중복 없이 논리적으로 재구성할 것 (발언 순서 그대로 정리 금지)
        3. 핵심 요약(Executive Summary)은 10~15줄 내로 작성
        4. 기술적 논의와 사업적 의미를 분리해서 정리
        5. 평가 기준, 의사결정 권한자, 이해관계 충돌 구조가 있다면 반드시 decision_structure에 정리
        6. Action Item은 주체, 기한, 목적, 리스크를 포함해서 작성
        7. 감정적 표현, 군더더기 표현 제거
        8. 이모지(emoji)를 절대 사용하지 않는다
        9. 날짜, 수치, 고유명사는 원문 그대로 유지한다

        ────────────────────────
        [제목 작성 규칙 - 가장 중요]
        ────────────────────────
        meeting_title 형식: "YYYYMMDD_고객명_회의내용1줄요약 관련 회의"

        * 날짜: 원문에서 추출하여 YYYYMMDD 8자리 (예: 2026.01.14 → 20260114)

        ★★★ 고객명 결정 - 반드시 아래 순서대로 판단할 것 ★★★

        [1순위] 사용자 입력 텍스트 (user_request에 "[사용자 입력 텍스트:" 가 있는 경우)
          → 사용자가 디스코드 채팅창에 입력한 텍스트에서 회사명/고객명을 추출
          → 이것이 있으면 무조건 최우선 적용. 다른 소스 무시.
          예: "한전 AICC 킥오프" → 고객명 = "한전"
          예: "삼성SDS 프로젝트 미팅" → 고객명 = "삼성SDS"
          예: "LG유플러스 컨택센터" → 고객명 = "LG유플러스"

        [2순위] 파일명 힌트 (user_request에 "[파일명 힌트:" 가 있는 경우)
          → 파일명에서 회사명/고객명을 추출
          → 단, 파일명이 숫자/날짜만인 경우(예: 260210, 20260210)는 고객명 아님 → 패스
          → 파일명이 실제 회사명인 경우만 적용
          예: [파일명 힌트: 한전] → 고객명 = "한전"
          예: [파일명 힌트: 삼성SDS_미팅] → 고객명 = "삼성SDS"
          예: [파일명 힌트: 260210] → 숫자뿐이므로 고객명 아님 → 3순위로 넘어감
          예: [파일명 힌트: meeting_0210] → 일반명이므로 고객명 아님 → 3순위로 넘어감

        [3순위] 회의 내용에서 추론
          → 회의 원문에서 고객사/회사명이 반복적으로 언급되는 경우 추출
          → "~사", "~전자", "~그룹", "~유플러스" 등 명확한 법인명/브랜드명만 인정
          → 자사(우리 회사) 이름이 아닌 상대방(고객) 회사명을 추출
          → 대부분의 회의에는 고객사명이 언급되므로, 잘 찾으면 거의 추출 가능

        [4순위] 최후 수단 - 고객사명 미기재
          → 1~3순위 모두 실패한 경우에만 "고객사명미기재" 사용
          → 이 경우는 극히 드물어야 함. 가급적 3순위에서 추론할 것

        * 회의내용1줄요약: 핵심 주제를 간결하게 작성

        * 제목 예시:
          - 사용자 입력 "한전 AICC 킥오프" → "20260213_한전_AICC 킥오프 관련 회의"
          - 파일명 "삼성SDS_미팅" → "20260213_삼성SDS_프로젝트 논의 관련 회의"
          - 회의 내용에서 "LG유플러스" 반복 언급 → "20260114_LG유플러스_AICC 도입 검토 관련 회의"
          - 고객명 전혀 파악 불가(극히 드문 경우) → "20260114_고객사명미기재_STT 기능 검토 관련 회의"

        * 절대 금지: 원문에 없는 회사명 지어내기, "[고객사명미기재]" 대괄호 사용

        ────────────────────────
        [출력 구조 가이드]
        ────────────────────────

        1. 회의 개요 (Meeting Overview):
           - meeting_title: 위 제목 규칙에 따라 작성
           - meeting_date: 원문에서 추출 (없으면 "미기재")
           - attendees: 참석자 목록
           - meeting_purpose: 회의 목적 1줄

        2. 핵심 요약 (Executive Summary):
           - 10~15줄 전략 요약 (List[str])
           - 이번 미팅이 사업에 미치는 의미, 승부 포인트, 주요 리스크, 향후 분기점 포함

        3. 주요 논의 내용 (Discussion Summary):
           - 논점별로 분리 (발언 순서 아님, 논리적 재구성)
           - 각 논점마다: topic_title(논점 제목), content(서술형 요약)
           - content는 소제목(배경, 고객입장, 사업적의미 등) 없이 문단 형태로 서술
           - 팩트 기반으로 작성하고, 과도한 추론이나 해석은 배제
           - 배경/맥락, 논의 내용, 리스크 등을 자연스럽게 하나의 문단으로 녹여서 작성

        4. 의사결정 구조 및 평가 기준 (Decision Structure):
           - 있는 경우만 작성 (없으면 빈 리스트)
           - category(구분), subject(주체), influence(영향력), criteria(기준), comment(코멘트)

        5. 핵심 리스크 (Key Risks):
           - 리스크 목록 (List[str])

        6. 결정사항 (Decisions):
           - 확정된 사항, 방향성 합의 내용, 미확정이나 유력한 방향

        7. Next Action:
           - subject(주체), action(액션), due_date(기한), purpose(목적), risk(리스크)

        ────────────────────────
        [입력 데이터]
        ────────────────────────
        {transcript}

        ────────────────────────
        [사용자 추가 요청사항 / 파일명 힌트]
        ────────────────────────
        {user_request}

        ★★★ 고객명 최종 체크리스트 (출력 전 반드시 확인) ★★★
        1. user_request에 "[사용자 입력 텍스트:" 가 있는가? → 있으면 거기서 고객명 추출 (최우선)
        2. user_request에 "[파일명 힌트:" 가 있는가? → 파일명이 회사명이면 사용 (숫자만이면 패스)
        3. 회의 원문에서 고객 회사명이 언급되는가? → 있으면 추출
        4. 위 모두 해당 없으면 → "고객사명미기재" (이 경우는 극히 드물어야 함)
        → 제목에 고객명이 빠져있으면 다시 확인할 것!

        ────────────────────────
        [출력 포맷]
        ────────────────────────
        {format_instructions}
        """

        # 사용자 추가 요청사항 처리
        user_request_text = user_prompt if user_prompt else "없음"

        prompt = PromptTemplate(
            template=system_prompt,
            input_variables=["transcript", "user_request"],
            partial_variables={"format_instructions": self.parser.get_format_instructions()}
        )

        chain = prompt | self.llm | self.parser

        try:
            result = await chain.ainvoke({"transcript": transcript, "user_request": user_request_text})
            logger.info(f"Analysis complete. Title: {result.meeting_title}")
            return result
        except Exception as e:
            logger.error(f"Error during LLM analysis: {e}")
            raise e

    async def analyze_for_email(self, transcript: str) -> EmailSummary:
        """이메일용 간결한 요약 생성 (핵심 포인트 + Next Action 중심)"""
        logger.info("Starting email summary analysis...")

        email_prompt = """
        당신은 회의 내용을 간결하게 요약하는 비서입니다.

        목표: 이메일로 공유하기 적합한 **짧고 핵심적인 요약**을 생성합니다.

        ────────────────────────
        [작성 원칙]
        ────────────────────────
        1. 이모지(emoji)를 절대 사용하지 않는다
        2. 마크다운(Markdown) 형식으로 작성한다
        3. executive_summary: 회의의 핵심을 2-3문장으로 요약 (제일 중요)
        4. 핵심 포인트는 3-5개로 제한 (각 1줄)
        5. 세부 내용은 생략하고 결론/방향성만 포함
        6. 결정사항은 확정된 것만 간단히
        7. Next Action은 담당자와 할 일만 명시 (기한은 생략 가능)
        8. 불필요한 배경설명, 논의과정은 제외
        9. 받는 사람이 1분 안에 읽을 수 있도록 작성

        ────────────────────────
        [입력 데이터]
        ────────────────────────
        {transcript}

        ────────────────────────
        [출력 포맷]
        ────────────────────────
        {format_instructions}
        """

        prompt = PromptTemplate(
            template=email_prompt,
            input_variables=["transcript"],
            partial_variables={"format_instructions": self.email_parser.get_format_instructions()}
        )

        chain = prompt | self.llm | self.email_parser

        try:
            result = await chain.ainvoke({"transcript": transcript})
            logger.info(f"Email summary complete. Title: {result.meeting_title}")
            return result
        except Exception as e:
            logger.error(f"Error during email summary analysis: {e}")
            raise e
