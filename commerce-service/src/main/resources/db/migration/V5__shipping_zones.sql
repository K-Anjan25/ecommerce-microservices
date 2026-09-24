-- Zone-based international shipping.
--
-- A zone covers a comma-separated list of ISO-3166 alpha-2 country codes and
-- carries the flat shipping cost plus the import duty/VAT rate applied to
-- international orders (billed in INR like the rest of the catalog).
-- Idempotent for rolling deployments.

CREATE TABLE IF NOT EXISTS shipping_zones (
    id uuid NOT NULL,
    name varchar(80) NOT NULL,
    countries varchar(500) NOT NULL,
    cost numeric(19,2) NOT NULL,
    free_above numeric(19,2),
    estimated_days_min integer NOT NULL,
    estimated_days_max integer NOT NULL,
    carrier varchar(50),
    duty_rate numeric(5,4) NOT NULL DEFAULT 0,
    duty_name varchar(60) NOT NULL DEFAULT 'Import duty & VAT',
    active boolean NOT NULL DEFAULT true,
    created_date timestamp,
    updated_date timestamp,
    created_by varchar(255),
    updated_by varchar(255),
    CONSTRAINT pk_shipping_zones PRIMARY KEY (id),
    CONSTRAINT uq_shipping_zones_name UNIQUE (name)
);
