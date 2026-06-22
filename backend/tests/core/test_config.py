import os
import runpy
from pathlib import Path

import pytest
from app.core.config import Settings
from pydantic import ValidationError

BACKEND_DIR = Path(__file__).resolve().parents[2]


def test_allowed_origins_splits_comma_separated_values() -> None:
    settings = Settings(
        cors_origins="https://shop.example.com, https://admin.example.com"
    )

    assert settings.allowed_origins == [
        "https://shop.example.com",
        "https://admin.example.com",
    ]


def test_production_rejects_wildcard_cors_origin() -> None:
    with pytest.raises(ValidationError, match="wildcard"):
        Settings(environment="production", cors_origins="*")


@pytest.mark.parametrize("scheme", ["postgresql://", "postgres://"])
def test_database_url_normalizes_railway_postgres_schemes(scheme: str) -> None:
    settings = Settings(database_url=f"{scheme}user:password@host:5432/store")

    assert settings.database_url == (
        "postgresql+psycopg://user:password@host:5432/store"
    )


def test_database_url_preserves_explicit_psycopg_scheme() -> None:
    database_url = "postgresql+psycopg://user:password@host:5432/store"

    assert Settings(database_url=database_url).database_url == database_url


def test_database_url_rejects_unsupported_scheme() -> None:
    with pytest.raises(ValidationError, match="unsupported database URL scheme"):
        Settings(database_url="sqlite:///store.db")


def test_settings_uses_backend_env_file_absolute_path() -> None:
    assert Settings.model_config["env_file"] == BACKEND_DIR / ".env"
    assert Path(Settings.model_config["env_file"]).is_absolute()


def test_conftest_overrides_ambient_environment_with_safe_test_values(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("DATABASE_URL", "postgresql://production.example/store")
    monkeypatch.setenv("ENVIRONMENT", "production")

    runpy.run_path(BACKEND_DIR / "tests" / "conftest.py")

    assert os.environ["DATABASE_URL"] == (
        "postgresql+psycopg://postgres:postgres@localhost:5432/freestyle_test"
    )
    assert os.environ["ENVIRONMENT"] == "test"
