#!/usr/bin/env bash
#
# Generate the per-service Flyway baseline DDL (V2__baseline_schema.sql) from
# Hibernate metadata — no database is created or modified by the export itself.
#
# How it works: each service ships a `schema-export` Spring profile that asks
# Hibernate's JPA schema-generation to write its object model to
# target/schema.sql (create-source: metadata). The script boots each service
# jar with that profile, waits for the file, then stops the process.
#
# The generated DDL is a STARTING POINT, not a reviewed migration. Before
# promoting it, read it end-to-end and adjust:
#   - FK/index naming and creation order across bounded contexts;
#   - column types Hibernate guesses (e.g. TEXT vs VARCHAR lengths);
#   - anything the seed data in docker/postgres expects.
#
# Usage:
#   docker compose up -d postgres rabbitmq   # listeners need them to idle quietly
#   ./tools/generate-schema-baseline.sh
#   # review target/schema-baseline/<service>.sql, then move the reviewed file to
#   #   <service>/src/main/resources/db/migration/V2__baseline_schema.sql
#
set -euo pipefail

SERVICES=(user-service product-service commerce-service)
OUT_DIR="target/schema-baseline"
TIMEOUT_SECONDS=120

command -v java >/dev/null || { echo "ERROR: java not found (need JDK 17)"; exit 1; }
command -v mvn >/dev/null || { echo "ERROR: mvn not found (or use ./common/mvnw — edit this script)"; exit 1; }
docker compose ps postgres 2>/dev/null | grep -q running || {
  echo "NOTE: postgres is not running — start it with: docker compose up -d postgres rabbitmq"
  echo "      (the export does not use the database, but idle listeners connect more quietly)"
}

echo "==> Building services (skip tests)"
mvn -q -DskipTests package

mkdir -p "$OUT_DIR"

for svc in "${SERVICES[@]}"; do
  jar_file="$(ls "$svc"/target/*.jar 2>/dev/null | grep -v original | head -1 || true)"
  [[ -n "$jar_file" ]] || { echo "ERROR: no jar for $svc"; exit 1; }

  out_file="$OUT_DIR/$svc.sql"
  rm -f "$svc/target/schema.sql" "$out_file"

  echo "==> Exporting schema: $svc"
  SPRING_PROFILES_ACTIVE=schema-export SERVER_PORT=0 \
    java -jar "$jar_file" >"$OUT_DIR/$svc.boot.log" 2>&1 &
  pid=$!

  waited=0
  while ! [[ -s "$svc/target/schema.sql" ]]; do
    if ! kill -0 "$pid" 2>/dev/null; then
      echo "ERROR: $svc exited before exporting the schema — see $OUT_DIR/$svc.boot.log"
      exit 1
    fi
    if (( waited >= TIMEOUT_SECONDS )); then
      echo "ERROR: timed out waiting for $svc/target/schema.sql — see $OUT_DIR/$svc.boot.log"
      kill "$pid" 2>/dev/null || true
      exit 1
    fi
    sleep 2
    waited=$((waited + 2))
  done

  kill "$pid" 2>/dev/null || true
  wait "$pid" 2>/dev/null || true

  # A stable header keeps the reviewed file honest about its origin.
  {
    echo "-- Baseline schema for $svc, generated from Hibernate metadata"
    echo "-- by tools/generate-schema-baseline.sh on $(date -u +%Y-%m-%d)."
    echo "-- Reviewed and adjusted for production use before committing."
    cat "$svc/target/schema.sql"
  } >"$out_file"

  echo "    wrote $out_file ($(wc -l <"$out_file") lines)"
done

cat <<'EOF'

Next steps (human review is part of the process):
  1. Read each target/schema-baseline/<service>.sql end-to-end.
  2. Copy the reviewed file to <service>/src/main/resources/db/migration/V2__baseline_schema.sql
     (or the next free V<n> in that service).
  3. On an existing database: run tools/flyway-baseline.sh FIRST (records V1 history),
     then tools/flyway-migrate.sh to apply the new baseline and any deltas.
  4. Verify with JPA_DDL_AUTO=validate FLYWAY_ENABLED=true — the app must boot clean.
EOF
