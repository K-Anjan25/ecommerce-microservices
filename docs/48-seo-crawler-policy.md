# SEO crawler policy

`frontend/public/robots.txt` now allows public catalog/storefront discovery and disallows private, transactional, payment, account, guest-capability, and admin routes. Production builds also generate `dist/robots.txt` with the configured sitemap origin, a `dist/sitemap.xml` for public storefront routes, and static `/products/` and `/flash-sales/` entry points containing a safe public fallback shell.

The policy intentionally disallows `/guest-order` and `/order-confirmation` because those routes can carry order-specific information. Gift-card wallet, checkout, account and operational screens are also private experiences.

Set `VITE_PUBLIC_STOREFRONT_URL` in `frontend/.env` for production sitemap URLs. Add optional comma-separated paths through `VITE_SITEMAP_PRODUCT_URLS` for public product routes.

This improves crawler hygiene and gives public routes a static fallback, but it does not replace data-aware SSR or full pre-rendering. Product metadata and live catalog content are still resolved by the client-side application; dependable product indexing still needs a server-rendered or data-aware build pipeline.
