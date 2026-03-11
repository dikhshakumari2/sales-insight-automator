"""Application configuration using Pydantic Settings."""
from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", case_sensitive=False
    )

    # Application
    app_name: str = "Sales Insight Automator"
    app_version: str = "1.0.0"
    debug: bool = False

    # Security
    allowed_origins: List[str] = ["http://localhost:3000", "http://localhost:5173"]
    max_file_size_mb: int = 10

    # AI
    gemini_api_key: str

    # Email — Resend (primary)
    resend_api_key: str = ""
    email_from: str = "Sales Insights <insights@yourdomain.com>"

    # Email — SMTP (fallback)
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_use_tls: bool = True

    @property
    def max_file_size_bytes(self) -> int:
        return self.max_file_size_mb * 1024 * 1024

    @property
    def use_resend(self) -> bool:
        return bool(self.resend_api_key)


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
