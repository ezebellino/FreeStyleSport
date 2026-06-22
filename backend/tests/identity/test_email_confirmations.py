from datetime import UTC, datetime, timedelta

from app.core.config import Settings
from app.modules.identity.confirmations import ConfirmationTokens, confirmation_link
from app.modules.identity.email import ConsoleEmailSender, EmailMessage


def test_confirmation_token_hash_is_stable_and_secret_is_not_stored() -> None:
    issued = ConfirmationTokens.issue(timedelta(hours=24))

    assert issued.raw_token != issued.token_hash
    assert ConfirmationTokens.hash(issued.raw_token) == issued.token_hash
    assert issued.expires_at > datetime.now(UTC)


def test_confirmation_link_uses_public_app_url() -> None:
    settings = Settings(
        database_url="postgresql+psycopg://user:pass@db:5432/store",
        public_app_url="https://freestyle.up.railway.app",
    )

    link = confirmation_link(settings, "abc123")

    assert link == "https://freestyle.up.railway.app/confirmar-cuenta?token=abc123"


def drive_async(coro: object) -> None:
    try:
        coro.send(None)  # type: ignore[attr-defined]
    except StopIteration:
        return
    raise AssertionError("coroutine did not finish synchronously")


def test_console_email_sender_captures_message() -> None:
    sender = ConsoleEmailSender()
    message = EmailMessage(
        to="admin@zeqebellino.com",
        subject="Confirma tu cuenta FreeStyle",
        html="<p>Confirma tu cuenta</p>",
    )

    drive_async(sender.send(message))

    assert sender.messages == [message]
