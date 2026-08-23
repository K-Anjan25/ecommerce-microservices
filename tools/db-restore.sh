#!/usr/bin/env bash
# Restore all Cartly databases from a db-backup.sh directory.
set -euo pipefail

usage() {
  echo "Usage: tools/db-restore.sh <backup-directory> --confirm" >&2
  exit 2
}

[[ $# -eq 2 && "$2" == "--confirm" ]] || usage
BACKUP_INPUT="$1"
cd "$(dirname "$0")/.."
BACKUP_DIR="$(cd "$BACKUP_INPUT" 2>/dev/null && pwd)" || { echo "error: backup directory not found" >&2; exit 1; }
DB_USER="${POSTGRES_USERNAME:-postgres}"
DATABASES=(userdb productdb commercedb)
APP_SERVICES=(api-gateway user-service product-service commerce-service)

for database in "${DATABASES[@]}"; do
  test -s "$BACKUP_DIR/$database.dump" || { echo "error: missing $database.dump" >&2; exit 1; }
done

if command -v sha256sum >/dev/null 2>&1; then
  (cd "$BACKUP_DIR" && sha256sum -c SHA256SUMS)
else
  (cd "$BACKUP_DIR" && shasum -a 256 -c SHA256SUMS)
fi

for database in "${DATABASES[@]}"; do
  docker compose exec -T postgres pg_restore --list < "$BACKUP_DIR/$database.dump" >/dev/null
done

echo "Stopping application services for a consistent restore window..."
docker compose stop "${APP_SERVICES[@]}"
restart_services() { docker compose up -d "${APP_SERVICES[@]}" >/dev/null || true; }
trap restart_services EXIT

for database in "${DATABASES[@]}"; do
  echo "Restoring $database..."
  # Remove active sessions left by tooling before replacing objects.
  docker compose exec -T postgres psql --username="$DB_USER" --dbname=postgres \
    --set=database="$database" --command="SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = :'database' AND pid <> pg_backend_pid();" >/dev/null
  docker compose exec -T postgres pg_restore \
    --username="$DB_USER" --dbname="$database" --clean --if-exists \
    --no-owner --no-acl --exit-on-error < "$BACKUP_DIR/$database.dump"
done

echo "Restore complete. Restarting application services..."
