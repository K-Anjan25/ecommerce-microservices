-- Cartly product-service: merchant identity + invoice branding fields for the
-- singleton store_settings row. Safe to re-apply.

ALTER TABLE IF EXISTS store_settings
    ADD COLUMN IF NOT EXISTS store_name varchar(60),
    ADD COLUMN IF NOT EXISTS store_tagline varchar(160),
    ADD COLUMN IF NOT EXISTS support_email varchar(120),
    ADD COLUMN IF NOT EXISTS invoice_footer_note varchar(240);

UPDATE store_settings SET store_name = 'Cartly' WHERE store_name IS NULL;
