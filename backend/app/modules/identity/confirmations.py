from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from hashlib import sha256
from secrets import token_urlsafe

from app.core.config import Settings


@dataclass(frozen=True, slots=True)
class IssuedConfirmationToken:
    raw_token: str
    token_hash: str
    expires_at: datetime


class ConfirmationTokens:
    @staticmethod
    def hash(raw_token: str) -> str:
        return sha256(raw_token.encode("utf-8")).hexdigest()

    @classmethod
    def issue(cls, ttl: timedelta) -> IssuedConfirmationToken:
        raw_token = token_urlsafe(48)
        return IssuedConfirmationToken(
            raw_token=raw_token,
            token_hash=cls.hash(raw_token),
            expires_at=datetime.now(UTC) + ttl,
        )


def confirmation_link(settings: Settings, raw_token: str) -> str:
    return f"{settings.public_app_url.rstrip('/')}/confirmar-cuenta?token={raw_token}"
