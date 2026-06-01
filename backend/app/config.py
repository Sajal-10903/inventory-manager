import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    DATABASE_URL: str = os.environ.get("DATABASE_URL", "")
    CORS_ORIGINS: str = "*"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


settings = Settings()

# Log the status but NEVER crash — the app must start for Render health checks
if settings.DATABASE_URL:
    print(f"DATABASE_URL is configured (starts with: {settings.DATABASE_URL[:30]}...)")
else:
    print("WARNING: DATABASE_URL is not set. Database features will fail but the app will still start.")
