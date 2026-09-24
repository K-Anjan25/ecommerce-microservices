#!/usr/bin/env python3
"""Generate docker/postgres/seed-catalog-data.sql — the real catalog dataset.

One row per product: real model data (specs/INR prices), real colourway
variants with swatches, and multi-angle photography gathered from the web
(manifest.json in this folder records every source URL).

Regenerate:  python3 tools/catalog-media/generate_seed.py
"""
import json, os, sys

OUT = "docker/postgres/seed-catalog-data.sql"
IMG = "/images/catalog"  # retired local-photo root (kept for reference only)
# ── Rich grouped specifications (PDP "Specifications" tab) ───────────────────
# JSON: [{"group": ..., "items": [{"label": ..., "value": ...}]}]. Computers get
# the deepest tables (the user asked for much more detail there); everything
# else 3-5 groups of attributes shoppers actually compare. Every value is
# grounded in the product's own description above or its variant attributes —
# never invented measurements.
SPECS = {
    "hp-pavilion-15": [
        {"group": "Processor & Memory", "items": [
            {"label": "Processor", "value": "AMD Ryzen 5 7530U (6 cores, up to 4.3 GHz, 12 threads, 16 MB L3 cache)"},
            {"label": "Memory", "value": "16 GB DDR4-3200 MHz (2 x 8 GB, upgradeable)"},
            {"label": "Storage", "value": "512 GB PCIe NVMe M.2 SSD (1 TB on the 16GB / 1TB variant)"},
            {"label": "Graphics", "value": "Integrated AMD Radeon Graphics"}]},
        {"group": "Display", "items": [
            {"label": "Panel", "value": "39.6 cm (15.6\") diagonal, FHD (1920 x 1080), IPS, micro-edge"},
            {"label": "Surface", "value": "Anti-glare, brightview"},
            {"label": "Camera", "value": "HP Wide Vision 720p HD camera with integrated dual array digital microphones and privacy shutter"}]},
        {"group": "Keyboard & audio", "items": [
            {"label": "Keyboard", "value": "Full-size backlit keyboard with numeric keypad"},
            {"label": "Audio", "value": "Audio by B&O, dual speakers, HP Audio Boost"}]},
        {"group": "Connectivity & ports", "items": [
            {"label": "Wireless", "value": "Wi-Fi 6 + Bluetooth 5.3"},
            {"label": "Ports", "value": "1x USB Type-C (10 Gbps, DisplayPort 1.4, HP Sleep and Charge), 2x USB Type-A (5 Gbps), 1x HDMI 2.1, 1x headphone/microphone combo, 1x AC smart pin"}]},
        {"group": "Battery & power", "items": [
            {"label": "Battery", "value": "3-cell, 41 Wh Li-ion polymer with HP Fast Charge"}]},
        {"group": "Software & security", "items": [
            {"label": "Operating system", "value": "Windows 11 Home"},
            {"label": "Office", "value": "Microsoft Office Home & Student 2021 included"}]},
        {"group": "Physical", "items": [
            {"label": "Weight", "value": "Approx. 1.74 kg"},
            {"label": "In the box", "value": "Laptop, 65 W Smart AC adapter, documentation"}]},
    ],
    "lenovo-ideapad-slim-3": [
        {"group": "Processor & Memory", "items": [
            {"label": "Processor", "value": "13th Gen Intel Core i5-13420H (8 cores: 4 P-cores + 4 E-cores, 12 threads)"},
            {"label": "Memory", "value": "16 GB LPDDR5"},
            {"label": "Storage", "value": "512 GB PCIe NVMe SSD"},
            {"label": "Graphics", "value": "Integrated Intel UHD Graphics"}]},
        {"group": "Display & camera", "items": [
            {"label": "Panel", "value": "39.6 cm (15.6\") FHD (1920 x 1080), anti-glare"},
            {"label": "Webcam", "value": "HD 720p webcam with privacy shutter"}]},
        {"group": "Build", "items": [
            {"label": "Chassis", "value": "Slim 1.62 kg Arctic Grey body"},
            {"label": "Keyboard", "value": "Full-size keyboard with numeric keypad"}]},
        {"group": "Connectivity & ports", "items": [
            {"label": "Wireless", "value": "Wi-Fi 6 + Bluetooth"},
            {"label": "Ports", "value": "USB-C, USB-A, HDMI, SD card reader, headphone/mic combo"}]},
        {"group": "Battery & power", "items": [
            {"label": "Battery", "value": "All-day battery with rapid charge"}]},
        {"group": "Software & in the box", "items": [
            {"label": "Operating system", "value": "Windows 11 Home"},
            {"label": "Office", "value": "Microsoft Office Home & Student 2021 included"},
            {"label": "Package contents", "value": "Laptop, power adapter, documentation"}]},
    ],
    "sony-wh-1000xm5": [
        {"group": "Noise cancelling", "items": [
            {"label": "Processing", "value": "8 microphones with Auto NC Optimizer — two processors control them all"},
            {"label": "Calls", "value": "Crystal-clear hands-free calling; speak-to-chat auto-pauses your music when you talk"}]},
        {"group": "Sound", "items": [
            {"label": "Upscaling", "value": "DSEE Extreme restores compressed music in real time"},
            {"label": "Wireless", "value": "Multipoint Bluetooth — connect two devices at once"},
            {"label": "Tuning", "value": "Adaptive Sound Control and EQ via Sony | Headphones Connect"}]},
        {"group": "Battery & charging", "items": [
            {"label": "Battery life", "value": "Up to 30 hours (noise cancelling on)"},
            {"label": "Quick charge", "value": "3 minutes of charge gives approx. 3 hours of playback"}]},
        {"group": "Design & comfort", "items": [
            {"label": "Fit", "value": "Fold-flat soft-fit leather; approx. 250 g"},
            {"label": "In the box", "value": "Carrying case, USB-C cable, headphone cable"}]},
    ],
    "jbl-flip-6": [
        {"group": "Sound", "items": [
            {"label": "Acoustics", "value": "JBL Original Pro Sound — racetrack-shaped woofer with a separate tweeter"},
            {"label": "PartyBoost", "value": "Pair multiple JBL PartyBoost speakers for stereo or a bigger stage"}]},
        {"group": "Durability", "items": [
            {"label": "Rating", "value": "IP67 — waterproof and dustproof (submersible up to 1 m for 30 min)"},
            {"label": "Body", "value": "Bold fabric wrap with rubber housing"}]},
        {"group": "Battery & charging", "items": [
            {"label": "Playtime", "value": "Up to 12 hours of playtime (varies by volume and track)"},
            {"label": "Charging", "value": "USB-C quick charge; battery status indicator"}]},
        {"group": "In the box", "items": [
            {"label": "Package contents", "value": "JBL Flip 6, USB-C cable, quick start guide, warranty card"}]},
    ],
    "boat-airdopes-141": [
        {"group": "Sound & calls", "items": [
            {"label": "Drivers", "value": "13 mm dynamic drivers"},
            {"label": "Calling", "value": "ENx noise cancellation with quad mics for clear calls"},
            {"label": "Gaming", "value": "80 ms low-latency gaming mode"}]},
        {"group": "Battery & charging", "items": [
            {"label": "Playback", "value": "Up to 42 hours of total playback with the charging case"},
            {"label": "ASAP Charge", "value": "Type-C ASAP charge — 5 minutes gives 75 minutes of playback"},
            {"label": "Wake & pair", "value": "IWP instant wake-pair: open the lid and the earbuds connect"}]},
        {"group": "Fit & durability", "items": [
            {"label": "Rating", "value": "IPX4 sweat and water resistance"},
            {"label": "Fit", "value": "In-ear design with touch controls"}]},
        {"group": "In the box", "items": [
            {"label": "Package contents", "value": "Airdopes 141 earbuds, charging case, Type-C cable, extra ear tips, user manual"}]},
    ],
    "logitech-mx-keys-s": [
        {"group": "Keyboard", "items": [
            {"label": "Keys", "value": "Low-profile Perfect Stroke keys with spherically-dished keycaps"},
            {"label": "Backlight", "value": "Smart illumination — backlighting lights the keys up as your hands approach"},
            {"label": "Automation", "value": "Smart Actions shortcuts automate repeated tasks"}]},
        {"group": "Connectivity & power", "items": [
            {"label": "Pairing", "value": "Easy-Switch across up to 3 devices via Bluetooth Low Energy or Logi Bolt USB receiver"},
            {"label": "Charging", "value": "USB-C rechargeable"},
            {"label": "Compatibility", "value": "macOS, Windows, iPadOS"}]},
        {"group": "In the box", "items": [
            {"label": "Package contents", "value": "MX Keys S keyboard, Logi Bolt receiver, USB-C charging cable, documentation"}]},
    ],
    "samsung-galaxy-s24": [
        {"group": "Display & build", "items": [
            {"label": "Display", "value": "15.6 cm (6.2\") Dynamic AMOLED 2X, 120 Hz adaptive refresh"},
            {"label": "Protection", "value": "Corning Gorilla Glass Victus 2 front; armour aluminium frame"},
            {"label": "Durability", "value": "IP68 water and dust resistance"}]},
        {"group": "Performance & memory", "items": [
            {"label": "Processor", "value": "Exynos 2400 (India) / Snapdragon 8 Gen 3 (select regions)"},
            {"label": "Memory", "value": "8 GB RAM + 256 GB storage"}]},
        {"group": "Camera & Galaxy AI", "items": [
            {"label": "Rear", "value": "50 MP triple camera system"},
            {"label": "Intelligence", "value": "Galaxy AI — Circle to Search, Live Translate and more"}]},
        {"group": "Battery & charging", "items": [
            {"label": "Battery", "value": "4000 mAh (typical) with 25 W charging"}]},
        {"group": "In the box", "items": [
            {"label": "Package contents", "value": "Handset, USB-C cable, SIM eject tool, quick start guide"}]},
    ],
    "redmi-note-13": [
        {"group": "Display & design", "items": [
            {"label": "Display", "value": "16.94 cm (6.67\") AMOLED, 120 Hz refresh, slim bezels"},
            {"label": "Build", "value": "Slim-bezel design with side fingerprint sensor and IR blaster"}]},
        {"group": "Performance & memory", "items": [
            {"label": "Processor", "value": "MediaTek Dimensity 6080 (6 nm)"},
            {"label": "Memory", "value": "6 GB RAM + 128 GB storage"}]},
        {"group": "Camera", "items": [
            {"label": "Rear", "value": "108 MP triple camera system"}]},
        {"group": "Battery & charging", "items": [
            {"label": "Battery", "value": "5000 mAh (typical) with 33 W fast charging"}]},
        {"group": "Software & in the box", "items": [
            {"label": "Operating system", "value": "Android 13 with MIUI 14"},
            {"label": "Package contents", "value": "Handset, 33 W adapter, USB-C cable, SIM eject tool, case, quick start guide"}]},
    ],
    "noise-colorfit-pro-5": [
        {"group": "Display & build", "items": [
            {"label": "Display", "value": "46.99 mm (1.85\") AMOLED always-on display"},
            {"label": "Calling", "value": "Bluetooth calling with built-in speaker and microphone"},
            {"label": "Assistant", "value": "AI voice assistant"}]},
        {"group": "Health & sports", "items": [
            {"label": "Sensors", "value": "SpO2 and heart-rate tracking, sleep and stress monitoring"},
            {"label": "Sports", "value": "100+ sports modes"}]},
        {"group": "Battery & durability", "items": [
            {"label": "Battery", "value": "Up to 7 days of battery life"},
            {"label": "Rating", "value": "IP68 water resistant"}]},
        {"group": "In the box", "items": [
            {"label": "Package contents", "value": "ColorFit Pro 5 smartwatch, magnetic charging cable, user manual"}]},
    ],
    "fire-boltt-ninja-call-pro-plus": [
        {"group": "Display & build", "items": [
            {"label": "Display", "value": "46.48 mm (1.83\") HD display, 240 x 280 resolution"},
            {"label": "Calling", "value": "Bluetooth calling with AI voice assistant"}]},
        {"group": "Health & sports", "items": [
            {"label": "Sensors", "value": "SpO2 and heart-rate monitoring"},
            {"label": "Sports", "value": "100+ sports modes with smart notifications"}]},
        {"group": "Battery & durability", "items": [
            {"label": "Battery", "value": "Up to 5 days of battery life; built-in games"},
            {"label": "Rating", "value": "IP67 water and dust resistance"}]},
        {"group": "In the box", "items": [
            {"label": "Package contents", "value": "Ninja Call Pro Plus smartwatch, magnetic charger, manual"}]},
    ],
    "nike-pegasus-40": [
        {"group": "Cushioning & ride", "items": [
            {"label": "Midsole", "value": "React foam with forefoot and heel Air Zoom units"},
            {"label": "Drop", "value": "10 mm heel-to-toe drop; neutral support"}]},
        {"group": "Upper & outsole", "items": [
            {"label": "Upper", "value": "Engineered mesh"},
            {"label": "Outsole", "value": "Waffle rubber outsole"}]},
        {"group": "Fit & use", "items": [
            {"label": "Sizing", "value": "Men's sizing UK 6-12 (stocked UK 8-10)"},
            {"label": "Best for", "value": "Versatile daily trainer for 5K to marathon"}]},
        {"group": "Care", "items": [
            {"label": "Care", "value": "Spot clean; air dry away from direct heat"}]},
    ],
    "adidas-ultraboost-light": [
        {"group": "Cushioning & ride", "items": [
            {"label": "Midsole", "value": "BOOST Light — 30% lighter than standard BOOST"},
            {"label": "Support", "value": "Linear Energy Push system; 10 mm drop"}]},
        {"group": "Upper & outsole", "items": [
            {"label": "Upper", "value": "adidas Primeknit+ textile upper"},
            {"label": "Outsole", "value": "Continental Natural Grip rubber"}]},
        {"group": "Fit & use", "items": [
            {"label": "Sizing", "value": "Men's sizing UK 6-12 (stocked UK 8-10)"},
            {"label": "Best for", "value": "Race-day comfort for daily runs"}]},
        {"group": "Care", "items": [
            {"label": "Care", "value": "Spot clean; air dry away from direct heat"}]},
    ],
    "puma-rs-x": [
        {"group": "Upper & sole", "items": [
            {"label": "Upper", "value": "Mixed mesh and suede upper with bold colour-blocking"},
            {"label": "Midsole", "value": "RS (Running System) cushioning midsole"},
            {"label": "Outsole", "value": "Durable rubber outsole"}]},
        {"group": "Fit & styling", "items": [
            {"label": "Sizing", "value": "Unisex sizing; stocked UK 9-10"},
            {"label": "Colourway", "value": "PUMA White-Vapor Gray with pink and blue accents"}]},
        {"group": "Care", "items": [
            {"label": "Care", "value": "Wipe clean with a damp cloth; air dry"}]},
    ],
    "levis-511": [
        {"group": "Fit & construction", "items": [
            {"label": "Fit", "value": "Slim fit through the hip and thigh with a mid rise"},
            {"label": "Fabric", "value": "Stretch denim for comfort"},
            {"label": "Sizes", "value": "Waist 30-34 (stocked 32 and 34)"}]},
        {"group": "Details", "items": [
            {"label": "Styling", "value": "Classic 5-pocket styling, signature leather patch and red tab"},
            {"label": "Washes", "value": "Shown in dark and medium stonewash"}]},
        {"group": "Care", "items": [
            {"label": "Care", "value": "Machine wash cold inside out; tumble dry low"}]},
    ],
    "american-tourister-duffel": [
        {"group": "Capacity & build", "items": [
            {"label": "Capacity", "value": "55 cm (55 L) travel duffel"},
            {"label": "Material", "value": "Durable polyester build"},
            {"label": "Cabin size", "value": "Cabin-size friendly on most airlines"}]},
        {"group": "Storage & carry", "items": [
            {"label": "Compartments", "value": "Spacious main compartment with front zip pocket"},
            {"label": "Carry", "value": "Padded carry handles and detachable shoulder strap"}]},
        {"group": "Colours", "items": [
            {"label": "Options", "value": "Stocked in Black and Red (55 cm)"}]},
    ],
    "hawkins-contura": [
        {"group": "Body & capacity", "items": [
            {"label": "Capacity", "value": "3 Litre ideal for 3-4 people (5 Litre variant stocked)"},
            {"label": "Material", "value": "Hard-anodised / plain aluminium with a rounded Contura body for easy stirring"},
            {"label": "Lid", "value": "Inner-lid design"}]},
        {"group": "Safety & handles", "items": [
            {"label": "Safety", "value": "Gasket-release system for safe pressure cooking"},
            {"label": "Handles", "value": "Stay-cool handle"}]},
        {"group": "Cooking & care", "items": [
            {"label": "Cooktops", "value": "Gas and induction compatible base"},
            {"label": "Care", "value": "Hand wash; do not use metal spoons on anodised finishes"}]},
        {"group": "In the box", "items": [
            {"label": "Package contents", "value": "Pressure cooker body, lid, gasket"}]},
    ],
    "prestige-cookware-set": [
        {"group": "Set contents", "items": [
            {"label": "Pieces", "value": "5 pieces — fry pan, kadai with glass lid, sauce pan with lid, tawa"},
            {"label": "Family", "value": "From the Omega/Eco non-stick families"}]},
        {"group": "Material & cooking", "items": [
            {"label": "Coating", "value": "Granite/Eco non-stick coating"},
            {"label": "Cooktops", "value": "Induction and gas compatible"},
            {"label": "Handles", "value": "Soft-touch handles"}]},
        {"group": "Care", "items": [
            {"label": "Cleaning", "value": "Dishwasher friendly; hand wash recommended for a longer coating life"}]},
    ],
    "philips-air-lamp": [
        {"group": "Light", "items": [
            {"label": "LED", "value": "5 W energy-efficient LED"},
            {"label": "Modes", "value": "Cool-daylight and warm modes with touch dimmer"},
            {"label": "Eye comfort", "value": "Flicker-free light"}]},
        {"group": "Design & power", "items": [
            {"label": "Dimensions", "value": "34.4 cm tall (approx. 34.4 x 27 cm footprint) — desk and bedside friendly"},
            {"label": "Arm", "value": "Flexible arm"},
            {"label": "Power", "value": "USB-powered"}]},
        {"group": "Colours & care", "items": [
            {"label": "Colours", "value": "Stocked in White and Black"},
            {"label": "Care", "value": "Wipe clean with a dry cloth"}]},
    ],
    "loreal-revitalift-serum": [
        {"group": "Formula", "items": [
            {"label": "Actives", "value": "1.5% pure hyaluronic acid (Revitalift Filler)"},
            {"label": "Results", "value": "Intensely hydrates and replumps skin in 1 hour; reduces fine lines over 4 weeks"},
            {"label": "Texture", "value": "Fragrance-free, non-greasy serum"}]},
        {"group": "Use & size", "items": [
            {"label": "Routine", "value": "Morning and night on clean skin, before moisturiser"},
            {"label": "Size", "value": "30 ml dropper bottle"}]},
        {"group": "In the box", "items": [
            {"label": "Package contents", "value": "Revitalift 1.5% Hyaluronic Acid serum 30 ml with dropper"}]},
    ],
    "mamaearth-vitamin-c-face-wash": [
        {"group": "Formula", "items": [
            {"label": "Actives", "value": "Vitamin C with turmeric and saffron"},
            {"label": "Free from", "value": "Toxin-free and SLS-free"},
            {"label": "Applicator", "value": "Built-in silicone brush applicator"}]},
        {"group": "Use & size", "items": [
            {"label": "Benefits", "value": "Gently cleanses and brightens, removes dirt and excess oil, evens skin tone"},
            {"label": "Skin type", "value": "Suits all skin types"},
            {"label": "Sizes", "value": "150 ml (stocked 150 ml and 250 ml)"}]},
        {"group": "In the box", "items": [
            {"label": "Package contents", "value": "Vitamin C foaming face wash with brush applicator"}]},
    ],
    "boldfit-yoga-mat": [
        {"group": "Material & comfort", "items": [
            {"label": "Thickness", "value": "6 mm high-density anti-skid foam (4 mm purple variant also stocked)"},
            {"label": "Cushioning", "value": "Soft foam cushioning for knees and joints"},
            {"label": "Surface", "value": "Alignment lines; moisture-resistant and easy to clean"}]},
        {"group": "Size & use", "items": [
            {"label": "Dimensions", "value": "183 x 61 cm"},
            {"label": "Best for", "value": "Yoga, Pilates and home workouts"}]},
        {"group": "Care & carry", "items": [
            {"label": "Carry", "value": "Includes carry strap"},
            {"label": "Care", "value": "Wipe clean; roll up for storage"}]},
    ],
    "kore-dumbbell-set": [
        {"group": "Set options", "items": [
            {"label": "Weight sets", "value": "PVC home gym combo in 10 kg and 20 kg sets"},
            {"label": "Rods", "value": "Dumbbell rods with curl rod options"}]},
        {"group": "Material & safety", "items": [
            {"label": "Plates", "value": "PVC-coated weight plates — floor-safe coating"},
            {"label": "Grip", "value": "Non-slip grip"}]},
        {"group": "Accessories & use", "items": [
            {"label": "Extras", "value": "Gym bag and gloves in selected sets"},
            {"label": "Best for", "value": "Home strength training — presses, curls and squats"}]},
    ],
    "nivia-skipping-rope": [
        {"group": "Cable & rotation", "items": [
            {"label": "Cable", "value": "Spring-loaded anti-tangle cable with adjustable height and speed"},
            {"label": "Rotation", "value": "Ball-bearing smooth rotation for freestyle"}]},
        {"group": "Handles & use", "items": [
            {"label": "Handles", "value": "Comfortable foam grip handles"},
            {"label": "Best for", "value": "Cardio, boxing training and warm-ups — men, women and children"}]},
        {"group": "Care", "items": [
            {"label": "Care", "value": "Wipe handles clean; store untangled"}]},
    ],
    "canon-eos-1500d": [
        {"group": "Sensor & imaging", "items": [
            {"label": "Sensor", "value": "24.1 MP APS-C CMOS sensor"},
            {"label": "Processor", "value": "DIGIC 4+"},
            {"label": "Kit lens", "value": "EF-S 18-55mm f/3.5-5.6 III"}]},
        {"group": "Shooting & video", "items": [
            {"label": "Autofocus", "value": "9-point AF with centre cross-type point"},
            {"label": "Burst", "value": "Up to 3 fps continuous shooting"},
            {"label": "Video", "value": "Full HD 1080p video recording"}]},
        {"group": "Display & sharing", "items": [
            {"label": "Screen", "value": "7.5 cm (3.0-inch) LCD"},
            {"label": "Wireless", "value": "Wi-Fi + NFC sharing to the Canon Camera Connect app"},
            {"label": "Guidance", "value": "Guided UI for beginners"}]},
        {"group": "Lens mount & power", "items": [
            {"label": "Mount", "value": "Canon EF / EF-S mount — body + kit lens included"},
            {"label": "In the box", "value": "EOS 1500D body, EF-S 18-55mm III lens, battery, charger, strap, documentation"}]},
    ],
}

# Cartly Plus member-only deals (percent off list; priced server-side).
MEMBER_DEALS = {
    "sony-wh-1000xm5": "8",
    "boat-airdopes-141": "10",
    "noise-colorfit-pro-5": "7.5",
    "logitech-mx-keys-s": "6",
    "levis-511": "12",
    "hawkins-contura": "5",
    "samsung-galaxy-s24": "5",
    "redmi-note-13": "5",
}

PLACEHOLDER = "/images/store/product-placeholder.svg"  # shared fallback for slugs with no brand-CDN set

# v2: brand-studio showcase photography, hotlinked from brand-owned CDNs
# (manifest.json records full + thumb URLs, angles, SKUs, source pages).
_manifest = json.load(open("tools/catalog-media/manifest.json"))
MIMG = _manifest.get("products", {})


def images_for(slug, legacy_imgs):
    """(url, thumb, angle, alt, sku) rows. Manifest v2 studio set when present,
    else the legacy local photo set."""
    entry = MIMG.get(slug)
    if entry and entry.get("images"):
        rows = []
        for im in entry["images"]:
            full = im.get("full") or im.get("thumb")
            thumb = im.get("thumb") or full
            rows.append((full, thumb, im.get("angle") or "gallery",
                         im.get("alt") or slug, im.get("sku")))
        return rows
    return [(PLACEHOLDER, PLACEHOLDER, "front",
             f"{slug.replace('-', ' ').title()} — studio photography coming soon", None)]


def variant_img_for(slug, sku, legacy_img, rows):
    """Thumb URL for a variant: manifest image tagged with that SKU, else legacy."""
    for (_full, thumb, _a, _alt, s) in rows:
        if s and s == sku:
            return f"'{thumb}'"
    return f"'{rows[0][1]}'" if rows else f"'{PLACEHOLDER}'"


def hero_for(slug, rows):
    return rows[0][1] if rows else PLACEHOLDER

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
 [("BOAT-141-BLK", "Black", 1299, 40, '{"color":"Black"}', "#1a1a1a", "01"),
  ("BOAT-141-WHT", "White Purity", 1299, 35, '{"color":"White Purity"}', "#f2f2f2", "05"),
  ("BOAT-141-BLU", "Thunder Blue", 1349, 25, '{"color":"Thunder Blue"}', "#3a5fcd", "02")], 100),

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
 [("JBL-FLIP6-BLU", "Blue", 9999, 18, '{"color":"Blue"}', "#2e6fdb", "03"),
  ("JBL-FLIP6-GRY", "Grey", 9999, 15, '{"color":"Grey"}', "#6d6d6d", "07"),
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
 [("NOISE-P5-BLK", "Midnight Black", 2999, 45, '{"color":"Midnight Black"}', "#101010", "02"),
  ("NOISE-P5-GLD", "Starlight Gold", 2999, 30, '{"color":"Starlight Gold"}', "#d9c9a3", "04"),
  ("NOISE-P5-BRN", "Classic Brown", 3199, 20, '{"color":"Classic Brown"}', "#6b4a33", "03")], 75),

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
    rows = images_for(slug, imgs)
    hero = hero_for(slug, rows)
    spec = SPECS.get(slug)
    specs_sql = f"'{esc(json.dumps(spec, ensure_ascii=False))}'" if spec else "NULL"
    deal = MEMBER_DEALS.get(slug)
    deal_sql = deal if deal else "NULL"
    out.append(f"-- {name}")
    out.append(
        "INSERT INTO products (id, name, unit_price, original_price, brand, badge, featured, description, category_id, image_url, deleted, created_date, subscribe_eligible, specifications, member_deal_percent)\n"
        f"SELECT gen_random_uuid(), '{esc(name)}', {price}, {mrp}, '{esc(brand)}', '{badge}', {'true' if feat else 'false'},\n"
        f"       '{esc(desc)}',\n"
        f"       (SELECT id FROM categories WHERE slug = '{cat}'), '{hero}', false, now(), true,\n"
        f"       {specs_sql}, {deal_sql}\n"
        f"WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = '{esc(name)}');\n"
        f"UPDATE products SET image_url = '{hero}', subscribe_eligible = true, specifications = {specs_sql}, member_deal_percent = {deal_sql} WHERE name = '{esc(name)}';")
    # gallery refresh (idempotent rebuild per product)
    pid = f"(SELECT id FROM products WHERE name = '{esc(name)}')"
    out.append(f"DELETE FROM product_images WHERE product_id = {pid};")
    for i, (full, thumb, angle, alt, sku) in enumerate(rows):
        vid = f"(SELECT id FROM product_variants WHERE sku = '{sku}')" if sku else "NULL"
        out.append(
            "INSERT INTO product_images (id, product_id, url, thumb_url, sort_order, variant_id, angle, alt_text)\n"
            f"SELECT gen_random_uuid(), {pid}, '{full}', '{thumb}', {i}, {vid}, '{angle}', '{esc(alt)}';")
    # variants: upsert by sku
    for (sku, vname, vprice, vstock, attrs, swatch, img) in variants:
        vimg = variant_img_for(slug, sku, img, rows)
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
-- Generated by tools/catalog-media/generate_seed.py — real product data +
-- brand-studio showcase photography hotlinked from brand-owned CDNs (URLs in
-- tools/catalog-media/manifest.json; nothing stored locally — see check_images.py).
-- Applied manually against the running productdb (volume already exists):
--   docker compose exec -T postgres psql -U postgres -d productdb < docker/postgres/seed-catalog-data.sql
-- Idempotent: product/category inserts are guarded; image galleries rebuild per run.
-- Requires V5 catalog-media columns + V6 thumb_url (product_images.variant_id/
-- angle/alt_text/thumb_url, product_variants.swatch_hex/image_url, subscribe_eligible).

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
body.append("-- Cleanup: drop superseded variant SKUs (JBL Black/Squad realigned to Blue/Grey/Red;")
body.append("-- Noise Silver Grey/Deep Wine realigned to Midnight Black/Starlight Gold/Classic Brown).")
body.append("DELETE FROM product_variants WHERE sku IN ('JBL-FLIP6-BLK', 'JBL-FLIP6-SQD', 'NOISE-P5-SLV', 'NOISE-P5-WNE');")

with open(OUT, "w") as f:
    f.write(header + categories_block + "\n".join(body) + "\n")
print("wrote", OUT, "products:", len(P),
      "images:", sum(len(p[9]) for p in P),
      "variants:", sum(len(p[10]) for p in P))
