#!/usr/bin/env bash
# Create compressed, checksummed dumps of all Cartly bounded-context databases.
set -euo pipefail

cd "$(dirname "$0")/.."
DEST_ROOT="${1:-backups}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
DEST="$DEST_ROOT/cartly-$STAMP"
DB_USER="${POSTGRES_USERNAME:-postgres}"
DATABASES=(userdb productdb commercedb)

command -v docker >/dev/null 2>&1 || { echo "error: docker is required" >&2; exit 1; }
docker compose ps --status running postgres | grep -q postgres || {
  echo "error: the postgres compose service is not running" >&2; exit 1;
}
mkdir -p "$DEST"

checksum() {
  if command -v sha256sum >/dev/null 2>&1; then sha256sum "$1";
  else shasum -a 256 "$1"; fi
}

for database in "${DATABASES[@]}"; do
  echo "Backing up $database..."
  docker compose exec -T postgres \
    pg_dump --username="$DB_USER" --dbname="$database" \
      --format=custom --compress=6 --no-owner --no-acl > "$DEST/$database.dump"
  test -s "$DEST/$database.dump" || { echo "error: empty dump for $database" >&2; exit 1; }
  checksum "$DEST/$database.dump" >> "$DEST/SHA256SUMS"
done

cat > "$DEST/manifest.txt" <<EOF
created_utc=$STAMP
postgres_image=postgres:15-alpine
databases=${DATABASES[*]}
format=pg_dump-custom
EOF

# Prove every archive is readable before calling the backup complete.
for database in "${DATABASES[@]}"; do
  docker compose exec -T postgres pg_restore --list < "$DEST/$database.dump" >/dev/null
done

echo "Backup complete: $DEST"
echo "Verify: (cd '$DEST' && sha256sum -c SHA256SUMS)"
