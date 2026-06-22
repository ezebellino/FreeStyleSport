# FreestyleSport

Mobile-first commerce for sports apparel, footwear, and accessories.

## Services

- `frontend/`: Next.js public store and staff interface.
- `backend/`: FastAPI commerce API.
- `legacy/`: read-only prototype retained until feature parity.

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
