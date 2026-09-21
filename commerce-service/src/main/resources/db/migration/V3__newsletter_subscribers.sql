-- Newsletter subscribers captured from the storefront footer.
-- Idempotent for rolling deployments.

CREATE TABLE IF NOT EXISTS newsletter_subscriber (
    id uuid NOT NULL,
    email varchar(255) NOT NULL,
    source varchar(30) NOT NULL,
    active boolean NOT NULL DEFAULT true,
    created_at timestamp NOT NULL,
    updated_at timestamp,
    CONSTRAINT pk_newsletter_subscriber PRIMARY KEY (id),
    CONSTRAINT uq_newsletter_email UNIQUE (email)
);
