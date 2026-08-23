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
5. The mock gateway is a **design tool**, never imported by the app; the real
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

- [ ] **Product detail** (`pages/Products/Product`) to frame 03 — gallery,
      buy box, sticky rail, tabs.
- [ ] **Cart + checkout merge** to frame 04 — stepper, one scroll, sticky summary,
      mobile pay bar. (`pages/Cart` + `pages/Checkout` are still separate.)
- [ ] Admin table density pass (Orders / Products / Users) to frame 05.
- [ ] Remaining feature pages (GiftCards, FlashSales, Referral, Returns,
      LoyaltyPoints, Compare, Addresses) inherit the tokens but were not
      re-composed.
- [ ] Dark mode — token structure supports a second mode; values unchosen.
- [ ] Roadmap Phase 9 leftovers are unaffected: CMS/store settings, audit log,
      staff (Manager) role.
