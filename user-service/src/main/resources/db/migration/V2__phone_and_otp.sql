-- Phone sign-in: user phone numbers + hashed one-time codes.
-- Idempotent for rolling deployments.

ALTER TABLE IF EXISTS users
    ADD COLUMN IF NOT EXISTS phone_number varchar(20);

-- Uniqueness is enforced conditionally (only non-null phones), matching the
-- entity's unique=true semantics.
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_phone_number
    ON users (phone_number)
    WHERE phone_number IS NOT NULL;

CREATE TABLE IF NOT EXISTS phone_otp (
    id uuid NOT NULL,
    phone_number varchar(20) NOT NULL,
    code_hash varchar(64) NOT NULL,
    expires_at timestamp NOT NULL,
    attempts integer NOT NULL DEFAULT 0,
    consumed boolean NOT NULL DEFAULT false,
    verified boolean NOT NULL DEFAULT false,
    CONSTRAINT pk_phone_otp PRIMARY KEY (id),
    CONSTRAINT uq_phone_otp_phone UNIQUE (phone_number)
);
