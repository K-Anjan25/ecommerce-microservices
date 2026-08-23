# 9. Which front end? — architecture decision

> Status: **OPEN — needs an owner decision.**
> Raised 2026-08-23 after the WordPress theme landed and the question became
> unavoidable: *if we use PHP, we don't need React.*
>
> That instinct is correct. Right now the repo has **three** things that all
> want to be "the website", and keeping all three is the one option that is
> definitely wrong.

---

## 9.1 What actually exists today

| Piece | Size | State |
|---|---|---|
| Spring Boot services (4 + event-bus + common) | 275 files · ~10,600 LOC | CI green, Phases 6–9 done |
| React storefront | 120 files · ~11,500 LOC | Fully redesigned (Cartly 2.0) |
| WordPress theme | 32 files · ~2,800 LOC | Renders on real WP; Woo untested |
| Design kit (tokens, 7 wireframes, palettes) | — | **Front-end agnostic — survives any choice** |

The commerce domain we hand-built in Java:

`Cart · Coupon · GiftCard · LoyaltyPoint · Order · Payment · ReturnRequest ·
SavedAddress · ShippingRate · TaxRule · Wishlist`

**WooCommerce ships every one of those**, most in core, the rest as mature
plugins. That is the uncomfortable fact at the centre of this decision.

---

## 9.2 The honest comparison

### Option A — Go all-in on WordPress + WooCommerce
*Delete the React app. Retire or archive the Java services. The Cartly theme
becomes the product.*

**You gain**
- Payments that are actually PCI-compliant, via gateways someone else maintains.
- Tax, shipping-carrier, invoicing and GDPR tooling that already exists.
- An admin your client/ops team can use without you building it.
- Plugins for the things still missing (gift cards, loyalty, referrals).
- Time-to-live measured in **days**.

**You lose**
- ~10,600 lines of Java that are the most impressive thing in this repo.
- The microservices story: RabbitMQ events, circuit breakers, JWT gateway,
  service decomposition, the 2 GB budget engineering.
- Control. You are now on WordPress's release cadence and plugin quality.

**Costs you may not have priced**: hosting with real PHP + MySQL, plugin
licences (gift cards/loyalty are usually paid), and the fact that PHP hosting
that survives traffic is not the €4/month tier.

---

### Option B — Keep Spring Boot + React. Treat the WP theme as a design artefact.
*The React storefront stays the product. The theme is a demonstration that the
design system ports.*

**You gain**
- The backend portfolio stays intact and keeps growing (Phase 9/10 remain).
- One front end to maintain, already redesigned and consistent.
- Full control over the domain model.

**You lose**
- Everything WooCommerce would have given you for free, stays your problem.
  Real payment capture, tax compliance, refunds against a live PSP, invoices,
  fraud, dunning — all still to build, and all boring.
- Time-to-live measured in **months**, honestly.

---

### Option C — Headless: WooCommerce as the backend, React as the front end
*Woo Store API for cart/checkout; React renders it.*

Sounds like the best of both. In practice at this size it is usually the worst:
you inherit WooCommerce's data model **and** own a bespoke front end, lose the
plugin ecosystem's front-end half (most plugins render PHP), and still have to
host both. It is a real pattern, but it earns its complexity at a scale this
project is not at.

**Not recommended unless** the Java services are being retired *and* you need a
front end WordPress themes cannot express.

---

## 9.3 The decision rule

It comes down to one question — **what is this project for?**

> **If it is a portfolio / learning project → Option B.**
> A Spring Boot microservices platform with RabbitMQ, a JWT gateway, circuit
> breakers and a 2 GB budget is a *hiring signal*. "I configured WooCommerce"
> is not. Do not delete the thing that makes this repo worth showing.

> **If you intend to actually sell things to real customers → Option A.**
> You will not beat WooCommerce to market, and the parts you have not built yet
> (payment capture, tax compliance, refunds, invoicing) are exactly the parts
> that are unforgiving when they are wrong. Ship the store; keep the Java repo
> as a separate portfolio piece.

There is no shame in either. There *is* a cost to not choosing: three front
ends is three things to keep in sync, and they will drift within a month.

---

## 9.4 On "use a WooCommerce template instead"

Separate question, worth answering directly: should the theme be a ready-made
one (Storefront, Astra, Blocksy, Kadence) rather than the custom Cartly theme?

**Use a ready-made theme if** the design is negotiable. They are well tested,
have huge option panels, and you will be live faster.

**Keep the custom theme if** the design is the point — which, given we spent
this long on wireframes and a token system, it is. A ready-made theme gets you
80% of a *generic* look quickly, then you fight its CSS for the remaining 20%
to reach *this* look. The Cartly theme is already at 100% of this look and is
built on WooCommerce's hook API rather than copied templates, so it survives Woo
upgrades.

Middle path if you want a safety net: keep Cartly as a **child theme of
Storefront**. You inherit Woo's officially-maintained template coverage and
override only what the design changes. Costs about a day.

---

## 9.5 What survives every option

- `design/` — tokens, 7 wireframes, palette sheet. Design source of truth.
- `docs/` — architecture, requirements, UML, roadmap, this decision.
- The design language itself, now proven to port between React and PHP.

---

## 9.6 Recommendation

**Choose one front end this week.** My read of the repo — phased roadmap,
memory budget, CI, UML docs — is that this is a **portfolio project**, which
points at **Option B**: keep Spring Boot + React, keep the WordPress theme as a
demonstration piece, and stop adding to it.

But that read may be wrong, and it is your call. If the goal is a real store,
**Option A** is the correct answer and I would say so just as plainly.
