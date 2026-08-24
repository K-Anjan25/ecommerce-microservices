#!/usr/bin/env bash
set -euo pipefail

# Explicitly baseline one already-existing bounded-context database. This is
# destructive only in the sense that it records migration history, so require
# a human confirmation and an external backup before proceeding.
: "${FLYWAY_URL:?Set FLYWAY_URL, e.g. jdbc:postgresql://host:5432/commercedb}"
: "${FLYWAY_USER:?Set FLYWAY_USER}"
: "${FLYWAY_PASSWORD:?Set FLYWAY_PASSWORD}"
: "${FLYWAY_BASELINE_CONFIRMED:?Set FLYWAY_BASELINE_CONFIRMED=true after taking a verified backup}"

if [[ "$FLYWAY_BASELINE_CONFIRMED" != "true" ]]; then
  printf 'ERROR: set FLYWAY_BASELINE_CONFIRMED=true only after taking a verified backup\n' >&2
  exit 1
fi

FLYWAY_BASELINE_VERSION="${FLYWAY_BASELINE_VERSION:-0}"
FLYWAY_BASELINE_DESCRIPTION="${FLYWAY_BASELINE_DESCRIPTION:-Cartly production schema baseline}"

flyway_args=(
  "-url=${FLYWAY_URL}"
  "-user=${FLYWAY_USER}"
  "-password=${FLYWAY_PASSWORD}"
  "-baselineVersion=${FLYWAY_BASELINE_VERSION}"
  "-baselineDescription=${FLYWAY_BASELINE_DESCRIPTION}"
  baseline
)

if command -v flyway >/dev/null 2>&1; then
  flyway "${flyway_args[@]}"
elif command -v docker >/dev/null 2>&1; then
  docker run --rm flyway/flyway:10-alpine "${flyway_args[@]}"
else
  printf 'ERROR: install Flyway CLI or Docker before baselining a database\n' >&2
  exit 1
fi

printf 'Flyway baseline recorded. Keep the schema backup and baseline metadata with the release record.\n'
