-- CARTLY — Phase 6 smoke-data seed (applied manually against a running productdb).
-- Not an init script: the postgres volume already exists, so this is run via
--   docker compose exec -T postgres psql -U postgres -d productdb -f docker/postgres/seed-smoke-data.sql
-- Idempotent: guarded with NOT EXISTS so it can be re-run safely.

-- Parent category
INSERT INTO categories (name, slug, parent_id, sort_order)
SELECT 'Electronics', 'electronics', NULL, 1
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'electronics');

-- Child category: Audio
INSERT INTO categories (name, slug, parent_id, sort_order)
SELECT 'Audio', 'audio', (SELECT id FROM categories WHERE slug = 'electronics'), 2
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'audio');

-- Make the existing SmokeCategory a child of Electronics
UPDATE categories
SET parent_id = (SELECT id FROM categories WHERE slug = 'electronics'),
    slug = 'laptops', sort_order = 3
WHERE name = 'SmokeCategory';

-- Sale price + brand + badge + featured on the existing Smoke Laptop
UPDATE products
SET brand = 'Cartly', original_price = 599.99, badge = 'SALE', featured = true
WHERE name = 'Smoke Laptop';

-- Variants for Smoke Laptop
INSERT INTO product_variants (id, product_id, name, sku, price, quantity_in_stock, attributes)
SELECT gen_random_uuid(), p.id, '8GB / 256GB', 'SMOKE-8-256', 499.99, 4, '{"ram":"8GB","storage":"256GB"}'
FROM products p WHERE p.name = 'Smoke Laptop'
  AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.sku = 'SMOKE-8-256');

INSERT INTO product_variants (id, product_id, name, sku, price, quantity_in_stock, attributes)
SELECT gen_random_uuid(), p.id, '16GB / 512GB', 'SMOKE-16-512', 649.99, 3, '{"ram":"16GB","storage":"512GB"}'
FROM products p WHERE p.name = 'Smoke Laptop'
  AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.sku = 'SMOKE-16-512');

-- Second product with sale price + brand + a variant
INSERT INTO products (id, name, unit_price, original_price, brand, badge, featured, description, category_id, deleted, created_date)
SELECT gen_random_uuid(), 'Smoke Buds', 149.99, 199.99, 'Cartly', 'SALE', false,
       'Wireless earbuds', (SELECT id FROM categories WHERE slug = 'audio'), false, now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Smoke Buds');

INSERT INTO product_variants (id, product_id, name, sku, price, quantity_in_stock, attributes)
SELECT gen_random_uuid(), p.id, 'Standard', 'BUDS-STD', 149.99, 10, '{"color":"White"}'
FROM products p WHERE p.name = 'Smoke Buds'
  AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.product_id = p.id);
