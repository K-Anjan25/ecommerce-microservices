-- Catalog depth round: rich grouped product specifications (JSON array of
-- {group, items:[{label, value}]} rendered as tables on the PDP), Cartly Plus
-- member-only deal percent (priced server-side by commerce-service), and
-- customer review photos ("photos from people who received the product").
-- Idempotent for rolling deployments.

ALTER TABLE IF EXISTS products
    ADD COLUMN IF NOT EXISTS specifications TEXT;

ALTER TABLE IF EXISTS products
    ADD COLUMN IF NOT EXISTS member_deal_percent NUMERIC(5, 2);

CREATE TABLE IF NOT EXISTS comment_images (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id   UUID         NOT NULL REFERENCES comments (id) ON DELETE CASCADE,
    image_url    TEXT         NOT NULL,
    alt_text     VARCHAR(255),
    sort_order   INT          NOT NULL DEFAULT 0,
    created_date TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comment_images_comment_id ON comment_images (comment_id);
