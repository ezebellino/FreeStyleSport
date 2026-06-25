import logging
from datetime import UTC, datetime, timedelta
from typing import Annotated, Protocol

from fastapi import Depends, Request
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import Settings
from app.core.errors import ApiError
from app.db.session import get_session
from app.modules.identity.audit import record_audit_event
from app.modules.identity.confirmations import ConfirmationTokens, confirmation_link
from app.modules.identity.email import EmailSender, EmailSendError, build_confirmation_email
from app.modules.identity.models import EmailConfirmation, User, UserSession
from app.modules.identity.passwords import PasswordHasher
from app.modules.identity.schemas import (
    BootstrapAdminRequest,
    ConfirmEmailRequest,
    LoginRequest,
    PublicUser,
    RegisterRequest,
    ResendConfirmationRequest,
)
from app.modules.identity.sessions import IssuedSessionTokens, SessionTokens

logger = logging.getLogger(__name__)


class IdentityService(Protocol):
    async def bootstrap_admin(
        self,
        payload: BootstrapAdminRequest,
        request: Request,
    ) -> PublicUser: ...

    async def login(
        self,
        payload: LoginRequest,
        request: Request,
        settings: Settings,
    ) -> tuple[PublicUser, IssuedSessionTokens]: ...

    async def current_user(self, raw_session_token: str | None) -> PublicUser: ...

    async def csrf_token(self, raw_session_token: str | None) -> str: ...

    async def logout(self, raw_session_token: str | None, request: Request) -> None: ...

    async def register(
        self,
        payload: RegisterRequest,
        request: Request,
        settings: Settings,
        email_sender: EmailSender,
    ) -> None: ...

    async def confirm_email(self, payload: ConfirmEmailRequest, request: Request) -> None: ...

    async def resend_confirmation(
        self,
        payload: ResendConfirmationRequest,
        settings: Settings,
        email_sender: EmailSender,
    ) -> None: ...


def _public_user(user: User) -> PublicUser:
    return PublicUser(id=user.id, email=user.email, role=user.role)


def _expires_at_is_past(expires_at: datetime) -> bool:
    now = datetime.now(UTC)
    if expires_at.tzinfo is None:
        return expires_at <= now.replace(tzinfo=None)
    return expires_at <= now


async def _send_confirmation_email(
    email_sender: EmailSender,
    settings: Settings,
    email: str,
    raw_token: str,
) -> None:
    link = confirmation_link(settings, raw_token)
    try:
        await email_sender.send(build_confirmation_email(email, link))
    except EmailSendError as exc:
        logger.warning(
            "Confirmation email failed for %s using sender %s from %s. Provider status: %s",
            email,
            type(email_sender).__name__,
            settings.email_from,
            exc.provider_status,
            exc_info=exc,
        )
        raise ApiError(
            424,
            "confirmation_email_failed",
            (
                "Creamos la cuenta, pero no pudimos enviar el correo de confirmacion. "
                "Intentalo de nuevo en unos minutos."
            ),
        ) from exc


class SqlAlchemyIdentityService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def bootstrap_admin(
        self,
        payload: BootstrapAdminRequest,
        request: Request,
    ) -> PublicUser:
        existing_count = await self._session.scalar(select(func.count()).select_from(User))
        if existing_count:
            raise ApiError(409, "bootstrap_unavailable", "The first administrator already exists")

        user = User(
            email=payload.email.lower(),
            password_hash=PasswordHasher().hash(payload.password),
            role="superadmin",
            is_active=True,
            email_confirmed_at=datetime.now(UTC),
        )
        self._session.add(user)
        await self._session.flush()
        await record_audit_event(self._session, request, "identity.bootstrap_admin", user.id)
        await self._session.commit()
        await self._session.refresh(user)
        return _public_user(user)

    async def login(
        self,
        payload: LoginRequest,
        request: Request,
        settings: Settings,
    ) -> tuple[PublicUser, IssuedSessionTokens]:
        user = await self._session.scalar(select(User).where(User.email == payload.email.lower()))
        if user is None or not PasswordHasher().verify(payload.password, user.password_hash):
            raise ApiError(401, "invalid_credentials", "Email or password is incorrect")

        if user.email_confirmed_at is None:
            raise ApiError(
                403,
                "email_not_confirmed",
                "Necesitamos que confirmes tu correo antes de entrar",
            )

        if not user.is_active:
            raise ApiError(401, "invalid_credentials", "Email or password is incorrect")

        tokens = SessionTokens.issue(timedelta(seconds=settings.session_ttl_seconds))
        self._session.add(
            UserSession(
                user_id=user.id,
                token_hash=tokens.session_token_hash,
                csrf_token=tokens.csrf_token,
                expires_at=tokens.expires_at,
            )
        )
        await record_audit_event(self._session, request, "identity.login", user.id)
        await self._session.commit()
        return _public_user(user), tokens

    async def _session_from_token(self, raw_session_token: str | None) -> UserSession:
        if not raw_session_token:
            raise ApiError(401, "not_authenticated", "Authentication is required")

        user_session = await self._session.scalar(
            select(UserSession)
            .options(selectinload(UserSession.user))
            .where(UserSession.token_hash == SessionTokens.hash(raw_session_token))
        )

        if (
            user_session is None
            or user_session.revoked_at is not None
            or _expires_at_is_past(user_session.expires_at)
            or not user_session.user.is_active
        ):
            raise ApiError(401, "not_authenticated", "Authentication is required")

        return user_session

    async def current_user(self, raw_session_token: str | None) -> PublicUser:
        user_session = await self._session_from_token(raw_session_token)
        return _public_user(user_session.user)

    async def csrf_token(self, raw_session_token: str | None) -> str:
        user_session = await self._session_from_token(raw_session_token)
        return user_session.csrf_token

    async def logout(self, raw_session_token: str | None, request: Request) -> None:
        user_session = await self._session_from_token(raw_session_token)
        user_session.revoked_at = datetime.now(UTC)
        await record_audit_event(self._session, request, "identity.logout", user_session.user_id)
        await self._session.commit()

    async def _expire_unused_confirmations(self, user_id: str) -> None:
        confirmations = await self._session.scalars(
            select(EmailConfirmation).where(
                EmailConfirmation.user_id == user_id,
                EmailConfirmation.used_at.is_(None),
            )
        )
        now = datetime.now(UTC)
        for confirmation in confirmations:
            confirmation.used_at = now

    async def _issue_confirmation(
        self,
        user: User,
        settings: Settings,
    ) -> str:
        await self._expire_unused_confirmations(user.id)
        issued = ConfirmationTokens.issue(
            timedelta(seconds=settings.email_confirmation_ttl_seconds)
        )
        self._session.add(
            EmailConfirmation(
                user_id=user.id,
                token_hash=issued.token_hash,
                expires_at=issued.expires_at,
            )
        )
        return issued.raw_token

    async def register(
        self,
        payload: RegisterRequest,
        request: Request,
        settings: Settings,
        email_sender: EmailSender,
    ) -> None:
        email = payload.email.lower()
        existing_user = await self._session.scalar(select(User).where(User.email == email))
        if existing_user is not None:
            raw_token = None
            if existing_user.email_confirmed_at is None:
                raw_token = await self._issue_confirmation(existing_user, settings)
            await record_audit_event(
                self._session,
                request,
                "identity.register_existing",
                existing_user.id,
            )
            await self._session.commit()
            if raw_token is not None:
                await _send_confirmation_email(
                    email_sender,
                    settings,
                    existing_user.email,
                    raw_token,
                )
            return

        user = User(
            email=email,
            password_hash=PasswordHasher().hash(payload.password),
            role="customer",
            is_active=False,
        )
        self._session.add(user)
        await self._session.flush()
        raw_token = await self._issue_confirmation(user, settings)
        await record_audit_event(self._session, request, "identity.register", user.id)
        await self._session.commit()
        await _send_confirmation_email(email_sender, settings, user.email, raw_token)

    async def confirm_email(self, payload: ConfirmEmailRequest, request: Request) -> None:
        confirmation = await self._session.scalar(
            select(EmailConfirmation)
            .options(selectinload(EmailConfirmation.user))
            .where(EmailConfirmation.token_hash == ConfirmationTokens.hash(payload.token))
        )

        if (
            confirmation is None
            or confirmation.used_at is not None
            or _expires_at_is_past(confirmation.expires_at)
        ):
            raise ApiError(400, "invalid_confirmation", "El enlace ya no es valido")

        now = datetime.now(UTC)
        confirmation.used_at = now
        confirmation.user.email_confirmed_at = now
        confirmation.user.is_active = True
        await record_audit_event(
            self._session,
            request,
            "identity.confirm_email",
            confirmation.user_id,
        )
        await self._session.commit()

    async def resend_confirmation(
        self,
        payload: ResendConfirmationRequest,
        settings: Settings,
        email_sender: EmailSender,
    ) -> None:
        user = await self._session.scalar(select(User).where(User.email == payload.email.lower()))
        if user is None or user.email_confirmed_at is not None:
            return

        raw_token = await self._issue_confirmation(user, settings)
        await self._session.commit()
        await _send_confirmation_email(email_sender, settings, user.email, raw_token)


SessionDependency = Annotated[AsyncSession, Depends(get_session)]


async def get_identity_service(session: SessionDependency) -> IdentityService:
    return SqlAlchemyIdentityService(session)
