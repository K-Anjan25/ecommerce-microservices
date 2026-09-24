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
