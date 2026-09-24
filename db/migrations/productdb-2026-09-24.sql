-- Cartly schema sync — productdb — 2026-09-24
-- Idempotent: safe to run repeatedly.

-- Multi-locale catalog content
ALTER TABLE products   ADD COLUMN IF NOT EXISTS translations VARCHAR(8000);
ALTER TABLE categories ADD COLUMN IF NOT EXISTS translations VARCHAR(8000);
ALTER TABLE categories ADD COLUMN IF NOT EXISTS description  VARCHAR(255);
ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_url    VARCHAR(255);

-- Localized alert emails
ALTER TABLE product_price_watches ADD COLUMN IF NOT EXISTS locale VARCHAR(8);

-- "Notify me when back in stock"
CREATE TABLE IF NOT EXISTS product_stock_watches (
    id           UUID         NOT NULL,
    product_id   UUID         NOT NULL,
    email        VARCHAR(255) NOT NULL,
    active       BOOLEAN      NOT NULL,
    locale       VARCHAR(8),
    created_by   VARCHAR(255),
    updated_by   VARCHAR(255),
    created_date TIMESTAMP,
    updated_date TIMESTAMP,
    CONSTRAINT pk_product_stock_watches PRIMARY KEY (id)
);

-- Customer Q&A
CREATE TABLE IF NOT EXISTS questions (
    id           UUID         NOT NULL,
    text         VARCHAR(255),
    asked_by     VARCHAR(255),
    user_id      UUID,
    answer       VARCHAR(255),
    answered_by  VARCHAR(255),
    answered_at  TIMESTAMP,
    product_id   UUID,
    created_by   VARCHAR(255),
    updated_by   VARCHAR(255),
    created_date TIMESTAMP,
    updated_date TIMESTAMP,
    CONSTRAINT pk_questions PRIMARY KEY (id)
);

-- ── Catalog media model: per-variant imagery, multi-angle galleries, S&S flag ──
ALTER TABLE product_images ADD COLUMN IF NOT EXISTS variant_id UUID;
ALTER TABLE product_images ADD COLUMN IF NOT EXISTS angle VARCHAR(20);
ALTER TABLE product_images ADD COLUMN IF NOT EXISTS alt_text VARCHAR(500);
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS swatch_hex VARCHAR(9);
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);
ALTER TABLE products ADD COLUMN IF NOT EXISTS subscribe_eligible BOOLEAN NOT NULL DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_product_images_variant ON product_images (variant_id);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images (product_id);
