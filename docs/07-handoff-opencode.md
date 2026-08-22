# 7. Handoff — Phase 6 complete, Phase 7 started

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

### 7.4.6 Remaining / optional
- [ ] Public order-tracking page for guests ("email link to track" in the roadmap) — needs
      public `GET /v1/orders/{id}/track` and a frontend page.
- [ ] `formdata.json` state list is outdated — no TELANGANA entry.
- Phase 7 scope is otherwise complete → next roadmap stop is Phase 8 remainder (price-drop
  alerts) and Phase 9 (admin platform & analytics).

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
