# FreestyleSport Commerce Redesign

**Date:** 2026-06-21
**Status:** Approved design pending written-spec review
**Primary goal:** Launch a mobile-first sports store that increases completed purchases and remains comfortable for customers, sellers, and administrators.

## 1. Context

FreestyleSport is a new commercial project. The current SQLite database contains no production store data, so preserving the existing schema or API is not a constraint. The repository remains useful as a functional prototype, but the production application will be rebuilt cleanly inside the same repository.

The first delivery focuses on the public store and conversion. It supports a single store, one shared catalog, internal sellers, guest checkout, Mercado Pago, bank transfer, national shipping, store pickup, and WhatsApp-assisted sales.

### Current prototype findings

- The frontend is a React/Vite SPA with Redux slices for products, cart, users, orders, coupons, reviews, search, notifications, wishlist, and payments.
- API origins are hard-coded as `http://127.0.0.1:8000` in client modules.
- The cart exists independently in browser state and backend state.
- Money is stored as floating-point values.
- Product cards hide commercial information behind a flip interaction and the add-to-cart control is not wired to a complete purchase journey.
- Checkout sends a coupon and immediately treats the API response as a completed purchase; it does not represent payment, shipping, guest identity, or asynchronous confirmation accurately.
- Authentication material is read from `localStorage` by frontend modules.
- Catalog polymorphism models “sports” and “food” products, while the actual store needs apparel, footwear, and accessories with sellable size/color variants.
- The repository has no meaningful automated test suite for the purchase path.

These constraints justify a clean implementation rather than compatibility-driven refactoring.

## 2. Scope

### In scope

- Public home, catalog, search, categories, filters, offers, product details, cart, guest checkout, payment return, order confirmation, and secure order tracking.
- Apparel, footwear, and accessories with size/color variants and SKU-level stock.
- Automatic promotions and coupon codes.
- Mercado Pago Checkout Pro and manual bank transfer by alias.
- National shipping priced by configurable rules and store pickup.
- Optional customer accounts and post-purchase account creation.
- Administrator and seller workspaces.
- Product media, inventory movements, orders, payment attempts, shipments, returns, and audit history.
- Conversion analytics without sending personal information.
- Railway staging and production deployments.

### Not in scope for the first release

- Third-party marketplace sellers or split payments.
- Multiple stores, warehouses, currencies, or countries.
- Native mobile applications.
- Always-on 3D scenes, decorative WebGL backgrounds, or 3D as a requirement for browsing and purchasing.
- Loyalty points, subscriptions, gift cards, or product bundles.
- ERP integration or automatic reconciliation of bank statements.
- Real-time carrier integrations. The initial shipping engine uses configurable postal zones, rates, free-shipping thresholds, and pickup; carriers can be added through the shipping adapter later.
- WhatsApp Business API automation. The first release uses a configured phone number and a prefilled deep link.

## 3. Architecture

The system is a modular monolith with two deployable applications and one managed database:

1. **Storefront and operations web:** Next.js App Router with TypeScript, Tailwind CSS, and source-owned ShadCN primitives.
2. **Commerce API:** FastAPI, SQLAlchemy 2, Alembic, and Pydantic.
3. **Data:** Railway PostgreSQL.

Railway deploys `frontend/` and `backend/` as separate services from the same Git repository. PostgreSQL is a third service referenced through `DATABASE_URL`. The frontend uses Next.js standalone output. The backend runs Alembic migrations as a pre-deploy command and exposes readiness and liveness endpoints.

The browser calls the API through its public HTTPS domain. Production uses sibling custom domains so the web and API remain same-site. Authentication cookies are host-only to the API, `Secure`, `HttpOnly`, and `SameSite=Lax`; staging environments on unrelated Railway domains use `SameSite=None` plus the same CSRF and exact-origin checks. Server-rendered frontend requests forward only the required incoming cookies to the configured private API URL.

The backend remains one deployable service for operational simplicity, while its source is separated by business capability:

- identity and access;
- catalog and media;
- pricing and promotions;
- inventory;
- cart;
- checkout and orders;
- payments;
- shipping;
- customers;
- audit and analytics.

Modules communicate through explicit application services and typed contracts. Routers do not contain business rules, database models do not serialize themselves, and payment/storage/shipping providers implement ports owned by the relevant module.

No Redis, message broker, search cluster, or microservice split is introduced in the first release. PostgreSQL transactions, indexed queries, a reservation-expiry job, and idempotent handlers are sufficient for the expected workload.

## 4. Repository direction

The current `frontend/` and `backend/` implementations are treated as prototype code. Their useful behavior is covered by new acceptance tests before replacement. The target shape is:

```text
frontend/
  src/
    app/                 # Next.js routes and layouts
    features/            # catalog, cart, checkout, account, admin, seller
    components/ui/       # shared accessible primitives
    lib/                 # API client, auth helpers, formatting, analytics
    styles/              # tokens and global styles
backend/
  app/
    core/                # config, security, errors, logging
    db/                  # engine, session, base, migration helpers
    modules/             # business capabilities
    integrations/        # Mercado Pago, media, notifications, shipping
    main.py
  alembic/
  tests/
docs/
  superpowers/
```

The frontend does not introduce Redux by default. TanStack Query owns remote server state; React state owns local interface state. The cart is server-owned and identified by an opaque cookie, so it survives refreshes and can be associated with a customer after login.

## 5. Experience and visual system

### Direction

The approved visual direction is **Urban high contrast**:

- graphite/black foundations;
- white content surfaces where readability benefits;
- electric lime as the primary action and highlight color;
- bold, condensed display typography paired with a highly readable UI font;
- strong editorial product photography;
- restrained motion with reduced-motion support.

The visual intensity must not reduce usability. Price, availability, variant selection, shipping information, and the primary purchase action remain visible without hover, card flipping, or hidden gestures.

### Mobile-first rules

- Base layouts are designed from 320 px and enhanced at larger breakpoints.
- Product purchase actions may remain sticky on small screens without covering content.
- Catalog filters use a mobile sheet and a persistent active-filter count.
- Operational tables become cards or compact lists on narrow screens.
- Touch targets are at least 44 by 44 CSS pixels.
- Focus is visible, keyboard paths are complete, contrast meets WCAG 2.2 AA, and nonessential animation respects reduced motion.

### Icons

`lucide-react` provides a consistent, tree-shakable icon set for search, profile, cart, wishlist, filters, navigation, status, copy, and operational actions. Every icon-only control has an accessible name and tooltip. Text remains visible when the action could be ambiguous.

### Component primitives

ShadCN supplies source-owned accessible primitives rather than a locked component package. The project initializes one coherent preset and installs only components required by an implemented flow. Semantic design tokens replace ShadCN's default appearance with the approved graphite, white, and electric-lime system.

- The public store uses ShadCN selectively for controls, sheets, drawers, dialogs, fields, feedback, and accessible overlays; merchandising layouts remain custom to the brand.
- Administrator and seller workspaces compose ShadCN forms, tables, cards, badges, sidebars, dialogs, command/search, empty states, skeletons, and toasts.
- Components are reviewed after CLI installation because their source becomes application code.
- Forms use explicit field groups, accessible validation, and predictable focus management.
- Raw color utilities do not bypass semantic tokens, and product/status colors have documented light/dark contrast pairs.

This follows ShadCN's open-code and composition model: [ShadCN documentation](https://ui.shadcn.com/docs).

### Motion and transitions

Fluid transitions are part of the design system, not one-off effects:

- CSS transitions handle simple hover, focus, color, opacity, and press feedback.
- Motion for React (`motion/react`) handles interruptible layout changes, cart drawer content, filter/result changes, modal presence, shared indicators, and deliberate route-level transitions.
- Standard durations are 120 ms for immediate feedback, 180-240 ms for component transitions, and at most 320 ms for large view transitions.
- Animations prefer `transform` and `opacity`; layout-triggering properties are avoided in repeated interactions.
- Navigation, checkout, and purchase controls never wait for an animation to finish.
- Scroll hijacking, mandatory parallax, autoplayed continuous movement, and animation-only communication are prohibited.
- `prefers-reduced-motion` disables nonessential movement and replaces spatial transitions with short fades or immediate state changes.
- Motion is loaded only by client components that need it, and `LazyMotion` is used when it materially reduces shipped code.

Reference: [Motion for React](https://motion.dev/docs/react).

### Three-dimensional content policy

Three.js is not installed merely to make the store feel modern. A 3D feature proceeds only when the owners can provide or commission a useful model for a product where rotation materially improves purchase confidence.

The approved extension point is an optional product-viewer experiment after the core storefront meets its performance and conversion gates:

- React Three Fiber expresses the Three.js scene in React. React 19 uses the compatible React Three Fiber major version documented by the project.
- The viewer is a client-only dynamic import activated by an explicit “Ver en 3D” control; it is never required to view images, variants, price, stock, or purchase actions.
- A normal product image is the initial and no-WebGL fallback.
- GLB assets are compressed and the first viewer payload, including its model, targets no more than 1.5 MB transferred.
- Rendering pauses offscreen, device pixel ratio is capped, reduced motion disables automatic rotation, keyboard/touch controls are documented, and loading/error states remain usable.
- The experiment ships only if representative mobile tests preserve the storefront Web Vitals targets and analytics can compare viewer usage with add-to-cart behavior.

References: [React Three Fiber introduction](https://r3f.docs.pmnd.rs/getting-started/introduction) and [Three.js documentation](https://threejs.org/docs/).

### Public journey

1. **Home:** one campaign-led hero, category shortcuts, verified offers, featured products, best sellers, and trust information.
2. **Catalog:** search, category navigation, filters for size/color/brand/price/availability, sorting, pagination, and useful empty states.
3. **Product:** gallery, name, price, legitimate discount, installment information, selectable variant, stock, shipping estimator, add-to-cart, and WhatsApp alternative.
4. **Cart drawer/page:** quantity editing, savings, coupon, estimated shipping, total, checkout action, and WhatsApp handoff without losing context.
5. **Guest checkout:** contact, delivery, order review, and payment choice. Account creation is offered after purchase.
6. **Payment:** Mercado Pago redirect or bank-transfer instructions.
7. **Confirmation/tracking:** accurate state from the backend and a secure guest tracking link.

## 6. Commerce model

### Catalog

- `Product` owns shared merchandising content: name, slug, description, brand, category, status, SEO fields, and media.
- `ProductVariant` is the sellable unit: SKU, size, color, base price, publication status, weight, and dimensions. A crossed-out price is shown only when the pricing service returns an eligible active promotion and its original base price.
- `InventoryItem` tracks available and reserved quantity per SKU.
- `InventoryMovement` records every adjustment, reservation, sale, release, return, actor, reason, and timestamp.
- Product images are stored through a media provider port. Cloudinary is the first production adapter; domain records store provider-neutral asset metadata so storage can change without altering catalog contracts.

### Money

- PostgreSQL uses `NUMERIC(12,2)` and Python uses `Decimal`.
- ARS is explicit on prices, carts, orders, payments, refunds, and shipping quotes.
- Rounding happens in one pricing service and is covered by tests.
- Order lines snapshot product name, SKU, selected options, unit price, discount, and media reference.

### Promotions

The first release supports:

- automatic percentage or fixed discounts;
- coupon-based percentage or fixed discounts;
- start/end dates;
- minimum subtotal;
- product/category scope;
- total and per-customer usage limits;
- optional free shipping.

Promotions do not stack by default. A promotion must explicitly allow combination. The API returns the applied rule, original price, final price, savings, and reason. Expired or exhausted campaigns cannot appear as active offers.

### Cart

- Guests receive an opaque cart identifier in a secure cookie.
- Login merges guest and account carts deterministically.
- All totals are recalculated by the backend when items, address, shipping, coupon, or payment method changes.
- Quantity validation and stock checks occur on every mutation and again during checkout.
- Browser state may optimistically display safe quantity changes but must reconcile with the API response.

### Orders and inventory reservations

- Checkout creates an order and reserves inventory transactionally.
- Mercado Pago reservations expire if the payment does not complete within the configured window.
- Bank-transfer reservations default to 24 hours and are configurable.
- Expired or cancelled orders release inventory through an idempotent scheduled job.
- An approved payment converts the reservation into a sale; it cannot be applied twice.

Order states are controlled transitions:

```text
awaiting_payment -> paid -> preparing -> shipped|ready_for_pickup -> completed
awaiting_payment -> expired|cancelled
paid|preparing -> cancelled|refunded (permission and business rules required)
```

## 7. Payments

### Mercado Pago Checkout Pro

- The API creates a payment preference from server-calculated order data.
- The customer may pay in Mercado Pago as a guest.
- Browser return URLs are informational and never confirm payment.
- A signed webhook is the authoritative event source.
- Webhook receipt, provider lookup, and state transition are idempotent.
- Raw webhook metadata is retained according to a documented retention policy, without logging credentials or unnecessary personal data.

This follows Mercado Pago's documented preference, return URL, testing, and signed webhook flow:

- [Checkout Pro overview](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/overview)
- [Payment notifications](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/payment-notifications)

### Bank transfer

- Administrators configure one active destination with alias, CBU/CVU when desired, holder, tax identifier when desired, bank name, instructions, and reservation duration.
- Checkout snapshots the transfer instructions onto the pending order so later configuration changes do not alter an existing customer's instructions.
- The customer sees a copy button, exact total, expiration, and secure tracking link.
- JPG, PNG, or PDF proof is optional, size-limited, validated, private, and accessed through signed authorization.
- Proof submission changes the payment to `under_review`; it never marks it paid.
- A user with the explicit financial permission confirms or rejects the payment after verifying actual accreditation. The action records actor, time, and note.
- Expiration cancels the pending order and releases reserved stock.

Payment states are provider-neutral: `pending`, `under_review`, `approved`, `rejected`, `expired`, `cancelled`, and `refunded`.

## 8. Shipping and pickup

- Administrators configure store pickup details and national shipping zones/rates.
- Shipping quotes use postal code, cart weight/value, free-shipping thresholds, and active rate rules.
- The order snapshots the chosen method, destination, quote, and promised description.
- Shipment state is independent from payment state.
- A shipping adapter allows a carrier quote/tracking integration without changing checkout contracts.
- Invalid or unsupported postal codes return a clear next action, including WhatsApp assistance.

## 9. Identity, roles, and permissions

### Customer and guest

- Purchase never requires an account.
- Guests receive a signed, expiring order-access link.
- Customers can later claim eligible guest orders after email verification.
- Registered customers manage profile, addresses, and history.

### Staff

- **Administrator:** complete configuration, users, roles, catalog, pricing, inventory, promotions, orders, payments, shipping, and audit access.
- **Seller:** operational catalog, inventory, customers, fulfillment, and order access. Sensitive settings, credentials, role administration, and financial actions are denied unless a granular permission is granted.
- `payments.verify_transfer` is separate from the seller role and can be assigned only when the owners want a seller to reconcile transfers.

### Session security

- Access and refresh material is stored in `HttpOnly`, `Secure` cookies, never localStorage.
- Unsafe requests require CSRF protection and allowed-origin validation.
- Passwords use Argon2id with versioned parameters that can be upgraded after a successful login.
- Login, reset, checkout, coupon, webhook, and upload endpoints have purpose-specific rate limits.
- CORS uses exact production and staging origins.
- Railway variables hold secrets; credentials never enter Git or client bundles.
- Authentication and authorization failures do not reveal whether unrelated accounts or orders exist.

## 10. Administrator and seller experience

### Administrator workspace

- Business summary: revenue, approved orders, conversion funnel, average order value, pending transfers, low stock, and failed payments.
- Product and variant editor with media, publication, SEO preview, stock, and price history.
- Promotion builder with validation and live eligibility summary.
- Order detail with immutable timeline and controlled transitions.
- Payment review, refunds, transfer destination, shipping rules, staff permissions, and audit log.

### Seller workspace

- Daily queue for paid orders, preparation, pickup, dispatch, and customer follow-up.
- Fast SKU search and stock adjustment with mandatory reason.
- Customer/order lookup without exposure to secrets or role management.
- Responsive cards on mobile and compact tables on desktop.

Destructive actions require explicit confirmation and communicate consequences. Routine status updates remain fast and keyboard accessible.

## 11. API and error design

- Public and staff APIs are versioned under `/api/v1`.
- List endpoints use bounded pagination and indexed filters.
- Request/response schemas are separate from persistence models.
- Mutating checkout and payment operations accept idempotency keys.
- Errors use one structured envelope compatible with problem details: stable code, localized-safe message, optional field errors, and `request_id`.
- The UI preserves entered form data after recoverable failures and identifies the next action.
- Automatic retries occur only for safe reads or explicitly idempotent operations.
- Database transactions and row-level locking protect stock and payment state transitions.

Representative route groups:

```text
/api/v1/catalog
/api/v1/cart
/api/v1/checkout
/api/v1/orders
/api/v1/account
/api/v1/admin
/api/v1/seller
/api/v1/webhooks/mercadopago
/health/live
/health/ready
```

## 12. Performance, SEO, and analytics

- Next.js renders indexable category and product metadata on the server.
- Product/category pages use deliberate caching and revalidation after staff updates.
- Images use responsive sizes, modern formats, stable dimensions, and lazy loading outside the initial viewport.
- API queries avoid unbounded collections and N+1 relationships.
- Search starts with indexed PostgreSQL text/trigram capabilities; no external search service is introduced initially.
- Production targets at the 75th percentile are LCP under 2.5 seconds, INP under 200 ms, and CLS under 0.1 on representative mobile traffic.
- Events include product view, search, zero-result search, promotion view, add-to-cart, checkout start, payment-method selection, approved purchase, and WhatsApp handoff.
- Analytics events exclude email, phone, address, payment credentials, and other direct identifiers.

## 13. Observability and operations

- JSON logs include timestamp, level, service, environment, request ID, route, duration, and safe domain identifiers.
- Healthchecks distinguish process liveness from database/integration readiness.
- Exceptions and payment failures are alertable; credentials and personal data are redacted.
- Audit events cover staff sign-in, permission changes, stock adjustments, promotion changes, order transitions, transfer verification, refunds, and payment configuration.
- A scheduled Railway job expires reservations and retries only explicitly retryable notification work.
- Transactional email uses a provider-neutral SMTP adapter configured through Railway variables; development uses a capture transport and never sends real messages.
- Database backups are enabled and restore procedures are tested before launch.

## 14. Testing and quality gates

### Backend

- Unit tests for pricing, promotion eligibility, rounding, inventory reservation, transitions, and permissions.
- Integration tests against PostgreSQL for repositories, constraints, locks, migrations, and idempotency.
- API tests for public, guest, customer, seller, and administrator contracts.
- Mercado Pago and media/shipping providers are tested through fakes plus focused adapter contract tests.

### Frontend

- Vitest and Testing Library cover accessible controls, form validation, loading/error/empty states, cart reconciliation, and responsive behavior.
- Component tests verify reduced-motion behavior, focus after animated overlays, and that animation never delays a purchase action.
- Playwright covers mobile and desktop journeys:
  - browse, filter, select variant, and add to cart;
  - guest checkout with shipping and pickup;
  - Mercado Pago preference and simulated signed webhook;
  - bank transfer, proof upload, staff approval, and expiration;
  - customer login and order claim;
  - seller and administrator permission boundaries.
- Automated accessibility checks supplement keyboard and screen-reader-oriented manual review.
- If the optional 3D experiment is activated, Playwright covers lazy loading, image fallback, keyboard/touch controls, WebGL failure, reduced motion, and the mobile transfer-size budget.

### Continuous checks

- Type checking, linting, formatting, unit tests, integration tests, production builds, migration validation, and dependency vulnerability checks run before deployment.
- Staging smoke tests pass before production promotion.

## 15. Railway deployment

The Railway project contains:

- `web`: root `frontend/`, Next.js standalone build, public domain;
- `api`: root `backend/`, FastAPI server, public webhook/API domain;
- `postgres`: managed PostgreSQL with reference variables;
- `jobs`: a scheduled service using the backend image for reservation expiry and retryable notifications.

Required deployment behavior:

- separate staging and production environments;
- exact environment variables per service;
- `alembic upgrade head` as the API pre-deploy command;
- readiness healthcheck before traffic switch;
- custom HTTPS domains for production;
- no filesystem dependency for durable uploads;
- first administrator created through an explicit one-time command, never an automatic default credential.

Railway's current guides document FastAPI GitHub/Docker deployment, Next.js standalone output, PostgreSQL reference variables, and pre-deploy migrations:

- [Deploy a FastAPI app](https://docs.railway.com/guides/fastapi)
- [Deploy a Next.js app with Postgres](https://docs.railway.com/guides/nextjs)

## 16. Delivery sequence

The implementation plan will split work into independently verifiable increments:

1. Repository foundation, typed configuration, PostgreSQL, CI, healthchecks, and Railway-ready builds.
2. Identity, sessions, RBAC, audit foundation, and staff bootstrap.
3. Catalog, variants, media, inventory, and staff catalog workflow.
4. Pricing, promotions, public catalog, search, and product experience.
5. Server cart, shipping quotes, pickup, guest checkout, and order reservations.
6. Mercado Pago, signed webhooks, bank transfer, proof review, and payment timelines.
7. Administrator/seller order operations, customer account, guest tracking, and WhatsApp handoff.
8. Analytics, accessibility, performance, security hardening, staging validation, and production launch checklist.

After launch gates pass, a separately approved experiment may add one lazy-loaded 3D viewer for a flagship product. It is not on the critical path to production.

Each increment must leave the application buildable and tested. Provider integrations remain behind ports so local tests do not require production credentials.

## 17. Acceptance criteria

The design is complete when the implemented system demonstrates all of the following:

- A mobile guest can discover a variant, see a legitimate offer, calculate delivery, and complete a purchase without creating an account.
- Mercado Pago approval is confirmed only through a validated, idempotent webhook.
- A guest can choose bank transfer, copy the configured alias, optionally submit proof, and track manual confirmation.
- Inventory cannot be oversold through concurrent checkout attempts covered by integration tests.
- An administrator can manage catalog, stock, promotions, shipping, staff permissions, and payment configuration.
- A seller can fulfill orders and adjust stock without accessing secrets or prohibited financial functions.
- The application deploys from Git to Railway staging using PostgreSQL and automated migrations.
- Critical customer and staff flows pass mobile/desktop end-to-end tests and WCAG 2.2 AA checks.
- Transitions remain fluid without delaying actions, preserve focus, and honor reduced-motion preferences.
- ShadCN primitives use the FreestyleSport semantic tokens and do not expose an unmodified template appearance.
- Conversion events make the completed-purchase funnel measurable without exposing personal data.
