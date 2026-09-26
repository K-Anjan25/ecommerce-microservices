# Cartly — platform brief

Everything an engineer needs in one page. Full historical design docs were
condensed into this file; the originals remain in git history
(`git log --follow -- docs/`).

## What this is

A full-stack e-commerce platform: 4 Spring Boot microservices + a React
TypeScript storefront ("Cartly", Editorial Warmth design), sized for a 2 GB
Docker host. Feature-complete commerce demo baseline; production launch is
blocked only by external certifications (see Status).

## Architecture

| Service | Port | Owns |
|---|---|---|
| `api-gateway` | 8889 | Routing + AuthFilter (JWT → `userId`/`authorities` headers), rate limits, security headers, file storage/serving (`/file/**`) |
| `user-service` | 8084 | Auth, users, roles, password reset, transactional email (encrypted retry outbox), referral codes |
| `product-service` | 8080 | Catalog, categories, variants, images, inventory, flash sales, comments, price watch, store settings, pg_trgm search |
| `commerce-service` | 8081 | Cart, orders, payments (Stripe/Razorpay, signed webhooks, reconciliation queue), coupons, gift cards, loyalty, returns, wishlist, shipping rates, tax rules, audit log |

Infra: `postgres` (3 schemas) + `rabbitmq` (order events, email, notifications).
Communication: REST/Feign with Resilience4j circuit breakers; async via RabbitMQ.
Auth: stateless JWT (access 2d / refresh 24d); guest checkout + capability-based
guest order tracking.

## Status (August 2026)

- **Phases 6–9 (catalog, checkout, marketing, admin): baseline complete.**
- **Phase 10 (hardening): baseline complete, ongoing** — CI, rate limits,
  headers, CSP, PWA, en/hi, dark mode, a11y, backup/restore, idempotent
  inventory, signed provider webhooks, reconciliation + email-retry queues.
- **Not production-certified yet:** live provider credentials/certification,
  Flyway rollout drills in a real DB, load/DR tests, SSR (optional),
  WooCommerce theme runtime certification, real catalog photography.

## Conventions (keep these)

- **Dates/time:** one business clock — services run `TZ=${APP_TIMEZONE:-Asia/Kolkata}`.
  Zone-less `LocalDateTime`/`LocalDate` everywhere; the browser sends naive
  wall-clock payloads (never UTC-converted ISO). All date pickers use
  `components/DateField` (token-themed calendar); all display goes through
  `utils/date.ts`.
- **Security:** every non-public route goes through the gateway `AuthFilter`,
  which strips and re-injects identity headers; services trust only those.
  Secrets via `.env` (see `.env.example`); `INTERNAL_SERVICE_SECRET` guards
  stock calls; `JPA_DDL_AUTO=validate` + Flyway for production.
- **Money/credits integrity:** server-side pricing only; gift cards/loyalty are
  order-bound; refunds are provider-backed, idempotent, capped at unused value.
- **Memory ceiling:** 2 GB host — no new infra services; features land inside
  existing modules.

## Admin console (`/admin`, ROLE_ADMIN+)

Dashboard · Orders · Products (+ variants/images model ready in API) ·
Categories · Flash sales · Coupons · Gift-card sales + manual issuance ·
Shipping rates · Tax rules · Returns · Storefront CMS · Audit log ·
Payment review · Email delivery · Customers.

## Operations

```bash
docker compose up -d --build        # whole stack
./tools/release-readiness.sh        # release gates (config + connectivity)
./tools/flyway-baseline.sh | migrate.sh   # schema migrations
./tools/db-backup.sh | db-restore.sh      # backup/restore runbook
./tools/production-smoke.sh         # read-only post-deploy smoke
```

### Staging rollout checklist (P12 gate)

1. **Backups**: verified backup + restore point before touching schema (`tools/db-backup.sh`).
2. **Schema baselines**: generate the Hibernate baseline per service with
   `tools/generate-schema-baseline.sh`, review the DDL, commit as
   `V2__baseline_schema.sql`, then `flyway-baseline.sh` (existing DBs) →
   `flyway-migrate.sh`.
3. **Config gate**: `JPA_DDL_AUTO=validate FLYWAY_ENABLED=true` — services must
   boot clean; `tools/check-production-config.sh` for env completeness.
4. **Providers**: live Stripe/Razorpay test-mode keys, signed webhook endpoints
   registered, return-path (`/stripe-payment-return`, Razorpay handoff) exercised.
5. **Webhooks/settlement**: `tools/simulate-payment-webhook.mjs` for signed
   signature checks; run a payment → capture → refund → gift-card round trip.
6. **Reconciliation & alerts**: monitor `/actuator/health` (reconciliation +
   email-retry health detail included), alert on RabbitMQ queue depth and
   payment-review open cases.
7. **Smoke**: `tools/production-smoke.sh` (read-only) post-deploy.

Design kit (wireframes, tokens, mock preview server): [`design/`](../design/).
WordPress/WooCommerce theme: separate repo `cartly-wp-theme`; tokens stay
canonical here.

Recently delivered (September 2026): **real catalog photography + variant
media model** — 24 exact products photographed from web sources
(`tools/catalog-media/manifest.json` records every source URL); per-variant
images + swatches + angle-tagged galleries (`product_images.variant_id/angle/
alt_text`, `product_variants.swatch_hex/image_url`). **Subscribe & Save v2
(Amazon parity)**: variant-level subscriptions, buy-box "One-time / Subscribe &
Save — Save 5%" offer, 5% base / 15% when 5+ deliveries batch in one calendar
month, ship-day floating pricing, pre-delivery reminder emails with
skip/change/cancel links, skip-next / reschedule / pause-until / soft-cancel
lifecycle, per-subscription OOS policy (skip/wait/cancel), hybrid renewal
payment (saved provider token auto-charged, otherwise the order waits for
manual payment), the "Your Subscriptions" hub, and an admin subscriptions
console with an 8-week demand forecast. Commerce roles: `ROLE_CS`
(customer-service agent) joins USER/MANAGER/ADMIN/SUPER_ADMIN; `ROLE_HR` is
legacy-only — kept for old accounts, no longer assignable via the admin UI.

## Next development phases

1. **P12 — Production certification** (in progress; tooling ready):
   schema-baseline generation (`tools/generate-schema-baseline.sh` → review →
   `V2__baseline_schema.sql`), staging rollout checklist above; remaining work
   needs a real environment (Flyway drill, live provider keys, webhook return
   path).
2. **P13 — Scale & resilience drills**: sustained load test, backup/restore and
   reconciliation drills in a deployed environment.
3. **P14 — Growth features**: product analytics dashboards (views/conversion),
   recommendation rails. Bulk catalog CSV import/export, invoice branding and
   the analytics window selector are delivered.

**Optional SSR is delivered** (`P15 ✅`, opt-in — the default SPA is
unchanged): `frontend/server/ssr-server.mjs` server-renders the public
pages (home/collection grid, bestsellers, product detail with real
title/og/JSON-LD-adjacent meta) and ships the react-query cache in a
CSP-safe JSON tag for instant hydration. Run with:

```bash
cd frontend
npm run build:ssr                # client build + SSR server bundle
npm run start:ssr                # NODE_ENV=production, port 3001
npm run dev:ssr                  # vite HMR for client + SSR via the built bundle
# env: PORT, GATEWAY_URL (api-gateway for /v1|/user|/file|/api proxy),
#      SSR_SITE_ORIGIN (canonical/og origin)
```

SSR renders through the prebuilt server bundle in both modes (vite's dev
module runner cannot interop CJS default exports); after editing
SSR-relevant code run `npm run build:ssr` (or `build:ssr:watch` in a second
terminal). If rendering fails the server falls back to the static shell —
the client app takes over as usual. `server/mock-gateway.cjs` is a local
fixture for trying SSR without the Java backend.

Recently delivered (August 2026): themed `DateField` + business-timezone
convention; admin console completion (flash sales, shipping rates, tax rules,
gift-card issuance, coupon edit); customer wishlist; multi-image gallery and
variant editor in the admin product form with id-preserving variant saves;
bulk catalog CSV import/export with per-row backend validation reporting;
invoice branding; analytics window selector + top categories; catalog search
hardening (pg_trgm auto-provisioned via V3 migration + boot guard, deduped
suggestion requests through the react-query cache, shareable `/?q=` and
`/?category=` catalog URLs, SPA scroll restoration); optional SSR for the
storefront.


## Catalog media (product photography)

All product photography is hotlinked from brand-owned CDNs — zero product photos live in this
repo. Per-angle full/thumb URLs, SKUs and provenance: `tools/catalog-media/manifest.json`.
`tools/catalog-media/generate_seed.py` bakes them into `docker/postgres/seed-catalog-data.sql`
(`product_images.url`/`thumb_url`, `product_variants.image_url`). Slugs with no brand-CDN set
(L'Oréal Revitalift serum, Hawkins Contura) seed the shared placeholder
`frontend/public/images/store/product-placeholder.svg`; the storefront also falls back to it via
`onError` in `ProductCard` when a hotlink dies.

Link-rot guard — run on demand (CI-gateable, exits 1 on dead URLs):

    python3 tools/catalog-media/check_images.py           # report
    python3 tools/catalog-media/check_images.py --write   # stamp *_alive flags into the manifest

## Cartly Plus & PDP depth

- **Cartly Plus** (commerce-service `membership` package, `cartly_plus_memberships`, V8): MONTHLY ₹149 / ANNUAL ₹1,499, prices fixed server-side. Benefits are enforced server-side only — free express delivery (`OrderService.calculateShipping`), Subscribe & Save 10%/20% vs 5%/15% (`SubscriptionService.discountForRun`), member-only prices (`products.member_deal_percent`, applied in `OrderService.applyAuthoritativePrices`, never stacked on flash prices), 24h flash-sale early access (product-service `PlusMembershipGateway` → `/internal/memberships/active/{userId}`), priority support lane (`support_ticket.priority=HIGH`). Frontend: `/cartly-plus` page + navbar "Plus" chip + member-price badge on the PDP.
- **Review photos**: `POST /v1/comments` accepts `images[]` (data URLs, max 8) → `comment_images` (product-service V7); the Reviews composer downscales client-side (~1200 px JPEG) and review cards render a thumbnail strip with a full-res lightbox.
- **Grouped specifications**: `products.specifications` JSON (`[{"group","items":[{"label","value"}]}]`) seeded per product — computers get the deepest tables — rendered as grouped tables in the PDP Specifications tab.
- **Subscribe & Save UI**: custom `StyledSelect` dropdowns everywhere (PDP cadence, subscription manager cadence/qty/OOS, payment provider) — no raw `<select>` menus remain. Pause/resume already flows through `PUT /v1/subscriptions/{id}`.
