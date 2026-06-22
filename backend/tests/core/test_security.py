from app.core.config import Settings
from app.core.security import build_cookie_settings


def test_cookie_settings_are_secure_in_production() -> None:
    settings = Settings(
        database_url="postgresql+psycopg://user:pass@db:5432/store",
        environment="production",
        session_cookie_name="fs_session",
        csrf_cookie_name="fs_csrf",
        cookie_domain="api.freestylesport.com",
    )

    cookie = build_cookie_settings(settings, "session")

    assert cookie["key"] == "fs_session"
    assert cookie["httponly"] is True
    assert cookie["secure"] is True
    assert cookie["samesite"] == "lax"
    assert cookie["domain"] == "api.freestylesport.com"


def test_csrf_cookie_is_readable_by_browser_javascript() -> None:
    settings = Settings(
        database_url="postgresql+psycopg://user:pass@db:5432/store",
        environment="development",
    )

    cookie = build_cookie_settings(settings, "csrf")

    assert cookie["key"] == "fs_csrf"
    assert cookie["httponly"] is False
    assert cookie["secure"] is False
    assert cookie["samesite"] == "lax"
