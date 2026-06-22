# Commerce Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the prototype foundation with a tested Next.js/FastAPI/PostgreSQL skeleton that is branded, mobile-first, and deployable as separate Railway services.

**Architecture:** Delete the prototype from the active tree, relying on Git history when the old implementation must be inspected, then create clean `frontend/` and `backend/` service roots. The backend starts as a modular FastAPI application with typed settings, problem responses, request IDs, database readiness, and Alembic; the frontend starts as a Next.js App Router application with ShadCN primitives, semantic urban-brand tokens, Lucide icons, and Motion configured for reduced motion.

**Tech Stack:** Python 3.13, FastAPI, Pydantic Settings, SQLAlchemy 2, Psycopg 3, Alembic, pytest, Ruff, Next.js App Router, React 19, TypeScript, Tailwind CSS, ShadCN/Radix, Lucide, Motion, Vitest, Testing Library, Docker, GitHub Actions, Railway PostgreSQL.

---

## Scope boundary and file map

This is plan 1 of the approved delivery sequence. It implements repository, deployment, application-shell, configuration, health, logging, and quality foundations only. Identity, catalog, inventory, promotions, cart, checkout, shipping, payments, staff operations, and analytics remain in later plans because each requires its own domain tests and can ship independently on this foundation.

Target files:

```text
backend/
  app/core/config.py             # typed environment settings
  app/core/errors.py             # stable API problem responses
  app/core/request_id.py         # request correlation middleware
  app/db/session.py              # async SQLAlchemy engine/session
  app/db/health.py               # SELECT 1 readiness probe
  app/health/router.py           # liveness/readiness routes
  app/main.py                    # application factory
  alembic/env.py                 # migration runtime
  tests/                         # backend unit/API tests
  pyproject.toml                 # runtime and development dependencies
  Dockerfile
  railway.toml
frontend/
  src/app/                       # Next.js routes, layout, tokens
  src/components/layout/         # branded responsive shell
  src/components/motion/         # reduced-motion-aware boundary and reveal transition
  src/components/ui/             # ShadCN source-owned primitives
  src/test/                      # Vitest setup
  Dockerfile
  railway.toml
.github/workflows/ci.yml
README.md
```

The prototype is deleted from the active tree before these service roots are rebuilt. Its complete source remains available through Git history.

### Task 1: Remove the prototype before the clean rebuild

**Files:**
- Delete: `frontend/`
- Delete: `backend/`
- Delete: `requirements.txt`
- Delete: `pasoapaso.txt`

- [ ] **Step 1: Verify the worktree and deletion targets**

Run:

```powershell
$root = (Resolve-Path .).Path
$expected = "C:\ProjectsZeqe\FreestyleSport\.worktrees\commerce-foundation"
if ($root -ne $expected) { throw "Wrong worktree: $root" }
foreach ($name in @("frontend", "backend")) {
  $expectedTarget = Join-Path $root $name
  $resolved = (Resolve-Path -LiteralPath $expectedTarget).Path
  if ($resolved -ne $expectedTarget -or (Split-Path -Parent $resolved) -ne $root) {
    throw "Unsafe target: $resolved"
  }
}
git status --short
git log -3 --oneline
```

Expected: every resolved directory is an immediate child of the intended worktree. Status may show only controller-created baseline artifacts under `frontend/`; the latest commits include the approved design and plan.

- [ ] **Step 2: Delete the prototype with Git-aware operations**

Run:

```powershell
git rm -r -f frontend backend
git rm requirements.txt pasoapaso.txt

foreach ($name in @("frontend", "backend")) {
  $expectedTarget = Join-Path $root $name
  if (Test-Path -LiteralPath $expectedTarget) {
    $resolved = (Resolve-Path -LiteralPath $expectedTarget).Path
    if ($resolved -ne $expectedTarget -or (Split-Path -Parent $resolved) -ne $root) {
      throw "Refusing recursive removal of unsafe target: $resolved"
    }
    Remove-Item -LiteralPath $resolved -Recurse -Force
  }
}
```

Expected: tracked prototype files appear as staged deletions. Any ignored dependency and build artifacts left behind by `git rm` are removed only after their service root is resolved and revalidated as the exact intended target. Root environment and database files remain untouched.

- [ ] **Step 3: Verify the intended deletion diff**

Run:

```powershell
git status --short
git diff --cached --name-status
git diff --cached --check
git diff -- docs/superpowers/plans/2026-06-21-commerce-foundation.md
```

Expected: the cached diff lists only prototype deletions and has no whitespace errors. The final command shows this plan modification as an unstaged diff. The removed prototype remains recoverable from Git history.

- [ ] **Step 4: Commit the deletion**

```powershell
git add docs/superpowers/plans/2026-06-21-commerce-foundation.md
git diff --cached --name-status
git diff --cached --check
git commit -m "chore: remove ecommerce prototype"
```

Expected: before commit, the full cached diff contains only the prototype deletions and this plan modification, with no whitespace errors.

### Task 2: Create typed backend configuration

**Files:**
- Create: `backend/pyproject.toml`
- Create: `backend/app/__init__.py`
- Create: `backend/app/core/__init__.py`
- Create: `backend/app/core/config.py`
- Create: `backend/tests/conftest.py`
- Create: `backend/tests/core/test_config.py`
- Create: `backend/.env.example`

- [ ] **Step 1: Create the Python project manifest**

Create `backend/pyproject.toml`:

```toml
[build-system]
requires = ["setuptools>=75"]
build-backend = "setuptools.build_meta"

[project]
name = "freestyle-sport-api"
version = "0.1.0"
requires-python = ">=3.13"
dependencies = [
  "alembic>=1.15,<2",
  "fastapi>=0.115,<1",
  "pydantic-settings>=2.8,<3",
  "psycopg[binary]>=3.2,<4",
  "sqlalchemy>=2.0,<3",
  "uvicorn[standard]>=0.34,<1",
]

[project.optional-dependencies]
dev = [
  "httpx>=0.28,<1",
  "pytest>=8.3,<9",
  "pytest-asyncio>=0.26,<1",
  "ruff>=0.11,<1",
]

[tool.setuptools.packages.find]
where = ["."]
include = ["app*"]

[tool.pytest.ini_options]
testpaths = ["tests"]
asyncio_mode = "auto"

[tool.ruff]
line-length = 100
target-version = "py313"

[tool.ruff.lint]
select = ["E", "F", "I", "UP", "B", "ASYNC"]
```

- [ ] **Step 2: Recreate the broken virtual environment and install the project**

Run:

```powershell
py -3.13 -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -e ".\backend[dev]"
```

Expected: installation exits `0`; `.\.venv\Scripts\python.exe --version` reports Python 3.13.

- [ ] **Step 3: Write failing settings tests**

Create `backend/tests/conftest.py`:

```python
import os

os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+psycopg://postgres:postgres@localhost:5432/freestyle_test",
)
os.environ.setdefault("ENVIRONMENT", "test")
```

Create `backend/tests/core/test_config.py`:

```python
import pytest
from pydantic import ValidationError

from app.core.config import Settings


def test_settings_split_comma_separated_origins() -> None:
    settings = Settings(
        database_url="postgresql+psycopg://user:pass@db:5432/store",
        environment="staging",
        cors_origins="https://shop.example.com, https://admin.example.com",
    )

    assert settings.allowed_origins == [
        "https://shop.example.com",
        "https://admin.example.com",
    ]


def test_production_rejects_wildcard_origin() -> None:
    with pytest.raises(ValidationError, match="wildcard"):
        Settings(
            database_url="postgresql+psycopg://user:pass@db:5432/store",
            environment="production",
            cors_origins="*",
        )
```

- [ ] **Step 4: Run the tests and verify the expected failure**

Run:

```powershell
.\.venv\Scripts\python.exe -m pytest backend\tests\core\test_config.py -q
```

Expected: collection fails with `ModuleNotFoundError: No module named 'app.core.config'`.

- [ ] **Step 5: Implement settings and package markers**

Create empty `backend/app/__init__.py` and `backend/app/core/__init__.py`.

Create `backend/app/core/config.py`:

```python
from functools import lru_cache
from typing import Literal

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    app_name: str = "FreestyleSport API"
    environment: Literal["development", "test", "staging", "production"] = "development"
    database_url: str
    cors_origins: str = "http://localhost:3000"
    log_level: str = "INFO"

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @model_validator(mode="after")
    def reject_production_wildcard(self) -> "Settings":
        if self.environment == "production" and "*" in self.allowed_origins:
            raise ValueError("production CORS origins cannot contain a wildcard")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
```

Create `backend/.env.example`:

```dotenv
ENVIRONMENT=development
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/freestyle
CORS_ORIGINS=http://localhost:3000
LOG_LEVEL=INFO
```

- [ ] **Step 6: Run settings tests and lint**

Run:

```powershell
.\.venv\Scripts\python.exe -m pytest backend\tests\core\test_config.py -q
.\.venv\Scripts\python.exe -m ruff check backend
```

Expected: `2 passed`; Ruff exits `0`.

- [ ] **Step 7: Commit typed settings**

```powershell
git add backend
git commit -m "feat(api): add typed service configuration"
```

### Task 3: Add API errors, request IDs, and health endpoints

**Files:**
- Create: `backend/app/core/errors.py`
- Create: `backend/app/core/request_id.py`
- Create: `backend/app/health/__init__.py`
- Create: `backend/app/health/router.py`
- Create: `backend/app/main.py`
- Create: `backend/tests/api/test_health.py`

- [ ] **Step 1: Write failing health and request-ID tests**

Create `backend/tests/api/test_health.py`:

```python
from fastapi.testclient import TestClient

from app.health.router import ReadinessProbe
from app.main import create_app


class HealthyProbe:
    async def check(self) -> None:
        return None


class FailingProbe:
    async def check(self) -> None:
        raise RuntimeError("database unavailable")


def test_liveness_returns_request_id() -> None:
    client = TestClient(create_app(readiness_probe=HealthyProbe()))

    response = client.get("/health/live", headers={"x-request-id": "test-request"})

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
    assert response.headers["x-request-id"] == "test-request"


def test_readiness_uses_stable_problem_response() -> None:
    probe: ReadinessProbe = FailingProbe()
    client = TestClient(create_app(readiness_probe=probe))

    response = client.get("/health/ready")

    assert response.status_code == 503
    assert response.json()["code"] == "service_not_ready"
    assert response.json()["message"] == "Service dependencies are unavailable"
    assert response.json()["request_id"] == response.headers["x-request-id"]
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```powershell
.\.venv\Scripts\python.exe -m pytest backend\tests\api\test_health.py -q
```

Expected: collection fails because `app.health.router` and `app.main` do not exist.

- [ ] **Step 3: Implement stable API errors**

Create `backend/app/core/errors.py`:

```python
from dataclasses import dataclass


@dataclass(slots=True)
class ApiError(Exception):
    status_code: int
    code: str
    message: str
```

Create `backend/app/core/request_id.py`:

```python
from uuid import uuid4

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response


class RequestIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        request_id = request.headers.get("x-request-id") or str(uuid4())
        request.state.request_id = request_id
        response = await call_next(request)
        response.headers["x-request-id"] = request_id
        return response
```

- [ ] **Step 4: Implement the health contract**

Create empty `backend/app/health/__init__.py`.

Create `backend/app/health/router.py`:

```python
from typing import Protocol

from fastapi import APIRouter, Depends

from app.core.errors import ApiError

router = APIRouter(prefix="/health", tags=["health"])


class ReadinessProbe(Protocol):
    async def check(self) -> None: ...


class ApplicationReadinessProbe:
    async def check(self) -> None:
        return None


def get_readiness_probe() -> ReadinessProbe:
    return ApplicationReadinessProbe()


@router.get("/live")
async def live() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/ready")
async def ready(probe: ReadinessProbe = Depends(get_readiness_probe)) -> dict[str, str]:
    try:
        await probe.check()
    except Exception as exc:
        raise ApiError(503, "service_not_ready", "Service dependencies are unavailable") from exc
    return {"status": "ready"}
```

- [ ] **Step 5: Implement the FastAPI application factory**

Create `backend/app/main.py`:

```python
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.core.errors import ApiError
from app.core.request_id import RequestIdMiddleware
from app.health.router import ReadinessProbe, get_readiness_probe, router as health_router


def create_app(readiness_probe: ReadinessProbe | None = None) -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_name, version="0.1.0")
    app.add_middleware(RequestIdMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "X-CSRF-Token", "X-Request-ID"],
    )

    @app.exception_handler(ApiError)
    async def handle_api_error(request: Request, exc: ApiError) -> JSONResponse:
        request_id = getattr(request.state, "request_id", "unknown")
        return JSONResponse(
            status_code=exc.status_code,
            content={"code": exc.code, "message": exc.message, "request_id": request_id},
        )

    if readiness_probe is not None:
        app.dependency_overrides[get_readiness_probe] = lambda: readiness_probe
    app.include_router(health_router)
    return app


app = create_app()
```

- [ ] **Step 6: Run API tests and lint**

Run:

```powershell
.\.venv\Scripts\python.exe -m pytest backend\tests\api\test_health.py -q
.\.venv\Scripts\python.exe -m ruff check backend
```

Expected: `2 passed`; Ruff exits `0`.

- [ ] **Step 7: Commit the API shell**

```powershell
git add backend
git commit -m "feat(api): add health and problem response foundation"
```

### Task 4: Add PostgreSQL readiness and Alembic

**Files:**
- Create: `backend/app/db/__init__.py`
- Create: `backend/app/db/session.py`
- Create: `backend/app/db/health.py`
- Modify: `backend/app/main.py`
- Create: `backend/tests/db/test_health.py`
- Create: `backend/alembic.ini`
- Create: `backend/alembic/env.py`
- Create: `backend/alembic/script.py.mako`

- [ ] **Step 1: Write a failing database-probe unit test**

Create `backend/tests/db/test_health.py`:

```python
from contextlib import asynccontextmanager

import pytest

from app.db.health import DatabaseReadinessProbe


class FakeSession:
    def __init__(self) -> None:
        self.statement = ""

    async def execute(self, statement: object) -> None:
        self.statement = str(statement)


@pytest.mark.asyncio
async def test_database_probe_executes_select_one() -> None:
    session = FakeSession()

    @asynccontextmanager
    async def session_factory():
        yield session

    await DatabaseReadinessProbe(session_factory).check()

    assert session.statement == "SELECT 1"
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```powershell
.\.venv\Scripts\python.exe -m pytest backend\tests\db\test_health.py -q
```

Expected: collection fails with `ModuleNotFoundError: No module named 'app.db.health'`.

- [ ] **Step 3: Implement async database session and readiness**

Create empty `backend/app/db/__init__.py`.

Create `backend/app/db/session.py`:

```python
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings

engine = create_async_engine(get_settings().database_url, pool_pre_ping=True)
session_factory = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
```

Create `backend/app/db/health.py`:

```python
from collections.abc import Callable
from contextlib import AbstractAsyncContextManager

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

SessionContext = Callable[[], AbstractAsyncContextManager[AsyncSession]]


class DatabaseReadinessProbe:
    def __init__(self, session_factory: SessionContext) -> None:
        self._session_factory = session_factory

    async def check(self) -> None:
        async with self._session_factory() as session:
            await session.execute(text("SELECT 1"))
```

- [ ] **Step 4: Wire the real probe into the default application**

In `backend/app/main.py`, add:

```python
from app.db.health import DatabaseReadinessProbe
from app.db.session import session_factory
```

Replace the final line with:

```python
app = create_app(readiness_probe=DatabaseReadinessProbe(session_factory))
```

- [ ] **Step 5: Add Alembic configuration**

Create `backend/alembic.ini`:

```ini
[alembic]
script_location = alembic
prepend_sys_path = .

[loggers]
keys = root,sqlalchemy,alembic

[handlers]
keys = console

[formatters]
keys = generic

[logger_root]
level = WARN
handlers = console
qualname =

[logger_sqlalchemy]
level = WARN
handlers =
qualname = sqlalchemy.engine

[logger_alembic]
level = INFO
handlers =
qualname = alembic

[handler_console]
class = StreamHandler
args = (sys.stderr,)
level = NOTSET
formatter = generic

[formatter_generic]
format = %(levelname)-5.5s [%(name)s] %(message)s
```

Create `backend/alembic/env.py`:

```python
from logging.config import fileConfig

from alembic import context
from sqlalchemy import create_engine, pool

from app.core.config import get_settings

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = None


def run_migrations_offline() -> None:
    context.configure(
        url=get_settings().database_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = create_engine(get_settings().database_url, poolclass=pool.NullPool)
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

Create `backend/alembic/script.py.mako`:

```mako
"""${message}

Revision ID: ${up_revision}
Revises: ${down_revision | comma,n}
Create Date: ${create_date}
"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
${imports if imports else ""}

revision: str = ${repr(up_revision)}
down_revision: str | None = ${repr(down_revision)}
branch_labels: str | Sequence[str] | None = ${repr(branch_labels)}
depends_on: str | Sequence[str] | None = ${repr(depends_on)}


def upgrade() -> None:
    ${upgrades if upgrades else "pass"}


def downgrade() -> None:
    ${downgrades if downgrades else "pass"}
```

- [ ] **Step 6: Run database tests and migration discovery**

Run:

```powershell
.\.venv\Scripts\python.exe -m pytest backend\tests\db\test_health.py -q
Push-Location backend
..\.venv\Scripts\python.exe -m alembic heads
Pop-Location
.\.venv\Scripts\python.exe -m ruff check backend
```

Expected: `1 passed`; `alembic heads` exits `0` with no revision yet; Ruff exits `0`. The identity plan will create the first schema revision.

- [ ] **Step 7: Commit database infrastructure**

```powershell
git add backend
git commit -m "feat(api): add postgres and migration foundation"
```

### Task 5: Scaffold Next.js, testing, and ShadCN

**Files:**
- Create: `frontend/` from `create-next-app`
- Create: `frontend/components.json` from ShadCN CLI
- Create: `frontend/vitest.config.ts`
- Create: `frontend/src/test/setup.ts`
- Modify: `frontend/package.json`

- [ ] **Step 1: Generate the current stable Next.js application**

Run from the repository root:

```powershell
npx.cmd create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --yes
```

Expected: `frontend/package.json`, `frontend/src/app/layout.tsx`, and `frontend/src/app/page.tsx` exist; `npm.cmd run build --prefix frontend` exits `0`.

- [ ] **Step 2: Install application and test dependencies**

Run:

```powershell
npm.cmd install --prefix frontend @tanstack/react-query lucide-react motion zod
npm.cmd install --prefix frontend --save-dev vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

Expected: `frontend/package-lock.json` changes and both commands exit `0`.

- [ ] **Step 3: Initialize ShadCN and inspect component documentation**

Run:

```powershell
Push-Location frontend
npx.cmd shadcn@latest init --preset radix-nova --yes
npx.cmd shadcn@latest docs button sheet tooltip badge
npx.cmd shadcn@latest add button sheet tooltip badge
Pop-Location
```

Expected: `frontend/components.json` reports Next.js, Radix, and Lucide; Button, Sheet, Tooltip, and Badge source files exist under the configured UI alias.

- [ ] **Step 4: Add Vitest configuration**

Create `frontend/vitest.config.ts`:

```typescript
import path from "node:path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
})
```

Create `frontend/src/test/setup.ts`:

```typescript
import "@testing-library/jest-dom/vitest"
```

Add scripts to `frontend/package.json` with:

```powershell
Push-Location frontend
npm.cmd pkg set scripts.typecheck="tsc --noEmit"
npm.cmd pkg set scripts.test="vitest"
npm.cmd pkg set "scripts.test:run=vitest run"
Pop-Location
```

- [ ] **Step 5: Verify the empty frontend harness**

Run:

```powershell
npm.cmd run lint --prefix frontend
npm.cmd run typecheck --prefix frontend
npm.cmd run test:run --prefix frontend -- --passWithNoTests
```

Expected: all three commands exit `0`.

- [ ] **Step 6: Commit the frontend toolchain**

```powershell
git add frontend
git commit -m "feat(web): scaffold next and shadcn foundation"
```

### Task 6: Build the mobile-first urban shell with fluid motion

**Files:**
- Create: `frontend/src/components/motion/motion-provider.tsx`
- Create: `frontend/src/components/motion/reveal.tsx`
- Create: `frontend/src/components/layout/store-header.tsx`
- Create: `frontend/src/components/layout/store-header.test.tsx`
- Modify: `frontend/src/app/layout.tsx`
- Modify: `frontend/src/app/page.tsx`
- Modify: `frontend/src/app/globals.css`

- [ ] **Step 1: Write the failing header accessibility test**

Create `frontend/src/components/layout/store-header.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { StoreHeader } from "./store-header"

describe("StoreHeader", () => {
  it("exposes mobile-first navigation and icon labels", () => {
    render(<StoreHeader cartCount={2} />)

    expect(screen.getByRole("link", { name: /freestyle sport/i })).toHaveAttribute("href", "/")
    expect(screen.getByRole("button", { name: /abrir menú/i })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /buscar/i })).toHaveAttribute("href", "/buscar")
    expect(screen.getByRole("link", { name: /perfil/i })).toHaveAttribute("href", "/cuenta")
    expect(screen.getByRole("link", { name: /carrito, 2 productos/i })).toHaveAttribute(
      "href",
      "/carrito",
    )
  })
})
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```powershell
npm.cmd run test:run --prefix frontend -- src/components/layout/store-header.test.tsx
```

Expected: FAIL because `store-header.tsx` does not exist.

- [ ] **Step 3: Implement the motion boundary**

Create `frontend/src/components/motion/motion-provider.tsx`:

```tsx
"use client"

import { domAnimation, LazyMotion, MotionConfig } from "motion/react"

export function MotionProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.2, ease: "easeOut" }}>
      <LazyMotion features={domAnimation} strict>
        {children}
      </LazyMotion>
    </MotionConfig>
  )
}
```

Create `frontend/src/components/motion/reveal.tsx`:

```tsx
"use client"

import { m } from "motion/react"

export function Reveal({
  children,
  className,
  delay = 0,
}: Readonly<{ children: React.ReactNode; className?: string; delay?: number }>) {
  return (
    <m.div
      className={className}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, delay, ease: "easeOut" }}
    >
      {children}
    </m.div>
  )
}
```

- [ ] **Step 4: Implement the responsive icon header**

Create `frontend/src/components/layout/store-header.tsx`:

```tsx
"use client"

import { MenuIcon, SearchIcon, ShoppingBagIcon, UserRoundIcon } from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const navItems = [
  ["Hombre", "/productos?categoria=hombre"],
  ["Mujer", "/productos?categoria=mujer"],
  ["Calzado", "/productos?categoria=calzado"],
  ["Accesorios", "/productos?categoria=accesorios"],
  ["Ofertas", "/ofertas"],
] as const

function IconLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" asChild>
          <Link href={href} aria-label={label}>{children}</Link>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

export function StoreHeader({ cartCount = 0 }: { cartCount?: number }) {
  return (
    <TooltipProvider>
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center gap-2 px-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button className="md:hidden" variant="ghost" size="icon" aria-label="Abrir menú">
                <MenuIcon data-icon="inline-start" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetTitle>Menú principal</SheetTitle>
              <nav className="flex flex-col gap-2 pt-6">
                {navItems.map(([label, href]) => <Button key={href} variant="ghost" asChild><Link href={href}>{label}</Link></Button>)}
              </nav>
            </SheetContent>
          </Sheet>

          <Link href="/" aria-label="Freestyle Sport" className="font-display text-xl font-black italic tracking-tight">
            FREE/SPORT
          </Link>

          <nav className="ml-6 hidden items-center gap-1 md:flex">
            {navItems.map(([label, href]) => <Button key={href} variant="ghost" asChild><Link href={href}>{label}</Link></Button>)}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <IconLink href="/buscar" label="Buscar"><SearchIcon data-icon="inline-start" /></IconLink>
            <IconLink href="/cuenta" label="Perfil"><UserRoundIcon data-icon="inline-start" /></IconLink>
            <div className="relative">
              <IconLink href="/carrito" label={`Carrito, ${cartCount} productos`}><ShoppingBagIcon data-icon="inline-start" /></IconLink>
              {cartCount > 0 && <Badge className="pointer-events-none absolute -right-1 -top-1">{cartCount}</Badge>}
            </div>
          </div>
        </div>
      </header>
    </TooltipProvider>
  )
}
```

- [ ] **Step 5: Apply semantic urban tokens and reduced-motion defaults**

Replace `frontend/src/app/globals.css` with:

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

:root {
  --background: #0d0d0f;
  --foreground: #fafafa;
  --card: #18181b;
  --card-foreground: #fafafa;
  --popover: #18181b;
  --popover-foreground: #fafafa;
  --primary: #c6ff00;
  --primary-foreground: #111111;
  --secondary: #27272a;
  --secondary-foreground: #fafafa;
  --muted: #27272a;
  --muted-foreground: #a1a1aa;
  --accent: #c6ff00;
  --accent-foreground: #111111;
  --destructive: #ef4444;
  --border: #3f3f46;
  --input: #3f3f46;
  --ring: #c6ff00;
  --radius: 0.75rem;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --font-display: "Arial Narrow", "Roboto Condensed", sans-serif;
}

* { border-color: var(--border); }
html { background: var(--background); }
body { min-height: 100vh; background: var(--background); color: var(--foreground); }

:focus-visible { outline: 2px solid var(--ring); outline-offset: 3px; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 6: Compose the root layout and branded landing shell**

Replace `frontend/src/app/layout.tsx` with:

```tsx
import type { Metadata } from "next"

import { StoreHeader } from "@/components/layout/store-header"
import { MotionProvider } from "@/components/motion/motion-provider"
import "./globals.css"

export const metadata: Metadata = {
  title: { default: "Freestyle Sport", template: "%s | Freestyle Sport" },
  description: "Indumentaria, calzado y accesorios deportivos.",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <MotionProvider>
          <StoreHeader />
          <main>{children}</main>
        </MotionProvider>
      </body>
    </html>
  )
}
```

Replace `frontend/src/app/page.tsx` with:

```tsx
import Link from "next/link"

import { Reveal } from "@/components/motion/reveal"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl content-center gap-6 px-4 py-16 md:grid-cols-2 md:px-8">
      <Reveal className="flex flex-col items-start gap-5">
        <p className="text-sm font-bold tracking-[0.2em] text-primary">NUEVA TEMPORADA</p>
        <h1 className="font-display text-5xl font-black italic leading-[0.9] tracking-tight sm:text-7xl">
          ENTRENÁ<br />SIN LÍMITES
        </h1>
        <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
          Indumentaria, calzado y accesorios para moverte con libertad.
        </p>
        <Button size="lg" asChild><Link href="/productos">VER COLECCIÓN</Link></Button>
      </Reveal>
      <Reveal delay={0.08} className="min-h-72">
        <div aria-label="Vista previa de campaña" className="size-full min-h-72 rounded-2xl bg-gradient-to-br from-secondary to-background ring-1 ring-border" />
      </Reveal>
    </section>
  )
}
```

- [ ] **Step 7: Run the focused test and full frontend checks**

Run:

```powershell
npm.cmd run test:run --prefix frontend -- src/components/layout/store-header.test.tsx
npm.cmd run lint --prefix frontend
npm.cmd run typecheck --prefix frontend
npm.cmd run build --prefix frontend
```

Expected: the focused test passes; lint, typecheck, and production build exit `0`.

- [ ] **Step 8: Commit the mobile shell**

```powershell
git add frontend
git commit -m "feat(web): add mobile urban storefront shell"
```

### Task 7: Add reproducible Railway containers

**Files:**
- Create: `backend/Dockerfile`
- Create: `backend/.dockerignore`
- Create: `backend/railway.toml`
- Create: `frontend/Dockerfile`
- Create: `frontend/.dockerignore`
- Create: `frontend/railway.toml`
- Create: `frontend/src/app/api/health/route.ts`
- Modify: `frontend/next.config.ts`

- [ ] **Step 1: Add the frontend health route**

Create `frontend/src/app/api/health/route.ts`:

```typescript
export function GET() {
  return Response.json({ status: "ok" })
}
```

Replace `frontend/next.config.ts` with:

```typescript
import type { NextConfig } from "next"

const nextConfig: NextConfig = { output: "standalone" }

export default nextConfig
```

- [ ] **Step 2: Add the backend container and Railway config**

Create `backend/Dockerfile`:

```dockerfile
FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1
WORKDIR /app

COPY pyproject.toml ./
COPY app ./app
COPY alembic.ini ./
COPY alembic ./alembic
RUN python -m pip install --upgrade pip && python -m pip install .

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
```

Create `backend/.dockerignore`:

```text
.env
.pytest_cache
.ruff_cache
__pycache__
tests
```

Create `backend/railway.toml`:

```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"

[deploy]
preDeployCommand = "alembic upgrade head"
healthcheckPath = "/health/ready"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3
```

- [ ] **Step 3: Add the frontend container and Railway config**

Create `frontend/Dockerfile`:

```dockerfile
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
```

Create `frontend/.dockerignore`:

```text
.env*
.next
node_modules
npm-debug.log
```

Create `frontend/railway.toml`:

```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"

[deploy]
healthcheckPath = "/api/health"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3
```

- [ ] **Step 4: Verify both production images**

Run where Docker is available:

```powershell
docker build -t freestyle-api:foundation backend
docker build -t freestyle-web:foundation frontend
```

Expected: both images build successfully. If Docker is unavailable locally, run these exact commands in GitHub Actions before declaring the task complete.

- [ ] **Step 5: Commit Railway packaging**

```powershell
git add backend frontend
git commit -m "chore: add railway service containers"
```

### Task 8: Add CI, local instructions, and final verification

**Files:**
- Create: `.github/workflows/ci.yml`
- Replace: `README.md`
- Create: `frontend/.env.example`

- [ ] **Step 1: Add continuous integration**

Create `.github/workflows/ci.yml`:

```yaml
name: ci

on:
  pull_request:
  push:
    branches: [main]

jobs:
  backend:
    runs-on: ubuntu-latest
    env:
      ENVIRONMENT: test
      DATABASE_URL: postgresql+psycopg://postgres:postgres@localhost:5432/freestyle_test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.13"
          cache: pip
          cache-dependency-path: backend/pyproject.toml
      - run: python -m pip install --upgrade pip
      - run: python -m pip install -e "./backend[dev]"
      - run: python -m ruff check backend
      - run: python -m pytest backend/tests -q
      - run: docker build -t freestyle-api:ci backend

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: npm
          cache-dependency-path: frontend/package-lock.json
      - working-directory: frontend
        run: npm ci
      - working-directory: frontend
        run: npm run lint
      - working-directory: frontend
        run: npm run typecheck
      - working-directory: frontend
        run: npm run test:run
      - working-directory: frontend
        run: npm run build
      - run: docker build -t freestyle-web:ci frontend
```

- [ ] **Step 2: Add the frontend environment contract**

Create `frontend/.env.example`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8000
API_PRIVATE_URL=http://localhost:8000
```

- [ ] **Step 3: Replace the project README**

Replace `README.md` with:

```markdown
# FreestyleSport

Mobile-first commerce for sports apparel, footwear, and accessories.

## Services

- `frontend/`: Next.js public store and staff interface.
- `backend/`: FastAPI commerce API.

The previous prototype remains available through Git history before this clean rebuild.

## Local prerequisites

- Node.js 22 and npm 10.
- Python 3.13.
- PostgreSQL 16 or a Railway PostgreSQL development database.
- Docker for production-image verification.

## Backend

```powershell
py -3.13 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -e ".\backend[dev]"
Copy-Item backend\.env.example backend\.env
$env:PYTHONPATH="backend"
.\.venv\Scripts\python.exe -m uvicorn app.main:app --app-dir backend --reload
```

## Frontend

```powershell
Copy-Item frontend\.env.example frontend\.env.local
npm.cmd ci --prefix frontend
npm.cmd run dev --prefix frontend
```

## Verification

```powershell
.\.venv\Scripts\python.exe -m ruff check backend
.\.venv\Scripts\python.exe -m pytest backend\tests -q
npm.cmd run lint --prefix frontend
npm.cmd run typecheck --prefix frontend
npm.cmd run test:run --prefix frontend
npm.cmd run build --prefix frontend
docker build -t freestyle-api:local backend
docker build -t freestyle-web:local frontend
```

## Railway

Create one Railway project with PostgreSQL plus two GitHub services. Set the API root directory to `backend` and the web root directory to `frontend`. Reference PostgreSQL's `DATABASE_URL` from the API service, configure exact `CORS_ORIGINS`, and generate HTTPS domains for both services. The API runs Alembic before deployment and both services expose healthchecks declared in their `railway.toml` files.

The approved design is in `docs/superpowers/specs/2026-06-21-freestyle-sport-commerce-design.md`.
```

- [ ] **Step 4: Run every local quality gate**

Run:

```powershell
.\.venv\Scripts\python.exe -m ruff check backend
.\.venv\Scripts\python.exe -m pytest backend\tests -q
npm.cmd run lint --prefix frontend
npm.cmd run typecheck --prefix frontend
npm.cmd run test:run --prefix frontend
npm.cmd run build --prefix frontend
git diff --check
git status --short
```

Expected: Ruff exits `0`; all backend and frontend tests pass; lint, typecheck, and build exit `0`; `git diff --check` prints nothing. `git status --short` lists only the CI, README, and environment-example changes for this task.

- [ ] **Step 5: Commit CI and documentation**

```powershell
git add .github README.md frontend/.env.example
git commit -m "ci: verify commerce service foundation"
```

- [ ] **Step 6: Verify the completed foundation commit range**

Run:

```powershell
git status --short
git log --oneline -8
```

Expected: the worktree is clean and the log shows one focused commit for each task in this plan.

## Follow-on plans

Write these plans only after this foundation is implemented and verified, so their exact paths and contracts reflect the live code:

1. Identity, HttpOnly sessions, CSRF, RBAC, audit, and first-admin bootstrap.
2. Catalog, variants, Cloudinary media, inventory, and staff product workflow.
3. Pricing, promotions, search, public catalog, product detail, and offer presentation.
4. Server cart, postal-zone shipping, pickup, guest checkout, and reservations.
5. Mercado Pago signed webhooks, bank transfer, proof review, refunds, and expiry jobs.
6. Administrator/seller fulfillment, customer accounts, guest tracking, and WhatsApp handoff.
7. Analytics, accessibility, performance, optional 3D experiment, and launch hardening.
