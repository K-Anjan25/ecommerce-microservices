# Cartly storefront benchmark and brand scorecard

> Review date: 2026-08-23 · Scope: React portfolio storefront · Decision: evolve the existing design rather than copy or install a template.

## 1. Reference market

The useful lesson from templates is their **commerce information architecture**, not their surface decoration.

| Reference | What it does well | What Cartly should borrow | What not to copy |
|---|---|---|---|
| [Vercel Commerce](https://vercel.com/templates/next.js/nextjs-commerce) | Lean, fast product discovery and restrained cards | Performance discipline and simple hierarchy | Its near-generic visual identity |
| [Ciseco](https://themeforest.net/item/ciseco-shop-ecommerce-nextjs-template/45326355) | Editorial merchandising, generous type and polished product grids | Collection storytelling and strong whitespace | Decorative UI that does not improve finding |
| [WoodMart](https://woodmart.xtemos.com/) | Mature large-catalog navigation, search, filters and merchandising modules | Search-first header and catalog density | The huge option surface and visual busyness |
| [Flatsome](https://flatsome3.uxthemes.com/) | Conversion-tested WooCommerce patterns and flexible product storytelling | Trust, sale and collection patterns | Page-builder-specific styling |
| [Shoptimizer](https://www.commercegurus.com/product/shoptimizer/) | Conversion focus with fewer checkout distractions | Clear CTAs, confidence signals and performance bias | Urgency theatre everywhere |
| [Botiga](https://athemes.com/theme/botiga/) | Quiet boutique presentation and strong product focus | Restraint and consistent product imagery | Underpowered navigation for a broad catalog |
| [Storefront](https://woocommerce.com/products/storefront/) | Official WooCommerce compatibility and predictable foundations | Semantic, durable commerce structure | Conservative default appearance |

Current comparative sources also consistently put **Shoptimizer, Neve/Astra, Botiga and Storefront** among the stronger performance-led WooCommerce choices, while **WoodMart/Flatsome** remain useful references for large-catalog merchandising. This is a design benchmark, not a recommendation to move the React app to WordPress; the separate `cartly-wp-theme` repository remains the installable WooCommerce product.

## 2. UX research translated into requirements

Baymard's [ecommerce search research](https://baymard.com/research/ecommerce-search) says interaction design is as important as search logic. Its [autocomplete guidance](https://baymard.com/blog/autocomplete-design) recommends a manageable list, visually obvious active options, keyboard navigation, low visual noise, and generous mobile targets. Its [search-scope guidance](https://baymard.com/blog/search-scope) supports placing category scope close to search without silently defaulting users into a narrow scope.

Cartly requirements:

1. Product search owns the widest, optically centred header column.
2. Search remains visible on desktop; mobile opens it from the drawer/tab bar.
3. Suggestions are capped at six, keyboard navigable, and announced as a listbox.
4. Stable destinations and dynamic categories are separated in one rail.
5. Search, sort and filter controls share one height and baseline.
6. Hover motion stays subtle; focus state is stronger than hover state.
7. No duplicated search implementation: shell and catalog share one component.

## 3. Brand score

Scoring is weighted to 100. Scores describe the state before this pass and the target reached by the new system; they are design-review scores, not automated metrics.

| Dimension | Weight | Before | This pass | Evidence / remaining issue |
|---|---:|---:|---:|---|
| Distinctiveness | 15 | 8 | 12 | Generic MUI cart tile replaced by an owned C-route/spark mark. Name remains somewhat generic. |
| Logo system | 10 | 4 | 8 | Responsive monogram + wordmark + tagline; light/inverse use. Still needs trademark and small-size field testing. |
| Colour system | 15 | 13 | 13 | Violet/lime/ink/bone is memorable, tokenized and dark-mode aware. Lime must remain an accent, not body text. |
| Typography | 15 | 12 | 13 | Inter for utility, Inter Tight for hierarchy, Instrument Serif only for editorial emphasis, Plex Mono for IDs. Four families are acceptable only under these strict roles. |
| Voice and text style | 10 | 6 | 8 | Short, confident and useful; removed vague search copy. Some legacy admin/customer copy still needs a language pass. |
| Layout and hierarchy | 15 | 8 | 13 | Header is now logo / dominant search / utilities, with navigation on its own baseline. |
| Commerce UX | 15 | 9 | 13 | One accessible autocomplete, aligned search/sort/filter, visible categories and preserved facets. Typo tolerance still needs backend work. |
| Consistency / accessibility | 5 | 3 | 4 | Shared control, ARIA listbox, focus states, 44px options. Automated and screen-reader audits remain. |
| **Total** | **100** | **63** | **84** | Target after follow-up audit: 88+. |

### Brand position

**Cartly is the bright, capable shopping companion for people who want to find the right thing without fighting the store.**

- Personality: clear, energetic, assured, never loud.
- Promise: **Find it. Love it. One cart.**
- Customer-facing vocabulary: “Search”, “Shop”, “Add to cart”, “You’re all caught up”.
- Avoid: “revolutionary”, fake scarcity, exclamation-heavy copy, implementation language, and title case on every control.

### Typography rules

- **Instrument Serif:** one short phrase in a major campaign/hero only; never controls, prices or tables.
- **Inter Tight:** H1–H4 and wordmark; tight tracking, compact hierarchy.
- **Inter:** paragraphs, controls, product metadata and navigation.
- **IBM Plex Mono:** SKUs, order IDs and technical status only.
- Sentence case for buttons and labels. Uppercase is reserved for 11px eyebrows and tiny badges.

## 4. Architecture decision

Keep:

- Existing violet/lime/ink/bone tokens and dark mode.
- Product card anatomy, faceted catalog, trust strip, category tiles and editorial hero.
- The React/Spring split and the independent WooCommerce theme repository.

Change in this pass:

- Replaced the generic cart icon logo with `BrandMark`.
- Moved primary links out of the crowded header row.
- Expanded search from a small pill to the dominant header control.
- Added a shared `CommerceSearch` with debounced suggestions, keyboard control, ARIA state and large options.
- Reused that control in the catalog and mobile drawer.
- Removed the obsolete, unused `SearchBar` component.
- Corrected sticky offsets for the taller, two-level shell.

Next design phase:

1. ~~Add suggestion result metadata (thumbnail, brand, price, category scope) to the backend DTO.~~ **Done:** the API now returns a six-item lightweight visual-suggestion DTO, and selecting a product goes directly to its detail page.
2. **In progress:** PostgreSQL trigram similarity now supports close-name autocomplete matches. Add a small domain synonym table next (for example, “earbuds” ↔ “earphones”).
3. Audit all customer-facing copy against the voice rules.
4. Run axe, keyboard-only, 320/768/1280/1440 responsive, and dark-mode visual checks.
5. Replace random/demo product photography with one consistent art direction before production branding is considered complete.
