#!/usr/bin/env bash
set -euo pipefail

# Fail closed before a production deployment can start with development
# defaults, wildcard origins, mutable Hibernate schema, or missing secrets.
failures=0
fail() {
  printf 'ERROR: %s\n' "$1" >&2
  failures=$((failures + 1))
}

require_nonblank() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    fail "$name must be set"
  fi
}

require_nonblank JWT_SECRET
require_nonblank INTERNAL_SERVICE_SECRET
require_nonblank CORS_ALLOWED_ORIGIN
require_nonblank STOREFRONT_PUBLIC_URL
require_nonblank EMAIL_OUTBOX_ENCRYPTION_KEY

jwt_secret="${JWT_SECRET:-}"
internal_service_secret="${INTERNAL_SERVICE_SECRET:-}"
cors_allowed_origin="${CORS_ALLOWED_ORIGIN:-}"
storefront_public_url="${STOREFRONT_PUBLIC_URL:-}"
email_outbox_key="${EMAIL_OUTBOX_ENCRYPTION_KEY:-}"

if [[ "${JPA_DDL_AUTO:-}" != "validate" ]]; then
  fail "JPA_DDL_AUTO must be validate in production"
fi

if [[ "${POSTGRES_PASSWORD:-}" == "root" ]]; then
  fail "POSTGRES_PASSWORD must not use the development default"
fi

if [[ "${#jwt_secret}" -lt 32 ]]; then
  fail "JWT_SECRET must be at least 32 characters"
fi
if [[ "${#internal_service_secret}" -lt 32 ]]; then
  fail "INTERNAL_SERVICE_SECRET must be at least 32 characters"
fi

if [[ "$cors_allowed_origin" == *'*'* || "$cors_allowed_origin" == *'localhost'* ]]; then
  fail "CORS_ALLOWED_ORIGIN must be an exact production origin"
fi
if [[ "$storefront_public_url" != https://* ]]; then
  fail "STOREFRONT_PUBLIC_URL must use HTTPS"
fi

key_bytes="$(printf '%s' "$email_outbox_key" | base64 --decode 2>/dev/null | wc -c | tr -d ' ')"
if [[ "$key_bytes" != 32 ]]; then
  fail "EMAIL_OUTBOX_ENCRYPTION_KEY must be base64 for exactly 32 bytes"
fi

if [[ -n "${STRIPE_SECRET_KEY:-}" && -z "${STRIPE_WEBHOOK_SECRET:-}" ]]; then
  fail "STRIPE_WEBHOOK_SECRET is required when STRIPE_SECRET_KEY is configured"
fi
if [[ -n "${RAZORPAY_KEY_SECRET:-}" && -z "${RAZORPAY_WEBHOOK_SECRET:-}" ]]; then
  fail "RAZORPAY_WEBHOOK_SECRET is required when RAZORPAY_KEY_SECRET is configured"
fi

if (( failures > 0 )); then
  printf '%s production configuration check(s) failed.\n' "$failures" >&2
  exit 1
fi

printf 'Production configuration checks passed.\n'
