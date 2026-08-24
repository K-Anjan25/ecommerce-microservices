#!/usr/bin/env bash
set -euo pipefail

# Read-only deployment smoke checks. It never creates an order, charges a
# provider, mutates inventory, or touches an authenticated customer endpoint.
BASE_URL="${BASE_URL:-http://localhost:8889}"
FRONTEND_URL="${FRONTEND_URL:-}"
CURL_TIMEOUT="${CURL_TIMEOUT:-10}"
failures=0

fail() {
  printf 'ERROR: %s\n' "$1" >&2
  failures=$((failures + 1))
}

get() {
  curl --fail --silent --show-error --max-time "$CURL_TIMEOUT" \
    --header 'Accept: application/json' "$1"
}

if [[ "${REQUIRE_HTTPS:-false}" == "true" && "$BASE_URL" != https://* ]]; then
  fail "BASE_URL must use HTTPS when REQUIRE_HTTPS=true"
fi

health=""
if health="$(get "${BASE_URL%/}/actuator/health" 2>/tmp/cartly-smoke-health.err)"; then
  if [[ "$health" != *'"status":"UP"'* && "$health" != *'"status": "UP"'* ]]; then
    fail "gateway health did not report UP"
  fi
else
  fail "gateway health endpoint is unavailable"
fi

products=""
if products="$(get "${BASE_URL%/}/v1/products?size=1" 2>/tmp/cartly-smoke-products.err)"; then
  if [[ -z "$products" ]]; then
    fail "public product endpoint returned an empty response"
  fi
else
  fail "public product endpoint is unavailable"
fi

if [[ -n "$FRONTEND_URL" ]]; then
  if ! curl --fail --silent --show-error --max-time "$CURL_TIMEOUT" \
      "${FRONTEND_URL%/}/robots.txt" | grep -q 'Disallow: /admin'; then
    fail "frontend robots policy is missing or unreachable"
  fi
  if ! curl --fail --silent --show-error --max-time "$CURL_TIMEOUT" \
      "${FRONTEND_URL%/}/sitemap.xml" | grep -q '<urlset'; then
    fail "frontend sitemap is missing or unreachable"
  fi
fi

rm -f /tmp/cartly-smoke-health.err /tmp/cartly-smoke-products.err
if (( failures > 0 )); then
  printf '%s smoke check(s) failed.\n' "$failures" >&2
  exit 1
fi

printf 'Cartly read-only production smoke checks passed.\n'
