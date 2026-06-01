from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    DATABASE_URL: str = ""
    CORS_ORIGINS: str = "*"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
