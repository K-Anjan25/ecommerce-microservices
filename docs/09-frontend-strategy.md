# 9. Which front end? — architecture decision

> Status: **DONE (2026-08-23) — split into two repos.**
> Platform: `ecommerce-microservices` (this one) · Theme: [`cartly-wp-theme`](https://github.com/K-Anjan25/cartly-wp-theme)
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
| React storefront | 120 files · ~11,500 LOC | Editorial Warmth implementation; portfolio/demo platform |
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

## 9.6 Decision — split into two repositories

The owner's answer to §9.3 was **both**, as two independent repos. That is a
better answer than either option alone, and it works *because the split is real*
— the two have different audiences, release cadences and deploy targets:

| | Platform repo | Theme repo |
|---|---|---|
| Repo | `ecommerce-microservices` (this one) | [`cartly-wp-theme`](https://github.com/K-Anjan25/cartly-wp-theme) |
| Contains | Spring Boot ×4 · React storefront · **`design/` (canonical)** · docs | The WordPress/WooCommerce theme |
| Audience | Recruiters, engineers reading the code | Site owners installing a theme |
| Runs on | Docker Compose, 2 GB budget | Any WordPress host |
| Ships as | A repo you point people at | A theme `.zip` |
| Cadence | Roadmap phases | WordPress/Woo release cycle |
| Next work | Phase 9 leftovers, Phase 10 | Verify against live WooCommerce, harden |

### The one rule that makes this safe

**Exactly one of them is "the store" at a time.**

- The React storefront is the **portfolio demo**. It talks to the Spring Boot
  services. It is not trying to take real money.
- The WordPress theme is the **product**. It talks to WooCommerce. Real orders
  go here.

Never let both claim to be the live store. That is the drift trap this split is
designed to avoid, not create.

### Keeping them from diverging

`design/tokens.json` stays **canonical in the platform repo**. There is no third
"design system" repo — that is overhead a solo maintainer does not need.

Instead the theme pulls tokens and CI refuses to let them rot:

```bash
./bin/sync-tokens.sh          # pull the platform's tokens
./bin/sync-tokens.sh --check  # CI: exit 1 if they drifted
```

It works in both layouts — inside the monorepo it reads
`../../frontend/src/tokens.css` from disk; standalone it fetches the raw file
from the platform repo. The theme's CI also fails if the committed
`assets/css/cartly.css` is stale relative to its source.

> This check earned its keep immediately: the first run found the theme's
> `tokens.css` had already drifted from the React one (a header comment I had
> edited while copying). Day one.

### The split, as performed

Done on 2026-08-23. `wordpress/cartly` was extracted with
`tools/split-theme-repo.sh` and pushed to
[`cartly-wp-theme`](https://github.com/K-Anjan25/cartly-wp-theme) — 4 commits, history preserved, CI landed at
`.github/workflows/ci.yml`. The directory has since been removed from this repo;
its content remains in this repo's history and in the `.bundle` the script
emits.

### Re-running the split

`tools/split-theme-repo.sh` extracts `wordpress/cartly` with **its git history
intact** (`git subtree split`), moves the CI workflow to the repo root, writes a
`.gitignore`, and produces both a working clone and a `.bundle`:

```bash
tools/split-theme-repo.sh
# → /tmp/cartly-wp-theme  +  /tmp/cartly-wp-theme.bundle

gh repo create cartly-wp-theme --public --source /tmp/cartly-wp-theme --push
```

Then, and **only** once the new repo exists, retire the copy here so the two
cannot drift:

```bash
git rm -r --cached wordpress && rm -rf wordpress
git commit -m "chore: theme moved to its own repository"
```

The script is idempotent and non-destructive to this repo — re-run it freely.
