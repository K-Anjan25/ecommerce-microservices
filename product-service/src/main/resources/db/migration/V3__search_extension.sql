-- Cartly product-service: pg_trgm powers similarity() in searchProducts and
-- suggestProducts. Without this extension both queries fail on a fresh
-- database. Postgres 13+ marks pg_trgm trusted, so the database owner can
-- create it; older/clouder setups need a superuser once. Idempotent.

CREATE EXTENSION IF NOT EXISTS pg_trgm;
