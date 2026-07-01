from dataclasses import dataclass
from datetime import timedelta
from uuid import uuid4

from fastapi import Request
from fastapi.testclient import TestClient

from app.core.config import Settings
from app.main import create_app
from app.modules.identity.email import EmailSender
from app.modules.identity.router import get_identity_service
from app.modules.identity.schemas import (
    BootstrapAdminRequest,
    ConfirmEmailRequest,
    LoginRequest,
    PublicUser,
    RegisterRequest,
    ResendConfirmationRequest,
    StaffUserCreateRequest,
)
from app.modules.identity.sessions import IssuedSessionTokens, SessionTokens


class HealthyProbe:
    async def check(self) -> None:
        return None


@dataclass
class StoredSession:
    user: PublicUser
    csrf_token: str
    revoked: bool = False


class FakeIdentityService:
    def __init__(self) -> None:
        self.users: dict[str, tuple[PublicUser, str]] = {}
        self.sessions: dict[str, StoredSession] = {}

    async def bootstrap_admin(
        self,
        payload: BootstrapAdminRequest,
        request: Request,
    ) -> PublicUser:
        if self.users:
            from app.core.errors import ApiError

            raise ApiError(409, "bootstrap_unavailable", "The first administrator already exists")
        user = PublicUser(
            id=str(uuid4()),
            email=payload.email,
            role="superadmin",
            email_confirmed=True,
        )
        self.users[payload.email.lower()] = (user, payload.password)
        return user

    async def register(
        self,
        payload: RegisterRequest,
        request: Request,
        settings: Settings,
        email_sender: EmailSender,
    ) -> bool:
        user = PublicUser(
            id=str(uuid4()),
            email=payload.email,
            role="customer",
            email_confirmed=False,
            first_name=payload.first_name,
            last_name=payload.last_name,
            phone=payload.phone,
        )
        self.users[payload.email.lower()] = (user, payload.password)
        return True

    async def confirm_email(self, payload: ConfirmEmailRequest, request: Request) -> None:
        return None

    async def resend_confirmation(
        self,
        payload: ResendConfirmationRequest,
        settings: Settings,
        email_sender: EmailSender,
    ) -> None:
        return None

    async def login(
        self,
        payload: LoginRequest,
        request: Request,
        settings: Settings,
    ) -> tuple[PublicUser, IssuedSessionTokens]:
        from app.core.errors import ApiError

        stored = self.users.get(payload.email.lower())
        if stored is None or stored[1] != payload.password:
            raise ApiError(401, "invalid_credentials", "Email or password is incorrect")

        user = stored[0]
        tokens = SessionTokens.issue(timedelta(seconds=settings.session_ttl_seconds))
        self.sessions[tokens.raw_session_token] = StoredSession(user, tokens.csrf_token)
        return user, tokens

    async def current_user(self, raw_session_token: str | None) -> PublicUser:
        from app.core.errors import ApiError

        if raw_session_token is None:
            raise ApiError(401, "not_authenticated", "Authentication is required")
        stored = self.sessions.get(raw_session_token)
        if stored is None or stored.revoked:
            raise ApiError(401, "not_authenticated", "Authentication is required")
        return stored.user

    async def csrf_token(self, raw_session_token: str | None) -> str:
        from app.core.errors import ApiError

        if raw_session_token is None:
            raise ApiError(401, "not_authenticated", "Authentication is required")
        stored = self.sessions.get(raw_session_token)
        if stored is None or stored.revoked:
            raise ApiError(401, "not_authenticated", "Authentication is required")
        return stored.csrf_token

    async def logout(self, raw_session_token: str | None, request: Request) -> None:
        from app.core.errors import ApiError

        if raw_session_token is None or raw_session_token not in self.sessions:
            raise ApiError(401, "not_authenticated", "Authentication is required")
        self.sessions[raw_session_token].revoked = True

    async def create_staff_user(
        self,
        payload: StaffUserCreateRequest,
        request: Request,
        actor_user_id: str,
    ) -> PublicUser:
        from app.core.errors import ApiError

        if payload.email.lower() in self.users:
            raise ApiError(409, "email_already_registered", "Ya existe una cuenta con ese email")

        user = PublicUser(
            id=str(uuid4()),
            email=payload.email,
            role=payload.role,
            email_confirmed=True,
            first_name=payload.first_name,
            last_name=payload.last_name,
            phone=payload.phone,
        )
        self.users[payload.email.lower()] = (user, payload.password)
        return user


def build_client() -> TestClient:
    service = FakeIdentityService()
    app = create_app(readiness_probe=HealthyProbe())
    app.dependency_overrides[get_identity_service] = lambda: service
    return TestClient(app)


def test_bootstrap_admin_creates_first_admin() -> None:
    client = build_client()

    response = client.post(
        "/identity/bootstrap-admin",
        json={"email": "owner@example.com", "password": "correct horse battery"},
    )

    assert response.status_code == 201
    assert response.json()["email"] == "owner@example.com"
    assert response.json()["role"] == "superadmin"


def test_bootstrap_admin_is_single_use() -> None:
    client = build_client()
    client.post(
        "/identity/bootstrap-admin",
        json={"email": "owner@example.com", "password": "correct horse battery"},
    )

    response = client.post(
        "/identity/bootstrap-admin",
        json={"email": "second@example.com", "password": "correct horse battery"},
    )

    assert response.status_code == 409
    assert response.json()["code"] == "bootstrap_unavailable"


def test_login_sets_session_and_csrf_cookies() -> None:
    client = build_client()
    client.post(
        "/identity/bootstrap-admin",
        json={"email": "owner@example.com", "password": "correct horse battery"},
    )

    response = client.post(
        "/identity/login",
        json={"email": "owner@example.com", "password": "correct horse battery"},
    )

    assert response.status_code == 200
    assert response.json()["role"] == "superadmin"
    assert response.json()["email_confirmed"] is True
    assert client.cookies.get("fs_session") is not None
    assert client.cookies.get("fs_csrf") is not None
    assert "HttpOnly" in response.headers["set-cookie"]
    assert "Max-Age=3600" in response.headers["set-cookie"]


def test_superadmin_can_create_admin_user() -> None:
    client = build_client()
    client.post(
        "/identity/bootstrap-admin",
        json={"email": "owner@example.com", "password": "correct horse battery"},
    )
    client.post(
        "/identity/login",
        json={"email": "owner@example.com", "password": "correct horse battery"},
    )

    response = client.post(
        "/identity/admin/users",
        json={
            "email": "seller@example.com",
            "password": "correct horse battery",
            "role": "admin",
            "first_name": "Seller",
        },
    )

    assert response.status_code == 201
    assert response.json()["email"] == "seller@example.com"
    assert response.json()["role"] == "admin"
    assert response.json()["email_confirmed"] is True


def test_me_returns_current_user_after_login() -> None:
    client = build_client()
    client.post(
        "/identity/bootstrap-admin",
        json={"email": "owner@example.com", "password": "correct horse battery"},
    )
    client.post(
        "/identity/login",
        json={"email": "owner@example.com", "password": "correct horse battery"},
    )

    response = client.get("/identity/me")

    assert response.status_code == 200
    assert response.json()["email"] == "owner@example.com"


def test_logout_requires_matching_csrf_header() -> None:
    client = build_client()
    client.post(
        "/identity/bootstrap-admin",
        json={"email": "owner@example.com", "password": "correct horse battery"},
    )
    client.post(
        "/identity/login",
        json={"email": "owner@example.com", "password": "correct horse battery"},
    )

    response = client.post("/identity/logout", headers={"x-csrf-token": "wrong"})

    assert response.status_code == 403
    assert response.json()["code"] == "csrf_failed"


def test_csrf_returns_current_session_token() -> None:
    client = build_client()
    client.post(
        "/identity/bootstrap-admin",
        json={"email": "owner@example.com", "password": "correct horse battery"},
    )
    client.post(
        "/identity/login",
        json={"email": "owner@example.com", "password": "correct horse battery"},
    )

    response = client.get("/identity/csrf")

    assert response.status_code == 200
    assert response.json() == {"csrf_token": client.cookies.get("fs_csrf")}


def test_logout_revokes_session_and_clears_cookies() -> None:
    client = build_client()
    client.post(
        "/identity/bootstrap-admin",
        json={"email": "owner@example.com", "password": "correct horse battery"},
    )
    client.post(
        "/identity/login",
        json={"email": "owner@example.com", "password": "correct horse battery"},
    )
    csrf_token = client.cookies.get("fs_csrf")

    response = client.post("/identity/logout", headers={"x-csrf-token": csrf_token})

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
    assert client.cookies.get("fs_session") is None
    assert client.cookies.get("fs_csrf") is None
    assert client.get("/identity/me").status_code == 401


def test_register_returns_plain_confirmation_message() -> None:
    client = build_client()

    response = client.post(
        "/identity/register",
        json={
            "email": "buyer@example.com",
            "password": "correct horse battery",
            "first_name": "Ada",
            "last_name": "Lovelace",
            "phone": "2494000000",
        },
    )

    assert response.status_code == 201
    assert response.json() == {"message": "Te enviamos un correo para confirmar tu cuenta."}


def test_confirm_email_returns_plain_success_message() -> None:
    client = build_client()

    response = client.post("/identity/confirm-email", json={"token": "valid-token-value"})

    assert response.status_code == 200
    assert response.json() == {"message": "Tu cuenta ya esta confirmada."}


def test_resend_confirmation_returns_generic_message() -> None:
    client = build_client()

    response = client.post("/identity/resend-confirmation", json={"email": "buyer@example.com"})

    assert response.status_code == 200
    assert response.json() == {
        "message": "Si la cuenta existe, te enviamos un nuevo correo de confirmacion."
    }
