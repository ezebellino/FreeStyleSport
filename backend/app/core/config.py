from functools import lru_cache
from pathlib import Path
from typing import Literal, Self

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    app_name: str = "FreestyleSport API"
    environment: Literal["development", "test", "staging", "production"] = "development"
    database_url: str
    cors_origins: str = "http://localhost:3000"
    log_level: str = "INFO"
    session_cookie_name: str = "fs_session"
    csrf_cookie_name: str = "fs_csrf"
    cookie_domain: str | None = None
    session_ttl_seconds: int = 60 * 60
    csrf_header_name: str = "x-csrf-token"
    resend_api_key: str | None = None
    email_from: str = "FreeStyle <onboarding@resend.dev>"
    public_app_url: str = "http://localhost:3000"
    public_api_url: str = "http://localhost:8000"
    email_confirmation_ttl_seconds: int = 60 * 60 * 24
    cloudinary_cloud_name: str | None = None
    cloudinary_api_key: str | None = None
    cloudinary_api_secret: str | None = None
    cloudinary_upload_folder: str = "freestyle/products"
    mercado_pago_access_token: str | None = None
    mercado_pago_webhook_secret: str | None = None

    @field_validator("database_url", mode="before")
    @classmethod
    def normalize_database_url(cls, value: object) -> object:
        if not isinstance(value, str):
            return value
        if value.startswith("postgresql+psycopg://"):
            return value
        if value.startswith("postgresql://"):
            return value.replace("postgresql://", "postgresql+psycopg://", 1)
        if value.startswith("postgres://"):
            return value.replace("postgres://", "postgresql+psycopg://", 1)
        raise ValueError("unsupported database URL scheme; PostgreSQL is required")

    @field_validator("session_ttl_seconds")
    @classmethod
    def validate_session_ttl(cls, value: int) -> int:
        if value <= 0:
            raise ValueError("session TTL must be positive")
        if value > 60 * 60:
            raise ValueError("session TTL cannot exceed 60 minutes")
        return value

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @model_validator(mode="after")
    def reject_wildcard_cors_in_production(self) -> Self:
        if self.environment == "production" and "*" in self.allowed_origins:
            raise ValueError("wildcard CORS origins are not allowed in production")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
