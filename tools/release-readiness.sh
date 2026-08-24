#!/usr/bin/env bash
set -euo pipefail

# Final pre-release gate. It validates local configuration and migration
# artifacts, then optionally runs the read-only deployed smoke checks.
# It does not mutate a database or call a payment provider.
failures=0
fail() {
  printf 'ERROR: %s\n' "$1" >&2
  failures=$((failures + 1))
}

if ! ./tools/check-production-config.sh; then
  failures=$((failures + 1))
fi

if [[ "${FLYWAY_ENABLED:-}" != "true" ]]; then
  fail "FLYWAY_ENABLED must be true for a production release"
fi
if [[ "${JPA_DDL_AUTO:-}" != "validate" ]]; then
  fail "JPA_DDL_AUTO must be validate for a production release"
fi

for migration_dir in \
  commerce-service/src/main/resources/db/migration \
  product-service/src/main/resources/db/migration \
  user-service/src/main/resources/db/migration; do
  if [[ ! -f "$migration_dir/V1__hardening_delta.sql" \
        && ! -f "$migration_dir/V1__localized_storefront_content.sql" \
        && ! -f "$migration_dir/V1__email_retry_outbox.sql" ]]; then
    fail "no reviewed Flyway delta found in $migration_dir"
  fi
  if ! find "$migration_dir" -maxdepth 1 -type f -name 'V*__*.sql' | grep -q .; then
    fail "no Flyway migration files found in $migration_dir"
  fi
done

if [[ "${VITE_PRERENDER_REQUIRED:-false}" == "true" ]]; then
  [[ "${VITE_PUBLIC_STOREFRONT_URL:-}" == https://* ]] \
    || fail "VITE_PUBLIC_STOREFRONT_URL must use HTTPS when pre-rendering is required"
  [[ -n "${VITE_PRERENDER_API_URL:-}" ]] \
    || fail "VITE_PRERENDER_API_URL is required when pre-rendering is required"
  [[ -n "${VITE_SITEMAP_PRODUCT_URLS:-}" ]] \
    || fail "VITE_SITEMAP_PRODUCT_URLS is required when pre-rendering is required"
fi

if [[ "${RUN_DEPLOYED_SMOKE:-false}" == "true" ]]; then
  if ! ./tools/production-smoke.sh; then
    failures=$((failures + 1))
  fi
fi

if (( failures > 0 )); then
  printf '%s release-readiness check(s) failed.\n' "$failures" >&2
  exit 1
fi

printf 'Cartly release-readiness checks passed.\n'
