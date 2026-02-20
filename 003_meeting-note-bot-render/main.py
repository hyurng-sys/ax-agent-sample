import asyncio
import signal
import logging
import discord
from discord.ext import commands

from config import get_settings
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
