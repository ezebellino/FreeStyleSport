from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from hashlib import sha256
from secrets import token_urlsafe


@dataclass(frozen=True, slots=True)
class IssuedSessionTokens:
    raw_session_token: str
    session_token_hash: str
    csrf_token: str
    expires_at: datetime


class SessionTokens:
    @staticmethod
    def hash(raw_session_token: str) -> str:
        return sha256(raw_session_token.encode("utf-8")).hexdigest()

    @classmethod
    def issue(cls, ttl: timedelta) -> IssuedSessionTokens:
        raw_session_token = token_urlsafe(48)
        return IssuedSessionTokens(
            raw_session_token=raw_session_token,
            session_token_hash=cls.hash(raw_session_token),
            csrf_token=token_urlsafe(32),
            expires_at=datetime.now(UTC) + ttl,
        )


def require_matching_csrf(cookie_token: str | None, header_token: str | None) -> None:
    if not cookie_token or not header_token or cookie_token != header_token:
        raise ValueError("CSRF token mismatch")