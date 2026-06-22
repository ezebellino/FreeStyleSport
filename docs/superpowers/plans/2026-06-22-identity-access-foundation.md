# Identity and Access Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Session note:** The project owner requested inline execution without subagents to conserve context/data.

**Goal:** Add secure identity foundations: first-admin bootstrap, password login, HttpOnly opaque sessions, CSRF enforcement, RBAC dependencies, and audit records.

**Architecture:** Keep identity as a backend module inside the FastAPI modular monolith. Store users, sessions, and audit events in PostgreSQL through SQLAlchemy models; expose small REST endpoints for bootstrap, login, logout, and current user; use host-only HttpOnly cookies for sessions and a non-HttpOnly CSRF cookie/header pair for unsafe requests. The frontend only receives public user shape and never reads session credentials.

**Tech Stack:** FastAPI, SQLAlchemy 2 async ORM, Alembic, Pydantic, argon2-cffi, pytest, httpx TestClient, Next.js App Router, TypeScript, TanStack Query later.

---

## Scope boundary and file map

This plan implements authentication and authorization primitives only. Customer registration, password reset email, seller/admin dashboards, catalog ownership, checkout identity merge, and account profile editing remain later plans.

Target files:

~~~text
backend/
  pyproject.toml
  app/core/config.py
  app/core/security.py
  app/db/base.py
  app/db/session.py
  app/modules/identity/models.py
  app/modules/identity/schemas.py
  app/modules/identity/passwords.py
  app/modules/identity/sessions.py
  app/modules/identity/audit.py
  app/modules/identity/dependencies.py
  app/modules/identity/router.py
  app/main.py
  alembic/env.py
  alembic/versions/<revision>_identity_access_foundation.py
  tests/identity/
frontend/
  src/app/cuenta/page.tsx
  src/app/admin/page.tsx
  src/lib/api.ts
  src/lib/auth.ts
~~~

## Task 1: Add identity dependencies and typed security settings

**Files:**
- Modify: `backend/pyproject.toml`
- Modify: `backend/app/core/config.py`
- Create: `backend/app/core/security.py`
- Create: `backend/tests/core/test_security.py`

- [ ] **Step 1: Add dependency and settings tests**

Create `backend/tests/core/test_security.py`:

~~~python
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
~~~

- [ ] **Step 2: Run expected failing test**

Run:

~~~powershell
.\.venv\Scripts\python.exe -m pytest backend\tests\core\test_security.py -q
~~~

Expected: FAIL because `app.core.security` does not exist.

- [ ] **Step 3: Add argon2 and settings**

Modify `backend/pyproject.toml` dependencies to include:

~~~toml
  "argon2-cffi>=25,<26",
~~~

Modify `Settings` in `backend/app/core/config.py` with these fields:

~~~python
    session_cookie_name: str = "fs_session"
    csrf_cookie_name: str = "fs_csrf"
    cookie_domain: str | None = None
    session_ttl_seconds: int = 60 * 60 * 24 * 7
    csrf_header_name: str = "x-csrf-token"
~~~

Create `backend/app/core/security.py`:

~~~python
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
        "samesite": "lax",
        "domain": settings.cookie_domain,
        "path": "/",
    }
~~~

- [ ] **Step 4: Verify**

Run:

~~~powershell
.\.venv\Scripts\python.exe -m pip install -e ".\backend[dev]"
.\.venv\Scripts\python.exe -m pytest backend\tests\core\test_security.py -q
.\.venv\Scripts\python.exe -m ruff check backend
~~~

Expected: tests pass and Ruff exits 0.

- [ ] **Step 5: Commit**

~~~powershell
git add backend
git commit -m "feat(api): add identity security settings"
~~~

## Task 2: Add database base, identity models, and Alembic metadata

**Files:**
- Create: `backend/app/db/base.py`
- Create: `backend/app/modules/identity/__init__.py`
- Create: `backend/app/modules/identity/models.py`
- Modify: `backend/alembic/env.py`
- Create: `backend/tests/identity/test_models.py`
- Create: `backend/alembic/versions/20260622_0001_identity_access_foundation.py`

- [ ] **Step 1: Write model metadata tests**

Create `backend/tests/identity/test_models.py`:

~~~python
from app.db.base import Base
from app.modules.identity.models import AuditEvent, User, UserSession


def test_identity_tables_are_registered() -> None:
    assert User.__tablename__ in Base.metadata.tables
    assert UserSession.__tablename__ in Base.metadata.tables
    assert AuditEvent.__tablename__ in Base.metadata.tables


def test_user_roles_are_stored_as_strings() -> None:
    role_column = User.__table__.c.role
    assert str(role_column.type).lower().startswith("varchar")
~~~

- [ ] **Step 2: Run expected failing test**

Run:

~~~powershell
.\.venv\Scripts\python.exe -m pytest backend\tests\identity\test_models.py -q
~~~

Expected: FAIL because `app.db.base` and identity models do not exist.

- [ ] **Step 3: Implement Base and models**

Create `backend/app/db/base.py`:

~~~python
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass
~~~

Create `backend/app/modules/identity/__init__.py`:

~~~python
"""Identity and access module."""
~~~

Create `backend/app/modules/identity/models.py`:

~~~python
from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


def utcnow() -> datetime:
    return datetime.now(UTC)


class User(Base):
    __tablename__ = "identity_users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(Text)
    role: Mapped[str] = mapped_column(String(32), default="customer")
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    sessions: Mapped[list["UserSession"]] = relationship(back_populates="user")


class UserSession(Base):
    __tablename__ = "identity_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("identity_users.id", ondelete="CASCADE"), index=True)
    token_hash: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    csrf_token: Mapped[str] = mapped_column(String(128))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped[User] = relationship(back_populates="sessions")


class AuditEvent(Base):
    __tablename__ = "audit_events"
    __table_args__ = (UniqueConstraint("request_id", "action", name="uq_audit_request_action"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    actor_user_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)
    action: Mapped[str] = mapped_column(String(120))
    request_id: Mapped[str] = mapped_column(String(128), index=True)
    ip_address: Mapped[str | None] = mapped_column(String(64), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
~~~

- [ ] **Step 4: Wire Alembic metadata**

Modify `backend/alembic/env.py`:

~~~python
from app.db.base import Base
from app.modules.identity import models as identity_models  # noqa: F401

target_metadata = Base.metadata
~~~

- [ ] **Step 5: Add migration**

Create `backend/alembic/versions/20260622_0001_identity_access_foundation.py` with SQLAlchemy tables matching the models above.

- [ ] **Step 6: Verify**

Run:

~~~powershell
.\.venv\Scripts\python.exe -m pytest backend\tests\identity\test_models.py -q
.\.venv\Scripts\python.exe -m ruff check backend
~~~

Expected: tests pass and Ruff exits 0.

- [ ] **Step 7: Commit**

~~~powershell
git add backend
git commit -m "feat(api): add identity persistence models"
~~~

## Task 3: Add password hashing, opaque session tokens, and CSRF validation

**Files:**
- Create: `backend/app/modules/identity/passwords.py`
- Create: `backend/app/modules/identity/sessions.py`
- Create: `backend/tests/identity/test_credentials.py`

- [ ] **Step 1: Write credentials tests**

Create `backend/tests/identity/test_credentials.py`:

~~~python
from datetime import UTC, datetime, timedelta

import pytest

from app.modules.identity.passwords import PasswordHasher
from app.modules.identity.sessions import SessionTokens, require_matching_csrf


def test_password_hash_roundtrip() -> None:
    hasher = PasswordHasher()

    password_hash = hasher.hash("correct horse battery staple")

    assert password_hash != "correct horse battery staple"
    assert hasher.verify("correct horse battery staple", password_hash) is True
    assert hasher.verify("wrong", password_hash) is False


def test_session_token_hash_is_stable_and_secret_is_not_stored() -> None:
    tokens = SessionTokens.issue(timedelta(days=7))

    assert tokens.raw_session_token != tokens.session_token_hash
    assert SessionTokens.hash(tokens.raw_session_token) == tokens.session_token_hash
    assert tokens.expires_at > datetime.now(UTC)


def test_csrf_requires_cookie_and_header_match() -> None:
    require_matching_csrf("same", "same")

    with pytest.raises(ValueError, match="CSRF"):
        require_matching_csrf("cookie", "header")
~~~

- [ ] **Step 2: Run expected failing test**

Run:

~~~powershell
.\.venv\Scripts\python.exe -m pytest backend\tests\identity\test_credentials.py -q
~~~

Expected: FAIL because modules do not exist.

- [ ] **Step 3: Implement password and token helpers**

Create `backend/app/modules/identity/passwords.py`:

~~~python
from argon2 import PasswordHasher as ArgonPasswordHasher
from argon2.exceptions import VerifyMismatchError


class PasswordHasher:
    def __init__(self) -> None:
        self._hasher = ArgonPasswordHasher()

    def hash(self, password: str) -> str:
        return self._hasher.hash(password)

    def verify(self, password: str, password_hash: str) -> bool:
        try:
            return self._hasher.verify(password_hash, password)
        except VerifyMismatchError:
            return False
~~~

Create `backend/app/modules/identity/sessions.py`:

~~~python
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
~~~

- [ ] **Step 4: Verify and commit**

Run:

~~~powershell
.\.venv\Scripts\python.exe -m pytest backend\tests\identity\test_credentials.py -q
.\.venv\Scripts\python.exe -m ruff check backend
git add backend
git commit -m "feat(api): add password and session token helpers"
~~~

## Task 4: Add identity API router with bootstrap, login, logout, and current user

**Files:**
- Create: `backend/app/modules/identity/schemas.py`
- Create: `backend/app/modules/identity/audit.py`
- Create: `backend/app/modules/identity/router.py`
- Modify: `backend/app/main.py`
- Create: `backend/tests/identity/test_router.py`

- [ ] **Step 1: Write API tests using fake stores first**

Create `backend/tests/identity/test_router.py`:

~~~python
from fastapi.testclient import TestClient

from app.main import create_app


def test_bootstrap_admin_creates_first_admin() -> None:
    client = TestClient(create_app(readiness_probe=None))

    response = client.post(
        "/identity/bootstrap-admin",
        json={"email": "owner@freestylesport.test", "password": "correct horse battery"},
    )

    assert response.status_code == 201
    assert response.json()["email"] == "owner@freestylesport.test"
    assert response.json()["role"] == "admin"


def test_bootstrap_admin_is_single_use() -> None:
    client = TestClient(create_app(readiness_probe=None))
    client.post(
        "/identity/bootstrap-admin",
        json={"email": "owner@freestylesport.test", "password": "correct horse battery"},
    )

    response = client.post(
        "/identity/bootstrap-admin",
        json={"email": "second@freestylesport.test", "password": "correct horse battery"},
    )

    assert response.status_code == 409
    assert response.json()["code"] == "bootstrap_unavailable"


def test_login_sets_session_and_csrf_cookies() -> None:
    client = TestClient(create_app(readiness_probe=None))
    client.post(
        "/identity/bootstrap-admin",
        json={"email": "owner@freestylesport.test", "password": "correct horse battery"},
    )

    response = client.post(
        "/identity/login",
        json={"email": "owner@freestylesport.test", "password": "correct horse battery"},
    )

    assert response.status_code == 200
    assert response.json()["role"] == "admin"
    assert "fs_session=" in response.headers["set-cookie"]
    assert "HttpOnly" in response.headers["set-cookie"]
    assert "fs_csrf=" in response.headers["set-cookie"]


def test_me_returns_current_user_after_login() -> None:
    client = TestClient(create_app(readiness_probe=None))
    client.post(
        "/identity/bootstrap-admin",
        json={"email": "owner@freestylesport.test", "password": "correct horse battery"},
    )
    client.post(
        "/identity/login",
        json={"email": "owner@freestylesport.test", "password": "correct horse battery"},
    )

    response = client.get("/identity/me")

    assert response.status_code == 200
    assert response.json()["email"] == "owner@freestylesport.test"


def test_logout_requires_matching_csrf_header() -> None:
    client = TestClient(create_app(readiness_probe=None))
    client.post(
        "/identity/bootstrap-admin",
        json={"email": "owner@freestylesport.test", "password": "correct horse battery"},
    )
    client.post(
        "/identity/login",
        json={"email": "owner@freestylesport.test", "password": "correct horse battery"},
    )

    response = client.post("/identity/logout", headers={"x-csrf-token": "wrong"})

    assert response.status_code == 403
    assert response.json()["code"] == "csrf_failed"
~~~

- [ ] **Step 2: Run expected failing test**

Run:

~~~powershell
.\.venv\Scripts\python.exe -m pytest backend\tests\identity\test_router.py -q
~~~

Expected: FAIL because router does not exist.

- [ ] **Step 3: Implement schemas**

Create `backend/app/modules/identity/schemas.py`:

~~~python
from pydantic import BaseModel, EmailStr, Field


class BootstrapAdminRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=12)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class PublicUser(BaseModel):
    id: str
    email: EmailStr
    role: str
~~~

- [ ] **Step 4: Implement audit helper and router**

Implement route handlers with `APIRouter(prefix="/identity", tags=["identity"])`, response cookies from `build_cookie_settings`, `ApiError` for stable errors, and async SQLAlchemy sessions from `session_factory`.

- [ ] **Step 5: Wire router**

Modify `backend/app/main.py`:

~~~python
from app.modules.identity.router import router as identity_router

app.include_router(identity_router)
~~~

- [ ] **Step 6: Verify and commit**

Run:

~~~powershell
.\.venv\Scripts\python.exe -m pytest backend\tests\identity -q
.\.venv\Scripts\python.exe -m ruff check backend
git add backend
git commit -m "feat(api): add identity session endpoints"
~~~

## Task 5: Add RBAC dependencies and audit tests

**Files:**
- Create: `backend/app/modules/identity/dependencies.py`
- Create: `backend/tests/identity/test_rbac.py`

- [ ] **Step 1: Write RBAC tests**

Create tests proving:
- inactive users are rejected;
- `require_role("admin")` accepts admin;
- `require_role("admin")` rejects seller/customer;
- audit records include request id, action, actor, IP, and user agent.

- [ ] **Step 2: Implement dependencies**

Create `backend/app/modules/identity/dependencies.py`:

~~~python
from collections.abc import Callable

from app.core.errors import ApiError
from app.modules.identity.schemas import PublicUser


def require_active_user(user: PublicUser) -> PublicUser:
    return user


def require_role(role: str) -> Callable[[PublicUser], PublicUser]:
    def dependency(user: PublicUser) -> PublicUser:
        if user.role != role:
            raise ApiError(403, "forbidden", "You do not have access to this resource")
        return user

    return dependency
~~~

- [ ] **Step 3: Verify and commit**

Run:

~~~powershell
.\.venv\Scripts\python.exe -m pytest backend\tests\identity -q
.\.venv\Scripts\python.exe -m ruff check backend
git add backend
git commit -m "feat(api): add identity authorization helpers"
~~~

## Task 6: Add minimal frontend auth routes and API helpers

**Files:**
- Create: `frontend/src/lib/api.ts`
- Create: `frontend/src/lib/auth.ts`
- Create: `frontend/src/app/cuenta/page.tsx`
- Create: `frontend/src/app/admin/page.tsx`
- Create: `frontend/src/lib/auth.test.ts`

- [ ] **Step 1: Write frontend auth helper tests**

Create `frontend/src/lib/auth.test.ts`:

~~~typescript
import { describe, expect, it } from "vitest"

import { buildCsrfHeaders } from "./auth"

describe("buildCsrfHeaders", () => {
  it("copies the csrf cookie into the csrf header", () => {
    expect(buildCsrfHeaders("fs_csrf=abc123; other=value")).toEqual({ "x-csrf-token": "abc123" })
  })

  it("returns an empty object when the cookie is missing", () => {
    expect(buildCsrfHeaders("other=value")).toEqual({})
  })
})
~~~

- [ ] **Step 2: Implement helpers**

Create `frontend/src/lib/api.ts`:

~~~typescript
export const publicApiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
export const privateApiUrl = process.env.API_PRIVATE_URL ?? publicApiUrl
~~~

Create `frontend/src/lib/auth.ts`:

~~~typescript
export function buildCsrfHeaders(cookieHeader: string): Record<string, string> {
  const token = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("fs_csrf="))
    ?.slice("fs_csrf=".length)

  return token ? { "x-csrf-token": decodeURIComponent(token) } : {}
}
~~~

- [ ] **Step 3: Add minimal account/admin pages**

Create `frontend/src/app/cuenta/page.tsx` and `frontend/src/app/admin/page.tsx` as server-rendered pages with clear copy that account/admin flows are enabled by the identity API foundation and will get full UI in the operations plan.

- [ ] **Step 4: Verify and commit**

Run:

~~~powershell
npm.cmd run lint --prefix frontend
npm.cmd run typecheck --prefix frontend
npm.cmd run test:run --prefix frontend
npm.cmd run build --prefix frontend
git add frontend
git commit -m "feat(web): add identity route shells"
~~~

## Task 7: Final verification and documentation

**Files:**
- Modify: `README.md`
- Modify: `.github/workflows/ci.yml` if new backend dependency cache needs refresh only.

- [ ] **Step 1: Document identity contracts**

Add a README section listing:
- `POST /identity/bootstrap-admin`
- `POST /identity/login`
- `GET /identity/me`
- `POST /identity/logout`
- `fs_session` HttpOnly cookie
- `fs_csrf` readable cookie and `x-csrf-token` header

- [ ] **Step 2: Run full verification**

Run:

~~~powershell
.\.venv\Scripts\python.exe -m pip install -e ".\backend[dev]"
.\.venv\Scripts\python.exe -m ruff check backend
.\.venv\Scripts\python.exe -m pytest backend\tests -q
npm.cmd run lint --prefix frontend
npm.cmd run typecheck --prefix frontend
npm.cmd run test:run --prefix frontend
npm.cmd run build --prefix frontend
docker build -t freestyle-api:identity backend
docker build -t freestyle-web:identity frontend
git diff --check
git status --short
~~~

Expected: all commands exit 0 and status lists only README/CI changes before final commit.

- [ ] **Step 3: Commit**

~~~powershell
git add README.md .github/workflows/ci.yml
git commit -m "docs: document identity foundation"
~~~

## Self-review notes

- Coverage: first-admin bootstrap, password login, HttpOnly sessions, CSRF, RBAC helpers, audit persistence, frontend route shells, CI/local verification.
- Deliberate exclusions: password reset, email verification, customer profile editing, seller/admin dashboards, cart merge, and checkout identity behavior.
- Execution mode: inline execution only per project owner request.


