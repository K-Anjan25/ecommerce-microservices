# Current platform status

**As of:** 24 August 2026  
**Branch:** `arena/01a02dc1-ecommerce-microservices`  
**Design:** Editorial Warmth

## Direct answer

The selected **platform baseline for Phases 6, 7, 8 and 9 is complete**. The selected baseline for **Phase 10 is also complete**, but Phase 10 is platform engineering and therefore remains ongoing.

The platform is **not “all completed” in the absolute production sense**. It is a broad, tested portfolio/demo ecommerce platform with substantial security and consistency hardening. Production launch still requires provider/runtime certification and several explicitly deferred boundaries.

## Phase matrix

| Phase | Baseline | Current qualification |
|---|---|---|
| 6 — Merchandising & catalog | Complete | Variants, multiple images, sale/brand/rating, hierarchy, facets, autocomplete and editorial catalog implemented |
| 7 — Commerce completion | Complete | Server pricing, shipping, tax, guest checkout, invoices, addresses, returns and mixed-tender refunds implemented |
| 8 — Marketing & creative | Complete with boundary | Recommendations, alerts, loyalty, referral, wrapping, flash sales, comparison, redemption and payment-backed gift-card issuance implemented; provider certification remains |
| 9 — Admin & analytics | Complete | Dashboard, CMS, coupons, return queue, roles and audit ledger implemented |
| 10 — Hardening | Baseline complete; ongoing | CI, authorization, rate limits, logs, backups, PWA, i18n, dark mode, accessibility, headers and transaction integrity implemented; operations continue |

## What we are currently doing

The roadmap feature build is no longer the main activity. Current work is **Phase 10 integrity and production-boundary hardening**, including:

- authoritative order pricing and payment ownership;
- signed provider settlement callbacks;
- order-bound gift-card and loyalty credit handling;
- mixed-tender return allocation and provider refund caps;
- idempotent inventory deduction/restoration;
- one-time credentials and account revocation;
- authenticated file storage;
- accessibility, dependency, PWA, SEO and frontend-session hardening;
- keeping the Editorial Warmth design artifacts aligned with the shipped UI.

## Completed operational baseline

- Backend, frontend and Compose checks run in GitHub Actions.
- Frontend audit has zero known npm vulnerabilities.
- JSON logs, correlation IDs and targeted rate limits are present.
- Backup and restore scripts/runbook exist.
- Security headers, CSP and constrained CORS are present.
- English/Hindi shell localization and dark mode are present.
- PWA offline shell avoids caching authenticated/API responses.
- Critical cross-service mutations now use locks, compensation and/or idempotency keys.
- SMTP failures now use an encrypted PostgreSQL retry outbox; email contents and sensitive links are not stored as plaintext.
- Email retry and resolved payment-reconciliation records have bounded retention and admin-safe metadata views.
- Release-readiness, Flyway, production configuration, SEO build, and read-only deployment smoke gates are documented and scriptable.

## Explicitly not complete

These are not hidden TODOs; they are the remaining production boundaries:

1. **Interactive payment-provider handoff.** Razorpay browser Checkout and Stripe Payment Element now hand off provider operations while keeping webhook settlement authoritative. Live-provider certification and production return-path testing remain.
2. **Provider reconciliation execution.** Stale online payments now use authenticated Stripe/Razorpay status lookups where possible, safely auto-refund late captures on cancelled orders, and create a durable operations queue for ambiguity. Provider-specific expiry, certification, alerting and the production operations runbook remain.
3. **Customer gift-card purchasing.** Payment-backed pending issuance, abandoned-intent cleanup, recipient delivery and unused-balance refund handling are implemented; cards activate only after verified capture. Live-provider certification and late-capture decisions remain.
4. **Production database migrations.** A `JPA_DDL_AUTO=validate` production gate and configuration checker are now available; versioned Flyway/Liquibase migrations, rollout and rollback exercises still remain.
5. **High-assurance SEO rendering.** A crawler policy, generated sitemap/robots assets, static public fallback shells, and optional data-aware product pre-rendering now exist; a long-lived SSR deployment remains optional production work.
6. **Localized merchant CMS content.** English/Hindi merchant fields and fallback selection are implemented; SSR/pre-rendered localized HTML remains separate work.
7. **Scale and disaster testing.** The 2 GB topology is respected, but sustained load, chaos, restore-time and provider reconciliation drills require a deployment environment.
8. **WooCommerce runtime certification.** The separate sellable theme must be tested in a real supported WordPress/WooCommerce matrix.
9. **Real catalog photography/content.** Editorial images are branded placeholders; merchant inventory controls actual product-card/PDP media.
10. **CI action-version warnings.** GitHub recommends newer action versions, but the current GitHub App cannot push workflow changes without `workflows` permission.

## Design artifact status

The seven files in `design/wireframes/` were regenerated on 24 August 2026 from their generator. They now represent:

- Editorial Warmth colors and typography;
- typographic Cartly wordmark;
- current editorial hero and category stories;
- no Browse category rail;
- no floating/sticky catalog toolbar;
- enclosed checkout and order-bound credits;
- provider-confirmed payment semantics;
- current admin navigation and role boundary;
- current mobile storefront, product and checkout behavior.

Archived palette sheets are historical exploration only and are labelled accordingly.

## Checkout completion UX

The enclosed checkout now ends on a dedicated confirmation screen for gift-card-funded, COD, provider-pending and provider-settled outcomes. Guest capability material is never placed in a query string or browser storage; fragment-delivered capabilities are hashed at rest and expire after a configurable TTL. See [35-checkout-confirmation.md](35-checkout-confirmation.md) and [36-guest-order-tracking.md](36-guest-order-tracking.md).

## Pending cancellation

Signed-in and capability-authenticated guest customers can cancel eligible pending/COD orders with idempotent inventory, credit and coupon compensation. Pending Stripe intents are cancelled provider-side before local release. Razorpay orders without a cancellation API still require reconciliation; see [37-pending-order-cancellation.md](37-pending-order-cancellation.md).
