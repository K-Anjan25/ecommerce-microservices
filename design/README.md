# Cartly 2.0 — Design kit

Everything needed to rebuild this redesign in Figma, plus the machine-readable
tokens the frontend is generated from.

```
design/
├── tokens.json                 # Tokens Studio (Figma plugin) compatible
├── palettes/
│   ├── README.md               # six palette options + how to switch
│   ├── comparison.png/.svg     # side-by-side sheet (same UI, six palettes)
│   ├── 00-ink-violet.svg …     # one panel per candidate
│   └── generate.mjs
├── wireframes/
│   ├── generate.mjs            # regenerates every SVG below
│   ├── 01-global-shell-desktop.svg
│   ├── 02-storefront-desktop.svg
│   ├── 03-product-detail-desktop.svg
│   ├── 04-cart-checkout-desktop.svg
│   ├── 05-admin-console-desktop.svg
│   ├── 06-mobile-flows.svg     # 3 phone screens, 390 × 844
│   └── 07-component-sheet.svg  # the Figma library page
└── preview-mock-server.mjs     # dev-only fake gateway for design review
```

---

## 1. Getting this into Figma

Figma has no importable open file format, so the kit ships as **SVG artboards +
a token JSON**. Both round-trip cleanly.

### 1.1 Wireframes → Figma frames

1. Create a new Figma file, name it `Cartly 2.0 — Wireframes`.
2. Drag all seven `.svg` files from `design/wireframes/` onto the canvas
   (or **File → Place image…**). Each file lands as **one editable frame**.
3. Every SVG group is named (`header`, `category-rail`, `product-card-3`,
   `order-summary-sticky`, `annotations`, …), so the Figma layer tree arrives
   already structured — no ungrouping archaeology.
4. Select a frame → right-click → **Frame selection**, then rename to the file
   name. Arrange them left→right in the order 01 … 07 on one page.
5. Optional: select the `annotations` group in each frame and move it to its own
   layer so review comments can be toggled off.

> Re-generate after any change: `node design/wireframes/generate.mjs`.
> The generator is the source of truth — edit `generate.mjs`, not the SVGs.

### 1.2 Tokens → Figma variables

1. Install the **Tokens Studio for Figma** plugin (free).
2. Plugin → **Settings → Import → File** → pick `design/tokens.json`.
3. **Create styles / Create variables** — you get colour, type, spacing, radius
   and shadow variables matching the code 1:1.
4. Name the collection `cartly/2.0`. Modes: only `light` for now (dark mode is a
   Phase 10 item).

### 1.3 Suggested Figma page structure

| Page | Contents |
|---|---|
| `00 · Cover` | Screenshot of frame 02 + version + owner |
| `01 · Foundations` | Frame 07 (component sheet) + the imported variables |
| `02 · Components` | Detached components built from frame 07: Button, Chip, Input, ProductCard, EmptyState, Skeleton, Toast |
| `03 · Storefront` | Frames 01, 02, 03 |
| `04 · Checkout` | Frame 04 |
| `05 · Admin` | Frame 05 |
| `06 · Mobile` | Frame 06 |
| `99 · Archive` | The 1.x green/cream screens for before/after |

---

> **Choosing a palette?** See [`design/palettes/README.md`](palettes/README.md) —
> six options rendered as the same storefront fragment, including the currently
> shipped one. Swapping costs three files because token names never change.

## 2. The design direction

**Cartly 1.x** was forest green (`#014C3E`) on cream (`#FAF7ED`) with amber
accents — warm, but every surface was tinted, so nothing had hierarchy: the page
background, cards and header all competed.

**Cartly 2.0** is a *quiet canvas, loud actions* system.

| | 1.x | 2.0 |
|---|---|---|
| Canvas | cream `#FAF7ED` + two radial gradients | bone `#F6F5F2`, flat |
| Surface | white cards on cream | white cards, 1px `#E5E3DD` hairline, no shadow at rest |
| Primary | forest green | violet `#5B3DF5` |
| Highlight | amber | lime `#D8F14B` (on ink only) |
| Dark surface | brand green | true ink `#0B0B0F` |
| Type | Inter everywhere | Inter (body) + Inter Tight (headings) + Instrument Serif (hero) |
| Radius | uniform 12/16 | 6 → 28 scale, tighter on controls |
| Elevation | shadows on everything | hairlines at rest, shadow only on hover/overlay |

Colour is doing one job: **violet = "you can act here", lime = "this is a deal",
ink = "this is chrome, not content"**. Everything else is greyscale so product
photography carries the page.

---

## 3. What got rearranged (and why)

### 3.1 Global shell — frame 01

| Before | After | Why |
|---|---|---|
| 8 flat nav links crammed into the app bar | 4 primary links (Shop · Deals · Gift Cards · Rewards); the rest moved to the account menu + drawer | The app bar was a dumping ground; 4 items fit at 1024px without wrapping |
| Search: a 224px input squeezed at the right of a green bar | Centred pill, `max-w-md`, `⌘K` shortcut | Search is how people use a catalog. It gets the middle of the header |
| Categories only inside a `<select>` on the page body | Persistent horizontal **category rail** under the header on the storefront | One tap instead of open-dropdown-scan-select |
| No announcement slot | Dismissible ink announcement bar (session-scoped) | Shipping threshold + flash-sale urgency need a home |
| Cream footer with one line | Inverse ink footer: 4 link columns, payment badges, service line | A real end-of-page stop and a second navigation surface |
| Mobile: hamburger for everything | **Bottom tab bar** (Shop · Search · Cart · Orders · You) with a cart badge; hamburger keeps the long tail | The five core jobs become one thumb-tap |

### 3.2 Storefront — frame 02

Old order: page title → filter bar → sidebar + grid.
New order: **hero → trust strip → category tiles → bestsellers → sticky toolbar
→ facets + grid**.

- The hero replaces a plain `<h1>Shop products</h1>` with one clear entry point
  and a featured-bestseller panel.
- Active facets became **removable chips** in the toolbar with a result count and
  "Clear all" — previously you had to hunt the sidebar to find what was applied.
- The toolbar is sticky, so sort/search stay reachable during infinite scroll.
- On mobile the sidebar becomes a **bottom sheet** with a "Show N results"
  confirm, instead of pushing the grid 260px down the page.

### 3.3 Product card — frame 07

The 1.x card had **four chips stacked on one image** (category, brand, sale,
stock) that collided at small widths, and an icon-only add button.

New anatomy, top → bottom: cover · sale/flash badge (top-left) · compare
(top-right) · stock warning (bottom-left, *only* when out/low) · brand eyebrow ·
name (2 lines) · rating · price row (sale price + strikethrough) · **full-width
docked Add-to-cart bar** that turns into a −/qty/+ stepper once in the cart.

### 3.4 Product detail — frame 03

Gallery + buy box + a **sticky right rail** (summary, loyalty preview, frequently
bought together). Long-form content (description, specs, reviews, Q&A, shipping)
drops into tabs instead of one endless column. CTA row sits at the same eye-line
as the price.

### 3.5 Cart → checkout — frame 04

One scroll with a 4-step progress header: line items → address → delivery method
→ payment → credits (coupon / gift card / loyalty collapsed into one row), with a
**sticky order summary** so the total and "Place order" never leave the viewport.
Mobile gets a docked pay bar.

### 3.6 Admin console — frame 05

The light sidebar became an **ink nav rail** with the user identity docked at the
bottom, so the admin reads as a different mode from the storefront at a glance.
Content order follows decreasing abstraction: KPI row → 7-day revenue chart +
orders-by-status → the actual work queue (recent orders table). Nav order was
also re-prioritised: Dashboard · **Orders** · Products · Categories · Coupons ·
Returns · Customers (orders are what an operator opens 20× a day).

---

## 4. Implementation mapping

Token names were deliberately **kept identical** between 1.x and 2.0
(`brand`, `brand-soft`, `ink-soft`, `paper`, `accent`, …) — only the values
moved. That means ~30 pages that were never touched still picked up the new look.

| Design artefact | Code |
|---|---|
| `design/tokens.json` | `frontend/tailwind.config.js` + `frontend/src/globalTheme.ts` |
| Frame 07 (components) | `frontend/src/style.css` `@layer components` |
| Frame 01 (shell) | `components/Navbar`, `components/MobileTabBar`, `components/DashboardLayout` |
| Frame 02 (storefront) | `pages/Products/index.tsx` |
| Frame 07 (card anatomy) | `components/Card/index.tsx` |
| Frame 05 (admin) | `components/AdminLayout`, `pages/Admin/Home` |
| Auth split panel | `components/AuthLayout` |
| The whole system, as a WordPress theme | [`cartly-wp-theme`](https://github.com/K-Anjan25/cartly-wp-theme) (separate repo) |

---

## 5. Reviewing the build without the backend

```bash
node design/preview-mock-server.mjs      # fake gateway on :8889
cd frontend && npm install && npm start  # http://localhost:3000
```

The mock serves categories, a 24-product catalog with working facets/sort/
search/suggest, bestsellers and the admin dashboard stats. It exists purely for
design review — the real stack is `docker compose up -d --build`.

---

## 6. Not done yet (next design tickets)

- [x] Product detail (frame 03) — **built**.
- [x] Cart → checkout (frame 04) — **built**. Implementation note: they stayed two
      routes joined by the shared `CheckoutSteps` header, so the cart remains
      bookmarkable and the checkout form stays isolated.
- [ ] Admin table density pass (frame 05 bottom) across Orders/Products/Users.
- [ ] Dark mode — token modes are structured for it, values not chosen.
- [ ] Real product photography; the grid currently leans on whatever `imageUrl`
      the catalog holds.
