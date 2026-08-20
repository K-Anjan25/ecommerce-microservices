-- CARTLY — single Postgres instance, one database per bounded context.
-- Mounted into the postgres container at /docker-entrypoint-initdb.d/.
-- Runs only on first boot of an empty data volume.

SELECT 'CREATE DATABASE userdb' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'userdb')\gexec
SELECT 'CREATE DATABASE productdb' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'productdb')\gexec
SELECT 'CREATE DATABASE commercedb' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'commercedb')\gexec
