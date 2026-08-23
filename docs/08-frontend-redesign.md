# 8. Frontend redesign — Cartly 2.0

> Session: 2026-08-23, branch `arena/01a02c1c-ecommerce-microservices`.
> Scope: a new visual language + an information-architecture rearrangement of the
> React storefront and admin console, delivered together with the wireframes and
> design tokens that specify it.
>
> Full design rationale, before/after tables and the Figma import procedure live
> in [`design/README.md`](../design/README.md). This file is the engineering
> record: what changed in the codebase, what to watch out for, what's left.

---

## 8.1 Deliverables

| Artefact | Path |
|---|---|
| Design tokens (Tokens Studio / Figma variables) | `design/tokens.json` |
| 7 wireframe artboards (SVG, drag into Figma) | `design/wireframes/*.svg` |
| Wireframe generator (source of truth) | `design/wireframes/generate.mjs` |
| Design kit + Figma handoff | `design/README.md` |
| Dev-only mock gateway for design review | `design/preview-mock-server.mjs` |

Wireframes: `01` global shell · `02` storefront · `03` product detail ·
`04` cart→checkout · `05` admin console · `06` mobile (3 screens) ·
`07` component sheet & tokens.

---

## 8.2 The one trick that made this cheap

**Token names were not renamed.** `brand`, `brand-main`, `brand-soft`,
`brand-tint`, `accent`, `ink`, `ink-soft`, `ink-muted`, `paper` all still exist —
only their *values* moved (forest green → violet, cream → bone, amber → lime,
`#102A43` → true ink). ~30 pages that were never opened this session picked up
the new look for free.

Two additive tokens were introduced because 1.x conflated them:
`canvas` (app background, was `paper`) and `line` (hairline, was `ink/10`).
`paper` now means "a white surface", which is what the 50 `text-paper` usages
already assumed.

---

## 8.3 Files changed

### Tokens / foundations
- `frontend/tailwind.config.js` — regenerated from `design/tokens.json`
  (colours, `font-heading`/`font-display`/`font-mono`, radius 6→28 scale,
  shadow scale, `max-w-container`, keyframes).
- `frontend/src/globalTheme.ts` — MUI theme kept in lock-step: palette, Inter
  Tight headings, 14px default radius, hairline `MuiCard`, uppercase-eyebrow
  table heads, tooltip/chip/alert overrides.
- `frontend/src/style.css` — rewritten `@layer components`: `.panel`,
  `.panel-ink`, `.chip` / `.chip-active` / `.chip-ink`, `.badge-sale`,
  `.badge-stock-*`, `.primary-/dark-/accent-/secondary-button`, `.eyebrow`,
  `.product-grid`, `.grain`, `.no-scrollbar`.
- `frontend/index.html` — Inter + **Inter Tight** + **Instrument Serif** +
  IBM Plex Mono; new ink/lime favicon; `theme-color` `#0B0B0F`;
  `viewport-fit=cover` for the mobile safe area.
- `frontend/public/manifest.json` — theme/background colours.

### Shell (wireframe 01 / 06)
- `components/Navbar` — **rewritten**. Dismissible announcement bar
  (session-scoped, scrolls away), sticky header with a centred command search
  (`⌘K`/`Ctrl+K` focus), 4 primary links, compare/orders/cart actions, a richer
  account menu, and a **sticky category rail** on the storefront fed by
  `GET /v1/categories` (react-query, 5-min stale). The mobile drawer gained
  search, grouped sections and category chips.
- `components/MobileTabBar` — **new**. Fixed bottom tab bar (Shop · Search ·
  Cart · Orders · You) with a cart badge and `env(safe-area-inset-bottom)`;
  hidden from `lg`.
- `components/DashboardLayout` — **rewritten**. `bg-canvas`, page-shell applied
  only to non-storefront routes (the storefront is full-bleed for its hero),
  `pb-24` to clear the tab bar, and an inverse ink footer with 3 link columns +
  payment badges.
- `components/AuthLayout` — ink split panel instead of the green gradient.

### Product detail (wireframe 03)
- `components/Card/ProductCard/index.tsx` — **rewritten**. Vertical thumbnail rail +
  4:3 main image with prev/next; buy box with brand eyebrow, `Rating`, price row
  (effective / compare-at / save %), **variant chips instead of a `Select`**
  (sold-out variants disabled + struck through), stock badge, CTA row at the price's
  eye-line, price-drop alert; a 4-row delivery/returns/security/gift trust panel;
  a **sticky selection rail** (live line total, loyalty preview, frequently bought
  together); and **tabs** — Description · Specifications · Reviews · Shipping &
  returns — replacing the single endless column. Specs are derived from the product
  plus the selected variant's `attributes` JSON (parsed defensively).
- `pages/Products/Product/index.tsx` — breadcrumb replaces the "Back to shop"
  button; a layout-matched skeleton replaces the two generic card placeholders.

### Cart → checkout (wireframe 04)
- `components/CheckoutSteps` — **new**. Shared 3-step progress header
  (Cart → Address & payment → Confirmation); completed steps are clickable.
- `components/CartLine` — **new**. Compact cart row (thumb, name, brand, variant
  chip, stock warning, qty stepper, line total, remove). The cart previously reused
  the *grid* product card, which is a browse component (4:3 cover, description,
  compare button) and made the cart read like a search result.
- `pages/Cart/index.tsx` — **rewritten**: stepper, free-shipping progress nudge,
  line-item panel, and a **sticky summary** whose primary CTA is now *Checkout*
  (the COD quick-order modal is preserved as a secondary text action).
- `pages/Checkout/index.tsx` — **re-composed, logic untouched**. Numbered sections
  (1 address · 2 delivery method · 3 payment · 4 credits & extras · collapsible
  review), selectable option **cards** replacing the two `Select` dropdowns,
  coupon state rendered as an applied/empty pair, sticky order summary on desktop
  and a **fixed pay bar** on mobile. Every mutation, query, tax/shipping formula and
  session-storage behaviour is byte-for-byte the original — the submit buttons live
  outside the `<form>` and reach it via `form="checkout-form"`.

### Storefront (wireframe 02)
- `pages/Products/index.tsx` — **rewritten** around the new order: hero → trust
  strip → category tiles → bestsellers → **sticky toolbar** → facet sidebar +
  grid. Active facets are removable chips with a result count and "Clear all";
  the sidebar becomes a bottom-sheet `Drawer` on mobile with a "Show N results"
  confirm. Also handles three navbar hand-offs via `location.state`:
  `{ search }`, `{ category }`, `{ focusSearch }`.
- `components/Card/index.tsx` — **rewritten** to the frame-07 anatomy
  (badge stack top-left, compare top-right, stock warning only when out/low,
  brand eyebrow, 2-line name, rating, price + strikethrough, docked full-width
  add-to-cart bar that becomes a −/qty/+ stepper). Variant-aware cart wiring is
  unchanged.

### Order screens
- `pages/Orders` — order cards with a canvas header strip (id / date / total /
  `StatusPill`), stacked product thumbnails resolved in **one** batched
  `findByIds` call across all orders, and buy-again + details actions. Loading is
  a skeleton instead of the word "Loading...".
- `pages/Orders/OrderDetail` — **rewritten**: status timeline, real product names
  and thumbnails, per-line return buttons that **preselect that item** in the
  dialog, a payment summary (subtotal / discount / shipping / tax / gift wrap →
  total), the delivery address, and the returns already raised on the order.
- `pages/Admin/Orders/OrderDetail` — **rewritten**: three fact cards
  (status + total, customer, ship-to), line items through `DataTable` with
  thumbnails and variants, a totals aside, and the returns queue with
  `StatusPill` + `LoadingButton` approve/reject/refund.
- **Fixed across all three**: the detail screens printed `Product <uuid>` for
  every line and every return, because product ids were never resolved to
  products. They now batch-resolve and fall back to a truncated id only when a
  product has been deleted.
- Dead code removed: `ORDER_PRODUCT_COLUMNS` and `OrderProductRow` had no
  remaining consumers after the admin rewrite.

### Feature pages (account / marketing)
- `components/FeatureHero` — **new**. One ink opening beat (eyebrow, headline,
  optional big metric, actions, slot) shared by Loyalty, Referral, Gift Cards and
  Flash Sales; every one of those pages used to start with a different grey
  `Paper`. Ships `HowItWorks`, the numbered 3-step strip underneath.
- `pages/LoyaltyPoints` — hero with balance + progress to the next tier, three
  stat tiles (balance / lifetime earned / lifetime redeemed), how-it-works, and a
  proper history list. **Fixed a React key warning** — entries were wrapped in a
  keyless `<>` with the key on the inner `ListItem`.
- `pages/FlashSales` — hero with a live countdown driven by the soonest-ending
  sale and the deepest discount as the metric; `product-grid` instead of MUI
  `Grid`; real empty and loading states.
- `pages/Referral` — code presented as a dashed ink ticket, `navigator.share`
  with clipboard fallback, copy-confirmation state, how-it-works, validate box.
- `pages/GiftCards` — amount presets + custom field, validity chips, and a **live
  gift-card preview** that fills in as you type; result card with one-tap code copy.
- `pages/Returns` — status filter chips with counts, shared `StatusPill`, refund
  amount/reference surfaced, link through to the originating order.
  **Fixed a dead class** — the empty state used `btn-primary`, which does not exist.
- `pages/Compare` — image-headed columns with per-column remove, and rows now
  **mark the winning product** (cheapest price, best rating, most stock) instead of
  leaving the reader to diff the numbers.
- `pages/Addresses` — **fixed two real bugs**: the state list was hardcoded to five
  states (so an address in e.g. Telangana could not be saved) and now uses the same
  `formdata.json` dataset as checkout with a dependent district select; and
  `defaultAddress` existed in the payload but had **no UI**, so no address could
  ever be made default from this page.

### Admin tables (wireframe 05, bottom)
- `components/DataTable` — **new**. One table primitive for the whole admin:
  full-bleed in its panel, sticky uppercase-eyebrow header on `bg-canvas`,
  hairline rows, dense padding, per-column `align`/`minWidth`/`mono`/`render`
  and a `hideBelow` breakpoint so wide tables shed columns instead of scrolling.
  **Below `md` it switches to a stacked card list** — a 7-column admin table on a
  phone was unusable. Ships `TableIconButton` and `StatusPill` (one shared
  status→tone map for order/return/coupon/user states).
- `Table/TableWithActions` + `Table/TableWithDetail` — rewritten as thin adapters
  over `DataTable`; **their props are unchanged**, so `Admin/Products` and
  `Admin/Orders` were not touched. The old components hardcoded
  `maxWidth: 1200px` and `marginTop: 16px`, which is why admin tables never
  filled the console.
- `pages/Admin/Users` — dropped its hand-rolled MUI table for `DataTable`
  (avatar initials cell, role chip, status pill, enable/disable action).
- `components/SkeletonRows` — reshaped to match `DataTable` so nothing jumps
  when data lands.
- Redundant `!bg-brand !text-paper hover:!bg-brand-main` overrides removed from
  19 files: the MUI theme's `containedPrimary` already supplies them, and the
  overrides were suppressing the theme's button shadow.

### Admin (wireframe 05)
- `components/AdminLayout` — **rewritten** as an ink nav rail with the user
  identity docked at the bottom, a sticky topbar showing the current section, and
  a mobile `Drawer`. Nav re-prioritised: Dashboard · **Orders** · Products ·
  Categories · Coupons · Returns · Customers.
- `pages/Admin/Home` — recharts colours re-pointed at the new palette.
- `components/PageHeader` — optional `eyebrow`, semantic `<header>`/`<h1>`.

### Dark mode
- `frontend/src/tokens.css` — **new**. Every colour is a CSS custom property in
  space-separated RGB channels (`--c-brand: 91 61 245`), declared once for
  `:root` and once for `.dark`. Tailwind consumes them as
  `rgb(var(--x) / <alpha-value>)`, so opacity modifiers (`bg-paper/90`,
  `border-line/60`) keep working.
- **The token split that made this cheap.** `ink` was doing two jobs: text
  colour *and* "intentionally dark surface" (hero, footer, admin rail,
  announcement bar, card action bar). Those must move in opposite directions in
  dark mode. So `ink*` is now strictly FOREGROUND (inverts), and two new tokens
  carry the other job: `contrast` (dark in *both* modes, lifted to `#1E212A` in
  dark so it still separates from the canvas) and `oncontrast` (always
  near-white). A scripted migration moved 19 files: `bg-ink → bg-contrast`,
  `text-paper → text-oncontrast`.
- **Fixed palettes swapped for semantic ones.** ~60 usages of
  `bg-emerald-50` / `text-rose-700` / `bg-amber-100` / `text-sky-700` /
  `bg-slate-100` became `state-{success,danger,warning,info}-{soft,on}` and
  `sunken` / `ink-soft`, which have dark values. (One literal stayed:
  `text-amber-500` on the rating star — a gold star is a literal, not a status.)
- `tailwind.config.js` — `darkMode: "class"`; colours resolve through the vars;
  `shadow-card/lift/pop` also come from vars, because a light-mode shadow is
  invisible on a dark canvas.
- `globalTheme.ts` — `createAppTheme(mode)` builds the MUI palette per mode
  (MUI needs real values, not vars). Brand lifts `#5B3DF5 → #7C5CFF` in dark:
  the light violet goes muddy against a near-black canvas.
- `hooks/useColorScheme.ts` + `context/colorScheme.ts` — follows the OS until
  the user picks a side, then persists to `localStorage`; also drives
  `<meta name="theme-color">` and `color-scheme`. `applyScheme()` runs **before**
  React mounts in `index.tsx`, so there is no light flash on load.
- Toggle lives in the header actions (desktop) and as a labelled row in the
  mobile drawer. Toasts and recharts follow the mode too.
- `design/palettes/` gained a dark panel (`00d-ink-violet-dark`) so the dark
  values are reviewable next to the light ones.

### Tooling
- `frontend/vite.config.ts` — `host: true` + `allowedHosts: ['.e2b.app', …]` so
  the dev server works behind a hosted preview proxy. No effect locally.

---

## 8.4 Gotchas for the next agent

1. **Sticky stack.** Header is `sticky top-0` (`h-16`); the category rail is
   `sticky top-16` (`h-12`). Anything else that sticks on the storefront must
   clear `7rem` (see the toolbar's `top-[7rem]`, the sidebar's `top-[13.5rem]`
   and the results section's `scroll-mt-[7.5rem]`). The announcement bar is
   deliberately **outside** the sticky region so those offsets stay constant
   whether or not it has been dismissed.
2. **`AdminLayout` uses negative margins** (`-mx-4 sm:-mx-6 lg:-mx-8 -mt-6
   sm:-mt-8`) to break out of `DashboardLayout`'s `page-shell`. If the shell's
   padding changes, change these too.
3. **`paper` is now white, not cream.** Page backgrounds must use `bg-canvas`.
3b. **`ink` is a FOREGROUND token.** For a surface that should stay dark in both
   modes use `bg-contrast` + `text-oncontrast` (or the `.surface-contrast`
   helper) — never `bg-ink`. Likewise prefer `state-*` over raw
   `emerald-50`/`rose-700`/etc., which do not adapt.
4. **MUI `Drawer` needs `PaperProps`**, not `slotProps.paper`, at the version
   pinned here — `slotProps` type-checks on `Menu` but not on `Drawer`.
5. **Checkout's submit buttons are outside its `<form>`** (they live in the sticky
   aside and the mobile pay bar) and are wired with `form="checkout-form"`. If you
   rename `FORM_ID`, rename all three.
6. **The mobile pay bar sits at `bottom-[3.875rem]`** — exactly the height of
   `MobileTabBar`. Change one and change the other.
7. The mock gateway is a **design tool**, never imported by the app; the real
   contract is still `docker compose up -d --build`.

---

## 8.5 Verification

```bash
cd frontend
npx tsc --noEmit     # clean
npm run build        # clean, ~9s
```

Visual review without the backend:

```bash
node design/preview-mock-server.mjs      # :8889
cd frontend && npm start                 # :3000
```

Backend is untouched by this session — no Java, pom, compose or SQL changes — so
CI's backend + compose jobs are unaffected.

---

## 8.6 Remaining redesign work

- [x] **Product detail** to frame 03 — gallery, buy box, sticky rail, tabs. *(done)*
- [x] **Cart → checkout** to frame 04 — stepper, sticky summary, mobile pay bar.
      *(done — they remain two routes joined by one stepper, which keeps the cart
      shareable/bookmarkable and the checkout form isolated.)*
- [x] Admin table density pass to frame 05 — shared `DataTable`, mobile card
      fallback, unified status pills. *(done)*
- [x] Feature pages (GiftCards, FlashSales, Referral, Returns, LoyaltyPoints,
      Compare, Addresses) re-composed. *(done)*
- [x] `pages/Orders` + both `OrderDetail` screens. *(done)*
- [x] Dark mode. *(done — see the Dark mode section above.)*
- [ ] Roadmap Phase 9 leftovers are unaffected: CMS/store settings, audit log,
      staff (Manager) role.
