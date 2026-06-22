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
from app.modules.identity.models import User, UserSession
from app.modules.identity.passwords import PasswordHasher
from app.modules.identity.schemas import BootstrapAdminRequest, LoginRequest, PublicUser
from app.modules.identity.sessions import IssuedSessionTokens, SessionTokens


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

    async def logout(self, raw_session_token: str | None, request: Request) -> None: ...


def _public_user(user: User) -> PublicUser:
    return PublicUser(id=user.id, email=user.email, role=user.role)


def _expires_at_is_past(expires_at: datetime) -> bool:
    now = datetime.now(UTC)
    if expires_at.tzinfo is None:
        return expires_at <= now.replace(tzinfo=None)
    return expires_at <= now


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
            role="admin",
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
        if (
            user is None
            or not user.is_active
            or not PasswordHasher().verify(payload.password, user.password_hash)
        ):
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

    async def logout(self, raw_session_token: str | None, request: Request) -> None:
        user_session = await self._session_from_token(raw_session_token)
        user_session.revoked_at = datetime.now(UTC)
        await record_audit_event(self._session, request, "identity.logout", user_session.user_id)
        await self._session.commit()


SessionDependency = Annotated[AsyncSession, Depends(get_session)]


async def get_identity_service(session: SessionDependency) -> IdentityService:
    return SqlAlchemyIdentityService(session)