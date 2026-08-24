# 7. Historical implementation handoff (archived)

> **Archive notice (2026-08-24):** This document records earlier Phase 6–9 implementation sessions and contains stale branch names, interim caveats and superseded design language. Do not use it as current status. Use [`06-roadmap.md`](06-roadmap.md), [`34-current-platform-status.md`](34-current-platform-status.md), and the numbered hardening documents 20–33.

> Purpose: self-contained status + exact commands so the resting opencode agent (or any
> teammate) can pick this up without re-deriving context. Generated 2026-08-21 after
> completing **Phase 6 — Merchandising & catalog depth** and starting **Phase 7 —
> Commerce completion** (`docs/06-roadmap.md`).
>
> Repo: `ecommerce-microservices` ("Cartly"). 4 Spring Boot services + React frontend.
> Stack: Java 17, Maven (wrapper), PostgreSQL, RabbitMQ, Docker Compose, React/Vite.

---

## 7.0 TL;DR for the next agent

- **Phase 6 is COMPLETE** (backend + frontend).
- **Phase 7 is nearly complete** (see §7.4.x): shipping rates + state tax (backend AND frontend
  wiring), returns with stock restore, saved addresses, **guest checkout end-to-end**, and
  **PDF invoices** (emailed on payment success + downloadable from order detail).
- All of the above is committed on branch `arena/01a02949-ecommerce-microservices`
  (PR #1). Java changes made on 2026-08-22 still need a Maven build to verify — the
  authoring sandbox had no JDK.
- Remaining Phase 7 items: refund via real payment provider (§7.4.4).

### 7.0.1 Critical bug fixed earlier (read before you touch entities!)
**`java.lang.StackOverflowError` on `GET /v1/products`** was caused by a Lombok `@Data`
`hashCode()`/`equals()`/`toString()` cycle between `Product` ↔ `ProductVariant` (and the same
pattern on `ProductImage`/`Comment` ↔ `Product`, and `Category` ↔ `Product`).
`Product.hashCode()` includes the `variants` set; `ProductVariant.hashCode()` includes
`product` → infinite recursion the moment Hibernate initializes a **non-empty** variants
collection (`Set.add()` → `hashCode()`). It only surfaced now because the seeded Smoke Laptop
has variants; an empty collection never triggered it.
Fix: added `@EqualsAndHashCode(exclude=...)` + `@ToString(exclude=...)` on the back-reference
field of every bidirectional entity (`Product` excludes `variants/images/comments`;
`ProductVariant`/`ProductImage`/`Comment` exclude `product`; `Category` excludes `products`).
**Do NOT remove these exclusions** and do not add `@Data` to new entities with bidirectional
relations without excluding the owning side.

---

## 7.1 Environment facts (learned the hard way)

| Fact | Detail |
|---|---|
| Java | 17 present (`java -version`). |
| Maven | **NOT** on PATH. Use the wrapper: `.\common\mvnw.cmd` (Maven 3.9.12 ships inside). |
| Docker | 29.2.1 + Compose v5.1.0 present, but **Docker Desktop daemon is OFF by default**. Start it first (see §7.2). |
| `curl` in PowerShell | `curl` is aliased to `Invoke-WebRequest` and **breaks**. Use `curl.exe` for HTTP smoke tests. |
| `.env` | Already present at repo root (gitignored). `JWT_SECRET` etc. are populated. No need to recreate. |
| Naming | `product-service/Dockerfile` is correctly capitalized (git tracks it lowercase; Windows FS is case-insensitive, Compose resolves it). |

---

## 7.2 Reproduction commands (verified this session)

### A. Build + unit tests (local, no infra)
```powershell
cd ecommerce-microservices
.\common\mvnw.cmd -B clean package        # compile + test + package all 6 modules
```
Result: **BUILD SUCCESS**. Tests: product-service 3, commerce-service 12 (Cart 7 + Order 5),
api-gateway 1, others skipped.

### B. Start Docker Desktop (required — daemon is off by default)
```powershell
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe" -WindowStyle Hidden
# then wait until:  docker info   shows "Server Version: ..."
```

### C. Build images + run the stack
```powershell
cd ecommerce-microservices
docker compose up -d --build        # builds 4 Java images via in-container Maven, starts 6 containers
docker compose ps                   # expect all 6 "healthy"
```
Image builds: each `Dockerfile` does `mvn -pl <svc> -am -Dmaven.test.skip=true package`
inside `maven:3.9.9-eclipse-temurin-17`, then runs the jar on `eclipse-temurin:17-jre-alpine`.
First build pulls Maven deps (~minutes, needs internet). Total stack memory caps ≈ 1.4 GB.

### D. Smoke test through the gateway (port 8889)
```powershell
curl.exe -s http://localhost:8889/actuator/health                       # -> {"status":"UP"}
curl.exe -s "http://localhost:8889/v1/products?size=3&sort=dateDesc"     # -> product list w/ new fields
curl.exe -s http://localhost:8889/v1/products/suggest?term=lap          # -> ["Smoke Laptop"]
curl.exe -s http://localhost:8889/v1/products/brands                    # -> [] (no brand in seed data)
```

---

## 7.3 Phase 6 final status (COMPLETE)

All Phase 6 items are now implemented and verified:

- [x] P6.1 Variants — `ProductVariant` entity/repo/DTO; `Product.variants`; `applyVariants` in
      `ProductService`; legacy `inventory` table still used when a product has no variants.
- [x] P6.2 Images — `ProductImage` entity/repo; `Product.images`; `applyImages` (sortOrder,
      first = cover). Gateway `/file/**` upload can be reused by admin to pass image URLs.
- [x] P6.3 Badges/sale/brand — `brand`, `originalPrice`, `badge` (enum-backed string),
      `featured` on `Product`; `ProductMapper` computes `avgRating`/`ratingCount`.
- [x] P6.4 Faceted search — `searchProducts` JPQL filters by `brand`/`minPrice`/`maxPrice`/
      `minRating`; new `GET /v1/products/suggest` + `GET /v1/products/brands`; **facet counts**
      returned in `ProductSearchResponse.facets` (`brands[]`, `categories[]`, `priceMin/Max`).
- [x] P6.5 Category hierarchy — `Category.parentId`/`slug`/`sortOrder`; `GET /v1/categories/tree`
      returns the nested tree (root → children). Flat `GET /v1/categories` still available.
- [x] P6.1 Commerce variant keying — `CartItem`/`OrderItem`/`CreateCartItemRequest`/
      `CreateOrderItemRequest` carry optional `variantId`; cart line merge/remove matches on
      `(productId, variantId)`; `InventoryServiceClient` `isInStock`/`deductStock` are variant-
      aware (fall back to legacy `inventories` table when `variantId` is null).
- [x] P6.6 Frontend catalog UX — facet sidebar on Products page, flash-sale countdown timer on
      `ProductCard`, returns/refunds page (`/returns`), user order detail page (`/orderDetail/:id`)
      with return request dialog, gift-wrap checkout fee, referral/loyalty pages.
- [x] P6.7 Smoke data — `docker/postgres/seed-smoke-data.sql` seeds Electronics→Audio +
      SmokeCategory parent/child, a sale-priced branded Smoke Laptop **with 2 variants**, and a
      Smoke Buds product with a variant.

---

## 7.4 Phase 7 status (IN PROGRESS)

Starting **Phase 7 — Commerce completion** per `docs/06-roadmap.md`.

### 7.4.1 Completed this session
- [x] Returns/refunds backend — `ReturnRequest` entity/repo/service/controller with
      `customerId` scoping; `GET /v1/returns/my` for user history; admin approve/reject/refund
      endpoints already existed.
- [x] Returns/refunds frontend — `frontend/src/pages/Returns` (user list), admin order detail
      already had return actions; new user `OrderDetail` page with "Request return" per item.
- [x] Saved addresses backend — `SavedAddress` entity/repo/service/controller; CRUD endpoints
      under `/v1/addresses`.
- [x] Saved addresses frontend — `frontend/src/pages/Addresses` with add/delete + default chip.

### 7.4.2 Shipping / tax (was "next up" — DONE in a later session, 2026-08-22)
- [x] Pincode-based shipping rates — `ShippingRate` entity + `/v1/shipping/calculate` +
      admin CRUD (`/v1/shipping/rates`), wired into `OrderService.calculateShipping`.
- [x] Configurable state tax — `TaxRule` entity + `/v1/tax/rule/{state}` + admin CRUD
      (`/v1/tax/rules`), wired into `OrderService.calculateTax`.
- [x] Stock restoration on return approval — `ReturnRequestService` calls
      `CommerceInventoryService.restoreStock` (failure is logged, does not block approval).
- [x] **Frontend Checkout wired to real quotes** — new `frontend/src/api/shippingApi.ts` +
      `types/shipping.ts`; Checkout collects a 6-digit pincode, queries
      `POST /v1/shipping/calculate` (shows carrier + ETA + FREE) and `GET /v1/tax/rule/{state}`
      (dynamic tax label/rate) for logged-in users; guests keep the flat estimate.
      Order payload now sends top-level `pincode` + `state` so the backend recomputes totals.
- [x] **`OrderService` unknown-pincode fix** — previously ANY unknown pincode ⇒ free shipping
      (service returns `cost=0, active=false` when no rate row exists; `cost != null` was the
      only guard). Now the pincode rate is trusted only when `rate.isActive()`.
      ⚠️ Java change made without a local JDK (sandbox has none) — run the Maven build.
- [x] **Checkout validation bug fix** — `customerEmail` was unconditionally required, blocking
      logged-in users (field only rendered for guests). `forms/orderForm` is now a factory:
      `createOrderForm({ guest, requirePincode })`; Cart uses `createOrderForm()`.
- [x] **Seed data** — `docker/postgres/seed-commerce-data.sql` (run manually against
      `commercedb`): 6 shipping rates (incl. inactive one) + 7 tax rules (Kerala 19% to prove
      per-state variance). State values must match `formdata.json` exactly (uppercase,
      e.g. `NCT OF DELHI`).
- [x] **Dockerfile casing** — `product-service/dockerfile`/`user-service/dockerfile` renamed to
      `Dockerfile` (matches compose; was breaking case-sensitive Linux/CI checkouts).

### 7.4.3 Guest checkout end-to-end (DONE 2026-08-22, second session)
- [x] **Gateway** — split routes: guarded `/v1/orders/**` + `/v1/payments/**` now also match
      `Header=Authorization, Bearer .+` (AuthFilter); new public routes match headerless
      `POST /v1/orders` and `POST /v1/payments` (no filter). Logged-in requests match the
      guarded route first, so `userId` injection is unchanged.
- [x] **commerce-service** — `POST /v1/payments` added to `permitAll` (POST /v1/orders already
      was); `PaymentController` reads `userId` header with `required=false`;
      `PaymentService` attributes guest payments to the all-zeros `GUEST_USER_ID` pseudo-user
      (`payment.user_id` is NOT NULL — no schema change needed).
- [x] **Frontend** — Checkout already collected guest email + sent `customerEmail` and the
      `/checkout` route was never auth-guarded; added a payment-method selector
      (Razorpay / Cash on delivery) because Razorpay requires real API keys — COD is the only
      provider that works in a keyless demo; success message is COD-aware.
- Notes / caveats: guest order emails (order placed + payment) already flowed through
  `order.customerEmail` via RabbitMQ. No rate limiting on the public endpoints yet
  (Phase 10). Cart is client-side (redux-persist), so "cart merge on login" is a non-issue.
  `formdata.json` state list still outdated — no TELANGANA entry.

### 7.4.4 PDF invoices (DONE 2026-08-22, second session)
- [x] **event-bus** — `EmailRequest` gains optional `attachmentName` + `attachmentBase64`
      (5-arg constructor; `hasAttachment()` helper; old 3-arg constructor unchanged).
- [x] **user-service** — `EmailService` builds a `MimeMultipart` (text + PDF attachment via
      `ByteArrayDataSource`/`DataHandler`) when the request has an attachment; plain text
      behaviour unchanged otherwise.
- [x] **commerce-service** — new `InvoiceService` (OpenPDF `com.github.librepdf:openpdf:1.3.30`):
      generates a tax invoice (order meta, bill-to, line table, subtotal/shipping/gift
      wrap/discount/tax/total); product names fetched best-effort from product-service via new
      `ProductCatalogClient` Feign client (falls back to short ids); amounts use "Rs." (Helvetica
      has no rupee glyph).
- [x] **Trigger** — `PaymentService.processPayment` emails the invoice when payment status is
      SUCCESS (wrapped in try/catch inside `emailInvoice`; never rolls back the payment).
- [x] **Download** — `GET /v1/orders/{orderId}/invoice` regenerates the PDF on demand
      (authenticated users via the guarded gateway route); frontend Order detail has an
      "Invoice" download button (`OrderApi.getInvoice` blob download).
- Caveats: invoice content is regenerated from current order data (no immutable snapshot);
  COD orders get no invoice email until a real provider payment happens.

### 7.4.5 Refunds via payment provider (DONE 2026-08-22, third session)
- [x] `PaymentProviderClient` gains `refund(Payment, BigDecimal)`; implemented by all three
      providers: **Razorpay** (`POST /v1/payments/{txn}/refund`, amount in paise), **Stripe**
      (`POST /v1/refunds`, `payment_intent` + smallest-unit amount), **CASH** (offline note).
      When provider keys are missing, Razorpay/Stripe return a clearly-labelled **simulated
      success** (`SIM-REFUND-…`) so the dev flow stays testable; with keys present a real API
      call is made against the stored transaction id.
- [x] `PaymentService.refundOrderPayment(orderId, amount)` — looks up the original payment,
      charges the provider, and on success publishes a `REFUNDED` payment-status event
      (`order → REFUNDED` via `applyPaymentStatus`, new enum value + history note) plus a
      refund-confirmation email. A failed refund only logs/returns — it never cancels the order.
- [x] `ReturnRequestService.refundReturnRequest` — now requires APPROVED status (matches the
      admin UI sequence Approve → Refund), computes line refund (price × qty), calls the
      provider through `refundOrderPayment`, and on success stores `refundAmount` +
      new `refundTransactionId` column (nullable, added by `ddl-auto`). On failure it throws so
      the admin sees the provider message (frontend `onError` added).
- [x] Frontend: `REFUNDED` order status; refund amount + reference shown on the Returns page;
  admin refund button surfaces errors.
- Caveat: Razorpay charges store the razorpay **order** id as transaction id (the flow never
  completes a real Razorpay checkout), so a real-key refund may be rejected by Razorpay until
  payment capture is implemented; dev/keyless flows are unaffected (simulated).

### 7.4.7 Frontend audit + UX polish (DONE 2026-08-22, fourth session)
Bugs fixed:
- **Cart was variant-blind on mutations** — ADD merged on `(productId, variantId)` but
  REMOVE/INCREASE/DECREASE matched `productId` only, corrupting both lines when a product was
  in the cart under two variants. Actions now take `(productId, variantId?)`; reducer matches
  on both (`undefined` only matches `undefined`); grid Card + detail ProductCard + Cart +
  Checkout lines all pass variant context. Cart/Checkout also had duplicate React keys for
  such lines (now `${productId}-${variantId ?? "base"}`) and cart lines now show their
  variant chip.
- **Orders page showed EVERYONE's orders** — `GET /v1/orders` is unscoped. New
  `GET /v1/orders/my` (userId header from gateway; 401 if absent) + repository
  `findByCustomerIdOrderByCreatedDateDesc`; frontend Orders page uses it.
- **"Buy again" added fake products** (`{id, name: productId}` — no price → NaN totals). Now
  fetches real products via `findByIds`, resolves variant names, skips deleted products.
- **Compare button did `window.location.href`** (full page reload, state wipe). Now uses the
  router + a toast.
- **Login ignored the redirect-back state** (`RequireAuth` passes `state.from`) — always went
  to `/`. Now returns to the originating page.
- **Card chip collision** — SALE and stock chips were both absolute at top-right. SALE now
  shows `SALE · N% off` below the stock chip.

UX polish:
- Global search in the navbar (desktop) → navigates home with `{state:{search}}`, and the
  Products page seeds its catalog search from it (per-location-entry effect).
- Subtle page-entry animation (`fade-up` on layout main), custom slim scrollbars,
  `:focus-visible` rings, `prefers-reduced-motion` support, lazy product images,
  bottom-right toasts with shorter auto-close.

All verified with `tsc + vite build`.

### 7.4.8 Phase 8 complete: price-drop alerts (DONE 2026-08-22, fifth session)
- [x] product-service: `ProductPriceWatch` entity (`product_price_watches`, keyed on
      productId+email, `active` flag) + `PriceWatchService` + `PriceWatchController`
      (`POST/DELETE/GET /v1/products/{id}/watch`). Subscribe/unsubscribe ride the gateway's
      authenticated product-write route; the status check is a public read.
- [x] Trigger: `ProductService.updateProduct` captures the previous unit price and, on a
      decrease, queues an email per active watch ("Was X / Now Y (Z% off)" + product link) via
      the event-bus producer to `notification.exchange` — same topology user-service consumes.
      product-service now declares the notification exchange/queue/binding too (idempotent) and
      gained the `event-bus` dependency + `scanBasePackages` for it.
- [x] Frontend: `PriceWatch` component on the product detail page — logged-in users toggle
      with their account email; guests enter one. Watch state queried per email.
- ⚠️ New Java + pom changes need Maven verify (no JDK in authoring env).

### 7.4.9 Phase 9 started: analytics dashboard (DONE 2026-08-22, fifth session)
- [x] commerce-service: `GET /v1/orders/stats/dashboard` (`@PreAuthorize` ROLE_ADMIN) returning
      revenue today / last 7 days, avg order value (cancelled excluded), total + today's order
      counts, orders-by-status map, 7-day daily revenue series and top-5 products by revenue.
      Computed in-memory from `findAll()` (dev scale — swap for SQL if volume grows).
- [x] Frontend Admin Home redesigned: revenue KPI cards, 7-day revenue bar chart (recharts —
      new frontend dep), orders-by-status chips, top products with resolved names, low-stock
      panel retained, quick actions folded into the side panel.
- Remaining Phase 9 items: CMS/store settings, coupon admin UI, refund queue UI, audit log,
  staff (Manager) role.

### 7.4.10 Phase 9 continued: coupon admin + checkout coupons + returns queue (2026-08-22, sixth session)
- [x] **Coupon admin UI** (`/admin/coupons`): list with type/value/min/max/usage/window chips,
      create dialog (formik+yup), activate/deactivate toggle, delete. Backend additions:
      `GET /v1/coupons`, `PUT /v1/coupons/{id}` (partial update — code/type/value immutable by
      design), `DELETE /v1/coupons/{id}` (usage rows deleted first; no cascade on the FK).
- [x] **Checkout coupons** — the order flow never sent `couponCode` before. Checkout now has a
      coupon field (logged-in users): validates via `POST /v1/coupons/validate`, shows the
      discount live, mirrors the backend tax math (tax on subtotal + shipping − discount +
      gift wrap), auto-invalidates when the cart changes, and includes the code in the order
      payload (server recomputes — preview only, never trusted).
- [x] **Admin returns/refunds queue** (`/admin/returns`): all return requests with status
      filter chips + counts, product names resolved, REQUESTED-first ordering (backend
      `GET /v1/returns/all`), approve/reject/refund actions with error surfacing. Admin nav
      gained Coupons + Returns entries.

### 7.4.11 Phase 10 started: CI workflow prepared (2026-08-22, seventh session)
- [x] `ProductServiceTest` fixed for the new `PriceWatchService` constructor arg (would have
      broken `mvn package` — found while preparing CI).
- [x] `.github/workflows/ci.yml` written (backend: temurin-17 + `mvn -B clean package` with
      maven cache; frontend: node-20 `npm ci` + `npm run build`; compose: `docker compose
      config -q`). ⚠️ **NOT PUSHED**: the Arena sandbox GitHub token lacks `workflows`
      permission, so pushes containing workflow files are rejected. The file sits untracked in
      the repo root — either reconnect the GitHub integration with workflow permissions (then
      the agent can push it) or add+push it manually:
      `git add .github && git commit -m "CI" && git push`.
- Static import/reference audit of all 35 changed Java files: clean (no missing imports /
  constructor-arg mismatches beyond the one fixed above). Full compile verification still
      pending real CI or a local `mvnw` run (sandbox has no JDK and Maven Central is blocked).

### 7.4.12 CI green — backend verified (2026-08-22, eighth session)
- [x] CI (`.github/workflows/ci.yml`, added by the owner) is **green on all three jobs**:
      backend `mvn -B clean package` (compile + tests, all 6 modules), frontend build,
      compose config. Root causes of the earlier failures, all fixed:
      1. event-bus dependency declared as `1.0-SNAPSHOT` (modules are `0.0.1-SNAPSHOT`);
      2. `EmailRequest` rewrite dropped its `package com.ecommerce.event_bus.dto;` line
         (class compiled into the default package — broke product/commerce/user-service);
      3. `CouponService` missing the `UpdateCouponRequest` import.
- All Phase 7–9 backend work is now machine-verified. PR #1 merged to main.

### 7.4.6 Remaining / optional
- [ ] Public order-tracking page for guests ("email link to track" in the roadmap) — needs
      public `GET /v1/orders/{id}/track` and a frontend page.
- [x] `formdata.json` — TELANGANA added (2026-08-22, after Andhra Pradesh; district list simplified).
- Phase 7 scope is otherwise complete → next roadmap stop is Phase 8 remainder (price-drop
  alerts) and Phase 9 (admin platform & analytics).

---

### 7.4.13 Frontend redesign — Cartly 2.0 (2026-08-23, ninth session)
- [x] **Design kit produced first, then implemented.** `design/tokens.json` (Tokens Studio /
      Figma-variable compatible), seven wireframe artboards in `design/wireframes/` (global
      shell · storefront · product detail · cart→checkout · admin console · mobile ×3 ·
      component sheet) generated by `design/wireframes/generate.mjs`, plus
      `design/README.md` with the Figma import procedure and the full before/after rationale.
- [x] **New visual language:** violet `#5B3DF5` primary + lime `#D8F14B` highlight on true ink
      `#0B0B0F`, bone `#F6F5F2` canvas, hairlines instead of shadows, Inter Tight headings +
      Instrument Serif hero. Token *names* were kept identical to 1.x, so ~30 untouched pages
      picked up the new look for free.
- [x] **Pieces rearranged:** dismissible announcement bar; centred command search (⌘K); sticky
      category rail; mobile bottom tab bar; inverse ink footer; storefront reordered to
      hero → trust strip → category tiles → bestsellers → sticky toolbar (removable facet
      chips) → sidebar + grid, with a bottom-sheet filter drawer on mobile; new product-card
      anatomy; admin ink nav rail with Orders promoted to second position.
- [x] `frontend/vite.config.ts` gained `host: true` + `allowedHosts` for hosted previews.
- [x] Verified with `npx tsc --noEmit` and `npm run build` (both clean). **No backend changes**
      this session — CI backend/compose jobs unaffected.
- Details, gotchas (sticky offsets, `paper` is now white, AdminLayout negative margins) and the
  remaining redesign backlog: **`docs/08-frontend-redesign.md`**.

### 7.4.14 Frontend redesign part 2 — PDP + checkout (2026-08-23, tenth session)
- [x] **Product detail rebuilt to wireframe 03**: thumbnail rail + 4:3 gallery, buy box with
      **variant chips instead of a Select**, price row with compare-at/save %, trust panel,
      **sticky selection rail** (live line total, loyalty preview, frequently bought together),
      and tabs (Description / Specifications / Reviews / Shipping & returns) replacing the one
      endless column. Breadcrumb + layout-matched skeleton on the page wrapper.
- [x] **Cart → checkout rebuilt to wireframe 04**: new `CheckoutSteps` (shared 3-step header)
      and `CartLine` (compact cart row — the cart used to reuse the *grid* product card).
      Cart gains a free-shipping progress nudge and a sticky summary whose primary CTA is now
      Checkout. Checkout re-composed into numbered sections with selectable option cards
      instead of dropdowns, a sticky desktop summary and a fixed mobile pay bar —
      **all order/payment/coupon/tax/shipping logic untouched**.
- [x] Wireframes 03/04 regenerated so the drawings match what shipped (3-step stepper,
      no Buy-now/Wishlist, four tabs, credits section).
- [x] `tsc --noEmit` + `npm run build` clean. Still no backend changes.

### 7.4.15 Palette decision + admin table density (2026-08-23, eleventh session)
- [x] **Palette: owner chose to KEEP Ink & Violet** (option 0). `design/palettes/` holds the
      generator and the six-way comparison sheet that produced the decision — same storefront
      fragment rendered per palette. No colour values changed.
- [x] **Admin table density pass (frame 05)**: new `components/DataTable` primitive (sticky
      eyebrow header, hairline dense rows, per-column align/mono/render + `hideBelow`
      breakpoint, **stacked card list below `md`**, shared `StatusPill` + `TableIconButton`).
      `TableWithActions`/`TableWithDetail` became thin adapters with **unchanged props**, so
      Admin Products/Orders needed no edits; Admin Users dropped its hand-rolled table.
      `SkeletonRows` reshaped to match. Removed the old hardcoded `maxWidth: 1200px` that kept
      admin tables from filling the console.
- [x] Swept 19 files of redundant `!bg-brand !text-paper hover:!bg-brand-main` button overrides
      (the theme already supplies them, and the overrides killed the button shadow).

### 7.4.16 Feature pages re-composed (2026-08-23, twelfth session)
- [x] New `components/FeatureHero` (+ `HowItWorks`) gives Loyalty / Referral / Gift Cards /
      Flash Sales one shared ink opening beat instead of four different grey Papers.
- [x] Re-composed: **LoyaltyPoints** (tier progress, stat tiles, history list),
      **FlashSales** (live countdown off the soonest-ending sale, product-grid, empty state),
      **Referral** (ticket-style code, navigator.share + clipboard fallback),
      **GiftCards** (presets, validity chips, live gift-card preview, copyable result),
      **Returns** (status filter chips with counts, shared StatusPill, refund reference),
      **Compare** (image-headed columns, per-column remove, winning value marked per row),
      **Addresses** (full state dataset + dependent districts, default-address toggle).
- [x] **Bugs fixed along the way** (all pre-existing):
      1. `Addresses` hardcoded five states — an address in Telangana could not be saved.
      2. `Addresses` sent `defaultAddress` but had no UI for it — no address could be defaulted.
      3. `Returns` empty state used `btn-primary`, a class that does not exist.
      4. `LoyaltyPoints` history mapped into a keyless `<>` fragment (React key warning).
- [x] `tsc --noEmit` + `npm run build` clean; all 10 routes serve 200 against the mock gateway.
- Remaining: `pages/Orders` and both `OrderDetail` screens; dark mode.

### 7.4.17 Order screens re-composed (2026-08-23, thirteenth session)
- [x] **`pages/Orders`**: order cards with a canvas header strip (id / date / total / StatusPill),
      stacked product thumbnails resolved in ONE batched `findByIds` across all orders, buy-again
      + details, skeleton loading.
- [x] **`pages/Orders/OrderDetail`**: status timeline, real product names/thumbnails, per-line
      return buttons that preselect that item, payment summary (subtotal / discount / shipping /
      tax / gift wrap -> total), delivery address, existing returns.
- [x] **`pages/Admin/Orders/OrderDetail`**: three fact cards (status+total, customer, ship-to),
      line items via `DataTable` with thumbnails/variants, totals aside, returns queue with
      StatusPill + LoadingButton approve/reject/refund.
- [x] **Bug fixed**: both detail screens rendered `Product <uuid>` for every line and every
      return — product ids were never resolved. They now batch-resolve, falling back to a
      truncated id only when the product has been deleted.
- [x] Dead code removed: `ORDER_PRODUCT_COLUMNS` / `OrderProductRow` had no consumers left.
- [x] `design/preview-mock-server.mjs` extended with orders, returns, loyalty balance+history,
      referral code and saved addresses — and its paths corrected to match the real API
      (`/v1/loyalty/*`, `/user/referral/*`, `/v1/addresses`, `/v1/returns/order/{id}`).
- Remaining redesign work: **dark mode only**.

### 7.4.18 Dark mode (2026-08-23, fourteenth session)
- [x] `frontend/src/tokens.css`: every colour becomes a CSS custom property (RGB channels) with
      a `:root` (light) and `.dark` block; Tailwind consumes them via
      `rgb(var(--x) / <alpha-value>)` so opacity modifiers still work.
- [x] **Key refactor:** `ink` was both "text colour" and "intentionally dark surface", which must
      move in OPPOSITE directions in dark mode. `ink*` is now strictly foreground; new
      `contrast` / `oncontrast` tokens carry the dark-surface job (`contrast` lifts to `#1E212A`
      in dark so it still separates from the canvas). Scripted migration across 19 files.
- [x] ~60 fixed tailwind palette usages (`bg-emerald-50`, `text-rose-700`, `bg-amber-100`,
      `text-sky-700`, `bg-slate-100`…) replaced with semantic `state-*` / `sunken` / `ink-soft`
      tokens that have dark values.
- [x] `tailwind.config.js` `darkMode: "class"`; shadows also come from vars (a light-mode shadow
      is invisible on a dark canvas). `globalTheme.ts` exposes `createAppTheme(mode)`.
- [x] `hooks/useColorScheme.ts` + `context/colorScheme.ts`: follows the OS until the user picks,
      then persists; drives `theme-color` and `color-scheme`; `applyScheme()` runs before React
      mounts so there is no light flash. Toggle in the header + mobile drawer. Toasts and
      recharts follow the mode.
- [x] `design/tokens.json` gained a `colorDark` collection; `design/palettes/` gained a dark
      panel so the values are reviewable.
- **The frontend redesign backlog in `docs/08` §8.6 is now empty.**

### 7.4.19 WordPress theme (2026-08-23, fifteenth session)
- [x] `wordpress/cartly/` — the Cartly 2.0 design system as an installable WordPress theme with
      WooCommerce support. Classic PHP templates (not a block theme) because the design depends
      on a sticky shell, a category rail and a mobile tab bar that FSE cannot express cleanly.
- [x] Shares the design source of truth: `assets/src/tokens.css` is a copy of
      `frontend/src/tokens.css`, and `tailwind.config.js` mirrors the React one. Compiled CSS is
      **committed** (`assets/css/cartly.css`) so the theme installs without Node.
- [x] Shell: dismissible announcement, sticky header with centred search + ⌘K, sticky category
      rail (auto-fills from `product_cat` when no menu is assigned), mobile drawer, bottom tab
      bar with a live cart badge, inverse footer, dark mode painted before first paint.
- [x] WooCommerce styled mostly by **re-hooking** (`inc/woocommerce.php`) rather than copying
      templates — overridden templates rot against Woo upgrades. Only 4 templates are forked,
      each stamped with its `@version`: `content-product.php` (the card),
      `loop/no-products-found.php`, `cart/cart-empty.php`, `global/quantity-input.php`.
- [x] `theme.json` exposes palette / type / spacing / shadows to the block editor.
- [x] Customizer sections for the announcement bar, storefront hero and footer.
- [x] ⚠️ **No PHP runtime in this sandbox**, so the theme ships `bin/lint-php.py` — a PHP-aware
      structural linter (islands, quoting, heredocs) checking balanced delimiters, alternative
      syntax pairing, ABSPATH guards and stray closing tags. 31/31 files pass. It is NOT a
      substitute for `php -l` / phpcs on a real host — run those before going live.
### 7.4.20 WordPress theme verified on real WordPress (2026-08-23, sixteenth session)
- [x] Booted **WordPress 6.5.5 + the Cartly theme** inside the sandbox using
      **WordPress Playground** (PHP 8.2 + WordPress compiled to WASM via `@wp-playground/cli`),
      which needs neither a PHP binary nor MySQL. Every template renders:
      front page, single post, category archive, page, search, 404 and wp-admin —
      **HTTP 200/404 with zero PHP fatals, warnings or parse errors**.
- [x] `bin/preview.sh` + two blueprints + `bin/preview-seed.php` committed, so anyone can
      reproduce the preview with one command.
- ⚠️ **WooCommerce could not be installed in this sandbox.** Outbound network is limited to the
  npm registry and the GitHub API; `wordpress.org`, `downloads.wordpress.org`,
  `playground.wordpress.net` and `objects.githubusercontent.com` (where GitHub release assets
  redirect) are all unreachable. WordPress itself was recovered from the
  `@wp-playground/wordpress-builds` npm tarball. So the **commerce** templates
  (`content-product.php`, shop archive, cart, checkout) are structurally linted and
  syntax-checked but have **not been rendered against a live WooCommerce** — run
  `./bin/preview.sh` (with WooCommerce) on a machine with normal network before shipping.
### 7.4.21 Two-repo split executed (2026-08-23, seventeenth session)
- [x] Owner decision (`docs/09-frontend-strategy.md`): build **both** front ends, in **two
      independent repos**. Platform repo = Spring Boot + React + the canonical `design/` kit
      (portfolio). Theme repo = WordPress/WooCommerce (the sellable product).
- [x] `wordpress/cartly` split out with `tools/split-theme-repo.sh` (git subtree, history
      preserved) and pushed to **https://github.com/K-Anjan25/cartly-wp-theme** — 4 commits, CI at `.github/workflows/ci.yml`,
      verified through the GitHub API.
- [x] `wordpress/` **removed from this repo.** Content remains in this repo's history and in
      the `.bundle` the split script emits. Keeping a second copy here was the drift trap the
      split exists to avoid.
- [x] Anti-drift guard: `design/tokens.json` is canonical HERE; the theme's `bin/sync-tokens.sh`
      pulls `frontend/src/tokens.css` and its CI fails on drift (it caught a real divergence on
      its very first run).
- [x] `tools/patches/theme-standalone-readme.patch` — rewrites the theme README for standalone
      life (absolute cross-repo links, no `../../` or `cd wordpress`). Verified with
      `git apply` against the live repo. **Apply it there**, it cannot be pushed from here.
- ⚠️ Still true: the theme's WooCommerce templates have never been rendered against a live
  WooCommerce (see 7.4.20). That is the top item in the theme repo.

### 7.4.22 Where the platform repo goes next
- **Phase 9 is complete.** CMS/store settings, scoped Manager role and cross-service audit log are done. The audit ledger merges the latest identity, catalog and commerce mutations in the admin studio.
- Next is Phase 10: structured logs, rate limiting, backups, i18n, PWA.
- `main` is still at the pre-redesign merge — **PR #2 carries this entire session** and needs
  merging before `main` reflects reality.

---

## 7.5 Phase-end verification runbook (MANDATORY at each phase end)

Run these in order after completing a phase's backend + frontend work:

```powershell
# 1. Frontend build
cd frontend
npm run build

# 2. Backend build + tests
cd ..
.\common\mvnw.cmd -B clean package

# 3. Docker rebuild + restart (if backend schema/API changed)
docker compose up -d --build

# 4. Wait for health
docker compose ps
# expect: api-gateway, product-service, commerce-service, user-service, postgres, rabbitmq = healthy

# 5. Gateway smoke tests
curl.exe -s http://localhost:8889/actuator/health
curl.exe -s "http://localhost:8889/v1/products?size=3"
```

If step 2 or 3 fails, fix before proceeding. If step 4 shows an unhealthy service, inspect logs:
```powershell
docker compose logs <service-name>
```

---

## 7.6 DB schema drift notes

Hibernate `ddl-auto: update` handles schema migrations in dev, but **named volumes persist
schema across code changes**. If you add a column/table and get `SQLGrammarException` at
runtime:

1. Check the entity field is present and mapped.
2. If the volume is stale, apply a one-off `ALTER TABLE` against the live DB:
   ```powershell
   docker compose exec -T postgres psql -U postgres -d productdb -c "ALTER TABLE ..."
   ```
3. Restart the affected service: `docker compose restart <service>`.

If the volume is wiped (`docker compose down -v`), Hibernate rebuilds schema from entities on
next boot — no manual ALTER needed.

---

## 7.7 Suggested next action for the next agent

Continue **Phase 7** with the three items in §7.4.2:
1. Add `ShippingRate` entity + pincode lookup service in `commerce-service`.
2. Add `TaxRule` entity + state tax lookup; update checkout tax calculation.
3. Wire stock restoration into `ReturnRequestService.approveReturnRequest`.

At phase end, run the **Phase-end verification runbook** (§7.5): frontend build → Maven build →
Docker rebuild/restart → smoke test.
