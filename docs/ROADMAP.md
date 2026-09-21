# Cartly → Amazon-class: Gap Analysis & Roadmap

Honest assessment against the bar set by Amazon / Flipkart / Myntra, grounded in
what the codebase actually ships today. Grouped by priority: **P0** = customers
feel the gap on every order, **P1** = operational/compliance depth, **P2** =
platform polish and scale.

## What already exists (do not re-plan)

- **Auth**: email + phone-OTP sign-in/sign-up (country codes, hashed OTPs),
  JWT access/refresh with token versioning, roles, referral codes.
- **Catalog**: products/variants/categories, search with typeahead,
  faceted filters (category / brand / price / rating) + sorting, flash sales,
  wishlist, compare, price watch.
- **Cart & checkout**: guest checkout, saved (default) address apply, coupons,
  gift cards, loyalty points, COD + Stripe card payments, checkout tokens.
- **Post-order**: order status history API, invoice download
  (`/v1/orders/{id}/invoice`), returns flow + admin queue, gift-card-purchase
  refunds, payment reconciliation admin.
- **International**: shipping zones w/ duty rates, live quotes, INR billing +
  display-currency switcher, territory-correct address forms (28 countries,
  city pickers), phone auth per country.
- **Trust & content**: reviews (comments w/ ratings), Help/Services/Contact/
  Terms with real backend contracts, audit logs, admin console.
- **Platform**: PWA (manifest + SW), i18n EN/HI, dark mode, SSR option, SEO
  sitemap, Docker Compose, Backend+Frontend CI, RabbitMQ event bus, email
  retry-outbox infra.

## P0 — the gaps customers hit every order

1. **Address picker at checkout.** Only the *default* saved address is
   applied today. Amazon always shows the full address list with add/edit.
   → `AddressApi.getSavedAddresses` already exists; render a chooser
   (radio list + "Add address" opening the territory-aware form).

2. **Real shipment tracking.** We have internal status history, but no carrier
   AWB/tracking number or a customer-facing tracking timeline ("Ordered →
   Packed → Shipped → Out for delivery → Delivered" with dates).
   → Add `awb`, `carrier`, `labelUrl` to shipment data; timeline UI off the
   existing `OrderStatusHistoryDto`; optional Shiprocket/Delhopy pull later.

3. **Order event notifications.** Infra exists (RabbitMQ notification config +
   email retry outbox) but order-placed / shipped / delivered / refund emails
   are not wired, and SMS needs a provider. Amazon's #1 retention loop.
   → Consumers on order events → templates → outbox (email first, SMS stub
   already logged in preview).

4. **India payment rails.** Checkout advertises UPI but only COD + Stripe
   exist. Flipkart/Amazon India are UPI-first.
   → Razorpay/Cashfree order + intent flow (UPI/cards/netbanking), webhook
   verify, refunds-to-source. Fits the existing PaymentProvider abstraction.

5. **Cart depth.** Missing *Save for later*, move-to-wishlist from cart, and
   per-line notes/gift options. Small frontend-heavy wins.

6. **Verified-purchase reviews.** Reviews exist but carry no verified badge,
   helpfulness votes, or review images — the trust core of Amazon PDPs.
   → Order-item ownership check for the badge (data already joins on
   customerId); votes + image attachments on comments.

7. **Recommendations & recently viewed.** No PDP "frequently bought together",
   no recently-viewed rail, home is not personalized.
   → Start deterministic: same-category co-purchase counts from `orders` data
   (SQL), client recently-viewed in localStorage. No ML needed for v1.

8. **Account security & privacy.** No 2FA (email OTP on new-device login is a
   cheap first step), no device/session list, no account deletion/data export
   (DPDP Act / GDPR expectations).

## P1 — operational depth

9. **Cancellation & refunds to source** for prepaid orders (Stripe refund API
   call-through, auto-refund on admin approval of returns) + partial refunds
   per line.
10. **Serviceability & delivery options**: delivery slots/speed tiers
    (same-day/express), COD limits per user/zone, courier selection.
11. **GST invoicing depth**: GSTIN on invoice, HSN codes, B2B e-invoice/IRN
    hook (invoice PDF exists — needs tax-breakout fidelity).
12. **Fraud & risk**: velocity checks, COD abuse flags, address risk scoring,
    chargeback workflow on top of payment reconciliation.
13. **Admin analytics**: revenue/conversion/AOV dashboards, cohort retention,
    CSV exports (Admin Home currently shows operational queues only).
14. **CS agent tooling**: order lookup with refund/return overrides, customer
    timeline in one screen (support tickets exist; no agent order tools).
15. **Inventory operations**: low-stock alerts, purchase orders, per-warehouse
    stock (CommerceInventoryService is single-pool today).

## P2 — scale & market fit

16. **Marketplace model** (the actual Amazon architecture): sellers,
    commissions, payouts, seller portal. This is a company-stage decision —
    single-retailer (FirstCry model) is a valid end-state; decide before
    touching order schema (add `sellerId` early if marketplace is likely).
17. **Per-country storefronts**: local language, local currency *billing*
    (FX provider), DDP duty collection at checkout (we estimate duty today;
    Amazon collects it), international returns.
18. **Notification center + push** (web push exists as PWA base), back-in-stock
    alerts alongside the existing price watch.
19. **Observability & experimentation**: metrics/tracing, rate limiting,
    feature flags, A/B framework.
20. **Native apps** once mobile web converts well.

## Suggested next sprint (highest value-first, fits current architecture)

1. Checkout address picker (P0-1) — hours, all data exists.
2. Order-tracking timeline UI + AWB field (P0-2) — small backend + UI.
3. Verified-purchase badge on reviews (P0-6) — one join.
4. Save-for-later + move-to-wishlist (P0-5) — frontend-heavy.
5. Order-event emails through the existing outbox (P0-3) — event consumers.
6. Razorpay UPI/card intent (P0-4) — biggest lift; start behind a flag.
