import pytest
from app.core.config import Settings
from pydantic import ValidationError


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
