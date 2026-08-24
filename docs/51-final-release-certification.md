# Final release certification

The repository now contains the implementation, migration deltas, configuration gate, SEO build tooling, and read-only smoke checks. `tools/release-readiness.sh` combines the local release gates without mutating databases or charging providers.

## Local release gate

```bash
set -a
. ./.env
set +a

JPA_DDL_AUTO=validate \
FLYWAY_ENABLED=true \
./tools/release-readiness.sh
```

For a release build that requires data-aware product pre-rendering, also provide the frontend build environment:

```bash
export VITE_PUBLIC_STOREFRONT_URL=https://shop.example.com
export VITE_PRERENDER_API_URL=https://api.example.com
export VITE_SITEMAP_PRODUCT_URLS=/products/<public-product-id>
export VITE_PRERENDER_REQUIRED=true
(cd frontend && npm ci && npm run build)
```

After deployment:

```bash
RUN_DEPLOYED_SMOKE=true \
BASE_URL=https://api.example.com \
FRONTEND_URL=https://shop.example.com \
REQUIRE_HTTPS=true \
./tools/release-readiness.sh
```

## Required staging gates

1. Verify a PostgreSQL backup and restore point.
2. Baseline the existing `userdb`, `productdb`, and `commercedb` schemas with `tools/flyway-baseline.sh`.
3. Apply each reviewed Flyway delta with `tools/flyway-migrate.sh`.
4. Start a canary with `FLYWAY_ENABLED=true` and `JPA_DDL_AUTO=validate`.
5. Run `tools/production-smoke.sh`.
6. Exercise signed Stripe/Razorpay webhooks, pending reconciliation, late capture, refund, gift-card issuance, gift-card refund, email retry, and abandoned-intent cleanup.
7. Run load, concurrency, backup/restore, and disaster-recovery drills.
8. Record provider results, alert routing, migration versions, and rollback evidence before production approval.

## Cannot be simulated in this checkout

Live provider authorization, production database state, infrastructure capacity, real SMTP delivery, incident routing, WordPress/WooCommerce compatibility, and final merchant photography/content require the deployment and content environments. The release gate deliberately reports configuration and connectivity readiness but does not claim those external certifications.
