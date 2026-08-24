-- Cartly commerce hardening delta.
-- This migration is applied after the existing commerce schema has been
-- baselined. It is deliberately idempotent for a rolling deployment.

ALTER TABLE IF EXISTS payment
    ADD COLUMN IF NOT EXISTS provider_payment_id varchar(255);

ALTER TABLE IF EXISTS orders
    ADD COLUMN IF NOT EXISTS order_type varchar(32);

CREATE TABLE IF NOT EXISTS payment_outbox_events (
    id uuid NOT NULL,
    order_id uuid NOT NULL,
    payment_status varchar(30) NOT NULL,
    provider varchar(20) NOT NULL,
    transaction_id varchar(255),
    amount numeric(19,2) NOT NULL,
    currency varchar(10) NOT NULL,
    attempts integer NOT NULL,
    next_attempt_at timestamp NOT NULL,
    created_at timestamp NOT NULL,
    CONSTRAINT pk_payment_outbox_events PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_payment_outbox_due
    ON payment_outbox_events (next_attempt_at, created_at);

CREATE TABLE IF NOT EXISTS payment_reconciliation_cases (
    id uuid NOT NULL,
    payment_id bigint NOT NULL,
    order_id uuid NOT NULL,
    provider varchar(20) NOT NULL,
    transaction_id varchar(255),
    amount numeric(19,2) NOT NULL,
    currency varchar(10) NOT NULL,
    status varchar(20) NOT NULL,
    reason varchar(500) NOT NULL,
    created_at timestamp NOT NULL,
    updated_at timestamp NOT NULL,
    resolved_at timestamp,
    CONSTRAINT pk_payment_reconciliation_cases PRIMARY KEY (id),
    CONSTRAINT uk_payment_reconciliation_payment UNIQUE (payment_id)
);

CREATE INDEX IF NOT EXISTS idx_payment_reconciliation_status_created
    ON payment_reconciliation_cases (status, created_at);

CREATE TABLE IF NOT EXISTS gift_card_purchase_intents (
    id uuid NOT NULL,
    order_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    amount numeric(19,2) NOT NULL,
    expiry_date date NOT NULL,
    recipient_email varchar(320),
    status varchar(24) NOT NULL,
    gift_card_id uuid,
    refunded_amount numeric(19,2),
    refund_transaction_id varchar(255),
    created_at timestamp,
    updated_at timestamp,
    issued_at timestamp,
    refunded_at timestamp,
    CONSTRAINT pk_gift_card_purchase_intents PRIMARY KEY (id),
    CONSTRAINT uk_gift_card_purchase_order UNIQUE (order_id)
);

CREATE INDEX IF NOT EXISTS idx_gift_card_purchase_customer_created
    ON gift_card_purchase_intents (customer_id, created_at);
