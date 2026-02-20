import json
import logging
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import model_validator

logger = logging.getLogger("Config")


class Settings(BaseSettings):
    """Central configuration with validation."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Discord
    discord_bot_token: str

    # Notion
    notion_api_key: str
    notion_database_id: str

    # LLM
    llm_provider: str = "google"
    google_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None

    # Make.com (optional)
    make_webhook_url: Optional[str] = None

    # Channel mapping (optional)
    channel_notion_map: Optional[str] = None

    # Server / Render
    port: int = 10000
    render_external_url: Optional[str] = None
    self_ping_interval: int = 780  # 13 minutes in seconds

    @model_validator(mode="after")
    def validate_llm_keys(self):
        if self.llm_provider == "google" and not self.google_api_key:
            raise ValueError("GOOGLE_API_KEY is required when LLM_PROVIDER=google")
        if self.llm_provider == "openai" and not self.openai_api_key:
            raise ValueError("OPENAI_API_KEY is required when LLM_PROVIDER=openai")
        return self

    def get_channel_notion_map(self) -> dict:
        if not self.channel_notion_map:
            return {}
        try:
            return json.loads(self.channel_notion_map)
        except json.JSONDecodeError:
            logger.warning("Invalid CHANNEL_NOTION_MAP JSON, using empty mapping")
            return {}


# Singleton
_settings: Optional[Settings] = None


def get_settings() -> Settings:
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings
