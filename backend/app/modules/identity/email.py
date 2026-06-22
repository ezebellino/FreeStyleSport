from dataclasses import dataclass, field
from typing import Protocol

import httpx

from app.core.config import Settings


@dataclass(frozen=True, slots=True)
class EmailMessage:
    to: str
    subject: str
    html: str


class EmailSender(Protocol):
    async def send(self, message: EmailMessage) -> None: ...


@dataclass(slots=True)
class ConsoleEmailSender:
    messages: list[EmailMessage] = field(default_factory=list)

    async def send(self, message: EmailMessage) -> None:
        self.messages.append(message)


class ResendEmailSender:
    def __init__(self, settings: Settings) -> None:
        if not settings.resend_api_key:
            raise ValueError("RESEND_API_KEY is required for Resend email sending")
        self._settings = settings

    async def send(self, message: EmailMessage) -> None:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {self._settings.resend_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "from": self._settings.email_from,
                    "to": [message.to],
                    "subject": message.subject,
                    "html": message.html,
                },
            )
        response.raise_for_status()


def build_confirmation_email(to: str, link: str) -> EmailMessage:
    return EmailMessage(
        to=to,
        subject="Confirma tu cuenta FreeStyle",
        html=(
            "<h1>Confirma tu cuenta FreeStyle</h1>"
            "<p>Para terminar de crear tu cuenta, abri este enlace:</p>"
            f'<p><a href="{link}">Confirmar mi cuenta</a></p>'
            "<p>Si no pediste crear una cuenta, podes ignorar este mensaje.</p>"
        ),
    )
