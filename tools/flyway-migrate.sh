#!/usr/bin/env bash
set -euo pipefail

# Apply reviewed Flyway migrations to one bounded-context database. The script
# never echoes the database password or a full URL that may contain credentials.
: "${FLYWAY_URL:?Set FLYWAY_URL, e.g. jdbc:postgresql://host:5432/commercedb}"
: "${FLYWAY_USER:?Set FLYWAY_USER}"
: "${FLYWAY_PASSWORD:?Set FLYWAY_PASSWORD}"

MIGRATION_DIR="${MIGRATION_DIR:-}"
if [[ -z "$MIGRATION_DIR" || ! -d "$MIGRATION_DIR" ]]; then
  printf 'ERROR: MIGRATION_DIR must point to a reviewed db/migration directory\n' >&2
  exit 1
fi

FLYWAY_BASELINE_ON_MIGRATE="${FLYWAY_BASELINE_ON_MIGRATE:-false}"
FLYWAY_BASELINE_VERSION="${FLYWAY_BASELINE_VERSION:-0}"

flyway_args=(
  "-url=${FLYWAY_URL}"
  "-user=${FLYWAY_USER}"
  "-password=${FLYWAY_PASSWORD}"
  "-baselineOnMigrate=${FLYWAY_BASELINE_ON_MIGRATE}"
  "-baselineVersion=${FLYWAY_BASELINE_VERSION}"
  migrate
)

if command -v flyway >/dev/null 2>&1; then
  flyway "-locations=filesystem:$(cd "$MIGRATION_DIR" && pwd)" "${flyway_args[@]}"
elif command -v docker >/dev/null 2>&1; then
  docker run --rm \
    -v "$(cd "$MIGRATION_DIR" && pwd):/flyway/sql:ro" \
    flyway/flyway:10-alpine "-locations=filesystem:/flyway/sql" "${flyway_args[@]}"
else
  printf 'ERROR: install Flyway CLI or Docker before running migrations\n' >&2
  exit 1
fi

printf 'Flyway migration completed for the selected bounded context.\n'
