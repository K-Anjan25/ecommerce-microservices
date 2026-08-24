-- Cartly product-service hardening delta.
-- Apply after the existing product schema has been baselined.

ALTER TABLE IF EXISTS store_settings
    ADD COLUMN IF NOT EXISTS announcement_text_hi varchar(255),
    ADD COLUMN IF NOT EXISTS announcement_link_text_hi varchar(255),
    ADD COLUMN IF NOT EXISTS hero_eyebrow_hi varchar(255),
    ADD COLUMN IF NOT EXISTS hero_title_hi varchar(255),
    ADD COLUMN IF NOT EXISTS hero_emphasis_hi varchar(255),
    ADD COLUMN IF NOT EXISTS hero_description_hi text,
    ADD COLUMN IF NOT EXISTS primary_cta_label_hi varchar(255),
    ADD COLUMN IF NOT EXISTS secondary_cta_label_hi varchar(255);
