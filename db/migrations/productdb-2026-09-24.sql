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
