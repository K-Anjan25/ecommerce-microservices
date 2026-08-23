# Cartly PostgreSQL backup and restore runbook

Cartly uses one PostgreSQL container with three bounded-context databases:
`userdb`, `productdb`, and `commercedb`. A valid platform backup must contain all
three from the same maintenance window.

## Create a backup

```bash
tools/db-backup.sh                 # writes backups/cartly-<UTC timestamp>/
tools/db-backup.sh /secure/volume  # production: write outside the repository
```

The script creates PostgreSQL custom-format archives, SHA-256 checksums, and a
manifest. It runs `pg_restore --list` against every archive before reporting
success. Custom format is compressed and supports selective inspection while
remaining portable across PostgreSQL 15 installations.

> `pg_dump` is transactionally consistent within each database, but PostgreSQL
> cannot provide one transaction across three databases. For a strict platform
> snapshot, pause writes or run the backup during a maintenance window.

## Store it safely

- Never commit dumps. `backups/` and `*.dump` are ignored.
- Encrypt backups at rest using the hosting provider's volume/object-storage
  encryption.
- Keep at least 7 daily and 4 weekly copies outside the application host.
- Restrict read access: `userdb` includes customer identity data and
  `commercedb` includes addresses/order history.
- Periodically copy one backup to a second region/provider.

## Verify without restoring

```bash
cd backups/cartly-20260823T120000Z
sha256sum -c SHA256SUMS
for dump in *.dump; do
  docker compose exec -T postgres pg_restore --list < "$dump" >/dev/null
  echo "$dump OK"
done
```

On macOS, use `shasum -a 256 -c SHA256SUMS`.

## Restore

Restoring is destructive and requires explicit confirmation:

```bash
tools/db-restore.sh backups/cartly-20260823T120000Z --confirm
```

The script:

1. Verifies every checksum and archive.
2. Stops gateway and application services to prevent writes.
3. Terminates remaining database sessions.
4. Restores all three databases with `--clean --if-exists --exit-on-error`.
5. Restarts the services through an exit trap, including after a failure.

Afterward:

```bash
docker compose ps
curl -fsS http://localhost:8889/actuator/health
curl -fsS http://localhost:8889/v1/products?size=1
```

Confirm that login, catalog browse, an existing order, and the audit ledger are
present before reopening traffic.

## Quarterly restore drill

Run against staging or a disposable host—not the only production database.

1. Record source counts:
   ```bash
   docker compose exec -T postgres psql -U postgres -d userdb -Atc 'select count(*) from users;'
   docker compose exec -T postgres psql -U postgres -d productdb -Atc 'select count(*) from products;'
   docker compose exec -T postgres psql -U postgres -d commercedb -Atc 'select count(*) from orders;'
   ```
2. Create a fresh backup.
3. Restore it with `--confirm`.
4. Repeat the counts and compare.
5. Run the gateway health and smoke requests.
6. Record duration, archive sizes, counts, operator, and any errors in the
   operations log.

A backup is not considered operationally valid until a restore drill has passed.

## Production migration note

`spring.jpa.hibernate.ddl-auto=update` remains a development convenience. Before
production launch, introduce versioned Flyway migrations; run migrations after a
verified pre-deploy backup and test restore, never as a substitute for one.
