# Production configuration and migration gate

Development keeps Hibernate `ddl-auto: update` so a fresh local checkout can create the demo schema. Every service now reads `JPA_DDL_AUTO` from the environment. Production must set:

```dotenv
JPA_DDL_AUTO=validate
```

This does not create or mutate a production schema. It makes an application fail during startup when the deployed schema does not match the versioned migration plan.

## Deployment gate

Run the repository check before building or starting the production topology:

```bash
set -a
. ./.env
set +a
./tools/check-production-config.sh
```

The gate rejects:

- missing or short JWT/internal-service secrets;
- the development PostgreSQL password;
- wildcard or localhost CORS origins;
- non-HTTPS storefront URLs;
- missing AES-256 email-outbox key;
- provider API credentials without matching webhook secrets;
- mutable Hibernate schema configuration.

The script prints configuration names and validation failures only; it never prints secret values.

## Migration rollout still required

The repository now includes optional Flyway support and a hardening-delta migration for each bounded context. Flyway remains disabled by default because the current databases were historically created by Hibernate. Before setting `JPA_DDL_AUTO=validate`, create and test a versioned Flyway baseline for each database (`userdb`, `productdb`, and `commercedb`) from a production schema snapshot, then enable `FLYWAY_ENABLED=true` and apply the included delta migrations. The rollout should be:

1. Back up the database and record the restore point.
2. Record a baseline for an existing schema only after the backup is verified:

   ```bash
   FLYWAY_URL=jdbc:postgresql://host:5432/commercedb \
   FLYWAY_USER=postgres \
   FLYWAY_PASSWORD="$POSTGRES_PASSWORD" \
   FLYWAY_BASELINE_CONFIRMED=true \
   ./tools/flyway-baseline.sh
   ```

3. Apply the reviewed delta for that bounded context:

   ```bash
   MIGRATION_DIR=commerce-service/src/main/resources/db/migration \
   FLYWAY_URL=jdbc:postgresql://host:5432/commercedb \
   FLYWAY_USER=postgres \
   FLYWAY_PASSWORD="$POSTGRES_PASSWORD" \
   ./tools/flyway-migrate.sh
   ```

4. Repeat for `productdb` and `userdb` with their migration directories.
5. Start one canary service with `JPA_DDL_AUTO=validate`.
6. Run application smoke and payment/webhook checks.
7. Roll out the remaining services.
8. Keep the previous application version and tested rollback migration available.

The included `V1__*` scripts are a hardening delta, not a complete fresh-database schema. Do not enable `validate` against an un-migrated existing database or an empty database, and do not run `update` against production as a substitute for reviewed migrations.
