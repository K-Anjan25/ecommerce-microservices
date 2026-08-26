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

## Next development phases

1. **P12 — Production certification** (in progress; tooling ready):
   schema-baseline generation (`tools/generate-schema-baseline.sh` → review →
   `V2__baseline_schema.sql`), staging rollout checklist above; remaining work
   needs a real environment (Flyway drill, live provider keys, webhook return
   path).
2. **P13 — Scale & resilience drills**: sustained load test, backup/restore and
   reconciliation drills in a deployed environment.
3. **P14 — Growth features**: product analytics dashboards (views/conversion),
   recommendation rails, invoice branding. Bulk catalog CSV import/export is
   delivered (admin Products page).
4. **P15 — Optional SSR/pre-render expansion** for SEO + localized merchant HTML.

Recently delivered (August 2026): themed `DateField` + business-timezone
convention; admin console completion (flash sales, shipping rates, tax rules,
gift-card issuance, coupon edit); customer wishlist; multi-image gallery and
variant editor in the admin product form with id-preserving variant saves;
bulk catalog CSV import/export with per-row backend validation reporting.
