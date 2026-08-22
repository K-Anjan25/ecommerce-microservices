-- CARTLY — Phase 7 commerce smoke data (applied manually against a running commercedb).
-- Not an init script: the postgres volume already exists, so this is run via
--   docker compose exec -T postgres psql -U postgres -d commercedb -f docker/postgres/seed-commerce-data.sql
-- Idempotent: guarded with NOT EXISTS so it can be re-run safely.
--
-- Prereq: commerce-service has booted at least once (Hibernate ddl-auto creates
-- the shipping_rates / tax_rules tables).
--
-- NOTE: `state` values must match the frontend dropdown (formdata.json) exactly,
-- e.g. "NCT OF DELHI", "ANDHRA PRADESH" (uppercase).

-- ---------------------------------------------------------------------------
-- Pincode-based shipping rates (subset of real Indian pincodes for smoke tests)
-- ---------------------------------------------------------------------------
INSERT INTO shipping_rates (id, pincode, cost, free_above, estimated_days_min, estimated_days_max, carrier, active, created_date, updated_date)
SELECT gen_random_uuid(), '500039', 49.00, 999.00, 2, 4, 'Cartly Express', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM shipping_rates WHERE pincode = '500039');

INSERT INTO shipping_rates (id, pincode, cost, free_above, estimated_days_min, estimated_days_max, carrier, active, created_date, updated_date)
SELECT gen_random_uuid(), '500001', 39.00, 999.00, 2, 4, 'Cartly Express', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM shipping_rates WHERE pincode = '500001');

INSERT INTO shipping_rates (id, pincode, cost, free_above, estimated_days_min, estimated_days_max, carrier, active, created_date, updated_date)
SELECT gen_random_uuid(), '560001', 59.00, 999.00, 3, 5, 'Cartly Express', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM shipping_rates WHERE pincode = '560001');

INSERT INTO shipping_rates (id, pincode, cost, free_above, estimated_days_min, estimated_days_max, carrier, active, created_date, updated_date)
SELECT gen_random_uuid(), '400001', 69.00, 1499.00, 4, 6, 'Cartly Express', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM shipping_rates WHERE pincode = '400001');

INSERT INTO shipping_rates (id, pincode, cost, free_above, estimated_days_min, estimated_days_max, carrier, active, created_date, updated_date)
SELECT gen_random_uuid(), '110001', 79.00, 1499.00, 5, 7, 'Cartly Express', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM shipping_rates WHERE pincode = '110001');

-- An inactive row to prove active=false rows are ignored by lookups.
INSERT INTO shipping_rates (id, pincode, cost, free_above, estimated_days_min, estimated_days_max, carrier, active, created_date, updated_date)
SELECT gen_random_uuid(), '600001', 59.00, 999.00, 3, 5, 'Old Courier', false, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM shipping_rates WHERE pincode = '600001');

-- ---------------------------------------------------------------------------
-- Per-state tax rules (rate is a fraction: 0.18 = 18%).
-- State names must match the frontend dropdown exactly (uppercase).
-- ---------------------------------------------------------------------------
INSERT INTO tax_rules (id, state, rate, tax_name, code, active, created_date, updated_date)
SELECT gen_random_uuid(), 'ANDHRA PRADESH', 0.18, 'GST', 'GST', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM tax_rules WHERE state = 'ANDHRA PRADESH');

INSERT INTO tax_rules (id, state, rate, tax_name, code, active, created_date, updated_date)
SELECT gen_random_uuid(), 'TELANGANA', 0.18, 'GST', 'GST', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM tax_rules WHERE state = 'TELANGANA');

INSERT INTO tax_rules (id, state, rate, tax_name, code, active, created_date, updated_date)
SELECT gen_random_uuid(), 'MAHARASHTRA', 0.18, 'GST', 'GST', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM tax_rules WHERE state = 'MAHARASHTRA');

INSERT INTO tax_rules (id, state, rate, tax_name, code, active, created_date, updated_date)
SELECT gen_random_uuid(), 'KARNATAKA', 0.18, 'GST', 'GST', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM tax_rules WHERE state = 'KARNATAKA');

INSERT INTO tax_rules (id, state, rate, tax_name, code, active, created_date, updated_date)
SELECT gen_random_uuid(), 'NCT OF DELHI', 0.18, 'GST', 'GST', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM tax_rules WHERE state = 'NCT OF DELHI');

-- Kerala carries a 1% cess on top of GST — seeded differently to prove the
-- per-state lookup is actually used (18% everywhere else).
INSERT INTO tax_rules (id, state, rate, tax_name, code, active, created_date, updated_date)
SELECT gen_random_uuid(), 'KERALA', 0.19, 'GST+Cess', 'GST+CESS', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM tax_rules WHERE state = 'KERALA');

INSERT INTO tax_rules (id, state, rate, tax_name, code, active, created_date, updated_date)
SELECT gen_random_uuid(), 'TAMIL NADU', 0.18, 'GST', 'GST', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM tax_rules WHERE state = 'TAMIL NADU');
