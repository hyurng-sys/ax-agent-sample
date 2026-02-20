import discord
from discord.ext import commands
import logging
import os
from datetime import datetime
from server import bot_stats
from utils.exceptions import AnalysisError, NotionError
from services.agent_service import AgentService
from services.email_service import EmailService
from services.notion_service import NotionService

logger = logging.getLogger("MeetingBotCog")

# 지원 파일 확장자
SUPPORTED_EXTENSIONS = ['.txt', '.md']

class MeetingBotCog(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.agent_service = AgentService()
        self.email_service = EmailService()
        self.notion_service = NotionService()

        # Ensure temp directory exists
        if not os.path.exists("temp"):
            os.makedirs("temp")

    @commands.Cog.listener()
    async def on_ready(self):
        bot_stats["bot_ready"] = True
        logger.info("Meeting Note Bot Cog loaded and ready.")

    def _extract_text_from_file(self, file_path: str) -> str:
        """txt/md 파일에서 텍스트 추출"""
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()

    @commands.Cog.listener()
    async def on_message(self, message):
        if message.author == self.bot.user:
            return

        if message.attachments:
            for attachment in message.attachments:
                ext = os.path.splitext(attachment.filename)[1].lower()
                if ext in SUPPORTED_EXTENSIONS:
                    logger.info(f"Detected supported file: {attachment.filename} from {message.author}")
                    await message.add_reaction("👀")
                    status_msg = await message.reply(f"📥 Downloading **{attachment.filename}**...")

                    try:
                        # Download file
                        file_path = os.path.join("temp", attachment.filename)
                        await attachment.save(file_path)
                        logger.info(f"File saved to {file_path}")

                        # Read content
                        content = self._extract_text_from_file(file_path)

                        # Extract user prompt (디스코드 채팅창에 입력한 텍스트)
                        user_prompt = message.content.strip() if message.content else None
                        filename_without_ext = os.path.splitext(attachment.filename)[0]
                        filename_hint = f"[파일명 힌트: {filename_without_ext}]"

                        if user_prompt:
                            logger.info(f"User text detected: '{user_prompt}' (will be used for title)")
                            await status_msg.edit(content=f"🧠 Analyzing **{attachment.filename}** with custom instructions: \"{user_prompt}\"...")
                            combined_prompt = f"{filename_hint}\n[사용자 입력 텍스트: {user_prompt}]\n사용자가 위 텍스트를 입력했습니다. 제목의 고객명과 회의주제에 반드시 반영하세요."
                        else:
                            await status_msg.edit(content=f"🧠 Analyzing **{attachment.filename}** with AI... (This may take a minute)")
                            combined_prompt = filename_hint

                        # 1. AI Analysis
                        try:
                            analysis_result = await self.agent_service.analyze_meeting(content, combined_prompt)
                        except Exception as e:
                            raise AnalysisError(f"AI analysis failed: {e}") from e

                        # 2. Save to Notion
                        await status_msg.edit(content=f"📝 Saving to Notion...")
                        try:
                            notion_url = await self.notion_service.create_page(analysis_result, str(message.channel.id))
                        except Exception as e:
                            raise NotionError(f"Notion save failed: {e}") from e

                        # 3. Send Email (non-fatal)
                        await status_msg.edit(content=f"📤 Sending email via Make.com...")
                        try:
                            make_success, make_msg = await self.email_service.send_email(analysis_result, notion_url)
                        except Exception as e:
                            logger.warning(f"Email failed (non-fatal): {e}")
                            make_success, make_msg = False, str(e)

                        # Final Confirmation
                        embed = discord.Embed(
                            title="✅ Meeting Minutes Created!",
                            description=f"**{analysis_result.meeting_title}** has been processed.",
                            color=discord.Color.green()
                        )
                        embed.add_field(name="Summary", value=analysis_result.executive_summary[:1024] if isinstance(analysis_result.executive_summary, str) else "\n".join(analysis_result.executive_summary)[:1024], inline=False)
                        embed.add_field(name="Notion", value=f"[View Page]({notion_url})", inline=True)

                        if make_success:
                            embed.add_field(name="Email", value="✅ Sent via Make.com", inline=True)
                        else:
                            embed.add_field(name="Email", value=f"❌ Failed: {make_msg[:50]}", inline=True)

                        await status_msg.edit(content="", embed=embed)
                        await message.add_reaction("✅")

                        # Update stats
                        bot_stats["meetings_processed"] += 1
                        bot_stats["last_processed_at"] = datetime.now().isoformat()

                        # Cleanup
                        os.remove(file_path)

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

async def setup(bot):
    await bot.add_cog(MeetingBotCog(bot))
