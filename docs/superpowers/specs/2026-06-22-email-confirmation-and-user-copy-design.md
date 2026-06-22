# Email Confirmation and User-Facing Copy Design

**Date:** 2026-06-22

**Status:** Draft for owner review

## Goal

Add a customer-friendly account flow for FreeStyle with email confirmation, a usable login/register surface, and visible copy that avoids programming jargon.

## Context

FreeStyle is deployed on Railway and already has the identity foundation: first-admin bootstrap, password login, opaque session cookies, CSRF protection, RBAC helpers, and audit events. The public site currently includes profile/account shells but some visible text still mentions implementation details that normal shoppers should not see.

Resend is the preferred email provider for this phase because its official pricing page lists a free plan at $0/month with 3,000 emails/month and 100 emails/day, enough for early account-confirmation traffic.

## Scope

### In scope

- Customer registration with email and password.
- Email confirmation before full account access.
- Login behavior that tells unconfirmed users to confirm their email in plain language.
- A confirmation page reached by a link from the email.
- Resend-backed transactional email sending.
- Development/test fallback that records the confirmation link without sending real mail.
- Railway environment variable documentation.
- Public UI copy cleanup to remove implementation terms.
- Initial superadmin account uses `ezequielbellino@gmail.com`.
- Role model with `superadmin`, `admin`, and `customer`.

### Out of scope

- Password reset.
- Changing email address after registration.
- Marketing newsletters.
- Order history backed by real order data.
- Editable customer profile fields.
- OAuth/social login.
- Email delivery webhooks.
- Full seller/admin dashboard implementation beyond the role foundation and account access rules.

## Product language

The public site must use shopper-facing language.

Avoid:

- backend
- CSRF
- cookie
- HttpOnly
- RBAC
- bootstrap
- module
- endpoint
- token
- migration

Use:

- Cuenta segura
- Confirmá tu correo
- Iniciar sesión
- Crear cuenta
- Tus pedidos
- Direcciones
- Seguridad de la cuenta
- Cerrar sesión
- Te enviamos un correo para confirmar tu cuenta

Technical terms may remain in README, backend tests, code comments for developers, and internal docs.

## User flows

### Create account

1. Shopper opens `/registro`.
2. Shopper enters email and password.
3. Backend creates an inactive/unconfirmed customer account.
4. Backend creates a short-lived confirmation token.
5. Backend sends a confirmation email.
6. Frontend shows: "Te enviamos un correo para confirmar tu cuenta."

### Confirm email

1. Shopper clicks the email link.
2. Frontend opens `/confirmar-cuenta?token=...`.
3. Frontend calls the backend confirmation endpoint.
4. Backend marks the user email as confirmed and activates the account.
5. Frontend shows: "Tu cuenta ya está confirmada. Ya podés iniciar sesión."

### Login

1. Shopper opens `/login`.
2. Shopper enters email and password.
3. Backend rejects unknown credentials with a generic message.
4. Backend rejects unconfirmed accounts with a clear message.
5. Confirmed shoppers receive the existing secure browser session.

### Admin access

1. The first operational owner account is `ezequielbellino@gmail.com` with role `superadmin`.
2. `superadmin` can manage the whole web and future staff/admin access.
3. `admin` is for staff who manage the web commercially: products, sales, orders, and day-to-day store operations.
4. `customer` is for shoppers using profile, orders, addresses, and checkout.

### Profile

1. Shopper opens `/perfil`.
2. If logged in, future work can load the current user and show real account details.
3. If not logged in, the page should guide the shopper to login or registration without exposing technical details.

## Backend design

### Data model additions

Extend `identity_users`:

- `email_confirmed_at: datetime | None`

Supported user roles:

- `superadmin`: owner-level account. Can manage the platform, staff/admin users, and future high-risk settings.
- `admin`: operational account for people who manage the web and sell through the store.
- `customer`: shopper account.

Initial account decision:

- `ezequielbellino@gmail.com` is the initial `superadmin`.

Add `identity_email_confirmations`:

- `id`
- `user_id`
- `token_hash`
- `expires_at`
- `used_at`
- `created_at`

Store only a hash of the confirmation token. The raw token is only used in the email link.

### API endpoints

- `POST /identity/register`
  - Input: email, password.
  - Creates customer account with `role="customer"` and `email_confirmed_at=None`.
  - Sends confirmation email.
  - Returns a plain public message; it must not expose the confirmation token.

- `POST /identity/confirm-email`
  - Input: confirmation token.
  - Marks email as confirmed if token is valid, unused, and not expired.
  - Returns a plain success message.

- `POST /identity/resend-confirmation`
  - Input: email.
  - If the account exists and is unconfirmed, sends a fresh confirmation email.
  - Always returns a generic success message to avoid account enumeration.

- Existing `POST /identity/login`
  - Rejects unconfirmed users with a stable error code and shopper-facing message.

### Email sending

Create an email port with two implementations:

- Resend sender for production/staging.
- Console/in-memory sender for development and tests.

Required environment variables:

- `RESEND_API_KEY`: Resend API key.
- `EMAIL_FROM`: sender address, for example `FreeStyle <onboarding@resend.dev>` during testing or `FreeStyle <hola@yourdomain.com>` after domain verification.
- `PUBLIC_APP_URL`: public frontend URL, for example `https://freestyle.up.railway.app`.

### Security behavior

- Confirmation tokens expire after 24 hours.
- Store token hashes, not raw tokens.
- Resending confirmation invalidates old unused confirmation tokens for that user.
- Registration and resend responses do not reveal whether an email already exists.
- Login uses a specific unconfirmed-account error only after credentials are correct.

## Frontend design

### Routes

- `/registro`: create account page.
- `/login`: login page.
- `/confirmar-cuenta`: confirmation result page.
- `/perfil`: customer profile surface with plain copy.

### Copy examples

Registration success:

> Te enviamos un correo para confirmar tu cuenta. Revisá tu bandeja de entrada y seguí el enlace.

Unconfirmed login:

> Necesitamos que confirmes tu correo antes de entrar. Si no encontrás el mensaje, podés pedir otro.

Confirmation success:

> Tu cuenta ya está confirmada. Ya podés iniciar sesión.

Generic login error:

> No pudimos iniciar sesión con esos datos. Revisá el correo y la contraseña.

## Railway deployment

Backend service variables:

```env
RESEND_API_KEY=<secret from Resend>
EMAIL_FROM=FreeStyle <onboarding@resend.dev>
PUBLIC_APP_URL=https://freestyle.up.railway.app
```

Existing variables stay required:

```env
ENVIRONMENT=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
CORS_ORIGINS=https://freestyle.up.railway.app
```

Frontend service variables:

```env
NEXT_PUBLIC_API_URL=<backend public URL>
API_PRIVATE_URL=<backend public URL>
```

## Testing strategy

Backend:

- Model tests for confirmation fields/table.
- Token helper tests for hash/expiry behavior.
- Service tests for register, confirm, resend, and unconfirmed login rejection.
- Router tests for public endpoint contracts.

Frontend:

- Unit tests for user-facing forms and confirmation state where practical.
- Build verification for new routes.
- Search visible TSX copy for disallowed technical words.

Full verification:

```powershell
.\.venv\Scripts\python.exe -m ruff check backend
.\.venv\Scripts\python.exe -m pytest backend\tests -q
npm.cmd run lint --prefix frontend
npm.cmd run typecheck --prefix frontend
npm.cmd run test:run --prefix frontend
npm.cmd run build --prefix frontend
docker build -t freestyle-api:email backend
docker build -t freestyle-web:email frontend
git diff --check
```

## Open decisions before implementation

- Whether to start with `onboarding@resend.dev` for testing or verify a FreeStyle domain immediately.
- Whether `/perfil` should redirect unauthenticated users to `/login` immediately in this phase or only show login/register calls to action.
