import asyncio
import logging
import time
from aiohttp import web, ClientSession

logger = logging.getLogger("Server")

# Bot statistics (updated by meeting_bot cog)
bot_stats = {
    "start_time": None,
    "meetings_processed": 0,
    "last_processed_at": None,
    "bot_ready": False,
}


async def handle_root(request):
    uptime = None
    if bot_stats["start_time"]:
        uptime = int(time.time() - bot_stats["start_time"])
    return web.json_response({
        "service": "meeting-note-bot",
        "status": "running",
        "bot_ready": bot_stats["bot_ready"],
        "uptime_seconds": uptime,
        "meetings_processed": bot_stats["meetings_processed"],
        "last_processed_at": bot_stats["last_processed_at"],
    })


async def handle_health(request):
    return web.Response(text="OK", status=200)


async def self_ping(url: str, interval: int):
    """Periodically ping own URL to prevent Render free plan sleep."""
    logger.info(f"Self-ping started: interval={interval}s, url={url}")
    await asyncio.sleep(60)  # Wait 1 min after startup
    async with ClientSession() as session:
        while True:
            try:
                await asyncio.sleep(interval)
                async with session.get(f"{url}/health") as resp:
                    logger.info(f"Self-ping: status={resp.status}")
            except asyncio.CancelledError:
                logger.info("Self-ping task cancelled")
                break
            except Exception as e:
                logger.warning(f"Self-ping failed: {e}")


def create_app() -> web.Application:
    app = web.Application()
    app.router.add_get("/", handle_root)
    app.router.add_get("/health", handle_health)
    return app


async def start_server(port: int, render_url: str = None, ping_interval: int = 780):
    """Start HTTP server and optional self-ping task."""
    app = create_app()
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, "0.0.0.0", port)
    await site.start()
    logger.info(f"HTTP server started on port {port}")

    bot_stats["start_time"] = time.time()

    # Start self-ping if Render URL is available
    ping_task = None
    if render_url:
        ping_task = asyncio.create_task(self_ping(render_url, ping_interval))

    return runner, ping_task
