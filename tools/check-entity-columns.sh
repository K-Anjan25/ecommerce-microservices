#!/usr/bin/env bash
# Guard against a boot-crashing Hibernate bug class: @Index(columnList=...) and
# @UniqueConstraint(columnNames=...) must reference COLUMN names. Explicit
# @Column names in this codebase are snake_case, so a camelCase reference is
# always the Java property name — Hibernate cannot resolve it and the service
# dies at startup ("database column 'X' not found"). Compile + tests do NOT
# catch this (the JPA metadata is only validated when the context boots).
#
# Run in CI before the Maven build.
set -euo pipefail

hits=$(grep -rnE 'column(List|Names)\s*=\s*"[^"]*[A-Z][^"]*"' \
  --include='*.java' \
  commerce-service/src/main product-service/src/main user-service/src/main api-gateway/src/main common/src/main 2>/dev/null || true)

if [ -n "$hits" ]; then
  echo "❌ camelCase column references found — these crash Hibernate at boot:"
  echo "$hits"
  echo ""
  echo "Use the @Column(name=...) value (snake_case), e.g. ticket_ref / created_at."
  exit 1
fi

echo "✅ entity column references look correct (all snake_case)"
