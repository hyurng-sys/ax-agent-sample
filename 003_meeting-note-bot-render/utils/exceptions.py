class MeetingBotError(Exception):
    """Base exception for Meeting Bot."""
    pass


class AnalysisError(MeetingBotError):
    """AI analysis failed."""
    pass


class NotionError(MeetingBotError):
    """Notion API operation failed."""
    pass


class EmailError(MeetingBotError):
    """Email/webhook delivery failed."""
    pass


class ConfigError(MeetingBotError):
    """Configuration validation failed."""
    pass
