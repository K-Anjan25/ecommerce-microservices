# Cartly 3.0 — WooCommerce pattern research and frontend architecture

> Research and implementation pass: 2026-08-23. This is a pattern study, not a visual clone. We reproduce proven information architecture and interaction behavior while retaining Cartly's own logo, copy, token system and React/Spring implementation.

## 1. What “best WooCommerce” means

There is no single best-looking WooCommerce site for a broad marketplace. The useful benchmark is a composite:

1. **Official WooCommerce architecture** for maintainable, composable storefronts.
2. **Successful real stores** for brand/product storytelling.
3. **Independent usability research** for product finding and checkout behavior.
4. **Performance-led themes** for restraint and responsive defaults.

The official [WooCommerce showcase](https://woocommerce.com/showcase/) includes stores such as Badeloft, Bird Buddy, Form and Van Leeuwen. Their brands differ radically, but the reusable system is stable: strong product photography, shallow primary navigation, collection-led landing pages, clear buy boxes, and restrained checkout.

Useful live/reference set:

| Reference | Why it is in the benchmark | Cartly adaptation |
|---|---|---|
| [WooCommerce showcase](https://woocommerce.com/showcase/) | Officially verified range of real Woo stores | Treat product imagery and category storytelling as content, not decoration |
| [Badeloft](https://www.badeloftusa.com/) | Considered high-ticket product pages and sample/trust path | Put delivery, returns and support beside the buy decision |
| [Bird Buddy](https://mybirdbuddy.com/) | Strong product education and subscription/add-on storytelling | Modular product-detail sections and related products |
| [Form Nutrition](https://formnutrition.com/) | Strong category language, subscription model and editorial brand | Fewer nav choices, confident typography, visible proof |
| [Porter & York](https://porterandyork.com/) | Trust-sensitive product category handled with detail and imagery | Product facts before marketing claims |
| [Yubico](https://www.yubico.com/store/) | Structured technical catalog and sticky navigation | Search-first catalog, model/spec clarity |
| [The Cool Hunter](https://shop.thecoolhunter.net/) | Editorial commerce and suggestion-led search | Visual search results and curated collections |
| [Maudern](https://woocommerce.com/products/maudern/) | Official marketplace example of a minimal block theme | Spacious grid, products first, no ornamental widget overload |
| [Luminate](https://woocommerce.com/products/luminate/) | Official marketplace electronics-oriented block theme | Clean collection and product templates across breakpoints |
| [Blocksy](https://wordpress.org/themes/blocksy/) | Mature, fast WordPress theme with advanced Woo support | Configuration through semantic primitives, not page-specific CSS |

## 2. Findings from WooCommerce implementation guidance

WooCommerce's theme guidance requires a coherent system across shop, category, product, cart, checkout and account screens, with repeated navigation, forms, tables, notices and content patterns. It also requires WCAG AA and a small harmonious palette. See [Theme design and UX guidelines](https://developer.woocommerce.com/docs/theming/theme-development/theme-design-ux-guidelines/).

Modern WooCommerce is moving toward blocks and patterns:

- Cart and Checkout blocks are the default path; the marketplace prioritizes block themes.
- Global styles/tokens should control components rather than selectors that depend on private nested markup.
- Product Collection, Product Filters, Mini-Cart, ratings, sale badges, variation selectors and reviews are independent composable units.
- Woo's new settings direction uses one shared design system, semantic tokens, a centered 720px settings measure, one idea per card and one predictable Save action.

React equivalent adopted by Cartly:

| Woo concept | Cartly implementation |
|---|---|
| Block pattern | Feature-owned React composition |
| `theme.json` global styles | `design/tokens.json` → CSS variables, Tailwind and MUI |
| Product Collection block | Product grid + product-card primitive |
| Product Filters block | Shared facet panel with desktop/mobile shells |
| Mini-Cart block | Cart action/badge now; mini-cart drawer is a next ticket |
| Store Editor patterns | Storefront Settings CMS + live preview |
| Global Styles | Semantic `brand`, `action`, `surface`, `ink`, `state` tokens |
| Cart/Checkout templates | Isolated checkout feature and enclosed checkout shell |

## 3. Research-backed behavior, not theme fashion

Baymard's current research reports that many leading stores remain mediocre in checkout and product finding. The key rules carried into Cartly are:

- Search and autocomplete must be visually prominent, keyboard operable and manageable in length.
- Product lists need title, price, imagery, rating count and variation information.
- Product pages need multiple images and must surface shipping/returns close to the purchase area.
- Guest checkout must be explicit and prominent.
- A multi-step indicator must map literally to the process and past steps must be editable.
- Checkout should be enclosed: remove catalog navigation and promotional exits.
- Completed checkout sections should collapse into readable summaries.
- Both required and optional fields should be identified.
- Costs, delivery method/date and payment implications should appear before commitment.

Primary references:

- [Baymard ecommerce search research](https://baymard.com/research/ecommerce-search)
- [Baymard product-list benchmark](https://baymard.com/blog/current-state-product-list-and-filtering)
- [Baymard checkout benchmark](https://baymard.com/blog/current-state-of-checkout-ux)
- [Baymard checkout-flow guide](https://baymard.com/learn/checkout-flow-ux-optimization)
- [WooCommerce ecommerce design guidance](https://woocommerce.com/posts/ecommerce-website-design/)
- [WooCommerce product-page guidance](https://woocommerce.com/posts/product-page-design/)

## 4. Brand and visual-system decision

### Keep

- Ink/bone foundation: product imagery remains the highest-chroma content.
- Violet as the owned brand signal.
- Lime only for deal/highlight moments on dark ink surfaces.
- Inter for utility/body, Inter Tight for compact commerce hierarchy, Instrument Serif for one editorial phrase, Plex Mono only for machine identifiers.
- Hairline surfaces at rest and elevation only for interactive lift/overlays.

### Correct

The previous system used one violet token for two incompatible jobs in dark mode:

- bright violet as text/link foreground on dark surfaces;
- darker violet as a filled action under white text.

One value cannot pass WCAG AA in both relationships. Cartly 3.0 splits them:

| Semantic token | Light | Dark | Purpose |
|---|---:|---:|---|
| `brand` | `#5B3DF5` | `#9B84FF` | Links, focus, selected outlines and brand foreground |
| `action` | `#5B3DF5` | `#7552F5` | Filled primary actions with white text |
| `action-hover` | `#4A2ED6` | `#6844E8` | Filled-action hover |
| `accent` | `#D8F14B` | `#D8F14B` | Deal/highlight on ink; never body copy on white |

This follows WooCommerce's guidance to use a small palette and meet WCAG AA rather than treating brand color as one literal hex everywhere.

## 5. Frontend architecture

The old architecture grouped almost everything by technical type (`api/`, `types/`, `components/`) even when a component, hook, API and model formed one feature. Cartly now uses a hybrid boundary:

```text
src/
├── app/                    # future: providers/router/shell composition
├── brand/                  # identity, mark, voice constants
├── features/
│   ├── catalog/
│   │   ├── components/CommerceSearch.tsx
│   │   └── hooks/useProductSuggestions.ts
│   ├── checkout/
│   │   └── components/CheckoutHeader.tsx
│   └── storefront/
│       ├── api.ts
│       ├── types.ts
│       └── hooks/useStoreSettings.ts
├── components/             # truly shared UI and legacy shared compositions
├── hooks/                  # cross-feature hooks only
├── api/                    # shared transport and not-yet-migrated domains
└── pages/                  # route composition; business logic migrates toward features
```

Rules:

1. A route page composes features; it should not own reusable network behavior.
2. Feature-only API/types/hooks live together.
3. `components/` is for cross-feature primitives, not every component in the app.
4. Brand identity is not a generic UI component.
5. Async behavior belongs in a hook with stale-response protection.
6. Import from a feature's public `index.ts`, not its internal file tree.
7. Migration is incremental; a big-bang directory move adds risk without customer value.

## 6. Implemented in this pass

- Regenerated all seven SVG wireframes as **Cartly 3.0**.
- Frame 01 now matches the live search-first shell: owned mark, 650px search zone, compact utilities, primary destinations then taxonomy.
- Frame 02 gains an operational confidence strip and aligned catalog-within-search.
- Frame 04 is now an enclosed checkout header rather than the global store shell.
- Frame 07 documents semantic brand foreground vs action fill.
- Real React checkout now removes the global navigation, promotional announcement, footer and mobile shopping tabs; it retains a branded escape to cart/home, security status and help.
- Storefront settings moved into a vertical feature with one canonical query hook.
- Search moved into a catalog feature; async suggestion behavior moved into `useProductSuggestions` with debounce and stale-response protection.
- Brand identity moved into `brand/`, separate from generic components.
- Added semantic action tokens and corrected dark-mode contrast.

## 7. Gap map — what fits next

### High impact / next

1. **Mini-cart drawer:** quick item review after add-to-cart without navigating away; preserve a clear full-cart action.
2. **Intermediary category pages / mega menu:** image-led parent categories and clickable top-level categories, with 300–500ms hover intent on desktop.
3. **Checkout summaries:** collapse completed address/delivery/payment sections into editable summaries.
4. **Delivery date:** translate rate names into an estimated date/window after pincode selection.
5. **Required/optional field semantics and browser autofill audit.**

### Medium

6. Product-card secondary image on hover and 3+ images available from product lists.
7. Visual variant swatches for attributes typed as color/image.
8. Wishlist persistence (comparison is not a wishlist).
9. Product-specific FAQ/support block.
10. Consistent production photography art direction.

### Deliberately rejected

- Autoplay hero carousel: hides catalog breadth and creates control/accessibility cost.
- Mega-theme feature density: configuration is not customer value.
- Checkout upsell clutter: recommendations belong on product/cart or confirmation.
- Copying another store's exact typography, illustrations or layout: it weakens Cartly's identity and creates copyright/trade-dress risk.
- A full repository rewrite: incremental feature boundaries are safer and measurable.
