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

## Identity and access contracts

The identity foundation exposes opaque cookie sessions and role-aware helpers for later account, seller, and staff flows.

### API endpoints

- `POST /identity/bootstrap-admin`: creates the first administrator. This is single-use and returns `409 bootstrap_unavailable` after an admin exists.
- `POST /identity/register`: creates a customer account and sends an email confirmation.
- `POST /identity/confirm-email`: confirms the customer email from the link sent by email.
- `POST /identity/resend-confirmation`: sends a fresh confirmation email when needed.
- `POST /identity/login`: validates email/password credentials and sets the session and CSRF cookies.
- `GET /identity/me`: returns the current public user shape from the active session.
- `POST /identity/logout`: revokes the active session. This unsafe request requires a matching CSRF cookie/header pair.

### Account roles

- `superadmin`: owner account. The initial superadmin is `admin@zeqebellino.com`.
- `admin`: store operator for products, sales, orders, and daily web management.
- `customer`: shopper account for profile, orders, addresses, and checkout.

## Email confirmation

FreeStyle uses Resend for account confirmation emails. Start with the free Resend sender while the custom domain DNS is corrected.

Backend Railway variables:

```env
RESEND_API_KEY=<from Resend>
EMAIL_FROM=FreeStyle <onboarding@resend.dev>
PUBLIC_APP_URL=https://freestyle.up.railway.app
EMAIL_CONFIRMATION_TTL_SECONDS=86400
```

### Browser session model

- `fs_session`: opaque HttpOnly session cookie. Browser JavaScript must not read it.
- `fs_csrf`: readable CSRF cookie used by the frontend when sending unsafe requests.
- `x-csrf-token`: request header that must match `fs_csrf` for protected unsafe requests such as logout.

### Authorization and audit

- Backend authorization should use the identity dependencies to require active users and exact roles such as `admin`.
- Sensitive actions can record audit events with request id, action, actor user id, IP address, and user agent.

## Commerce catalog

The catalog is generic by design: the current tenant is FreeStyle, but product records include
tenant ownership so the same ecommerce skeleton can later support other stores or rubros.

### API endpoints

- `GET /commerce/products`: public published products, with optional `category` filter.
- `GET /commerce/products/{slug}`: public product detail.
- `GET /commerce/admin/products`: staff catalog view for `admin` and `superadmin`.
- `POST /commerce/admin/products`: create products with price, category, images, variants, stock, and flexible attributes.
- `PUT /commerce/admin/products/{product_id}`: update product content, images, variants, and publication status.

### Product image strategy

Product images are stored as public URLs plus provider metadata. This keeps the database portable:
Cloudinary, S3/R2, Supabase Storage, or any other image CDN can be used without changing the
catalog tables. Cloudinary can be used on its free plan for the first storefront iteration; the
admin form already accepts Cloudinary URLs such as `https://res.cloudinary.com/...`.

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
