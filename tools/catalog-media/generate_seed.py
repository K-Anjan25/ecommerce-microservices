#!/usr/bin/env python3
"""Generate docker/postgres/seed-catalog-data.sql — the real catalog dataset.

One row per product: real model data (specs/INR prices), real colourway
variants with swatches, and multi-angle photography gathered from the web
(manifest.json in this folder records every source URL).

Regenerate:  python3 tools/catalog-media/generate_seed.py
"""
import json, os, sys

OUT = "docker/postgres/seed-catalog-data.sql"
IMG = "/images/catalog"  # served from frontend/public/images/catalog

# (name, slug, category, brand, price, mrp, badge, featured, description,
#  images: [(file, angle, alt, sku|None)], variants: [(sku, vname, price, stock, attrs, swatch, img|None)], stock)
P = [
("Sony WH-1000XM5 Wireless Headphones", "sony-wh-1000xm5", "audio", "Sony", 26990, 34990, "BESTSELLER", True,
 "Industry-leading noise cancelling (8 microphones, Auto NC Optimizer), 30-hour battery, 3 min quick charge for 3 hours playback, multipoint Bluetooth, crystal-clear hands-free calling, speak-to-chat, DSEE Extreme upscaling. ~250 g, fold-flat soft-fit leather.",
 [("03", "front", "Sony WH-1000XM5 in Black, three-quarter front view", "SONY-XM5-BLK"),
  ("04", "variant", "Sony WH-1000XM5 in Silver on stand", "SONY-XM5-SLV"),
  ("05", "detail", "WH-1000XM5 headband and earcup detail, top view", None),
  ("01", "box", "WH-1000XM5 carrying case, cables and accessories", None),
  ("06", "lifestyle", "WH-1000XM5 held in hand", None),
  ("02", "gallery", "WH-1000XM5 in Black and Silver colourways", None)],
 [("SONY-XM5-BLK", "Black", 26990, 12, '{"color":"Black"}', "#202020", "03"),
  ("SONY-XM5-SLV", "Silver", 26990, 8, '{"color":"Silver"}', "#c9c4bc", "04")], 20),

("boAt Airdopes 141 TWS Earbuds", "boat-airdopes-141", "audio", "boAt", 1299, 4490, "SALE", False,
 "True wireless earbuds with 42-hour total playback, 13 mm drivers, ENx noise cancellation for calls with quad mics, 80 ms low-latency gaming mode, IPX4 sweat resistance, IWP instant wake-pair, Type-C ASAP charge (5 min = 75 min).",
 [("01", "front", "boAt Airdopes 141 in Bold Black with charging case", "BOAT-141-BLK"),
  ("05", "variant", "boAt Airdopes 141 in Pure White, earbuds pair", "BOAT-141-WHT"),
  ("03", "detail", "Airdopes 141 quad mics with ENx technology", None),
  ("08", "box", "Airdopes 141 retail pack contents", None),
  ("04", "lifestyle", "Airdopes 141 in Bold Black, water splash", "BOAT-141-BLK"),
  ("06", "gallery", "Airdopes 141 Pure White charging case", "BOAT-141-WHT"),
  ("02", "gallery", "Airdopes 141 charging case with earbuds", None),
  ("07", "gallery", "Airdopes 141 earbud close-up, immersive audio", None)],
 [("BOAT-141-BLK", "Bold Black", 1299, 40, '{"color":"Bold Black"}', "#1a1a1a", "01"),
  ("BOAT-141-WHT", "Pure White", 1299, 35, '{"color":"Pure White"}', "#f2f2f2", "05"),
  ("BOAT-141-BLU", "Aqua Blue", 1349, 25, '{"color":"Aqua Blue"}', "#6ec6d9", None)], 100),

("JBL Flip 6 Portable Bluetooth Speaker", "jbl-flip-6", "audio", "JBL", 9999, 14999, "SALE", False,
 "Portable Bluetooth speaker with JBL Original Pro Sound, racetrack-shaped woofer + separate tweeter, 12 hours of playtime, IP67 waterproof and dustproof, PartyBoost pairing, USB-C quick charge, bold fabric wrap.",
 [("07", "front", "JBL Flip 6 in Grey, product view", "JBL-FLIP6-GRY"),
  ("05", "variant", "JBL Flip 6 in Squad camo colourway", "JBL-FLIP6-SQD"),
  ("04", "variant", "JBL Flip 6 in Red held in hand outdoors", "JBL-FLIP6-RED"),
  ("08", "detail", "JBL Flip 6 Grey, angled view", "JBL-FLIP6-GRY"),
  ("01", "lifestyle", "JBL Flip 6 in Red on an outdoor trip", "JBL-FLIP6-RED"),
  ("09", "gallery", "JBL Flip 6 Grey on white", "JBL-FLIP6-GRY"),
  ("06", "gallery", "JBL Flip 6 Squad camo on rock", "JBL-FLIP6-SQD"),
  ("02", "gallery", "JBL Flip 6 colour lineup", None)],
 [("JBL-FLIP6-GRY", "Grey", 9999, 15, '{"color":"Grey"}', "#6d6d6d", "07"),
  ("JBL-FLIP6-SQD", "Squad", 9999, 9, '{"color":"Squad"}', "#4d563f", "05"),
  ("JBL-FLIP6-RED", "Red", 9999, 11, '{"color":"Red"}', "#d32f2f", "04")], 24),

("Logitech MX Keys S Wireless Keyboard", "logitech-mx-keys-s", "computers", "Logitech", 11995, 13995, "NEW", False,
 "Low-profile wireless keyboard with smart illuminated backlighting, Perfect Stroke keys, Smart Actions shortcuts, easy-switch pairing for up to 3 devices (Bluetooth/Bolt), USB-C rechargeable, macOS + Windows + iPadOS.",
 [("01", "front", "Logitech MX Keys S in Graphite with Bolt receiver", "LOGI-MXS-GRP"),
  ("02", "side", "MX Keys S Graphite, angled side view", "LOGI-MXS-GRP"),
  ("03", "detail", "MX Keys S low-profile keys detail", None),
  ("04", "lifestyle", "MX Keys S on a desk", None)],
 [("LOGI-MXS-GRP", "Graphite", 11995, 18, '{"color":"Graphite"}', "#3b3b3b", "01"),
  ("LOGI-MXS-GRY", "Pale Grey", 11995, 11, '{"color":"Pale Grey"}', "#d5d5d8", None)], 29),

("HP Pavilion 15 Laptop (Ryzen 5 7530U, 16GB, 512GB)", "hp-pavilion-15", "computers", "HP", 58990, 69999, "NEW", True,
 "15.6-inch FHD IPS micro-edge display, AMD Ryzen 5 7530U (6 cores, up to 4.3 GHz), 16GB DDR4 RAM, 512GB PCIe SSD, AMD Radeon Graphics, backlit keyboard, B&O audio, 720p HD camera with privacy shutter, Fast Charge, Windows 11 Home + MSO 2021.",
 [("01", "front", "HP Pavilion 15 open, front view", "HP-PAV15-16512"),
  ("02", "side", "HP Pavilion 15 open at an angle", "HP-PAV15-16512"),
  ("03", "gallery", "HP Pavilion 15 front view with wallpaper", None),
  ("04", "gallery", "HP Pavilion 15 on white", None),
  ("05", "detail", "HP Pavilion 15 keyboard deck and Ryzen 5 sticker", "HP-PAV15-161TB")],
 [("HP-PAV15-16512", "16GB / 512GB", 58990, 7, '{"ram":"16GB","storage":"512GB"}', "#b7b4ae", "01"),
  ("HP-PAV15-161TB", "16GB / 1TB", 64990, 4, '{"ram":"16GB","storage":"1TB"}', "#b7b4ae", "01")], 11),

("Lenovo IdeaPad Slim 3 (i5 13th Gen, 16GB, 512GB)", "lenovo-ideapad-slim-3", "computers", "Lenovo", 52990, 62990, "NEW", False,
 "15.6-inch FHD display, 13th Gen Intel Core i5-13420H, 16GB LPDDR5, 512GB SSD, Intel UHD Graphics, slim 1.62 kg Arctic Grey chassis, rapid charge, Wi-Fi 6, privacy shutter, Windows 11 Home + MSO 2021.",
 [("01", "front", "Lenovo IdeaPad Slim 3 in Arctic Grey, open front", "LEN-SLIM3-16512"),
  ("02", "side", "IdeaPad Slim 3 open at an angle", "LEN-SLIM3-16512"),
  ("03", "gallery", "IdeaPad Slim 3 on white", None),
  ("04", "gallery", "IdeaPad Slim 3 product view", None),
  ("05", "detail", "IdeaPad Slim 3 with Intel Core badge", None)],
 [("LEN-SLIM3-16512", "16GB / 512GB", 52990, 9, '{"ram":"16GB","storage":"512GB"}', "#9aa0a6", "01")], 9),

("Samsung Galaxy S24 5G (8GB, 256GB)", "samsung-galaxy-s24", "mobiles-tablets", "Samsung", 62999, 74999, "BESTSELLER", True,
 "6.2-inch Dynamic AMOLED 2X, 120 Hz, Exynos 2400 / Snapdragon 8 Gen 3 (region), 8GB RAM + 256GB, 50 MP triple camera with Galaxy AI (Circle to Search, Live Translate), 4000 mAh with 25 W charging, IP68, Gorilla Glass Victus 2, armour aluminium frame.",
 [("01", "front", "Galaxy S24 in Onyx Black, front and back", "SAM-S24-BLK"),
  ("05", "variant", "Galaxy S24 in Marble Grey, front and back", "SAM-S24-GRY"),
  ("03", "detail", "Galaxy S24 Onyx Black, large product view", "SAM-S24-BLK"),
  ("04", "gallery", "Galaxy S24 official colour render", None),
  ("02", "gallery", "Galaxy S24 in graphite, pair view", None)],
 [("SAM-S24-BLK", "Onyx Black", 62999, 14, '{"color":"Onyx Black","storage":"256GB"}', "#1c1c1c", "01"),
  ("SAM-S24-GRY", "Marble Grey", 62999, 10, '{"color":"Marble Grey","storage":"256GB"}', "#b9b6b0", "05"),
  ("SAM-S24-VLT", "Cobalt Violet", 62999, 6, '{"color":"Cobalt Violet","storage":"256GB"}', "#6b5b95", None)], 30),

("Redmi Note 13 5G (6GB, 128GB)", "redmi-note-13", "mobiles-tablets", "Redmi", 15999, 18999, "SALE", False,
 "6.67-inch AMOLED 120 Hz display, MediaTek Dimensity 6080, 6GB RAM + 128GB, 108 MP triple camera, 5000 mAh with 33 W fast charging, slim bezel design, side fingerprint, IR blaster, Android 13 + MIUI 14.",
 [("04", "front", "Redmi Note 13 5G in Graphite Black, front and back", "RED-N13-BLK"),
  ("02", "variant", "Redmi Note 13 5G in Ocean Sunset colourway", "RED-N13-OCN"),
  ("03", "detail", "Redmi Note 13 5G back with triple camera", None),
  ("01", "gallery", "Redmi Note 13 5G product render", None),
  ("05", "gallery", "Redmi Note 13 5G colour poster", None)],
 [("RED-N13-BLK", "Graphite Black", 15999, 22, '{"color":"Graphite Black","storage":"128GB"}', "#2b2b2b", "04"),
  ("RED-N13-OCN", "Ocean Sunset", 15999, 16, '{"color":"Ocean Sunset","storage":"128GB"}', "#5fc9c3", "02")], 38),

("Noise ColorFit Pro 5 Smartwatch", "noise-colorfit-pro-5", "wearables", "Noise", 2999, 6999, "SALE", False,
 "1.85-inch AMOLED always-on display (46.99 mm), Bluetooth calling with built-in speaker and mic, AI voice assistant, 100+ sports modes, SpO2 and heart-rate tracking, sleep and stress monitoring, IP68 water resistant, 7-day battery.",
 [("02", "front", "Noise ColorFit Pro 5 in Jet Black, metal strap", "NOISE-P5-BLK"),
  ("03", "variant", "ColorFit Pro 5 in Deep Wine rose-gold", "NOISE-P5-WNE"),
  ("05", "detail", "ColorFit Pro 5 Midnight Black, display and strap", "NOISE-P5-BLK"),
  ("04", "gallery", "ColorFit Pro 5 Silver Grey, case back sensors", "NOISE-P5-SLV"),
  ("01", "gallery", "ColorFit Pro 5 hero render with watch faces", None)],
 [("NOISE-P5-BLK", "Jet Black", 2999, 45, '{"color":"Jet Black"}', "#101010", "02"),
  ("NOISE-P5-SLV", "Silver Grey", 2999, 30, '{"color":"Silver Grey"}', "#9a9a9a", "04"),
  ("NOISE-P5-WNE", "Deep Wine", 3199, 20, '{"color":"Deep Wine"}', "#6d1a36", "03")], 75),

("Fire-Boltt Ninja Call Pro Plus Smartwatch", "fire-boltt-ninja-call-pro-plus", "wearables", "Fire-Boltt", 1499, 4999, "SALE", False,
 "1.83-inch (46.48 mm) HD display, Bluetooth calling with AI voice assistant, 240x280 resolution, 100+ sports modes, SpO2 and heart-rate monitoring, IP67 rating, built-in games, smart notifications, 5-day battery.",
 [("02", "front", "Fire-Boltt Ninja Call Pro Plus in Black and Gold", "FB-NINJA-BLK"),
  ("05", "detail", "Ninja Call Pro Plus with IP67 water resistance", "FB-NINJA-BLK"),
  ("03", "gallery", "Ninja Call Pro Plus 1.83-inch display infographic", None),
  ("04", "gallery", "Ninja Call Pro Plus feature collage", None),
  ("01", "gallery", "Ninja Call Pro Plus AI voice assistant banner", None)],
 [("FB-NINJA-BLK", "Black", 1499, 50, '{"color":"Black"}', "#111111", "02"),
  ("FB-NINJA-BLU", "Blue", 1499, 33, '{"color":"Blue"}', "#2244aa", None)], 83),

("Nike Air Zoom Pegasus 40 Running Shoes", "nike-pegasus-40", "footwear", "Nike", 7995, 9995, "BESTSELLER", False,
 "Road running shoe with React foam + forefoot and heel Air Zoom units, engineered mesh upper with waffle outsole, neutral support, 10 mm drop, versatile daily trainer for 5K to marathon. Men's sizing (UK 6-12).",
 [("01", "front", "Nike Air Zoom Pegasus 40 in Black/White, side view", None),
  ("03", "gallery", "Pegasus 40 white colourway pair with outsole", None),
  ("04", "variant", "Pegasus 40 in Wolf Grey/Volt (DV3853-004)", None),
  ("05", "gallery", "Pegasus 40 in Platinum Tint (DV3853-006)", None),
  ("02", "gallery", "Pegasus 40 white colourway close-up", None)],
 [("NIKE-PEG40-8", "UK 8", 7995, 14, '{"size":"UK 8"}', "#e8e8e8", "01"),
  ("NIKE-PEG40-9", "UK 9", 7995, 18, '{"size":"UK 9"}', "#e8e8e8", "01"),
  ("NIKE-PEG40-10", "UK 10", 7995, 12, '{"size":"UK 10"}', "#e8e8e8", "01")], 44),

("Adidas Ultraboost Light Running Shoes", "adidas-ultraboost-light", "footwear", "Adidas", 12999, 16999, "NEW", False,
 "Ultraboost Light with 30% lighter BOOST midsole, Primeknit+ upper, Linear Energy Push system, Continental Natural Grip outsole, 10 mm drop. Race-day comfort for daily runs. Men's sizing (UK 6-12).",
 [("01", "front", "adidas Ultraboost Light in Black, side view", None),
  ("02", "side", "Ultraboost Light Black, three-quarter view", None),
  ("03", "detail", "Ultraboost Light Black pair, top-down", None),
  ("04", "lifestyle", "Ultraboost Light Black on wooden floor", None)],
 [("ADI-UBL-8", "UK 8", 12999, 10, '{"size":"UK 8"}', "#e8e8e8", "01"),
  ("ADI-UBL-9", "UK 9", 12999, 13, '{"size":"UK 9"}', "#e8e8e8", "01"),
  ("ADI-UBL-10", "UK 10", 12999, 8, '{"size":"UK 10"}', "#e8e8e8", "01")], 31),

("Puma RS-X Reinvention Sneakers", "puma-rs-x", "footwear", "Puma", 5499, 8999, "SALE", False,
 "Chunky retro-running sneaker with RS (Running System) cushioning midsole, mixed mesh and suede upper, bold colour-blocking, rubber outsole. Unisex sizing. Colourway: PUMA White-Vapor Gray with pink and blue accents.",
 [("01", "front", "Puma RS-X Reinvention in White/Vapor Gray, pair", None),
  ("02", "side", "RS-X Reinvention three-quarter front angle", None),
  ("03", "back", "RS-X Reinvention rear heel view", None),
  ("04", "detail", "RS-X Reinvention side profile", None),
  ("05", "variant", "RS-X Reinvention in Red/White colourway", None)],
 [("PUMA-RSX-8", "UK 8", 5499, 16, '{"size":"UK 8"}', "#f0efeb", "01"),
  ("PUMA-RSX-9", "UK 9", 5499, 20, '{"size":"UK 9"}', "#f0efeb", "01")], 36),

("Levi's 511 Slim Fit Mid-Rise Jeans", "levis-511", "men", "Levi's", 2399, 3999, "SALE", False,
 "Slim fit through the hip and thigh with a mid rise, stretch denim for comfort, classic 5-pocket styling, signature leather patch and red tab. Shown in dark and medium stonewash. Sizes: waist 30-34.",
 [("03", "front", "Levi's 511 Slim Fit jeans, model view", None),
  ("04", "detail", "Levi's 511 dark wash on hanger", None),
  ("01", "detail", "Levi's 511 leather patch close-up", None),
  ("02", "gallery", "Levi's 511 folded, back pocket detail", None),
  ("05", "gallery", "Levi's 511 in light stonewash", None)],
 [("LEVI-511-30", "Waist 30", 2399, 25, '{"size":"30"}', "#3c4a5a", "03"),
  ("LEVI-511-32", "Waist 32", 2399, 32, '{"size":"32"}', "#3c4a5a", "03"),
  ("LEVI-511-34", "Waist 34", 2399, 21, '{"size":"34"}', "#3c4a5a", "03")], 78),

("American Tourister 55cm Travel Duffel Bag", "american-tourister-duffel", "men", "American Tourister", 1499, 2799, "SALE", False,
 "55 cm (55 L) travel duffel with spacious main compartment, front zip pocket, padded carry handles and detachable shoulder strap, durable polyester build. Cabin-size friendly on most airlines.",
 [("01", "front", "American Tourister 55cm duffel in Black, front", "AT-DUF55-BLK"),
  ("02", "side", "Am. Tourister duffel in Black, side view", "AT-DUF55-BLK"),
  ("03", "detail", "Am. Tourister duffel Black, handles and zips", None),
  ("05", "lifestyle", "Am. Tourister duffel carried on shoulder", None),
  ("04", "gallery", "Am. Tourister duffel, grey wheeled variant", None)],
 [("AT-DUF55-BLK", "Black", 1499, 26, '{"color":"Black"}', "#161616", "01"),
  ("AT-DUF55-RED", "Red", 1499, 17, '{"color":"Red"}', "#b71c1c", None)], 43),

("Hawkins Contura Aluminium Pressure Cooker", "hawkins-contura", "cookware", "Hawkins", 1950, 2450, "BESTSELLER", False,
 "Hard-anodised / plain aluminium Contura with rounded body for easy stirring, inner-lid design, stay-cool handle, gasket-release system for safety, gas and induction compatible base. 3 litre capacity ideal for 3-4 people.",
 [("01", "front", "Hawkins Contura 3 litre pressure cooker, silver", "HWK-CTR-3L"),
  ("02", "side", "Hawkins Contura new-shape 3 litre, side view", "HWK-CTR-3L"),
  ("03", "variant", "Hawkins Contura hard anodised black (CB30)", None),
  ("04", "gallery", "Hawkins Contura pressure cooker front view", None)],
 [("HWK-CTR-3L", "3 Litre", 1950, 28, '{"capacity":"3L"}', "#c0c0c0", "01"),
  ("HWK-CTR-5L", "5 Litre", 2200, 34, '{"capacity":"5L"}', "#c0c0c0", "01")], 62),

("Prestige Non-Stick Cookware Set (5 Pieces)", "prestige-cookware-set", "cookware", "Prestige", 2799, 4999, "SALE", False,
 "Non-stick cookware set: fry pan, kadai with glass lid, sauce pan with lid and tawa (5 pieces). Granite/Eco non-stick coating, induction and gas compatible, soft-touch handles, dishwasher friendly. From the Omega/Eco families.",
 [("01", "front", "Prestige non-stick cookware set, green pans with lids", None),
  ("02", "detail", "Prestige Omega Granite BYK cookware set", None),
  ("03", "gallery", "Prestige Omega Deluxe Granite 3-piece set", None),
  ("04", "gallery", "Prestige Omega Deluxe Granite Alpha set", None)],
 [("PRSTG-NS5-STD", "Standard", 2799, 24, '{"pieces":"5"}', "#3e5641", "01")], 24),

("Philips Air LED Table Lamp 5W", "philips-air-lamp", "home-decor", "Philips", 899, 1299, "NEW", False,
 "Slim LED table lamp with 5W energy-efficient LED, cool-daylight and warm modes, touch dimmer, USB-powered flexible arm, flicker-free eye-comfort light. 34.4 cm tall — desk and bedside friendly.",
 [("03", "front", "Philips Air 5W LED table lamp in Black, front", "PHL-LAMP-BLK"),
  ("02", "lifestyle", "Philips Air LED lamp on a work desk", "PHL-LAMP-BLK"),
  ("01", "detail", "Philips Air LED lamp dimensions (34.4 x 27 cm)", None)],
 [("PHL-LAMP-WHT", "White", 899, 40, '{"color":"White"}', "#efefef", None),
  ("PHL-LAMP-BLK", "Black", 949, 27, '{"color":"Black"}', "#1b1b1b", "03")], 67),

("L'Oreal Paris Revitalift Hyaluronic Acid Serum 30ml", "loreal-revitalift-serum", "skincare", "L'Oreal Paris", 649, 799, "BESTSELLER", True,
 "1.5% pure hyaluronic acid serum (Revitalift Filler): intensely hydrates and replumps skin in 1 hour, reduces fine lines over 4 weeks, fragrance-free, non-greasy. Morning and night on clean skin, before moisturiser. 30 ml dropper bottle.",
 [("02", "front", "L'Oreal Revitalift Filler 1.5% Hyaluronic Acid serum bottle", "LOR-SERUM-30"),
  ("03", "side", "Revitalift hyaluronic acid serum, front view", "LOR-SERUM-30"),
  ("01", "box", "Revitalift serum retail blister pack", None),
  ("04", "lifestyle", "L'Oreal Revitalift serum campaign visual", None)],
 [("LOR-SERUM-30", "30ml", 649, 60, '{"size":"30ml"}', "#b39ddb", "02")], 60),

("Mamaearth Vitamin C Foaming Face Wash 150ml", "mamaearth-vitamin-c-face-wash", "skincare", "Mamaearth", 299, 349, "SALE", True,
 "Vitamin C foaming face wash with turmeric and saffron: gently cleanses and brightens, removes dirt and excess oil, evens skin tone, suits all skin types, silicone brush applicator, toxin-free and SLS-free. 150 ml.",
 [("01", "front", "Mamaearth Vitamin C foaming face wash 150ml, bottle", "MAM-VCFW-150"),
  ("05", "side", "Mamaearth Vitamin C face wash pump bottle", "MAM-VCFW-150"),
  ("02", "box", "Mamaearth Vitamin C face wash retail box and bottle", None),
  ("04", "gallery", "Mamaearth Vitamin C face wash pack shot", None),
  ("03", "gallery", "Mamaearth Vitamin C face wash with Vitamin C graphic", None)],
 [("MAM-VCFW-150", "150ml", 299, 70, '{"size":"150ml"}', "#f3e5ab", "01"),
  ("MAM-VCFW-250", "250ml", 449, 45, '{"size":"250ml"}', "#f3e5ab", "01")], 115),

("Boldfit Anti-Skid Yoga Mat 6mm with Strap", "boldfit-yoga-mat", "fitness", "Boldfit", 799, 1499, "SALE", False,
 "6 mm high-density anti-skid yoga mat with alignment lines, soft foam cushioning for knees and joints, moisture-resistant and easy to clean, includes carry strap. 183 x 61 cm, for yoga, Pilates and home workouts.",
 [("03", "front", "Boldfit yoga mat 6mm in Blue, rolled with strap", "BLD-YOGA-BLU6"),
  ("02", "variant", "Boldfit yoga mat 6mm in Green, rolled with strap", "BLD-YOGA-GRN6"),
  ("04", "detail", "Boldfit yoga mat, lightweight and portable", "BLD-YOGA-BLU6"),
  ("01", "lifestyle", "Boldfit yoga mat carried outdoors", None)],
 [("BLD-YOGA-BLU6", "Blue 6mm", 799, 55, '{"color":"Blue","thickness":"6mm"}', "#2f6fed", "03"),
  ("BLD-YOGA-GRN6", "Green 6mm", 799, 48, '{"color":"Green","thickness":"6mm"}', "#2e7d32", "02"),
  ("BLD-YOGA-PUR4", "Purple 4mm", 699, 36, '{"color":"Purple","thickness":"4mm"}', "#6a3ab2", None)], 139),

("Kore PVC Dumbbell Set for Home Gym", "kore-dumbbell-set", "fitness", "Kore", 899, 1599, "SALE", False,
 "PVC home gym combo: dumbbell rods with weight plates (10 kg / 20 kg sets), curl rod options, non-slip grip, floor-safe PVC coating. Complete home strength setup with gym bag and gloves in selected sets.",
 [("01", "front", "Kore PVC dumbbell set with curl rod and plates", "KORE-DB-10KG"),
  ("02", "box", "Kore PVC home gym set with bag and accessories", "KORE-DB-20KG"),
  ("03", "detail", "Kore PVC weight plates and rods", None)],
 [("KORE-DB-10KG", "10kg Set", 899, 30, '{"weight":"10kg"}', "#222222", "01"),
  ("KORE-DB-20KG", "20kg Set", 1299, 22, '{"weight":"20kg"}', "#222222", "02")], 52),

("Nivia Trainer Adjustable Skipping Rope", "nivia-skipping-rope", "fitness", "Nivia", 249, 399, "NEW", False,
 "Nivia Trainer jump rope with spring-loaded anti-tangle cable, adjustable height and speed, comfortable foam grip handles, ball-bearing smooth rotation for freestyle, cardio and boxing training. Men, women and children.",
 [("01", "front", "Nivia Trainer adjustable skipping rope in Black", "NIV-SKIP-STD"),
  ("03", "side", "Nivia Trainer jump rope, coiled", "NIV-SKIP-STD"),
  ("02", "variant", "Nivia Trainer jump rope in Green", "NIV-SKIP-STD")],
 [("NIV-SKIP-STD", "Standard", 249, 80, '{"length":"Adjustable"}', "#222222", "01")], 80),

 ("Canon EOS 1500D DSLR Camera with 18-55mm Lens", "canon-eos-1500d", "electronics", "Canon", 42999, 49999, "BESTSELLER", True,
 "24.1 MP APS-C CMOS DSLR with EF-S 18-55mm f/3.5-5.6 III kit lens, DIGIC 4+ processor, 9-point AF with center cross-type, 3 fps continuous shooting, 3.0-inch LCD, Wi-Fi + NFC sharing, 1080p video, guided UI for beginners. Body + kit lens.",
 [("01", "front", "Canon EOS 1500D with 18-55mm lens, front view", "CAN-1500D-KIT"),
  ("04", "side", "Canon EOS 1500D side view with lens", "CAN-1500D-KIT"),
  ("05", "back", "Canon EOS 1500D rear LCD and controls", "CAN-1500D-KIT"),
  ("02", "detail", "Canon EOS 1500D top view, mode dial and hot shoe", None),
  ("03", "box", "Canon EOS 1500D body with 18-55mm kit lens, unpacked", None)],
 [("CAN-1500D-KIT", "With 18-55mm Lens", 42999, 6, '{"lens":"18-55mm"}', "#222222", "01")], 6),
]

def esc(s):
    return s.replace("'", "''") if s else s

def sql_product(p):
    (name, slug, cat, brand, price, mrp, badge, feat, desc, imgs, variants, stock) = p
    out = []
    hero = f"{IMG}/{slug}/01.jpg"
    out.append(f"-- {name}")
    out.append(
        "INSERT INTO products (id, name, unit_price, original_price, brand, badge, featured, description, category_id, image_url, deleted, created_date, subscribe_eligible)\n"
        f"SELECT gen_random_uuid(), '{esc(name)}', {price}, {mrp}, '{esc(brand)}', '{badge}', {'true' if feat else 'false'},\n"
        f"       '{esc(desc)}',\n"
        f"       (SELECT id FROM categories WHERE slug = '{cat}'), '{hero}', false, now(), true\n"
        f"WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = '{esc(name)}');\n"
        f"UPDATE products SET image_url = '{hero}', subscribe_eligible = true WHERE name = '{esc(name)}';")
    # gallery refresh (idempotent rebuild per product)
    pid = f"(SELECT id FROM products WHERE name = '{esc(name)}')"
    out.append(f"DELETE FROM product_images WHERE product_id = {pid};")
    for i, (fno, angle, alt, sku) in enumerate(imgs):
        vid = f"(SELECT id FROM product_variants WHERE sku = '{sku}')" if sku else "NULL"
        out.append(
            "INSERT INTO product_images (id, product_id, url, sort_order, variant_id, angle, alt_text)\n"
            f"SELECT gen_random_uuid(), {pid}, '{IMG}/{slug}/{fno}.jpg', {i}, {vid}, '{angle}', '{esc(alt)}';")
    # variants: upsert by sku
    for (sku, vname, vprice, vstock, attrs, swatch, img) in variants:
        vimg = f"{IMG}/{slug}/{img}.jpg" if img else "NULL"
        out.append(
            "INSERT INTO product_variants (id, product_id, name, sku, price, quantity_in_stock, attributes, swatch_hex, image_url)\n"
            f"SELECT gen_random_uuid(), {pid}, '{esc(vname)}', '{sku}', {vprice}, {vstock}, '{attrs}', '{swatch}', {vimg}\n"
            f"WHERE NOT EXISTS (SELECT 1 FROM product_variants WHERE sku = '{sku}');\n"
            f"UPDATE product_variants SET name = '{esc(vname)}', price = {vprice}, attributes = '{attrs}', swatch_hex = '{swatch}', image_url = {vimg} WHERE sku = '{sku}';")
    out.append(
        "INSERT INTO inventories (id, product_id, quantity)\n"
        f"SELECT gen_random_uuid(), {pid}, {stock}\n"
        f"WHERE NOT EXISTS (SELECT 1 FROM inventories WHERE product_id = {pid});")
    return "\n".join(out)

header = f"""-- CARTLY — real catalog seed (productdb).
-- Generated by tools/catalog-media/generate_seed.py — real product data + real
-- product photography gathered from the web (sources: tools/catalog-media/manifest.json).
-- Applied manually against the running productdb (volume already exists):
--   docker compose exec -T postgres psql -U postgres -d productdb < docker/postgres/seed-catalog-data.sql
-- Idempotent: product/category inserts are guarded; image galleries rebuild per run.
-- Requires the V5 catalog-media columns (variant_id/angle/alt_text/swatch_hex/image_url/subscribe_eligible).

-- ---------------------------------------------------------------------------
-- Categories: real store tree (Electronics, Fashion, Home & Kitchen, Beauty, Sports)
-- ---------------------------------------------------------------------------
"""
# categories block copied verbatim from previous seed (stable slugs)
cats = open("docker/postgres/seed-catalog-data.sql").read()
start = cats.find("INSERT INTO categories")
end = cats.find("-- Products")
categories_block = cats[start:end].rstrip() + "\n"

body = ["\n-- ---------------------------------------------------------------------------",
        "-- Products (prices in INR: unit_price = sale price, original_price = MRP)",
        "-- ---------------------------------------------------------------------------\n"]
for p in P:
    body.append(sql_product(p))
    body.append("")

# cleanup of the one renamed SKU family (old Black JBL) so upgrades converge
body.append("-- Cleanup: JBL Flip 6 'Black' SKU was renamed to the photographed 'Grey' variant.")
body.append("DELETE FROM product_variants WHERE sku = 'JBL-FLIP6-BLK';")

with open(OUT, "w") as f:
    f.write(header + categories_block + "\n".join(body) + "\n")
print("wrote", OUT, "products:", len(P),
      "images:", sum(len(p[9]) for p in P),
      "variants:", sum(len(p[10]) for p in P))
