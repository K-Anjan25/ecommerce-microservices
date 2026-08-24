# SEO crawler policy

`frontend/public/robots.txt` now allows public catalog/storefront discovery and disallows private, transactional, payment, account, guest-capability, and admin routes. Production builds also generate `dist/robots.txt` with the configured sitemap origin, a `dist/sitemap.xml` for public storefront routes, and static `/products/` and `/flash-sales/` entry points containing a safe public fallback shell.

The policy intentionally disallows `/guest-order` and `/order-confirmation` because those routes can carry order-specific information. Gift-card wallet, checkout, account and operational screens are also private experiences.

Set `VITE_PUBLIC_STOREFRONT_URL` in `frontend/.env` for production sitemap URLs. Add optional comma-separated product IDs through `VITE_SITEMAP_PRODUCT_URLS` and set `VITE_PRERENDER_API_URL` to the public catalog origin to generate data-aware product entry points at build time. Set `VITE_PRERENDER_REQUIRED=true` in a release build when missing catalog data should fail the build.

This improves crawler hygiene and gives public routes a static fallback. Product entry points can now include server-fetched title, description, image, offer, availability, canonical metadata, and JSON-LD. A long-lived server-rendered catalog is still a deployment choice when content must update without rebuilding.
