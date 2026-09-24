-- Cartly schema sync — commercedb — 2026-09-24
-- Idempotent: safe to run repeatedly.

-- Localized confirmation emails (UI language at checkout)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS locale VARCHAR(8);

-- Auto-reorder subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
    id           UUID           NOT NULL,
    customer_id  UUID,
    product_id   UUID,
    product_name VARCHAR(255),
    unit_price   NUMERIC(19, 2),
    quantity     INT4,
    interval_days INT4,
    next_run_at  TIMESTAMP,
    active       BOOLEAN        NOT NULL,
    last_order_id UUID,
    created_by   VARCHAR(255),
    updated_by   VARCHAR(255),
    created_date TIMESTAMP,
    updated_date TIMESTAMP,
    CONSTRAINT pk_subscriptions PRIMARY KEY (id)
);

-- Funnel analytics events
CREATE TABLE IF NOT EXISTS analytics_events (
    id          BIGSERIAL,
    event_type  VARCHAR(40) NOT NULL,
    session_id  VARCHAR(64),
    product_id  UUID,
    created_at  TIMESTAMP,
    CONSTRAINT pk_analytics_events PRIMARY KEY (id)
);

-- ── Subscribe & Save v2: variant-level, status lifecycle, discounts, pause/skip ──
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS variant_id UUID;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS variant_name VARCHAR(255);
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE';
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(5, 2) DEFAULT 5;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS paused_until TIMESTAMP;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS skip_next BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS oos_policy VARCHAR(10) DEFAULT 'SKIP';
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP;
UPDATE subscriptions SET status = CASE WHEN active THEN 'ACTIVE' ELSE 'PAUSED' END WHERE status IS NULL;
UPDATE subscriptions SET oos_policy = 'SKIP' WHERE oos_policy IS NULL;
UPDATE subscriptions SET discount_percent = 5 WHERE discount_percent IS NULL;
CREATE INDEX IF NOT EXISTS idx_subscriptions_due ON subscriptions (status, next_run_at);

-- ── Vaulted payment methods (provider-side tokens) ──
CREATE TABLE IF NOT EXISTS saved_payment_methods (
    id           UUID         NOT NULL,
    user_id      UUID         NOT NULL,
    provider     VARCHAR(20)  NOT NULL,
    token        VARCHAR(255) NOT NULL,
    brand        VARCHAR(50),
    last4        VARCHAR(4),
    is_default   BOOLEAN      NOT NULL DEFAULT FALSE,
    created_by   VARCHAR(255),
    updated_by  VARCHAR(255),
    created_date TIMESTAMP,
    updated_date TIMESTAMP,
    CONSTRAINT pk_saved_payment_methods PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS idx_saved_payment_methods_user ON saved_payment_methods (user_id);
