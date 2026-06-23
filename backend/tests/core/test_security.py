from app.core.config import Settings
from app.core.security import build_cookie_settings


def test_production_cookies_support_cross_origin_frontend_api_session() -> None:
    settings = Settings(
        database_url="postgresql+psycopg://user:pass@db:5432/store",
        environment="production",
        session_cookie_name="fs_session",
        cookie_domain="api.freestylesport.com",
    )

    cookie_settings = build_cookie_settings(settings, "session")

    assert cookie_settings["key"] == "fs_session"
    assert cookie_settings["httponly"] is True
    assert cookie_settings["secure"] is True
    assert cookie_settings["samesite"] == "none"
    assert cookie_settings["domain"] == "api.freestylesport.com"


def test_development_cookies_keep_local_lax_defaults() -> None:
    settings = Settings(
        database_url="postgresql+psycopg://user:pass@db:5432/store",
        environment="development",
    )

    cookie_settings = build_cookie_settings(settings, "session")

    assert cookie_settings["secure"] is False
    assert cookie_settings["samesite"] == "lax"


def test_csrf_cookie_is_readable_by_browser_javascript() -> None:
    settings = Settings(
        database_url="postgresql+psycopg://user:pass@db:5432/store",
    )

    cookie_settings = build_cookie_settings(settings, "csrf")

    assert cookie_settings["key"] == "fs_csrf"
    assert cookie_settings["httponly"] is False
