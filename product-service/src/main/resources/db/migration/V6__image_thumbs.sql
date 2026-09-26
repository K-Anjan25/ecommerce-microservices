-- Thumb URL for catalog gallery images: cards load the CDN-sized thumb,
-- gallery/zoom loads the full-res URL. Both are external brand-CDN URLs
-- (hotlinked) or legacy local paths; thumb_url NULL means "use url".
ALTER TABLE product_images ADD COLUMN IF NOT EXISTS thumb_url varchar(1024);
