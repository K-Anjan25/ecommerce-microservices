-- Subscribe & Save v2 + vaulted payment methods (commmercedb, Flyway).
-- Idempotent: safe to re-run.

-- Subscriptions: variant-level, lifecycle status, discounts, pause/skip, OOS policy.
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

-- Vaulted payment methods (provider-side tokens; card data never stored here).
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
