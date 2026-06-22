# Email Confirmation and User Copy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Session note:** The project owner requested inline execution without subagents to conserve context/data.

**Goal:** Add customer registration, email confirmation, Resend-backed email sending, role-aware owner/admin/customer accounts, and non-technical public account copy.

**Architecture:** Extend the existing FastAPI identity module with email confirmation persistence, token helpers, an email sender port, and public register/confirm/resend endpoints. Keep browser-facing pages in Next.js App Router with simple server-rendered forms and shopper-friendly copy, while backend tests validate all security-sensitive behavior.

**Tech Stack:** FastAPI, SQLAlchemy 2 async ORM, Alembic, Pydantic, argon2-cffi, httpx, pytest, Next.js App Router, TypeScript, Vitest, Resend HTTP API.

---

## Scope boundary and decisions

- Initial `superadmin`: `admin@zeqebellino.com`.
- Staff role: `admin`, for managing the web, products, sales, and orders.
- Customer role: `customer`.
- Initial email sender: `FreeStyle <onboarding@resend.dev>`.
- Domain sender migration to `zeqebellino.com` is deferred until Hostinger DNS is corrected.
- `/perfil` should show login/register calls to action in this phase, not hard-redirect.
- Password reset, editable profile, real order history, newsletters, and admin dashboards remain later work.

## File map

```text
backend/
  pyproject.toml
  .env.example
  app/core/config.py
  app/modules/identity/models.py
  app/modules/identity/schemas.py
  app/modules/identity/email.py
  app/modules/identity/confirmations.py
  app/modules/identity/service.py
  app/modules/identity/router.py
  alembic/versions/20260622_0002_email_confirmations.py
  tests/core/test_config.py
  tests/identity/test_models.py
  tests/identity/test_email_confirmations.py
  tests/identity/test_router.py
frontend/
  src/app/login/page.tsx
  src/app/registro/page.tsx
  src/app/confirmar-cuenta/page.tsx
  src/app/perfil/page.tsx
  src/lib/auth.ts
  src/lib/auth.test.ts
README.md
docs/superpowers/specs/2026-06-22-email-confirmation-and-user-copy-design.md
```

## Task 1: Add email configuration and Resend dependency

**Files:**
- Modify: `backend/pyproject.toml`
- Modify: `backend/app/core/config.py`
- Modify: `backend/.env.example`
- Modify: `backend/tests/core/test_config.py`

- [ ] **Step 1: Add settings test**

Append to `backend/tests/core/test_config.py`:

```python
def test_email_settings_have_safe_defaults() -> None:
    settings = Settings(
        database_url="postgresql+psycopg://user:pass@db:5432/store",
        environment="development",
    )

    assert settings.email_from == "FreeStyle <onboarding@resend.dev>"
    assert settings.public_app_url == "http://localhost:3000"
    assert settings.email_confirmation_ttl_seconds == 60 * 60 * 24
    assert settings.resend_api_key is None
```

- [ ] **Step 2: Run expected failing test**

Run:

```powershell
.\.venv\Scripts\python.exe -m pytest backend\tests\core\test_config.py -q
```

Expected: FAIL because the new settings do not exist.

- [ ] **Step 3: Add dependency and settings**

Modify `backend/pyproject.toml` dependencies:

```toml
    "httpx>=0.28,<1",
```

Move `httpx` out of dev dependencies only if duplicated after adding it to runtime dependencies.

Modify `Settings` in `backend/app/core/config.py`:

```python
    resend_api_key: str | None = None
    email_from: str = "FreeStyle <onboarding@resend.dev>"
    public_app_url: str = "http://localhost:3000"
    email_confirmation_ttl_seconds: int = 60 * 60 * 24
```

Modify `backend/.env.example`:

```env
RESEND_API_KEY=
EMAIL_FROM=FreeStyle <onboarding@resend.dev>
PUBLIC_APP_URL=http://localhost:3000
EMAIL_CONFIRMATION_TTL_SECONDS=86400
```

- [ ] **Step 4: Verify and commit**

Run:

```powershell
.\.venv\Scripts\python.exe -m pip install -e ".\backend[dev]"
.\.venv\Scripts\python.exe -m pytest backend\tests\core\test_config.py -q
.\.venv\Scripts\python.exe -m ruff check backend
git add backend
git commit -m "feat(api): add email confirmation settings"
```

## Task 2: Add confirmation persistence and roles

**Files:**
- Modify: `backend/app/modules/identity/models.py`
- Modify: `backend/tests/identity/test_models.py`
- Create: `backend/alembic/versions/20260622_0002_email_confirmations.py`

- [ ] **Step 1: Add model tests**

Append to `backend/tests/identity/test_models.py`:

```python
from app.modules.identity.models import EmailConfirmation


def test_email_confirmation_table_is_registered() -> None:
    assert EmailConfirmation.__tablename__ in Base.metadata.tables


def test_user_has_email_confirmation_timestamp() -> None:
    assert "email_confirmed_at" in User.__table__.c
```

- [ ] **Step 2: Run expected failing test**

Run:

```powershell
.\.venv\Scripts\python.exe -m pytest backend\tests\identity\test_models.py -q
```

Expected: FAIL because `EmailConfirmation` and `email_confirmed_at` do not exist.

- [ ] **Step 3: Implement models**

Modify `User`:

```python
    email_confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
```

Add relationship:

```python
    email_confirmations: Mapped[list["EmailConfirmation"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
```

Add class:

```python
class EmailConfirmation(Base):
    __tablename__ = "identity_email_confirmations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(
        ForeignKey("identity_users.id", ondelete="CASCADE"),
        index=True,
    )
    token_hash: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped[User] = relationship(back_populates="email_confirmations")
```

- [ ] **Step 4: Add migration**

Create `backend/alembic/versions/20260622_0002_email_confirmations.py`:

```python
"""email confirmations

Revision ID: 20260622_0002
Revises: 20260622_0001
Create Date: 2026-06-22
"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "20260622_0002"
down_revision: str | None = "20260622_0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "identity_users",
        sa.Column("email_confirmed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_table(
        "identity_email_confirmations",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("token_hash", sa.String(length=128), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["identity_users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_identity_email_confirmations_token_hash"),
        "identity_email_confirmations",
        ["token_hash"],
        unique=True,
    )
    op.create_index(
        op.f("ix_identity_email_confirmations_user_id"),
        "identity_email_confirmations",
        ["user_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_identity_email_confirmations_user_id"),
        table_name="identity_email_confirmations",
    )
    op.drop_index(
        op.f("ix_identity_email_confirmations_token_hash"),
        table_name="identity_email_confirmations",
    )
    op.drop_table("identity_email_confirmations")
    op.drop_column("identity_users", "email_confirmed_at")
```

- [ ] **Step 5: Verify and commit**

Run:

```powershell
.\.venv\Scripts\python.exe -m pytest backend\tests\identity\test_models.py -q
.\.venv\Scripts\python.exe -m ruff check backend
git add backend
git commit -m "feat(api): add email confirmation persistence"
```

## Task 3: Add confirmation token and email sender helpers

**Files:**
- Create: `backend/app/modules/identity/confirmations.py`
- Create: `backend/app/modules/identity/email.py`
- Create: `backend/tests/identity/test_email_confirmations.py`

- [ ] **Step 1: Write helper tests**

Create `backend/tests/identity/test_email_confirmations.py`:

```python
from datetime import UTC, datetime, timedelta

import pytest

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


@pytest.mark.asyncio
async def test_console_email_sender_captures_message() -> None:
    sender = ConsoleEmailSender()
    message = EmailMessage(
        to="admin@zeqebellino.com",
        subject="Confirmá tu cuenta FreeStyle",
        html="<p>Confirmá tu cuenta</p>",
    )

    await sender.send(message)

    assert sender.messages == [message]
```

- [ ] **Step 2: Run expected failing test**

Run:

```powershell
.\.venv\Scripts\python.exe -m pytest backend\tests\identity\test_email_confirmations.py -q
```

Expected: FAIL because helpers do not exist.

- [ ] **Step 3: Implement confirmation helpers**

Create `backend/app/modules/identity/confirmations.py`:

```python
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
```

- [ ] **Step 4: Implement email sender port**

Create `backend/app/modules/identity/email.py`:

```python
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
        subject="Confirmá tu cuenta FreeStyle",
        html=(
            "<h1>Confirmá tu cuenta FreeStyle</h1>"
            "<p>Para terminar de crear tu cuenta, abrí este enlace:</p>"
            f'<p><a href="{link}">Confirmar mi cuenta</a></p>'
            "<p>Si no pediste crear una cuenta, podés ignorar este mensaje.</p>"
        ),
    )
```

- [ ] **Step 5: Verify and commit**

Run:

```powershell
.\.venv\Scripts\python.exe -m pytest backend\tests\identity\test_email_confirmations.py -q
.\.venv\Scripts\python.exe -m ruff check backend
git add backend
git commit -m "feat(api): add email confirmation helpers"
```

## Task 4: Add register, confirm, resend, and superadmin behavior

**Files:**
- Modify: `backend/app/modules/identity/schemas.py`
- Modify: `backend/app/modules/identity/service.py`
- Modify: `backend/app/modules/identity/router.py`
- Modify: `backend/tests/identity/test_router.py`

- [ ] **Step 1: Add router tests**

Append tests to `backend/tests/identity/test_router.py` by extending `FakeIdentityService` with `register`, `confirm_email`, and `resend_confirmation`, then add:

```python
def test_register_returns_plain_confirmation_message() -> None:
    client = build_client()

    response = client.post(
        "/identity/register",
        json={"email": "buyer@example.com", "password": "correct horse battery"},
    )

    assert response.status_code == 201
    assert response.json() == {"message": "Te enviamos un correo para confirmar tu cuenta."}


def test_confirm_email_returns_plain_success_message() -> None:
    client = build_client()

    response = client.post("/identity/confirm-email", json={"token": "valid-token"})

    assert response.status_code == 200
    assert response.json() == {"message": "Tu cuenta ya está confirmada."}


def test_resend_confirmation_returns_generic_message() -> None:
    client = build_client()

    response = client.post("/identity/resend-confirmation", json={"email": "buyer@example.com"})

    assert response.status_code == 200
    assert response.json() == {
        "message": "Si la cuenta existe, te enviamos un nuevo correo de confirmación."
    }
```

- [ ] **Step 2: Run expected failing tests**

Run:

```powershell
.\.venv\Scripts\python.exe -m pytest backend\tests\identity\test_router.py -q
```

Expected: FAIL because schemas/routes do not exist.

- [ ] **Step 3: Add schemas**

Modify `backend/app/modules/identity/schemas.py`:

```python
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=12)


class ConfirmEmailRequest(BaseModel):
    token: str = Field(min_length=16)


class ResendConfirmationRequest(BaseModel):
    email: EmailStr


class MessageResponse(BaseModel):
    message: str
```

- [ ] **Step 4: Extend service protocol and implementation**

Add methods to `IdentityService`:

```python
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
```

Implementation rules:

- `bootstrap_admin` creates role `superadmin`, sets `email_confirmed_at=utcnow()`, and remains single-use.
- `register` creates `role="customer"`, `is_active=False`, `email_confirmed_at=None`.
- `register` handles duplicate email with the same plain success message after auditing.
- `confirm_email` marks token `used_at`, user `email_confirmed_at`, and `is_active=True`.
- `resend_confirmation` returns success for all emails and only sends if account exists and is unconfirmed.
- `login` rejects valid credentials for unconfirmed users with `ApiError(403, "email_not_confirmed", "Necesitamos que confirmes tu correo antes de entrar")`.

- [ ] **Step 5: Add routes**

Modify `router.py`:

```python
@router.post("/register", response_model=MessageResponse, status_code=201)
async def register(...) -> MessageResponse:
    await identity_service.register(payload, request, settings, email_sender)
    return MessageResponse(message="Te enviamos un correo para confirmar tu cuenta.")
```

Add equivalent `/confirm-email` and `/resend-confirmation` routes with shopper-facing messages.

- [ ] **Step 6: Verify and commit**

Run:

```powershell
.\.venv\Scripts\python.exe -m pytest backend\tests\identity -q
.\.venv\Scripts\python.exe -m ruff check backend
git add backend
git commit -m "feat(api): add email confirmation endpoints"
```

## Task 5: Add frontend auth pages and clean public copy

**Files:**
- Create: `frontend/src/app/login/page.tsx`
- Create: `frontend/src/app/registro/page.tsx`
- Create: `frontend/src/app/confirmar-cuenta/page.tsx`
- Modify: `frontend/src/app/perfil/page.tsx`
- Modify: `frontend/src/lib/auth.ts`
- Modify: `frontend/src/lib/auth.test.ts`

- [ ] **Step 1: Add frontend helper test**

Append to `frontend/src/lib/auth.test.ts`:

```typescript
import { publicApiUrl } from "./api"

describe("auth routes", () => {
  it("has a configured public API URL", () => {
    expect(publicApiUrl).toBeTruthy()
  })
})
```

- [ ] **Step 2: Add API helpers**

Modify `frontend/src/lib/auth.ts`:

```typescript
import { publicApiUrl } from "./api"

export type AuthMessage = { message: string }

export async function registerCustomer(email: string, password: string): Promise<AuthMessage> {
  const response = await fetch(`${publicApiUrl}/identity/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })
  return response.json() as Promise<AuthMessage>
}

export async function confirmEmail(token: string): Promise<AuthMessage> {
  const response = await fetch(`${publicApiUrl}/identity/confirm-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  })
  return response.json() as Promise<AuthMessage>
}
```

- [ ] **Step 3: Add pages**

Create:

- `/registro`: form with email/password and copy "Crear cuenta".
- `/login`: form with email/password and copy "Iniciar sesión".
- `/confirmar-cuenta`: reads `searchParams` and shows confirmation status shell.

Keep pages free of words: `backend`, `CSRF`, `cookie`, `HttpOnly`, `RBAC`, `bootstrap`, `endpoint`, `token`.

- [ ] **Step 4: Clean `/perfil`**

Replace technical text in `frontend/src/app/perfil/page.tsx`:

- "módulo" -> "próximamente"
- "cookie HttpOnly" -> "cuenta protegida"
- "CSRF" -> "seguridad adicional"
- "login/logout" -> "entrada y salida de cuenta"
- "base de identidad" -> "sistema de cuenta"

- [ ] **Step 5: Verify and commit**

Run:

```powershell
npm.cmd run lint --prefix frontend
npm.cmd run typecheck --prefix frontend
npm.cmd run test:run --prefix frontend
npm.cmd run build --prefix frontend
git diff --check
git add frontend
git commit -m "feat(web): add account confirmation pages"
```

## Task 6: Documentation, Railway variables, and full verification

**Files:**
- Modify: `README.md`
- Modify: `docs/superpowers/specs/2026-06-22-email-confirmation-and-user-copy-design.md`

- [ ] **Step 1: Document production variables**

Add README section:

```markdown
## Email confirmation

FreeStyle uses Resend for account confirmation emails.

Backend Railway variables:

```env
RESEND_API_KEY=<from Resend>
EMAIL_FROM=FreeStyle <onboarding@resend.dev>
PUBLIC_APP_URL=https://freestyle.up.railway.app
EMAIL_CONFIRMATION_TTL_SECONDS=86400
```

The initial superadmin account is `admin@zeqebellino.com`.
```

- [ ] **Step 2: Full verification**

Run:

```powershell
.\.venv\Scripts\python.exe -m pip install -e ".\backend[dev]"
.\.venv\Scripts\python.exe -m ruff check backend
.\.venv\Scripts\python.exe -m pytest backend\tests -q
npm.cmd run lint --prefix frontend
npm.cmd run typecheck --prefix frontend
npm.cmd run test:run --prefix frontend
npm.cmd run build --prefix frontend
docker build -t freestyle-api:email backend
docker build -t freestyle-web:email frontend
git diff --check
git status --short
```

- [ ] **Step 3: Commit and push**

Run:

```powershell
git add README.md docs/superpowers/specs/2026-06-22-email-confirmation-and-user-copy-design.md
git commit -m "docs: document account confirmation setup"
git push
```

## Self-review notes

- Spec coverage: registration, confirmation, resend, Resend, roles, copy cleanup, Railway variables, and verification are mapped to tasks.
- Scope intentionally excludes password reset, editable profile data, newsletters, and full admin dashboard.
- Execution mode: inline only per project owner preference.
