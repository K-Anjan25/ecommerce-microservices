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
- [ ] Remaining feature pages (GiftCards, FlashSales, Referral, Returns,
      LoyaltyPoints, Compare, Addresses) inherit the tokens but were not
      re-composed.
- [ ] Dark mode — token structure supports a second mode; values unchosen.
- [ ] Roadmap Phase 9 leftovers are unaffected: CMS/store settings, audit log,
      staff (Manager) role.
