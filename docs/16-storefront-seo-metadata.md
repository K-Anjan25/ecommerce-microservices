# Storefront SEO metadata

Cartly now manages route metadata without another runtime dependency.

## Homepage

- Editorial title and CMS-controlled description.
- Canonical root URL.
- Open Graph title, description, image and website type.
- Twitter summary-large-image metadata.
- Schema.org `WebSite` JSON-LD.

## Product pages

Each loaded product supplies:

- Product-specific document title and description.
- Canonical `/products/<id>` URL.
- Open Graph product metadata and primary image.
- Schema.org `Product` JSON-LD with brand, images, SKU, INR Offer,
  stock availability, and aggregate rating when reviews exist.

Dynamic text is serialized with `<` escaped before entering JSON-LD. Metadata is
restored on route unmount so product values do not leak onto account or admin
pages.

## SPA limitation

This metadata is rendered client-side. Major search engines execute JavaScript,
but social crawlers and some commerce crawlers may only read the initial HTML.
For production SEO at scale, pre-render public catalog routes or introduce an
SSR storefront; do not SSR authenticated account/admin routes. This hook remains
useful after that migration as the client-side navigation metadata source.
