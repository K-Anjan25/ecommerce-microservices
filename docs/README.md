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

Design kit (wireframes, tokens, mock preview server): [`design/`](../design/).
WordPress/WooCommerce theme: separate repo `cartly-wp-theme`; tokens stay
canonical here.

## Next development phases

1. **P11 — Catalog depth in UI**: multi-image manager + variant editor in the
   admin product form (APIs already support `images[]` and `variants[]`).
2. **P12 — Production certification**: Flyway baseline/migrate/rollback drill,
   live Stripe/Razorpay keys, webhook return-path tests, reconciliation ops
   runbook + alerting.
3. **P13 — Scale & resilience drills**: sustained load test, backup/restore and
   reconciliation drills in a deployed environment.
4. **P14 — Growth features**: product analytics dashboards (views/conversion),
   recommendation rails, bulk catalog import/export, invoice branding.
5. **P15 — Optional SSR/pre-render expansion** for SEO + localized merchant HTML.
