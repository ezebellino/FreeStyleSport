from typing import Literal, TypedDict

from app.core.config import Settings


class CookieSettings(TypedDict):
    key: str
    httponly: bool
    secure: bool
    samesite: Literal["lax", "none"]
    domain: str | None
    path: str


def build_cookie_settings(settings: Settings, kind: Literal["session", "csrf"]) -> CookieSettings:
    secure = settings.environment in {"staging", "production"}
    return {
        "key": settings.session_cookie_name if kind == "session" else settings.csrf_cookie_name,
        "httponly": kind == "session",
        "secure": secure,
        "samesite": "none" if secure else "lax",
        "domain": settings.cookie_domain,
        "path": "/",
    }
