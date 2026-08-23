# 6. Platform Roadmap — CARTLY → full ecommerce platform

Roadmap for growing the working 4-service stack into a full-featured ecommerce
platform plus a creative layer, all within the host's 2 GB Docker budget.

> **Status (2026-08-23):** Phase 6 complete · Phase 7 complete · Phase 8 complete · Phase 9 complete · Phase 10 ongoing.
>
> | Phase | Current state |
> |---|---|
> | 6 — Merchandising & catalog | **Complete**; visual autocomplete refinement added 2026-08-23 |
> | 7 — Commerce completion | **Complete** |
> | 8 — Marketing & creative | **Complete** |
> | 9 — Admin & analytics | **Complete**; analytics, coupons, returns, storefront CMS, Manager role and cross-service audit log done |
> | 10 — Hardening | **Baseline complete / ongoing**; CI, dark mode, authorization, rate limits, security headers/CORS, correlated JSON logs, backup/restore, PWA, en/hi i18n and zero-known-vulnerability frontend baseline done |

## 6.0 Guardrails (hard constraints, every phase must respect)

- **Memory ceiling 2 GB / 2 vCPU** for the whole compose stack — no new service
  may be added without removing one or proving budget headroom.
- **No heavy infra additions** unless budget permits: no Redis, no Elasticsearch,
  no ML runtime, no extra brokers. Search/recommendations stay Postgres + rules.
- **4-service model stays:** postgres · rabbitmq · api-gateway · user-service ·
  product-service · commerce-service. Feature work lands inside existing modules.
- **KISS over scale-out:** every feature must be shippable in one service commit
  and testable against the existing smoke data set.

## 6.1 Phase 6 — Merchandising & catalog depth

Goal: a shoppable, merchant-grade catalog.

### P6.1 Product variants
- Backend: `ProductVariant` entity (product_id, name e.g. "Size M", sku, price
  delta or absolute price, quantityInStock, attributes JSON).
- Move per-variant stock into the variant; product stock = sum of variant stock.
- Cart/order tie line items to a `(productId, variantId)` pair; price comes from
  the variant at order time (price snapshot on line item for history).
- Inventory check/deduct (`isInStock`/`deductStock`) now keyed on `(productId,
  variantId)`; existing smoke data continues to work (variant-less → default
  variant behavior).
- Admin add/edit product UI: manage variants (add/remove rows, live total stock).

### P6.2 Multiple images per product
- Backend: `ProductImage` table (product_id, url, sort_order) + image upload
  (reuse gateway file serving) — support multiple uploads, first image = cover.
- DTOs expose `images[]` + keep `imageUrl` (cover) for backward compat.

### P6.3 Badges, sale price, brand, rating
- Backend product fields: `brand`, `originalPrice` (nullable), `badge`
  (BESTSELLER|NEW|SALE enum string), `featured` bool, sale active window dates.
- Effective price = `originalPrice != null ? originalPrice : unitPrice`; frontend
  renders strikethrough + % off badge only while within the sale window.
- Comment rating rollup: `avgRating` + `ratingCount` on product (computed by
  query when listing).

### P6.4 Faceted search (extend `searchProducts`)
- Query gains facets: `brand` (multi-select), `minPrice`, `maxPrice`, `minRating`,
  plus existing `filter` (category) and `searchTerm`.
- Response shape gains facet counts: `facet.brands[]`, `facet.priceMin/priceMax`,
  `facet.categories[]` (counts from same filtered set for stable checkboxes).
- Suggestion endpoint: `GET /v1/products/suggest?term=` → top 8 matched names
  (trigram prefix) for the SearchBar autocomplete.

### P6.5 Category hierarchy
- Backend: `Category.parentId` (self-referencing), `slug`, `sortOrder`.
- `GET /v1/categories` returns a tree (`children[]`); legacy flat consumers keep
  working via a flattened view.
- Search can filter by a category + its descendants (IN clause on subtree).
- Frontend: navbar mega-menu listing parent → children; category chips remain.

### P6.6 Frontend catalog UX
- Product detail: image carousel, variant picker (visual chips), price shows
  sale state, stock per selected variant, buy/added behavior unchanged.
- Product grid: sale badge + strikethrough price, brand, avg rating stars,
  stock chip (existing), "VIEW" for out-of-stock.
- Search results: sidebar/popover facet checkboxes (brand, price range, rating),
  category tree filter, suggestion dropdown.

### P6.7 Data & smoke updates
- Extend `docker/postgres/init-multiple-databases.sql` with new tables
  (`product_variant`, `product_image`) via Hibernate `ddl-auto` (keep current
  boot-time schema creation; add indexes for search facets).
- Extend smoke data: variants on "Smoke Laptop", a second product with sale
  price + brand, a parent category.

**Exit criteria:** catalog screens + admin product form support variants/images/
sale/brand; faceted search returns correct counts; all existing smoke tests pass.

## 6.2 Phase 7 — Commerce completion (real-world checkout)

- **Shipping:** pincode-based rate table/method selection, free-shipping
  threshold, shipping cost on order + invoice.
- **Tax:** configurable tax rate per region/state (`GST` default for India),
  applied per line + shipping; shown as line on order summary/invoice.
- **Returns & refunds:** customer requests return (per order item), admin
  approve/reject → refund via payment provider (Stripe/Razorpay refund call),
  order transitions to REFUNDED; stock restored on accept.
- **Guest checkout:** order created with contact email without login; email link
  to track; cart merge on later login.
- **Invoices:** PDF invoice generated + emailed on payment success (template with
  order lines, tax, shipping, totals).
- **Address book + re-order:** saved addresses CRUD; order detail "buy again"
  re-adds items to cart.

## 6.3 Phase 8 — Marketing & creative layer

- **Price-drop alerts:** customer watches a product; when effective price drops,
  email push (RabbitMQ) — hook into price update.
- **Recommendations:** "related" (same category), "bought together" (co-occurrence
  count in order history), "bestsellers" (order-line aggregate) — rule-based SQL.
- **Gift cards:** issue + purchase gift cards, code redemption at checkout
  (alongside coupons), balance ledger table.
- **Loyalty points:** points per ₹ spent, balance, redeem as discount, history.
- **Referral program:** unique referral code per user, credit on signup/order.
- **Gift wrapping:** optional line at checkout with fixed fee + message.
- **Flash sales:** scheduled deal window with discounted price + countdown on
  product/detail (reuse sale-window mechanics).
- **Product comparison:** pick 2–4 products into a comparison tray → side-by-side
  table (specs, price, rating, stock).

## 6.4 Phase 9 — Admin platform & analytics

- **Analytics dashboard:** revenue (today/week), orders count, top products,
  avg order value, conversion funnel — lightweight aggregation queries (no
  warehouse), simple charts on the dashboard.
- **CMS:** homepage banner management, featured/nav sections, storefront
  configuration stored in a `store_settings` table.
- **Coupon management UI** (create/edit/deactivate, usage stats).
- **Refund/payout management** queue + approve/reject.
- **Audit log:** who/what/when for admin mutations (order status, product edit,
  user disable) in `audit_log` table; surfaced in admin UI.
- **Staff roles:** Manager (order handling, no user management) vs Admin.

## 6.5 Phase 10 — Platform engineering (hardening; optional/ongoing)

- Structured JSON logs (logback) across services.
- Rate limiting on login + public writes; keep existing lockout.
- Postgres backup/migration workflow + restore drill.
- GitHub Actions CI: `mvn test`, `docker compose config`, frontend `npm run
  build`, optional `docker compose up` smoke on 2-GB runner.
- i18n (en + hi), dark mode, PWA offline shell.
- Redis cache ONLY if memory headroom appears (measure with `docker stats`).

## 6.6 Execution order & ownership

| Order | Phase | Delivers | Est. commits |
|---|---|---|---|
| 1 | 6 | Merchant-grade catalog | 4–6 |
| 2 | 7 | Real checkout (ship/tax/refund/invoice) | 5–7 |
| 3 | 8 | Marketing + creative features | 5–7 |
| 4 | 9 | Admin platform + analytics | 4–6 |
| 5 | 10 | Hardening (ongoing) | ongoing |

Each phase ends with: backend build + smoke through gateway, frontend build,
commit + push, and a short "what changed" for the owner.

## 6.7 Risks

| Risk | Mitigation |
|---|---|
| Variants break cart/order/stock models | Variant-optional design; default variant preserves legacy flows; snapshot price on line items |
| Faceted search slow on Postgres | Indexes (GIN trigram, btree on brand/category/price); keep result set small with pagination |
| Phase scope creep on 2 GB host | One phase at a time; verify memory with `docker stats` before starting next |
| Schema churn while DB has data | Hibernate `ddl-auto` for dev; document migration path for prod |