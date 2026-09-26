-- Catalog media model: per-variant imagery + multi-angle galleries + S&S eligibility.
-- productdb, idempotent.

ALTER TABLE product_images ADD COLUMN IF NOT EXISTS variant_id UUID;
ALTER TABLE product_images ADD COLUMN IF NOT EXISTS angle VARCHAR(20);
ALTER TABLE product_images ADD COLUMN IF NOT EXISTS alt_text VARCHAR(500);
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS swatch_hex VARCHAR(9);
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);
ALTER TABLE products ADD COLUMN IF NOT EXISTS subscribe_eligible BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_product_images_variant ON product_images (variant_id);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images (product_id);
