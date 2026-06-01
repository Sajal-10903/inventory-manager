import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    DATABASE_URL: str
    CORS_ORIGINS: str = "*"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}

settings = Settings()

if not settings.DATABASE_URL:
    raise ValueError("CRITICAL: DATABASE_URL environment variable is missing! Configure it in Render.")
