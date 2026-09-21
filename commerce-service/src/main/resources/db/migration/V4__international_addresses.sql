-- International-ready addresses.
--
-- Adds destination country (ISO-3166 alpha-2), pincode and phone to saved
-- addresses, and destination country to order addresses. Existing rows stay
-- India ('IN'); the storefront currently ships across India only.

ALTER TABLE IF EXISTS saved_addresses
    ADD COLUMN IF NOT EXISTS country varchar(2) DEFAULT 'IN',
    ADD COLUMN IF NOT EXISTS pincode varchar(20),
    ADD COLUMN IF NOT EXISTS phone_number varchar(20);

ALTER TABLE IF EXISTS order_address
    ADD COLUMN IF NOT EXISTS country varchar(2) DEFAULT 'IN';
