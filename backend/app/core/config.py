from functools import lru_cache
from typing import Literal, Self

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    app_name: str = "FreestyleSport API"
    environment: Literal["development", "test", "staging", "production"] = "development"
    database_url: str
    cors_origins: str = "http://localhost:3000"
    log_level: str = "INFO"

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
