-- Cartly schema sync — userdb — 2026-09-24
-- Idempotent: safe to run repeatedly. Applies every schema change the
-- services need that `ddl-auto: update` may have missed (e.g. when the
-- stack runs with JPA_DDL_AUTO=none).

-- MFA step-up (EmailMfaService)
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS email_mfa_code (
    id          UUID         NOT NULL,
    email       VARCHAR(255),
    code_hash   VARCHAR(255),
    expires_at  TIMESTAMP,
    attempts    INT4         NOT NULL,
    consumed    BOOLEAN      NOT NULL,
    CONSTRAINT pk_email_mfa_code PRIMARY KEY (id)
);
