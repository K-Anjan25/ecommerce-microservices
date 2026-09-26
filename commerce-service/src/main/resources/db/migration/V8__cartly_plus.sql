-- Cartly Plus membership (our Prime-style program): paid plans with free
-- express delivery, boosted Subscribe & Save, member-only prices, 24h flash
-- early access and a priority support lane. Plus priority on support tickets.
-- Idempotent for rolling deployments.

CREATE TABLE IF NOT EXISTS cartly_plus_memberships (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID         NOT NULL UNIQUE,
    status              VARCHAR(16)  NOT NULL DEFAULT 'ACTIVE',
    plan                VARCHAR(16)  NOT NULL,
    price_paid          NUMERIC(10, 2) NOT NULL,
    started_at          TIMESTAMP    NOT NULL,
    current_period_end  TIMESTAMP    NOT NULL,
    auto_renew          BOOLEAN      NOT NULL DEFAULT TRUE,
    updated_at          TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cartly_plus_memberships_user_id ON cartly_plus_memberships (user_id);

ALTER TABLE IF EXISTS support_ticket
    ADD COLUMN IF NOT EXISTS priority VARCHAR(10) NOT NULL DEFAULT 'NORMAL';
