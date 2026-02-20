import logging
from config import get_settings
import aiohttp
from services.agent_service import MeetingAnalysis

logger = logging.getLogger("EmailService")


class EmailService:
    def __init__(self):
        settings = get_settings()
        self.webhook_url = settings.make_webhook_url
        logger.info(f"EmailService initialized: webhook_url_set={bool(self.webhook_url)}")
        if not self.webhook_url:
            logger.warning("MAKE_WEBHOOK_URL is not set. Email service will not work.")

    async def send_email(self, analysis: MeetingAnalysis, notion_url: str = None) -> tuple[bool, str]:
        """
        Send data to Make.com webhook for email delivery
        Returns: (success: bool, message: str)
        """
        logger.info(f"send_email called for: {analysis.meeting_title}")

        if not self.webhook_url:
            msg = "MAKE_WEBHOOK_URL missing. Skipping."
            logger.warning(msg)
            return False, msg

        try:
            payload = {
                "title": analysis.meeting_title,
                "date": analysis.meeting_date,
                "summary": analysis.executive_summary,
                "email_body": analysis.to_html(),       # 이메일 본문용 HTML
                "md_content": analysis.to_markdown(),   # MD 파일 첨부용
                "notion_url": notion_url,               # Notion 페이지 링크
            }

            logger.info(f"Sending to Make.com webhook...")

            async with aiohttp.ClientSession() as session:
                async with session.post(self.webhook_url, json=payload) as response:
                    status = response.status
                    logger.info(f"Make.com webhook response status: {status}")

                    if status in [200, 201, 202]:
                        logger.info("Webhook sent successfully to Make.com")
                        return True, "Email triggered via Make.com"
                    else:
                        error_msg = f"Make.com returned status {status}"
                        logger.error(error_msg)
                        return False, error_msg

        except Exception as e:
            error_msg = str(e)
            logger.error(f"Error sending to Make.com webhook: {error_msg}", exc_info=True)
            return False, error_msg
