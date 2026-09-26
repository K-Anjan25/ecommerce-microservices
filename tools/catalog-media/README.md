# Catalog media (real product photography)

Gathered 2026-09-24 from public web sources for the 24 demo catalog products.
`manifest.json` maps every file under `frontend/public/images/catalog/<slug>/`
to its source URL and title.

## Sourcing order

1. Manufacturer / official stores (PUMA.com, Samsung.com, Dell, brand pages)
2. Retailer product CDNs (Amazon, Flipkart, Croma, Reliance Digital, Zepto, eBay…)
3. Media reviews (SoundGuys, TechRadar, CNet) and phone databases (phonesdata)

## Licensing

Brand product photography is copyrighted by the manufacturers/rights holders.
It is used here to make a demo storefront show the *exact* products the catalog
names (not stock stand-ins). This is fine for a private/demo deployment; before
a public production launch either:

- replace with brand press-kit / partner-feed imagery licensed for resale use, or
- generate/store brand-approved shots per the retailer agreement.

No image is claimed as Cartly's own work.

## Layout

```
frontend/public/images/catalog/<product-slug>/NN.jpg   # 01 = primary/hero angle
```

Angle semantics (front / detail / box / lifestyle / variant colourway) live in
the `product_images` seed rows (`angle`, `alt_text`, `variant_id`) — see
`docker/postgres/seed-catalog-data.sql` — so a file's role can change without
renaming it.
