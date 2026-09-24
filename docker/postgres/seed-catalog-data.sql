-- CARTLY — real catalog seed (productdb).
-- Applied manually against the running productdb (volume already exists):
--   Get-Content docker/postgres/seed-catalog-data.sql -Raw | docker compose exec -T postgres psql -U postgres -d productdb
-- Idempotent: every INSERT is guarded with NOT EXISTS, safe to re-run.
-- Image URLs point at the frontend's local store photos (frontend/public/images/store/).

-- ---------------------------------------------------------------------------
-- Categories: real store tree (Electronics, Fashion, Home & Kitchen, Beauty, Sports)
-- ---------------------------------------------------------------------------
INSERT INTO categories (name, slug, parent_id, sort_order, description, image_url)
SELECT 'Electronics', 'electronics', NULL, 1, 'Headphones, laptops, mobiles, wearables and more', '/images/store/tiles/tile-electronics.png'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'electronics');

INSERT INTO categories (name, slug, parent_id, sort_order, description, image_url)
SELECT 'Fashion', 'fashion', NULL, 2, 'Clothing, footwear and accessories', '/images/store/tiles/tile-fashion.png'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'fashion');

INSERT INTO categories (name, slug, parent_id, sort_order, description, image_url)
SELECT 'Home & Kitchen', 'home-kitchen', NULL, 3, 'Cookware, appliances and home decor', '/images/store/tiles/tile-kitchen.png'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'home-kitchen');

INSERT INTO categories (name, slug, parent_id, sort_order, description, image_url)
SELECT 'Beauty', 'beauty', NULL, 4, 'Skincare, haircare and personal care', '/images/store/tiles/tile-beauty.png'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'beauty');

INSERT INTO categories (name, slug, parent_id, sort_order, description, image_url)
SELECT 'Sports', 'sports', NULL, 5, 'Fitness gear and outdoor essentials', '/images/store/tiles/tile-sports.png'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'sports');

INSERT INTO categories (name, slug, parent_id, sort_order, description, image_url)
SELECT 'Audio', 'audio', (SELECT id FROM categories WHERE slug = 'electronics'), 1, 'Headphones, earbuds and speakers', NULL
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'audio');

INSERT INTO categories (name, slug, parent_id, sort_order, description, image_url)
SELECT 'Computers', 'computers', (SELECT id FROM categories WHERE slug = 'electronics'), 2, 'Laptops, keyboards and accessories', NULL
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'computers');

INSERT INTO categories (name, slug, parent_id, sort_order, description, image_url)
SELECT 'Mobiles & Tablets', 'mobiles-tablets', (SELECT id FROM categories WHERE slug = 'electronics'), 3, 'Smartphones and tablets', NULL
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'mobiles-tablets');

INSERT INTO categories (name, slug, parent_id, sort_order, description, image_url)
SELECT 'Wearables', 'wearables', (SELECT id FROM categories WHERE slug = 'electronics'), 4, 'Smartwatches and fitness bands', NULL
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'wearables');

INSERT INTO categories (name, slug, parent_id, sort_order, description, image_url)
SELECT 'Men', 'men', (SELECT id FROM categories WHERE slug = 'fashion'), 1, 'Mens clothing and essentials', NULL
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'men');

INSERT INTO categories (name, slug, parent_id, sort_order, description, image_url)
SELECT 'Women', 'women', (SELECT id FROM categories WHERE slug = 'fashion'), 2, 'Womens clothing and essentials', NULL
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'women');

INSERT INTO categories (name, slug, parent_id, sort_order, description, image_url)
SELECT 'Footwear', 'footwear', (SELECT id FROM categories WHERE slug = 'fashion'), 3, 'Running shoes, sneakers and sandals', NULL
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'footwear');

INSERT INTO categories (name, slug, parent_id, sort_order, description, image_url)
SELECT 'Cookware', 'cookware', (SELECT id FROM categories WHERE slug = 'home-kitchen'), 1, 'Cookers, pans and kitchen tools', NULL
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'cookware');

INSERT INTO categories (name, slug, parent_id, sort_order, description, image_url)
SELECT 'Home Decor', 'home-decor', (SELECT id FROM categories WHERE slug = 'home-kitchen'), 2, 'Lamps, furnishings and decor', NULL
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'home-decor');

INSERT INTO categories (name, slug, parent_id, sort_order, description, image_url)
SELECT 'Skincare', 'skincare', (SELECT id FROM categories WHERE slug = 'beauty'), 1, 'Serums, face wash and moisturisers', NULL
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'skincare');

INSERT INTO categories (name, slug, parent_id, sort_order, description, image_url)
SELECT 'Fitness', 'fitness', (SELECT id FROM categories WHERE slug = 'sports'), 1, 'Yoga mats, dumbbells and training gear', NULL
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'fitness');

-- ---------------------------------------------------------------------------
-- Products (prices in INR: unit_price = sale price, original_price = MRP)
-- ---------------------------------------------------------------------------

-- 1. Sony WH-1000XM5
INSERT INTO products (id, name, unit_price, original_price, brand, badge, featured, description, category_id, image_url, deleted, created_date)
SELECT gen_random_uuid(), 'Sony WH-1000XM5 Wireless Headphones', 26990, 34990, 'Sony', 'BESTSELLER', true,
       'Industry-leading noise cancelling with 30-hour battery, multipoint connection and crystal-clear hands-free calling.',
       (SELECT id FROM categories WHERE slug = 'audio'), '/images/store/product-headphones.jpg', false, now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Sony WH-1000XM5 Wireless Headphones');
INSERT INTO product_images (id, product_id, url, sort_order)
SELECT gen_random_uuid(), p.id, '/images/store/product-headphones.jpg', 0 FROM products p
WHERE p.name = 'Sony WH-1000XM5 Wireless Headphones'
  AND NOT EXISTS (SELECT 1 FROM product_images i WHERE i.product_id = p.id AND i.url = '/images/store/product-headphones.jpg');
INSERT INTO product_variants (id, product_id, name, sku, price, quantity_in_stock, attributes)
SELECT gen_random_uuid(), p.id, 'Black', 'SONY-XM5-BLK', 26990, 12, '{"color":"Black"}' FROM products p
WHERE p.name = 'Sony WH-1000XM5 Wireless Headphones' AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.sku = 'SONY-XM5-BLK');
INSERT INTO product_variants (id, product_id, name, sku, price, quantity_in_stock, attributes)
SELECT gen_random_uuid(), p.id, 'Silver', 'SONY-XM5-SLV', 26990, 8, '{"color":"Silver"}' FROM products p
WHERE p.name = 'Sony WH-1000XM5 Wireless Headphones' AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.sku = 'SONY-XM5-SLV');
INSERT INTO inventories (id, product_id, quantity)
SELECT gen_random_uuid(), p.id, 20 FROM products p WHERE p.name = 'Sony WH-1000XM5 Wireless Headphones'
  AND NOT EXISTS (SELECT 1 FROM inventories i WHERE i.product_id = p.id);

-- 2. boAt Airdopes 141
INSERT INTO products (id, name, unit_price, original_price, brand, badge, featured, description, category_id, image_url, deleted, created_date)
SELECT gen_random_uuid(), 'boAt Airdopes 141 TWS Earbuds', 1299, 4490, 'boAt', 'SALE', false,
       'True wireless earbuds with 42-hour playback, low-latency gaming mode and ENx noise cancellation for calls.',
       (SELECT id FROM categories WHERE slug = 'audio'), '/images/store/product-earbuds.jpg', false, now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'boAt Airdopes 141 TWS Earbuds');
INSERT INTO product_images (id, product_id, url, sort_order)
SELECT gen_random_uuid(), p.id, '/images/store/product-earbuds.jpg', 0 FROM products p
WHERE p.name = 'boAt Airdopes 141 TWS Earbuds'
  AND NOT EXISTS (SELECT 1 FROM product_images i WHERE i.product_id = p.id AND i.url = '/images/store/product-earbuds.jpg');
INSERT INTO product_variants (id, product_id, name, sku, price, quantity_in_stock, attributes)
SELECT gen_random_uuid(), p.id, 'Bold Black', 'BOAT-141-BLK', 1299, 40, '{"color":"Bold Black"}' FROM products p
WHERE p.name = 'boAt Airdopes 141 TWS Earbuds' AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.sku = 'BOAT-141-BLK');
INSERT INTO product_variants (id, product_id, name, sku, price, quantity_in_stock, attributes)
SELECT gen_random_uuid(), p.id, 'Pure White', 'BOAT-141-WHT', 1299, 35, '{"color":"Pure White"}' FROM products p
WHERE p.name = 'boAt Airdopes 141 TWS Earbuds' AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.sku = 'BOAT-141-WHT');
INSERT INTO product_variants (id, product_id, name, sku, price, quantity_in_stock, attributes)
SELECT gen_random_uuid(), p.id, 'Aqua Blue', 'BOAT-141-BLU', 1349, 25, '{"color":"Aqua Blue"}' FROM products p
WHERE p.name = 'boAt Airdopes 141 TWS Earbuds' AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.sku = 'BOAT-141-BLU');
INSERT INTO inventories (id, product_id, quantity)
SELECT gen_random_uuid(), p.id, 100 FROM products p WHERE p.name = 'boAt Airdopes 141 TWS Earbuds'
  AND NOT EXISTS (SELECT 1 FROM inventories i WHERE i.product_id = p.id);

-- 3. JBL Flip 6
INSERT INTO products (id, name, unit_price, original_price, brand, badge, featured, description, category_id, image_url, deleted, created_date)
SELECT gen_random_uuid(), 'JBL Flip 6 Portable Bluetooth Speaker', 9999, 14999, 'JBL', 'SALE', false,
       'Portable waterproof speaker with 12 hours of playtime, PartyBoost pairing and bold JBL original pro sound.',
       (SELECT id FROM categories WHERE slug = 'audio'), '/images/store/demo-speaker.jpg', false, now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'JBL Flip 6 Portable Bluetooth Speaker');
INSERT INTO product_images (id, product_id, url, sort_order)
SELECT gen_random_uuid(), p.id, '/images/store/demo-speaker.jpg', 0 FROM products p
WHERE p.name = 'JBL Flip 6 Portable Bluetooth Speaker'
  AND NOT EXISTS (SELECT 1 FROM product_images i WHERE i.product_id = p.id AND i.url = '/images/store/demo-speaker.jpg');
INSERT INTO product_variants (id, product_id, name, sku, price, quantity_in_stock, attributes)
SELECT gen_random_uuid(), p.id, 'Black', 'JBL-FLIP6-BLK', 9999, 15, '{"color":"Black"}' FROM products p
WHERE p.name = 'JBL Flip 6 Portable Bluetooth Speaker' AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.sku = 'JBL-FLIP6-BLK');
INSERT INTO product_variants (id, product_id, name, sku, price, quantity_in_stock, attributes)
SELECT gen_random_uuid(), p.id, 'Squad', 'JBL-FLIP6-SQD', 9999, 9, '{"color":"Squad"}' FROM products p
WHERE p.name = 'JBL Flip 6 Portable Bluetooth Speaker' AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.sku = 'JBL-FLIP6-SQD');
INSERT INTO inventories (id, product_id, quantity)
SELECT gen_random_uuid(), p.id, 24 FROM products p WHERE p.name = 'JBL Flip 6 Portable Bluetooth Speaker'
  AND NOT EXISTS (SELECT 1 FROM inventories i WHERE i.product_id = p.id);

-- 4. Logitech MX Keys S
INSERT INTO products (id, name, unit_price, original_price, brand, badge, featured, description, category_id, image_url, deleted, created_date)
SELECT gen_random_uuid(), 'Logitech MX Keys S Wireless Keyboard', 11995, 13995, 'Logitech', 'NEW', false,
       'Low-profile wireless keyboard with backlit keys, Smart Actions shortcuts and multi-device pairing for up to 3 devices.',
       (SELECT id FROM categories WHERE slug = 'computers'), '/images/store/product-keyboard.jpg', false, now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Logitech MX Keys S Wireless Keyboard');
INSERT INTO product_images (id, product_id, url, sort_order)
SELECT gen_random_uuid(), p.id, '/images/store/product-keyboard.jpg', 0 FROM products p
WHERE p.name = 'Logitech MX Keys S Wireless Keyboard'
  AND NOT EXISTS (SELECT 1 FROM product_images i WHERE i.product_id = p.id AND i.url = '/images/store/product-keyboard.jpg');
INSERT INTO product_variants (id, product_id, name, sku, price, quantity_in_stock, attributes)
SELECT gen_random_uuid(), p.id, 'Graphite', 'LOGI-MXS-GRP', 11995, 18, '{"color":"Graphite"}' FROM products p
WHERE p.name = 'Logitech MX Keys S Wireless Keyboard' AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.sku = 'LOGI-MXS-GRP');
INSERT INTO product_variants (id, product_id, name, sku, price, quantity_in_stock, attributes)
SELECT gen_random_uuid(), p.id, 'Pale Grey', 'LOGI-MXS-GRY', 11995, 11, '{"color":"Pale Grey"}' FROM products p
WHERE p.name = 'Logitech MX Keys S Wireless Keyboard' AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.sku = 'LOGI-MXS-GRY');
INSERT INTO inventories (id, product_id, quantity)
SELECT gen_random_uuid(), p.id, 29 FROM products p WHERE p.name = 'Logitech MX Keys S Wireless Keyboard'
  AND NOT EXISTS (SELECT 1 FROM inventories i WHERE i.product_id = p.id);

-- 5. HP Pavilion 15
INSERT INTO products (id, name, unit_price, original_price, brand, badge, featured, description, category_id, image_url, deleted, created_date)
SELECT gen_random_uuid(), 'HP Pavilion 15 Laptop (Ryzen 5 7530U, 16GB, 512GB)', 58990, 71990, 'HP', 'SALE', true,
       '15.6-inch FHD laptop with AMD Ryzen 5 7530U, 16GB RAM, 512GB SSD, backlit keyboard and fast-charge battery.',
       (SELECT id FROM categories WHERE slug = 'computers'), NULL, false, now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'HP Pavilion 15 Laptop (Ryzen 5 7530U, 16GB, 512GB)');
INSERT INTO product_variants (id, product_id, name, sku, price, quantity_in_stock, attributes)
SELECT gen_random_uuid(), p.id, '16GB / 512GB', 'HP-PAV15-16512', 58990, 7, '{"ram":"16GB","storage":"512GB"}' FROM products p
WHERE p.name = 'HP Pavilion 15 Laptop (Ryzen 5 7530U, 16GB, 512GB)' AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.sku = 'HP-PAV15-16512');
INSERT INTO product_variants (id, product_id, name, sku, price, quantity_in_stock, attributes)
SELECT gen_random_uuid(), p.id, '16GB / 1TB', 'HP-PAV15-161TB', 64990, 4, '{"ram":"16GB","storage":"1TB"}' FROM products p
WHERE p.name = 'HP Pavilion 15 Laptop (Ryzen 5 7530U, 16GB, 512GB)' AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.sku = 'HP-PAV15-161TB');
INSERT INTO inventories (id, product_id, quantity)
SELECT gen_random_uuid(), p.id, 11 FROM products p WHERE p.name = 'HP Pavilion 15 Laptop (Ryzen 5 7530U, 16GB, 512GB)'
  AND NOT EXISTS (SELECT 1 FROM inventories i WHERE i.product_id = p.id);

-- 6. Lenovo IdeaPad Slim 3
INSERT INTO products (id, name, unit_price, original_price, brand, badge, featured, description, category_id, image_url, deleted, created_date)
SELECT gen_random_uuid(), 'Lenovo IdeaPad Slim 3 (i5 13th Gen, 16GB, 512GB)', 52990, 65990, 'Lenovo', 'NONE', false,
       'Slim 15.6-inch laptop with Intel Core i5 13th Gen, 16GB RAM, 512GB SSD, military-grade durability and rapid charge.',
       (SELECT id FROM categories WHERE slug = 'computers'), NULL, false, now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Lenovo IdeaPad Slim 3 (i5 13th Gen, 16GB, 512GB)');
INSERT INTO product_variants (id, product_id, name, sku, price, quantity_in_stock, attributes)
SELECT gen_random_uuid(), p.id, '16GB / 512GB', 'LEN-SLIM3-16512', 52990, 9, '{"ram":"16GB","storage":"512GB"}' FROM products p
WHERE p.name = 'Lenovo IdeaPad Slim 3 (i5 13th Gen, 16GB, 512GB)' AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.sku = 'LEN-SLIM3-16512');
INSERT INTO inventories (id, product_id, quantity)
SELECT gen_random_uuid(), p.id, 9 FROM products p WHERE p.name = 'Lenovo IdeaPad Slim 3 (i5 13th Gen, 16GB, 512GB)'
  AND NOT EXISTS (SELECT 1 FROM inventories i WHERE i.product_id = p.id);

-- 7. Samsung Galaxy S24 5G
INSERT INTO products (id, name, unit_price, original_price, brand, badge, featured, description, category_id, image_url, deleted, created_date)
SELECT gen_random_uuid(), 'Samsung Galaxy S24 5G (8GB, 256GB)', 62999, 79999, 'Samsung', 'BESTSELLER', true,
       'Flagship smartphone with Galaxy AI, 50MP triple camera, 120Hz AMOLED display and 7 years of OS updates.',
       (SELECT id FROM categories WHERE slug = 'mobiles-tablets'), NULL, false, now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Samsung Galaxy S24 5G (8GB, 256GB)');
INSERT INTO product_variants (id, product_id, name, sku, price, quantity_in_stock, attributes)
SELECT gen_random_uuid(), p.id, 'Onyx Black', 'SAM-S24-BLK', 62999, 14, '{"color":"Onyx Black","storage":"256GB"}' FROM products p
WHERE p.name = 'Samsung Galaxy S24 5G (8GB, 256GB)' AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.sku = 'SAM-S24-BLK');
INSERT INTO product_variants (id, product_id, name, sku, price, quantity_in_stock, attributes)
SELECT gen_random_uuid(), p.id, 'Marble Grey', 'SAM-S24-GRY', 62999, 10, '{"color":"Marble Grey","storage":"256GB"}' FROM products p
WHERE p.name = 'Samsung Galaxy S24 5G (8GB, 256GB)' AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.sku = 'SAM-S24-GRY');
INSERT INTO product_variants (id, product_id, name, sku, price, quantity_in_stock, attributes)
SELECT gen_random_uuid(), p.id, 'Cobalt Violet', 'SAM-S24-VLT', 62999, 6, '{"color":"Cobalt Violet","storage":"256GB"}' FROM products p
WHERE p.name = 'Samsung Galaxy S24 5G (8GB, 256GB)' AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.sku = 'SAM-S24-VLT');
INSERT INTO inventories (id, product_id, quantity)
SELECT gen_random_uuid(), p.id, 30 FROM products p WHERE p.name = 'Samsung Galaxy S24 5G (8GB, 256GB)'
  AND NOT EXISTS (SELECT 1 FROM inventories i WHERE i.product_id = p.id);

-- 8. Redmi Note 13 5G
INSERT INTO products (id, name, unit_price, original_price, brand, badge, featured, description, category_id, image_url, deleted, created_date)
SELECT gen_random_uuid(), 'Redmi Note 13 5G (6GB, 128GB)', 15999, 20999, 'Redmi', 'SALE', false,
       '6.67-inch AMOLED display, 108MP triple camera, 5000mAh battery with 33W fast charging and 5G on both SIMs.',
       (SELECT id FROM categories WHERE slug = 'mobiles-tablets'), NULL, false, now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Redmi Note 13 5G (6GB, 128GB)');
INSERT INTO product_variants (id, product_id, name, sku, price, quantity_in_stock, attributes)
SELECT gen_random_uuid(), p.id, 'Graphite Black', 'RED-N13-BLK', 15999, 22, '{"color":"Graphite Black","storage":"128GB"}' FROM products p
WHERE p.name = 'Redmi Note 13 5G (6GB, 128GB)' AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.sku = 'RED-N13-BLK');
INSERT INTO product_variants (id, product_id, name, sku, price, quantity_in_stock, attributes)
SELECT gen_random_uuid(), p.id, 'Ocean Sunset', 'RED-N13-OCN', 15999, 16, '{"color":"Ocean Sunset","storage":"128GB"}' FROM products p
WHERE p.name = 'Redmi Note 13 5G (6GB, 128GB)' AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.sku = 'RED-N13-OCN');
INSERT INTO inventories (id, product_id, quantity)
SELECT gen_random_uuid(), p.id, 38 FROM products p WHERE p.name = 'Redmi Note 13 5G (6GB, 128GB)'
  AND NOT EXISTS (SELECT 1 FROM inventories i WHERE i.product_id = p.id);

-- 9. Noise ColorFit Pro 5
INSERT INTO products (id, name, unit_price, original_price, brand, badge, featured, description, category_id, image_url, deleted, created_date)
SELECT gen_random_uuid(), 'Noise ColorFit Pro 5 Smartwatch', 2999, 7999, 'Noise', 'BESTSELLER', true,
       '1.85-inch AMOLED display, Bluetooth calling, 100+ watch faces, SpO2 and heart-rate tracking with 7-day battery.',
       (SELECT id FROM categories WHERE slug = 'wearables'), '/images/store/product-watch.jpg', false, now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Noise ColorFit Pro 5 Smartwatch');
INSERT INTO product_images (id, product_id, url, sort_order)
SELECT gen_random_uuid(), p.id, '/images/store/product-watch.jpg', 0 FROM products p
WHERE p.name = 'Noise ColorFit Pro 5 Smartwatch'
  AND NOT EXISTS (SELECT 1 FROM product_images i WHERE i.product_id = p.id AND i.url = '/images/store/product-watch.jpg');
INSERT INTO product_variants (id, product_id, name, sku, price, quantity_in_stock, attributes)
SELECT gen_random_uuid(), p.id, 'Jet Black', 'NOISE-P5-BLK', 2999, 45, '{"color":"Jet Black"}' FROM products p
WHERE p.name = 'Noise ColorFit Pro 5 Smartwatch' AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.sku = 'NOISE-P5-BLK');
INSERT INTO product_variants (id, product_id, name, sku, price, quantity_in_stock, attributes)
SELECT gen_random_uuid(), p.id, 'Silver Grey', 'NOISE-P5-SLV', 2999, 30, '{"color":"Silver Grey"}' FROM products p
WHERE p.name = 'Noise ColorFit Pro 5 Smartwatch' AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.sku = 'NOISE-P5-SLV');
INSERT INTO product_variants (id, product_id, name, sku, price, quantity_in_stock, attributes)
SELECT gen_random_uuid(), p.id, 'Deep Wine', 'NOISE-P5-WNE', 3199, 20, '{"color":"Deep Wine"}' FROM products p
WHERE p.name = 'Noise ColorFit Pro 5 Smartwatch' AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.sku = 'NOISE-P5-WNE');
INSERT INTO inventories (id, product_id, quantity)
SELECT gen_random_uuid(), p.id, 95 FROM products p WHERE p.name = 'Noise ColorFit Pro 5 Smartwatch'
  AND NOT EXISTS (SELECT 1 FROM inventories i WHERE i.product_id = p.id);

-- 10. Fire-Boltt Ninja Call Pro Plus
INSERT INTO products (id, name, unit_price, original_price, brand, badge, featured, description, category_id, image_url, deleted, created_date)
SELECT gen_random_uuid(), 'Fire-Boltt Ninja Call Pro Plus Smartwatch', 1499, 9999, 'Fire-Boltt', 'SALE', false,
       '1.83-inch display with Bluetooth calling, AI voice assistant, 120+ sport modes and IP67 dust and water resistance.',
       (SELECT id FROM categories WHERE slug = 'wearables'), NULL, false, now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Fire-Boltt Ninja Call Pro Plus Smartwatch');
INSERT INTO product_variants (id, product_id, name, sku, price, quantity_in_stock, attributes)
SELECT gen_random_uuid(), p.id, 'Black', 'FB-NINJA-BLK', 1499, 50, '{"color":"Black"}' FROM products p
WHERE p.name = 'Fire-Boltt Ninja Call Pro Plus Smartwatch' AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.sku = 'FB-NINJA-BLK');
INSERT INTO product_variants (id, product_id, name, sku, price, quantity_in_stock, attributes)
SELECT gen_random_uuid(), p.id, 'Blue', 'FB-NINJA-BLU', 1499, 33, '{"color":"Blue"}' FROM products p
WHERE p.name = 'Fire-Boltt Ninja Call Pro Plus Smartwatch' AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.sku = 'FB-NINJA-BLU');
INSERT INTO inventories (id, product_id, quantity)
SELECT gen_random_uuid(), p.id, 83 FROM products p WHERE p.name = 'Fire-Boltt Ninja Call Pro Plus Smartwatch'
  AND NOT EXISTS (SELECT 1 FROM inventories i WHERE i.product_id = p.id);

-- 11. Nike Air Zoom Pegasus 40
INSERT INTO products (id, name, unit_price, original_price, brand, badge, featured, description, category_id, image_url, deleted, created_date)
SELECT gen_random_uuid(), 'Nike Air Zoom Pegasus 40 Running Shoes', 7995, 11995, 'Nike', 'BESTSELLER', true,
       'Responsive Zoom Air cushioning with engineered mesh upper for breathable comfort on daily road runs.',
       (SELECT id FROM categories WHERE slug = 'footwear'), '/images/store/product-sneaker.jpg', false, now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Nike Air Zoom Pegasus 40 Running Shoes');
INSERT INTO product_images (id, product_id, url, sort_order)
SELECT gen_random_uuid(), p.id, '/images/store/product-sneaker.jpg', 0 FROM products p
WHERE p.name = 'Nike Air Zoom Pegasus 40 Running Shoes'
  AND NOT EXISTS (SELECT 1 FROM product_images i WHERE i.product_id = p.id AND i.url = '/images/store/product-sneaker.jpg');
INSERT INTO product_variants (id, product_id, name, sku, price, quantity_in_stock, attributes)
SELECT gen_random_uuid(), p.id, 'UK 8', 'NIKE-PEG40-8', 7995, 14, '{"size":"UK 8"}' FROM products p
WHERE p.name = 'Nike Air Zoom Pegasus 40 Running Shoes' AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.sku = 'NIKE-PEG40-8');
INSERT INTO product_variants (id, product_id, name, sku, price, quantity_in_stock, attributes)
SELECT gen_random_uuid(), p.id, 'UK 9', 'NIKE-PEG40-9', 7995, 18, '{"size":"UK 9"}' FROM products p
WHERE p.name = 'Nike Air Zoom Pegasus 40 Running Shoes' AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.sku = 'NIKE-PEG40-9');
INSERT INTO product_variants (id, product_id, name, sku, price, quantity_in_stock, attributes)
SELECT gen_random_uuid(), p.id, 'UK 10', 'NIKE-PEG40-10', 7995, 12, '{"size":"UK 10"}' FROM products p
WHERE p.name = 'Nike Air Zoom Pegasus 40 Running Shoes' AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.sku = 'NIKE-PEG40-10');
INSERT INTO inventories (id, product_id, quantity)
SELECT gen_random_uuid(), p.id, 44 FROM products p WHERE p.name = 'Nike Air Zoom Pegasus 40 Running Shoes'
  AND NOT EXISTS (SELECT 1 FROM inventories i WHERE i.product_id = p.id);

-- 12. Adidas Ultraboost Light
INSERT INTO products (id, name, unit_price, original_price, brand, badge, featured, description, category_id, image_url, deleted, created_date)
SELECT gen_random_uuid(), 'Adidas Ultraboost Light Running Shoes', 12999, 18999, 'Adidas', 'NEW', false,
       'Featherlight Boost foam midsole with Primeknit+ upper and Continental rubber outsole for grip in all weather.',
       (SELECT id FROM categories WHERE slug = 'footwear'), NULL, false, now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Adidas Ultraboost Light Running Shoes');
INSERT INTO product_variants (id, product_id, name, sku, price, quantity_in_stock, attributes)
SELECT gen_random_uuid(), p.id, 'UK 8', 'ADI-UBL-8', 12999, 10, '{"size":"UK 8"}' FROM products p
WHERE p.name = 'Adidas Ultraboost Light Running Shoes' AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.sku = 'ADI-UBL-8');
INSERT INTO product_variants (id, product_id, name, sku, price, quantity_in_stock, attributes)
SELECT gen_random_uuid(), p.id, 'UK 9', 'ADI-UBL-9', 12999, 13, '{"size":"UK 9"}' FROM products p
WHERE p.name = 'Adidas Ultraboost Light Running Shoes' AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.sku = 'ADI-UBL-9');
INSERT INTO product_variants (id, product_id, name, sku, price, quantity_in_stock, attributes)
SELECT gen_random_uuid(), p.id, 'UK 10', 'ADI-UBL-10', 12999, 8, '{"size":"UK 10"}' FROM products p
WHERE p.name = 'Adidas Ultraboost Light Running Shoes' AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.sku = 'ADI-UBL-10');
INSERT INTO inventories (id, product_id, quantity)
SELECT gen_random_uuid(), p.id, 31 FROM products p WHERE p.name = 'Adidas Ultraboost Light Running Shoes'
  AND NOT EXISTS (SELECT 1 FROM inventories i WHERE i.product_id = p.id);

-- 13. Puma RS-X Reinvention
INSERT INTO products (id, name, unit_price, original_price, brand, badge, featured, description, category_id, image_url, deleted, created_date)
SELECT gen_random_uuid(), 'Puma RS-X Reinvention Sneakers', 5499, 8999, 'Puma', 'SALE', false,
       'Retro-inspired street sneakers with RS cushioning, mixed-material upper and all-day comfort fit.',
       (SELECT id FROM categories WHERE slug = 'footwear'), NULL, false, now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Puma RS-X Reinvention Sneakers');
INSERT INTO product_variants (id, product_id, name, sku, price, quantity_in_stock, attributes)
SELECT gen_random_uuid(), p.id, 'UK 8', 'PUMA-RSX-8', 5499, 16, '{"size":"UK 8"}' FROM products p
WHERE p.name = 'Puma RS-X Reinvention Sneakers' AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.sku = 'PUMA-RSX-8');
INSERT INTO product_variants (id, product_id, name, sku, price, quantity_in_stock, attributes)
SELECT gen_random_uuid(), p.id, 'UK 9', 'PUMA-RSX-9', 5499, 20, '{"size":"UK 9"}' FROM products p
WHERE p.name = 'Puma RS-X Reinvention Sneakers' AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.sku = 'PUMA-RSX-9');
INSERT INTO inventories (id, product_id, quantity)
SELECT gen_random_uuid(), p.id, 36 FROM products p WHERE p.name = 'Puma RS-X Reinvention Sneakers'
  AND NOT EXISTS (SELECT 1 FROM inventories i WHERE i.product_id = p.id);

-- 14. Levi's 511 Slim Jeans
INSERT INTO products (id, name, unit_price, original_price, brand, badge, featured, description, category_id, image_url, deleted, created_date)
SELECT gen_random_uuid(), 'Levi''s 511 Slim Fit Mid-Rise Jeans', 2399, 3999, 'Levi''s', 'NONE', false,
       'Classic slim-fit stretch denim jeans with zip fly, five-pocket styling and all-day comfort stretch.',
       (SELECT id FROM categories WHERE slug = 'men'), '/images/store/demo-textile.jpg', false, now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Levi''s 511 Slim Fit Mid-Rise Jeans');
INSERT INTO product_images (id, product_id, url, sort_order)
SELECT gen_random_uuid(), p.id, '/images/store/demo-textile.jpg', 0 FROM products p
WHERE p.name = 'Levi''s 511 Slim Fit Mid-Rise Jeans'
  AND NOT EXISTS (SELECT 1 FROM product_images i WHERE i.product_id = p.id AND i.url = '/images/store/demo-textile.jpg');
INSERT INTO product_variants (id, product_id, name, sku, price, quantity_in_stock, attributes)
SELECT gen_random_uuid(), p.id, 'Waist 30', 'LEVI-511-30', 2399, 25, '{"size":"30"}' FROM products p
WHERE p.name = 'Levi''s 511 Slim Fit Mid-Rise Jeans' AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.sku = 'LEVI-511-30');
INSERT INTO product_variants (id, product_id, name, sku, price, quantity_in_stock, attributes)
SELECT gen_random_uuid(), p.id, 'Waist 32', 'LEVI-511-32', 2399, 32, '{"size":"32"}' FROM products p
WHERE p.name = 'Levi''s 511 Slim Fit Mid-Rise Jeans' AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.sku = 'LEVI-511-32');
INSERT INTO product_variants (id, product_id, name, sku, price, quantity_in_stock, attributes)
SELECT gen_random_uuid(), p.id, 'Waist 34', 'LEVI-511-34', 2399, 21, '{"size":"34"}' FROM products p
WHERE p.name = 'Levi''s 511 Slim Fit Mid-Rise Jeans' AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.sku = 'LEVI-511-34');
INSERT INTO inventories (id, product_id, quantity)
SELECT gen_random_uuid(), p.id, 78 FROM products p WHERE p.name = 'Levi''s 511 Slim Fit Mid-Rise Jeans'
  AND NOT EXISTS (SELECT 1 FROM inventories i WHERE i.product_id = p.id);

-- 15. American Tourister Duffel
INSERT INTO products (id, name, unit_price, original_price, brand, badge, featured, description, category_id, image_url, deleted, created_date)
SELECT gen_random_uuid(), 'American Tourister 55cm Travel Duffel Bag', 1499, 3200, 'American Tourister', 'SALE', false,
       '55cm water-resistant polyester duffel with shoe compartment, padded shoulder strap and 3-year warranty.',
       (SELECT id FROM categories WHERE slug = 'men'), '/images/store/product-duffel.jpg', false, now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'American Tourister 55cm Travel Duffel Bag');
INSERT INTO product_images (id, product_id, url, sort_order)
SELECT gen_random_uuid(), p.id, '/images/store/product-duffel.jpg', 0 FROM products p
WHERE p.name = 'American Tourister 55cm Travel Duffel Bag'
  AND NOT EXISTS (SELECT 1 FROM product_images i WHERE i.product_id = p.id AND i.url = '/images/store/product-duffel.jpg');
INSERT INTO product_variants (id, product_id, name, sku, price, quantity_in_stock, attributes)
SELECT gen_random_uuid(), p.id, 'Black', 'AT-DUF55-BLK', 1499, 26, '{"color":"Black"}' FROM products p
WHERE p.name = 'American Tourister 55cm Travel Duffel Bag' AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.sku = 'AT-DUF55-BLK');
INSERT INTO product_variants (id, product_id, name, sku, price, quantity_in_stock, attributes)
SELECT gen_random_uuid(), p.id, 'Red', 'AT-DUF55-RED', 1499, 17, '{"color":"Red"}' FROM products p
WHERE p.name = 'American Tourister 55cm Travel Duffel Bag' AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.sku = 'AT-DUF55-RED');
INSERT INTO inventories (id, product_id, quantity)
SELECT gen_random_uuid(), p.id, 43 FROM products p WHERE p.name = 'American Tourister 55cm Travel Duffel Bag'
  AND NOT EXISTS (SELECT 1 FROM inventories i WHERE i.product_id = p.id);

-- 16. Hawkins Contura Pressure Cooker
INSERT INTO products (id, name, unit_price, original_price, brand, badge, featured, description, category_id, image_url, deleted, created_date)
SELECT gen_random_uuid(), 'Hawkins Contura Aluminium Pressure Cooker', 2200, 2850, 'Hawkins', 'BESTSELLER', false,
       'Hard-anodised aluminium cooker with pressure-locked safety lid, suitable for gas and induction cooktops.',
       (SELECT id FROM categories WHERE slug = 'cookware'), '/images/store/product-skillet.jpg', false, now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Hawkins Contura Aluminium Pressure Cooker');
INSERT INTO product_images (id, product_id, url, sort_order)
SELECT gen_random_uuid(), p.id, '/images/store/product-skillet.jpg', 0 FROM products p
WHERE p.name = 'Hawkins Contura Aluminium Pressure Cooker'
  AND NOT EXISTS (SELECT 1 FROM product_images i WHERE i.product_id = p.id AND i.url = '/images/store/product-skillet.jpg');
INSERT INTO product_variants (id, product_id, name, sku, price, quantity_in_stock, attributes)
SELECT gen_random_uuid(), p.id, '3 Litre', 'HWK-CTR-3L', 1950, 28, '{"capacity":"3L"}' FROM products p
WHERE p.name = 'Hawkins Contura Aluminium Pressure Cooker' AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.sku = 'HWK-CTR-3L');
INSERT INTO product_variants (id, product_id, name, sku, price, quantity_in_stock, attributes)
SELECT gen_random_uuid(), p.id, '5 Litre', 'HWK-CTR-5L', 2200, 34, '{"capacity":"5L"}' FROM products p
WHERE p.name = 'Hawkins Contura Aluminium Pressure Cooker' AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.sku = 'HWK-CTR-5L');
INSERT INTO inventories (id, product_id, quantity)
SELECT gen_random_uuid(), p.id, 62 FROM products p WHERE p.name = 'Hawkins Contura Aluminium Pressure Cooker'
  AND NOT EXISTS (SELECT 1 FROM inventories i WHERE i.product_id = p.id);

-- 17. Prestige Non-Stick Cookware Set
INSERT INTO products (id, name, unit_price, original_price, brand, badge, featured, description, category_id, image_url, deleted, created_date)
SELECT gen_random_uuid(), 'Prestige Non-Stick Cookware Set (5 Pieces)', 2799, 4520, 'Prestige', 'SALE', false,
       '5-piece non-stick set with fry pan, kadai, casserole and lids, metal-spoon friendly coating and cool-touch handles.',
       (SELECT id FROM categories WHERE slug = 'cookware'), NULL, false, now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Prestige Non-Stick Cookware Set (5 Pieces)');
INSERT INTO product_variants (id, product_id, name, sku, price, quantity_in_stock, attributes)
SELECT gen_random_uuid(), p.id, 'Standard', 'PRSTG-NS5-STD', 2799, 24, '{"pieces":"5"}' FROM products p
WHERE p.name = 'Prestige Non-Stick Cookware Set (5 Pieces)' AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.sku = 'PRSTG-NS5-STD');
INSERT INTO inventories (id, product_id, quantity)
SELECT gen_random_uuid(), p.id, 24 FROM products p WHERE p.name = 'Prestige Non-Stick Cookware Set (5 Pieces)'
  AND NOT EXISTS (SELECT 1 FROM inventories i WHERE i.product_id = p.id);

-- 18. Philips LED Table Lamp
INSERT INTO products (id, name, unit_price, original_price, brand, badge, featured, description, category_id, image_url, deleted, created_date)
SELECT gen_random_uuid(), 'Philips Air LED Table Lamp 5W', 899, 1299, 'Philips', 'NEW', false,
       'Energy-efficient 5W LED desk lamp with warm white light, flexible neck and eye-care flicker-free glow.',
       (SELECT id FROM categories WHERE slug = 'home-decor'), '/images/store/product-lamp.jpg', false, now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Philips Air LED Table Lamp 5W');
INSERT INTO product_images (id, product_id, url, sort_order)
SELECT gen_random_uuid(), p.id, '/images/store/product-lamp.jpg', 0 FROM products p
WHERE p.name = 'Philips Air LED Table Lamp 5W'
  AND NOT EXISTS (SELECT 1 FROM product_images i WHERE i.product_id = p.id AND i.url = '/images/store/product-lamp.jpg');
INSERT INTO product_variants (id, product_id, name, sku, price, quantity_in_stock, attributes)
SELECT gen_random_uuid(), p.id, 'White', 'PHL-LAMP-WHT', 899, 40, '{"color":"White"}' FROM products p
WHERE p.name = 'Philips Air LED Table Lamp 5W' AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.sku = 'PHL-LAMP-WHT');
INSERT INTO product_variants (id, product_id, name, sku, price, quantity_in_stock, attributes)
SELECT gen_random_uuid(), p.id, 'Black', 'PHL-LAMP-BLK', 949, 27, '{"color":"Black"}' FROM products p
WHERE p.name = 'Philips Air LED Table Lamp 5W' AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.sku = 'PHL-LAMP-BLK');
INSERT INTO inventories (id, product_id, quantity)
SELECT gen_random_uuid(), p.id, 67 FROM products p WHERE p.name = 'Philips Air LED Table Lamp 5W'
  AND NOT EXISTS (SELECT 1 FROM inventories i WHERE i.product_id = p.id);

-- 19. L'Oreal Revitalift Serum
INSERT INTO products (id, name, unit_price, original_price, brand, badge, featured, description, category_id, image_url, deleted, created_date)
SELECT gen_random_uuid(), 'L''Oreal Paris Revitalift Hyaluronic Acid Serum 30ml', 649, 999, 'L''Oreal Paris', 'BESTSELLER', true,
       'Anti-wrinkle face serum with 1.5% hyaluronic acid for plumper, firmer skin in 2 weeks. For all skin types.',
       (SELECT id FROM categories WHERE slug = 'skincare'), '/images/store/product-serum.jpg', false, now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'L''Oreal Paris Revitalift Hyaluronic Acid Serum 30ml');
INSERT INTO product_images (id, product_id, url, sort_order)
SELECT gen_random_uuid(), p.id, '/images/store/product-serum.jpg', 0 FROM products p
WHERE p.name = 'L''Oreal Paris Revitalift Hyaluronic Acid Serum 30ml'
  AND NOT EXISTS (SELECT 1 FROM product_images i WHERE i.product_id = p.id AND i.url = '/images/store/product-serum.jpg');
INSERT INTO product_variants (id, product_id, name, sku, price, quantity_in_stock, attributes)
SELECT gen_random_uuid(), p.id, '30ml', 'LOR-SERUM-30', 649, 60, '{"size":"30ml"}' FROM products p
WHERE p.name = 'L''Oreal Paris Revitalift Hyaluronic Acid Serum 30ml' AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.sku = 'LOR-SERUM-30');
INSERT INTO inventories (id, product_id, quantity)
SELECT gen_random_uuid(), p.id, 60 FROM products p WHERE p.name = 'L''Oreal Paris Revitalift Hyaluronic Acid Serum 30ml'
  AND NOT EXISTS (SELECT 1 FROM inventories i WHERE i.product_id = p.id);

-- 20. Mamaearth Vitamin C Face Wash
INSERT INTO products (id, name, unit_price, original_price, brand, badge, featured, description, category_id, image_url, deleted, created_date)
SELECT gen_random_uuid(), 'Mamaearth Vitamin C Foaming Face Wash 150ml', 299, 399, 'Mamaearth', 'SALE', false,
       'Sulphate-free foaming face wash with vitamin C and turmeric for tan removal and natural glow. Dermatologically tested.',
       (SELECT id FROM categories WHERE slug = 'skincare'), NULL, false, now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Mamaearth Vitamin C Foaming Face Wash 150ml');
INSERT INTO product_variants (id, product_id, name, sku, price, quantity_in_stock, attributes)
SELECT gen_random_uuid(), p.id, '150ml', 'MAM-VCFW-150', 299, 70, '{"size":"150ml"}' FROM products p
WHERE p.name = 'Mamaearth Vitamin C Foaming Face Wash 150ml' AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.sku = 'MAM-VCFW-150');
INSERT INTO product_variants (id, product_id, name, sku, price, quantity_in_stock, attributes)
SELECT gen_random_uuid(), p.id, '250ml', 'MAM-VCFW-250', 449, 45, '{"size":"250ml"}' FROM products p
WHERE p.name = 'Mamaearth Vitamin C Foaming Face Wash 150ml' AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.sku = 'MAM-VCFW-250');
INSERT INTO inventories (id, product_id, quantity)
SELECT gen_random_uuid(), p.id, 115 FROM products p WHERE p.name = 'Mamaearth Vitamin C Foaming Face Wash 150ml'
  AND NOT EXISTS (SELECT 1 FROM inventories i WHERE i.product_id = p.id);

-- 21. Boldfit Yoga Mat
INSERT INTO products (id, name, unit_price, original_price, brand, badge, featured, description, category_id, image_url, deleted, created_date)
SELECT gen_random_uuid(), 'Boldfit Anti-Skid Yoga Mat 6mm with Strap', 799, 1499, 'Boldfit', 'BESTSELLER', false,
       '6mm cushioned EVA yoga mat with anti-skid texture, carry strap and sweat-resistant surface for home workouts.',
       (SELECT id FROM categories WHERE slug = 'fitness'), '/images/store/product-yogamat.jpg', false, now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Boldfit Anti-Skid Yoga Mat 6mm with Strap');
INSERT INTO product_images (id, product_id, url, sort_order)
SELECT gen_random_uuid(), p.id, '/images/store/product-yogamat.jpg', 0 FROM products p
WHERE p.name = 'Boldfit Anti-Skid Yoga Mat 6mm with Strap'
  AND NOT EXISTS (SELECT 1 FROM product_images i WHERE i.product_id = p.id AND i.url = '/images/store/product-yogamat.jpg');
INSERT INTO product_variants (id, product_id, name, sku, price, quantity_in_stock, attributes)
SELECT gen_random_uuid(), p.id, 'Blue 6mm', 'BLD-YOGA-BLU6', 799, 55, '{"color":"Blue","thickness":"6mm"}' FROM products p
WHERE p.name = 'Boldfit Anti-Skid Yoga Mat 6mm with Strap' AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.sku = 'BLD-YOGA-BLU6');
INSERT INTO product_variants (id, product_id, name, sku, price, quantity_in_stock, attributes)
SELECT gen_random_uuid(), p.id, 'Green 6mm', 'BLD-YOGA-GRN6', 799, 48, '{"color":"Green","thickness":"6mm"}' FROM products p
WHERE p.name = 'Boldfit Anti-Skid Yoga Mat 6mm with Strap' AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.sku = 'BLD-YOGA-GRN6');
INSERT INTO product_variants (id, product_id, name, sku, price, quantity_in_stock, attributes)
SELECT gen_random_uuid(), p.id, 'Purple 4mm', 'BLD-YOGA-PUR4', 699, 36, '{"color":"Purple","thickness":"4mm"}' FROM products p
WHERE p.name = 'Boldfit Anti-Skid Yoga Mat 6mm with Strap' AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.sku = 'BLD-YOGA-PUR4');
INSERT INTO inventories (id, product_id, quantity)
SELECT gen_random_uuid(), p.id, 139 FROM products p WHERE p.name = 'Boldfit Anti-Skid Yoga Mat 6mm with Strap'
  AND NOT EXISTS (SELECT 1 FROM inventories i WHERE i.product_id = p.id);

-- 22. Kore Dumbbell Set
INSERT INTO products (id, name, unit_price, original_price, brand, badge, featured, description, category_id, image_url, deleted, created_date)
SELECT gen_random_uuid(), 'Kore PVC Dumbbell Set for Home Gym', 1299, 2499, 'Kore', 'SALE', false,
       'Rust-proof PVC dumbbell set with flat and round plates, steel rods and star locks for full-body strength training.',
       (SELECT id FROM categories WHERE slug = 'fitness'), NULL, false, now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Kore PVC Dumbbell Set for Home Gym');
INSERT INTO product_variants (id, product_id, name, sku, price, quantity_in_stock, attributes)
SELECT gen_random_uuid(), p.id, '10kg Set', 'KORE-DB-10KG', 899, 30, '{"weight":"10kg"}' FROM products p
WHERE p.name = 'Kore PVC Dumbbell Set for Home Gym' AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.sku = 'KORE-DB-10KG');
INSERT INTO product_variants (id, product_id, name, sku, price, quantity_in_stock, attributes)
SELECT gen_random_uuid(), p.id, '20kg Set', 'KORE-DB-20KG', 1299, 22, '{"weight":"20kg"}' FROM products p
WHERE p.name = 'Kore PVC Dumbbell Set for Home Gym' AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.sku = 'KORE-DB-20KG');
INSERT INTO inventories (id, product_id, quantity)
SELECT gen_random_uuid(), p.id, 52 FROM products p WHERE p.name = 'Kore PVC Dumbbell Set for Home Gym'
  AND NOT EXISTS (SELECT 1 FROM inventories i WHERE i.product_id = p.id);

-- 23. Nivia Skipping Rope
INSERT INTO products (id, name, unit_price, original_price, brand, badge, featured, description, category_id, image_url, deleted, created_date)
SELECT gen_random_uuid(), 'Nivia Trainer Adjustable Skipping Rope', 249, 399, 'Nivia', 'NEW', false,
       'Adjustable-length speed rope with foam-grip handles and tangle-free cable for cardio, boxing and cross-training.',
       (SELECT id FROM categories WHERE slug = 'fitness'), NULL, false, now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Nivia Trainer Adjustable Skipping Rope');
INSERT INTO product_variants (id, product_id, name, sku, price, quantity_in_stock, attributes)
SELECT gen_random_uuid(), p.id, 'Standard', 'NIV-SKIP-STD', 249, 80, '{"length":"Adjustable"}' FROM products p
WHERE p.name = 'Nivia Trainer Adjustable Skipping Rope' AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.sku = 'NIV-SKIP-STD');
INSERT INTO inventories (id, product_id, quantity)
SELECT gen_random_uuid(), p.id, 80 FROM products p WHERE p.name = 'Nivia Trainer Adjustable Skipping Rope'
  AND NOT EXISTS (SELECT 1 FROM inventories i WHERE i.product_id = p.id);

-- 24. Canon EOS 1500D DSLR
INSERT INTO products (id, name, unit_price, original_price, brand, badge, featured, description, category_id, image_url, deleted, created_date)
SELECT gen_random_uuid(), 'Canon EOS 1500D DSLR Camera with 18-55mm Lens', 42999, 51999, 'Canon', 'FEATURED', true,
       '24.1MP APS-C DSLR with 18-55mm kit lens, Full HD video, built-in Wi-Fi and NFC for easy sharing.',
       (SELECT id FROM categories WHERE slug = 'electronics'), NULL, false, now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Canon EOS 1500D DSLR Camera with 18-55mm Lens');
INSERT INTO product_variants (id, product_id, name, sku, price, quantity_in_stock, attributes)
SELECT gen_random_uuid(), p.id, 'With 18-55mm Lens', 'CAN-1500D-KIT', 42999, 6, '{"lens":"18-55mm"}' FROM products p
WHERE p.name = 'Canon EOS 1500D DSLR Camera with 18-55mm Lens' AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.sku = 'CAN-1500D-KIT');
INSERT INTO inventories (id, product_id, quantity)
SELECT gen_random_uuid(), p.id, 6 FROM products p WHERE p.name = 'Canon EOS 1500D DSLR Camera with 18-55mm Lens'
  AND NOT EXISTS (SELECT 1 FROM inventories i WHERE i.product_id = p.id);
