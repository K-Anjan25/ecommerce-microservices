-- Carrier shipment tracking on orders.
-- Idempotent for rolling deployments.

ALTER TABLE IF EXISTS orders
    ADD COLUMN IF NOT EXISTS awb varchar(40);

ALTER TABLE IF EXISTS orders
    ADD COLUMN IF NOT EXISTS carrier_name varchar(60);
