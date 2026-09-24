-- CARTLY — real shipping/tax/coupon seed (commercedb).
-- Applied manually against the running commercedb (volume already exists):
--   Get-Content docker/postgres/seed-shipping-data.sql -Raw | docker compose exec -T postgres psql -U postgres -d commercedb
-- Idempotent: every INSERT is guarded with NOT EXISTS, safe to re-run.
-- State names match frontend/src/formdata.json state_name values exactly (uppercase).
-- Pincodes are real Indian postal codes for the named cities.

-- ---------------------------------------------------------------------------
-- Pincode-based domestic shipping rates (Cartly Express, costs in INR)
-- ---------------------------------------------------------------------------
INSERT INTO shipping_rates (id, pincode, cost, free_above, estimated_days_min, estimated_days_max, carrier, active, created_date, updated_date)
SELECT gen_random_uuid(), '110045', 79.00, 1499.00, 4, 6, 'Cartly Express', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM shipping_rates WHERE pincode = '110045');

INSERT INTO shipping_rates (id, pincode, cost, free_above, estimated_days_min, estimated_days_max, carrier, active, created_date, updated_date)
SELECT gen_random_uuid(), '400050', 69.00, 1499.00, 3, 5, 'Cartly Express', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM shipping_rates WHERE pincode = '400050');

INSERT INTO shipping_rates (id, pincode, cost, free_above, estimated_days_min, estimated_days_max, carrier, active, created_date, updated_date)
SELECT gen_random_uuid(), '600020', 59.00, 999.00, 3, 5, 'Cartly Express', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM shipping_rates WHERE pincode = '600020');

INSERT INTO shipping_rates (id, pincode, cost, free_above, estimated_days_min, estimated_days_max, carrier, active, created_date, updated_date)
SELECT gen_random_uuid(), '700020', 79.00, 1499.00, 4, 6, 'Cartly Express', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM shipping_rates WHERE pincode = '700020');

INSERT INTO shipping_rates (id, pincode, cost, free_above, estimated_days_min, estimated_days_max, carrier, active, created_date, updated_date)
SELECT gen_random_uuid(), '411001', 49.00, 999.00, 2, 4, 'Cartly Express', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM shipping_rates WHERE pincode = '411001');

INSERT INTO shipping_rates (id, pincode, cost, free_above, estimated_days_min, estimated_days_max, carrier, active, created_date, updated_date)
SELECT gen_random_uuid(), '380001', 59.00, 999.00, 3, 5, 'Cartly Express', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM shipping_rates WHERE pincode = '380001');

INSERT INTO shipping_rates (id, pincode, cost, free_above, estimated_days_min, estimated_days_max, carrier, active, created_date, updated_date)
SELECT gen_random_uuid(), '302001', 59.00, 999.00, 3, 5, 'Cartly Express', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM shipping_rates WHERE pincode = '302001');

INSERT INTO shipping_rates (id, pincode, cost, free_above, estimated_days_min, estimated_days_max, carrier, active, created_date, updated_date)
SELECT gen_random_uuid(), '226001', 69.00, 1499.00, 3, 5, 'Cartly Express', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM shipping_rates WHERE pincode = '226001');

INSERT INTO shipping_rates (id, pincode, cost, free_above, estimated_days_min, estimated_days_max, carrier, active, created_date, updated_date)
SELECT gen_random_uuid(), '160001', 69.00, 1499.00, 3, 5, 'Cartly Express', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM shipping_rates WHERE pincode = '160001');

INSERT INTO shipping_rates (id, pincode, cost, free_above, estimated_days_min, estimated_days_max, carrier, active, created_date, updated_date)
SELECT gen_random_uuid(), '682001', 59.00, 999.00, 3, 5, 'Cartly Express', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM shipping_rates WHERE pincode = '682001');

INSERT INTO shipping_rates (id, pincode, cost, free_above, estimated_days_min, estimated_days_max, carrier, active, created_date, updated_date)
SELECT gen_random_uuid(), '641001', 59.00, 999.00, 3, 5, 'Cartly Express', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM shipping_rates WHERE pincode = '641001');

INSERT INTO shipping_rates (id, pincode, cost, free_above, estimated_days_min, estimated_days_max, carrier, active, created_date, updated_date)
SELECT gen_random_uuid(), '452001', 59.00, 999.00, 3, 5, 'Cartly Express', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM shipping_rates WHERE pincode = '452001');

INSERT INTO shipping_rates (id, pincode, cost, free_above, estimated_days_min, estimated_days_max, carrier, active, created_date, updated_date)
SELECT gen_random_uuid(), '440001', 59.00, 999.00, 2, 4, 'Cartly Express', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM shipping_rates WHERE pincode = '440001');

INSERT INTO shipping_rates (id, pincode, cost, free_above, estimated_days_min, estimated_days_max, carrier, active, created_date, updated_date)
SELECT gen_random_uuid(), '395001', 59.00, 999.00, 3, 5, 'Cartly Express', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM shipping_rates WHERE pincode = '395001');

INSERT INTO shipping_rates (id, pincode, cost, free_above, estimated_days_min, estimated_days_max, carrier, active, created_date, updated_date)
SELECT gen_random_uuid(), '462001', 59.00, 999.00, 3, 5, 'Cartly Express', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM shipping_rates WHERE pincode = '462001');

INSERT INTO shipping_rates (id, pincode, cost, free_above, estimated_days_min, estimated_days_max, carrier, active, created_date, updated_date)
SELECT gen_random_uuid(), '781001', 99.00, 1999.00, 5, 8, 'Cartly Express', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM shipping_rates WHERE pincode = '781001');

INSERT INTO shipping_rates (id, pincode, cost, free_above, estimated_days_min, estimated_days_max, carrier, active, created_date, updated_date)
SELECT gen_random_uuid(), '800001', 79.00, 1499.00, 4, 6, 'Cartly Express', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM shipping_rates WHERE pincode = '800001');

INSERT INTO shipping_rates (id, pincode, cost, free_above, estimated_days_min, estimated_days_max, carrier, active, created_date, updated_date)
SELECT gen_random_uuid(), '751001', 69.00, 1499.00, 3, 6, 'Cartly Express', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM shipping_rates WHERE pincode = '751001');

INSERT INTO shipping_rates (id, pincode, cost, free_above, estimated_days_min, estimated_days_max, carrier, active, created_date, updated_date)
SELECT gen_random_uuid(), '248001', 69.00, 1499.00, 3, 5, 'Cartly Express', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM shipping_rates WHERE pincode = '248001');

INSERT INTO shipping_rates (id, pincode, cost, free_above, estimated_days_min, estimated_days_max, carrier, active, created_date, updated_date)
SELECT gen_random_uuid(), '570001', 49.00, 999.00, 2, 4, 'Cartly Express', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM shipping_rates WHERE pincode = '570001');

-- ---------------------------------------------------------------------------
-- Per-state GST rules (rate is a fraction: 0.18 = 18%). Covers all 36
-- states/UTs from the checkout dropdown. Kerala carries its 1% flood cess.
-- ---------------------------------------------------------------------------
INSERT INTO tax_rules (id, state, rate, tax_name, code, active, created_date, updated_date)
SELECT gen_random_uuid(), 'JAMMU & KASHMIR', 0.18, 'GST', 'GST', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM tax_rules WHERE state = 'JAMMU & KASHMIR');

INSERT INTO tax_rules (id, state, rate, tax_name, code, active, created_date, updated_date)
SELECT gen_random_uuid(), 'HIMACHAL PRADESH', 0.18, 'GST', 'GST', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM tax_rules WHERE state = 'HIMACHAL PRADESH');

INSERT INTO tax_rules (id, state, rate, tax_name, code, active, created_date, updated_date)
SELECT gen_random_uuid(), 'PUNJAB', 0.18, 'GST', 'GST', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM tax_rules WHERE state = 'PUNJAB');

INSERT INTO tax_rules (id, state, rate, tax_name, code, active, created_date, updated_date)
SELECT gen_random_uuid(), 'CHANDIGARH', 0.18, 'GST', 'GST', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM tax_rules WHERE state = 'CHANDIGARH');

INSERT INTO tax_rules (id, state, rate, tax_name, code, active, created_date, updated_date)
SELECT gen_random_uuid(), 'UTTARAKHAND', 0.18, 'GST', 'GST', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM tax_rules WHERE state = 'UTTARAKHAND');

INSERT INTO tax_rules (id, state, rate, tax_name, code, active, created_date, updated_date)
SELECT gen_random_uuid(), 'HARYANA', 0.18, 'GST', 'GST', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM tax_rules WHERE state = 'HARYANA');

INSERT INTO tax_rules (id, state, rate, tax_name, code, active, created_date, updated_date)
SELECT gen_random_uuid(), 'RAJASTHAN', 0.18, 'GST', 'GST', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM tax_rules WHERE state = 'RAJASTHAN');

INSERT INTO tax_rules (id, state, rate, tax_name, code, active, created_date, updated_date)
SELECT gen_random_uuid(), 'UTTAR PRADESH', 0.18, 'GST', 'GST', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM tax_rules WHERE state = 'UTTAR PRADESH');

INSERT INTO tax_rules (id, state, rate, tax_name, code, active, created_date, updated_date)
SELECT gen_random_uuid(), 'BIHAR', 0.18, 'GST', 'GST', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM tax_rules WHERE state = 'BIHAR');

INSERT INTO tax_rules (id, state, rate, tax_name, code, active, created_date, updated_date)
SELECT gen_random_uuid(), 'SIKKIM', 0.18, 'GST', 'GST', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM tax_rules WHERE state = 'SIKKIM');

INSERT INTO tax_rules (id, state, rate, tax_name, code, active, created_date, updated_date)
SELECT gen_random_uuid(), 'ARUNACHAL PRADESH', 0.18, 'GST', 'GST', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM tax_rules WHERE state = 'ARUNACHAL PRADESH');

INSERT INTO tax_rules (id, state, rate, tax_name, code, active, created_date, updated_date)
SELECT gen_random_uuid(), 'NAGALAND', 0.18, 'GST', 'GST', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM tax_rules WHERE state = 'NAGALAND');

INSERT INTO tax_rules (id, state, rate, tax_name, code, active, created_date, updated_date)
SELECT gen_random_uuid(), 'MANIPUR', 0.18, 'GST', 'GST', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM tax_rules WHERE state = 'MANIPUR');

INSERT INTO tax_rules (id, state, rate, tax_name, code, active, created_date, updated_date)
SELECT gen_random_uuid(), 'MIZORAM', 0.18, 'GST', 'GST', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM tax_rules WHERE state = 'MIZORAM');

INSERT INTO tax_rules (id, state, rate, tax_name, code, active, created_date, updated_date)
SELECT gen_random_uuid(), 'TRIPURA', 0.18, 'GST', 'GST', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM tax_rules WHERE state = 'TRIPURA');

INSERT INTO tax_rules (id, state, rate, tax_name, code, active, created_date, updated_date)
SELECT gen_random_uuid(), 'MEGHALAYA', 0.18, 'GST', 'GST', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM tax_rules WHERE state = 'MEGHALAYA');

INSERT INTO tax_rules (id, state, rate, tax_name, code, active, created_date, updated_date)
SELECT gen_random_uuid(), 'ASSAM', 0.18, 'GST', 'GST', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM tax_rules WHERE state = 'ASSAM');

INSERT INTO tax_rules (id, state, rate, tax_name, code, active, created_date, updated_date)
SELECT gen_random_uuid(), 'WEST BENGAL', 0.18, 'GST', 'GST', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM tax_rules WHERE state = 'WEST BENGAL');

INSERT INTO tax_rules (id, state, rate, tax_name, code, active, created_date, updated_date)
SELECT gen_random_uuid(), 'JHARKHAND', 0.18, 'GST', 'GST', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM tax_rules WHERE state = 'JHARKHAND');

INSERT INTO tax_rules (id, state, rate, tax_name, code, active, created_date, updated_date)
SELECT gen_random_uuid(), 'ODISHA', 0.18, 'GST', 'GST', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM tax_rules WHERE state = 'ODISHA');

INSERT INTO tax_rules (id, state, rate, tax_name, code, active, created_date, updated_date)
SELECT gen_random_uuid(), 'CHHATTISGARH', 0.18, 'GST', 'GST', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM tax_rules WHERE state = 'CHHATTISGARH');

INSERT INTO tax_rules (id, state, rate, tax_name, code, active, created_date, updated_date)
SELECT gen_random_uuid(), 'MADHYA PRADESH', 0.18, 'GST', 'GST', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM tax_rules WHERE state = 'MADHYA PRADESH');

INSERT INTO tax_rules (id, state, rate, tax_name, code, active, created_date, updated_date)
SELECT gen_random_uuid(), 'GUJARAT', 0.18, 'GST', 'GST', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM tax_rules WHERE state = 'GUJARAT');

INSERT INTO tax_rules (id, state, rate, tax_name, code, active, created_date, updated_date)
SELECT gen_random_uuid(), 'DAMAN & DIU', 0.18, 'GST', 'GST', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM tax_rules WHERE state = 'DAMAN & DIU');

INSERT INTO tax_rules (id, state, rate, tax_name, code, active, created_date, updated_date)
SELECT gen_random_uuid(), 'DADRA & NAGAR HAVELI', 0.18, 'GST', 'GST', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM tax_rules WHERE state = 'DADRA & NAGAR HAVELI');

INSERT INTO tax_rules (id, state, rate, tax_name, code, active, created_date, updated_date)
SELECT gen_random_uuid(), 'GOA', 0.18, 'GST', 'GST', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM tax_rules WHERE state = 'GOA');

INSERT INTO tax_rules (id, state, rate, tax_name, code, active, created_date, updated_date)
SELECT gen_random_uuid(), 'LAKSHADWEEP', 0.18, 'GST', 'GST', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM tax_rules WHERE state = 'LAKSHADWEEP');

INSERT INTO tax_rules (id, state, rate, tax_name, code, active, created_date, updated_date)
SELECT gen_random_uuid(), 'PUDUCHERRY', 0.18, 'GST', 'GST', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM tax_rules WHERE state = 'PUDUCHERRY');

INSERT INTO tax_rules (id, state, rate, tax_name, code, active, created_date, updated_date)
SELECT gen_random_uuid(), 'ANDAMAN & NICOBAR ISLANDS', 0.18, 'GST', 'GST', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM tax_rules WHERE state = 'ANDAMAN & NICOBAR ISLANDS');

-- States also covered by the earlier smoke seed; included here so this file
-- alone yields full 36-state coverage on a fresh database.
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

INSERT INTO tax_rules (id, state, rate, tax_name, code, active, created_date, updated_date)
SELECT gen_random_uuid(), 'KERALA', 0.19, 'GST+Cess', 'GST+CESS', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM tax_rules WHERE state = 'KERALA');

INSERT INTO tax_rules (id, state, rate, tax_name, code, active, created_date, updated_date)
SELECT gen_random_uuid(), 'TAMIL NADU', 0.18, 'GST', 'GST', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM tax_rules WHERE state = 'TAMIL NADU');

-- ---------------------------------------------------------------------------
-- International shipping zones (Cartly Global, costs in INR, ISO alpha-2 codes)
-- ---------------------------------------------------------------------------
INSERT INTO shipping_zones (id, name, countries, cost, free_above, estimated_days_min, estimated_days_max, carrier, duty_rate, duty_name, active, created_date, updated_date)
SELECT gen_random_uuid(), 'Gulf', 'AE,SA,QA,KW,OM,BH', 1499.00, 9999.00, 5, 8, 'Cartly Global', 0.05, 'Import duty & VAT', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM shipping_zones WHERE name = 'Gulf');

INSERT INTO shipping_zones (id, name, countries, cost, free_above, estimated_days_min, estimated_days_max, carrier, duty_rate, duty_name, active, created_date, updated_date)
SELECT gen_random_uuid(), 'North America', 'US,CA', 1999.00, 14999.00, 7, 10, 'Cartly Global', 0.08, 'Import duty', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM shipping_zones WHERE name = 'North America');

INSERT INTO shipping_zones (id, name, countries, cost, free_above, estimated_days_min, estimated_days_max, carrier, duty_rate, duty_name, active, created_date, updated_date)
SELECT gen_random_uuid(), 'Europe', 'GB,DE,FR,IT,ES,NL,IE', 1899.00, 14999.00, 6, 9, 'Cartly Global', 0.12, 'Import duty & VAT', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM shipping_zones WHERE name = 'Europe');

INSERT INTO shipping_zones (id, name, countries, cost, free_above, estimated_days_min, estimated_days_max, carrier, duty_rate, duty_name, active, created_date, updated_date)
SELECT gen_random_uuid(), 'Southeast Asia', 'SG,MY,TH,VN,ID,PH', 1299.00, 8999.00, 4, 7, 'Cartly Global', 0.07, 'Import duty & GST', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM shipping_zones WHERE name = 'Southeast Asia');

INSERT INTO shipping_zones (id, name, countries, cost, free_above, estimated_days_min, estimated_days_max, carrier, duty_rate, duty_name, active, created_date, updated_date)
SELECT gen_random_uuid(), 'Oceania', 'AU,NZ', 1799.00, 12999.00, 7, 11, 'Cartly Global', 0.10, 'Import duty & GST', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM shipping_zones WHERE name = 'Oceania');

-- ---------------------------------------------------------------------------
-- Launch coupons (valid 90 days from seeding)
-- ---------------------------------------------------------------------------
INSERT INTO coupons (id, code, type, value, min_order_amount, max_discount, valid_from, valid_until, usage_limit, used_count, active)
SELECT gen_random_uuid(), 'WELCOME10', 'PERCENT', 10.00, 999.00, 500.00, now(), now() + interval '90 days', 10000, 0, true
WHERE NOT EXISTS (SELECT 1 FROM coupons WHERE code = 'WELCOME10');

INSERT INTO coupons (id, code, type, value, min_order_amount, max_discount, valid_from, valid_until, usage_limit, used_count, active)
SELECT gen_random_uuid(), 'FLAT200', 'FIXED', 200.00, 1499.00, 200.00, now(), now() + interval '90 days', 5000, 0, true
WHERE NOT EXISTS (SELECT 1 FROM coupons WHERE code = 'FLAT200');

INSERT INTO coupons (id, code, type, value, min_order_amount, max_discount, valid_from, valid_until, usage_limit, used_count, active)
SELECT gen_random_uuid(), 'MEGA25', 'PERCENT', 25.00, 4999.00, 1500.00, now(), now() + interval '90 days', 1000, 0, true
WHERE NOT EXISTS (SELECT 1 FROM coupons WHERE code = 'MEGA25');
