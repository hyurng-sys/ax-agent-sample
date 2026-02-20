import logging
from config import get_settings
from notion_client import AsyncClient
from datetime import datetime
from services.agent_service import MeetingAnalysis

logger = logging.getLogger("NotionService")

class NotionService:
    def __init__(self):
        settings = get_settings()
        self.default_api_key = settings.notion_api_key
        self.default_page_id = settings.notion_database_id
        self.default_client = AsyncClient(auth=self.default_api_key)
        self.channel_map = settings.get_channel_notion_map()
        logger.info(f"Loaded channel mapping: {len(self.channel_map)} channels")

    def get_notion_config_for_channel(self, channel_id: str) -> tuple:
        """채널 ID에 해당하는 Notion 클라이언트와 페이지 ID 반환"""
        channel_config = self.channel_map.get(str(channel_id))

        if channel_config and isinstance(channel_config, dict):
            # 채널별 설정이 있는 경우: {"api_key": "...", "page_id": "..."}
            api_key = channel_config.get("api_key", self.default_api_key)
            page_id = channel_config.get("page_id", self.default_page_id)
            client = AsyncClient(auth=api_key)
            logger.info(f"Channel {channel_id} → Custom Notion config (page: {page_id})")
            return client, page_id
        else:
            # 기본 설정 사용
            logger.info(f"Channel {channel_id} → Default Notion config")
            return self.default_client, self.default_page_id

    async def create_page(self, analysis: MeetingAnalysis, channel_id: str = None) -> str:
        """
        Creates a new child page under the parent page with the meeting analysis.
        Returns the URL of the created page.
        channel_id가 있으면 해당 채널에 매핑된 Notion 설정(API키+페이지)으로 저장.
        """
        notion_client, parent_page_id = self.get_notion_config_for_channel(channel_id) if channel_id else (self.default_client, self.default_page_id)

        if not parent_page_id:
            logger.error("No Notion page ID found for this channel.")
            raise ValueError("No Notion page ID configured.")

        logger.info(f"Creating Notion page for: {analysis.meeting_title}")

        # 페이지 제목 (database row는 이름 property 사용)
        properties = {
            "이름": {
                "title": [{"text": {"content": analysis.meeting_title}}]
            }
        }

        # 2. Page Content (Blocks)
        children = []

        # 1. 회의 개요 (Meeting Overview)
        children.append({"object": "block", "type": "heading_2", "heading_2": {"rich_text": [{"text": {"content": "1. 회의 개요 (Meeting Overview)"}}]}})
        overview_items = [
            f"회의 제목: {analysis.meeting_title}",
            f"회의 일시: {analysis.meeting_date}",
            f"참석자: {', '.join(analysis.attendees)}",
            f"회의 목적: {analysis.meeting_purpose}",
        ]
        for item in overview_items:
            children.append({"object": "block", "type": "bulleted_list_item", "bulleted_list_item": {"rich_text": [{"text": {"content": item}}]}})

        # 2. 핵심 요약 (Executive Summary)
        children.append({"object": "block", "type": "heading_2", "heading_2": {"rich_text": [{"text": {"content": "2. 핵심 요약 (Executive Summary)"}}]}})
        for point in analysis.executive_summary:
            children.append({"object": "block", "type": "bulleted_list_item", "bulleted_list_item": {"rich_text": [{"text": {"content": point}}]}})

        # 3. 주요 논의 내용 (Discussion Summary)
        children.append({"object": "block", "type": "heading_2", "heading_2": {"rich_text": [{"text": {"content": "3. 주요 논의 내용 (Discussion Summary)"}}]}})
        for i, topic in enumerate(analysis.discussions, 1):
            children.append({"object": "block", "type": "heading_3", "heading_3": {"rich_text": [{"text": {"content": f"주제 {i}: {topic.topic_title}"}}]}})
            # Notion API rich_text content 최대 2000자 제한 처리
            content_text = topic.content
            if len(content_text) <= 2000:
                children.append({"object": "block", "type": "paragraph", "paragraph": {"rich_text": [{"text": {"content": content_text}}]}})
            else:
                # 2000자씩 분할
                for j in range(0, len(content_text), 2000):
                    chunk = content_text[j:j+2000]
                    children.append({"object": "block", "type": "paragraph", "paragraph": {"rich_text": [{"text": {"content": chunk}}]}})
            children.append({"object": "block", "type": "divider", "divider": {}})

        # 4. 의사결정 구조 및 평가 기준
        if analysis.decision_structure:
            children.append({"object": "block", "type": "heading_2", "heading_2": {"rich_text": [{"text": {"content": "4. 의사결정 구조 및 평가 기준 (Decision Structure)"}}]}})
            # 테이블 헤더 + 행
            table_width = 5
            header_row = {"type": "table_row", "table_row": {"cells": [[{"type": "text", "text": {"content": h}}] for h in ["구분", "주체", "영향력", "기준", "코멘트"]]}}
            rows = [header_row]
            for item in analysis.decision_structure:
                rows.append({"type": "table_row", "table_row": {"cells": [[{"type": "text", "text": {"content": item.category}}], [{"type": "text", "text": {"content": item.subject}}], [{"type": "text", "text": {"content": item.influence}}], [{"type": "text", "text": {"content": item.criteria}}], [{"type": "text", "text": {"content": item.comment}}]]}})
            children.append({"object": "block", "type": "table", "table": {"table_width": table_width, "has_column_header": True, "has_row_header": False, "children": rows}})

        # 5. 핵심 리스크 (Key Risks)
        children.append({"object": "block", "type": "heading_2", "heading_2": {"rich_text": [{"text": {"content": "5. 핵심 리스크 (Key Risks)"}}]}})
        if analysis.key_risks:
            for risk in analysis.key_risks:
                children.append({"object": "block", "type": "bulleted_list_item", "bulleted_list_item": {"rich_text": [{"text": {"content": risk}}]}})
        else:
            children.append({"object": "block", "type": "paragraph", "paragraph": {"rich_text": [{"text": {"content": "없음"}}]}})

        # 6. 결정사항 (Decisions)
        children.append({"object": "block", "type": "heading_2", "heading_2": {"rich_text": [{"text": {"content": "6. 결정사항 (Decisions)"}}]}})
        if analysis.decisions:
            for decision in analysis.decisions:
                children.append({"object": "block", "type": "bulleted_list_item", "bulleted_list_item": {"rich_text": [{"text": {"content": decision}}]}})
        else:
            children.append({"object": "block", "type": "paragraph", "paragraph": {"rich_text": [{"text": {"content": "특이 사항 없음"}}]}})

        # 7. Next Action (체크박스)
        children.append({"object": "block", "type": "heading_2", "heading_2": {"rich_text": [{"text": {"content": "7. Next Action"}}]}})
        if analysis.action_items:
            for item in analysis.action_items:
                children.append({
                    "object": "block",
                    "type": "to_do",
                    "to_do": {
                        "rich_text": [
                            {"type": "text", "text": {"content": item.action}},
                            {"type": "text", "text": {"content": f" (@{item.subject} / ~{item.due_date})"}, "annotations": {"italic": True, "color": "gray"}}
                        ],
                        "checked": False
                    }
                })
        else:
            children.append({"object": "block", "type": "paragraph", "paragraph": {"rich_text": [{"text": {"content": "실행 항목 없음"}}]}})


        try:
            # Notion API는 children 블록을 최대 100개까지만 허용
            # 100개씩 나눠서 처리
            MAX_BLOCKS = 100
            first_batch = children[:MAX_BLOCKS]
            remaining_batches = [children[i:i+MAX_BLOCKS] for i in range(MAX_BLOCKS, len(children), MAX_BLOCKS)]

            # 첫 번째 배치로 페이지 생성
            response = await notion_client.pages.create(
                parent={"database_id": parent_page_id},
                properties=properties,
                children=first_batch
            )
            page_id = response.get('id')
            page_url = response.get('url')
            logger.info(f"Notion page created: {page_url} (blocks: {len(first_batch)})")

            # 나머지 배치들을 순차적으로 추가
            for i, batch in enumerate(remaining_batches):
                await notion_client.blocks.children.append(
                    block_id=page_id,
                    children=batch
                )
                logger.info(f"Appended batch {i+2}: {len(batch)} blocks")

            return page_url
        except Exception as e:
            logger.error(f"Error creating Notion page: {e}", exc_info=True)
            raise e
