-- Support tickets raised from the storefront Help/Contact surface.
-- Idempotent for rolling deployments.

CREATE TABLE IF NOT EXISTS support_ticket (
    id uuid NOT NULL,
    ticket_ref varchar(20) NOT NULL,
    name varchar(120) NOT NULL,
    email varchar(180) NOT NULL,
    topic varchar(60) NOT NULL,
    order_number varchar(64),
    message text NOT NULL,
    status varchar(20) NOT NULL,
    customer_id varchar(64),
    created_at timestamp NOT NULL,
    updated_at timestamp,
    CONSTRAINT pk_support_ticket PRIMARY KEY (id),
    CONSTRAINT uq_support_ticket_ref UNIQUE (ticket_ref)
);

CREATE INDEX IF NOT EXISTS idx_support_ticket_status_created
    ON support_ticket (status, created_at);

CREATE INDEX IF NOT EXISTS idx_support_ticket_email
    ON support_ticket (email);
