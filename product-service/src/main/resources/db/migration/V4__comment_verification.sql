-- Verified-purchase reviews: the author's user id (server-derived from the
-- gateway-injected identity) and whether an active order backs the review.
-- Idempotent for rolling deployments.

ALTER TABLE IF EXISTS comments
    ADD COLUMN IF NOT EXISTS user_id uuid;

ALTER TABLE IF EXISTS comments
    ADD COLUMN IF NOT EXISTS verified_purchase boolean NOT NULL DEFAULT false;
