-- Cartly user-service hardening delta.
-- Apply after the existing user schema has been baselined.

CREATE TABLE IF NOT EXISTS email_retry_events (
    id uuid NOT NULL,
    encrypted_payload text NOT NULL,
    initialization_vector varchar(24) NOT NULL,
    attempts integer NOT NULL,
    status varchar(10),
    next_attempt_at timestamp NOT NULL,
    created_at timestamp NOT NULL,
    last_attempt_at timestamp,
    CONSTRAINT pk_email_retry_events PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_email_retry_due
    ON email_retry_events (next_attempt_at, created_at);
