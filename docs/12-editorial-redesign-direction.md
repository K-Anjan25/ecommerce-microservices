# Cartly editorial redesign — selected direction

> Owner selection: 2026-08-23 · Direction A, Editorial Warmth · Position: premium curated lifestyle marketplace.

The Cartly 3.0 violet/lime direction was rejected after visual review. It is retained in Git history only; it is no longer the target brand.

## Selected visual language

- Warm cream canvas (`#F4F0E8`) and ivory surfaces (`#FBF9F4`).
- Espresso typography (`#221A16`).
- Rust action/brand color (`#A4472D`) with a deeper hover (`#8E3823`).
- Muted brass accent (`#C8A96B`), used sparingly.
- Instrument Serif for the wordmark, hero and major editorial headings.
- Inter for navigation, product information, forms and operational UI.
- Typographic wordmark instead of the previous app-icon monogram.
- Image-led asymmetrical hero with no dark panel, neon color or generic SaaS cards.
- Unboxed, tall product cards so photography has visual priority.
- Circular image-led category navigation.
- Search remains fully capable but is visually secondary to collection storytelling.

## Product position

Cartly should feel designed for a premium curated mix of home, apparel, beauty and thoughtful everyday objects. It is not presented as a dense discount marketplace, even though the backend remains multi-category capable.

## Implemented in the first build pass

- Replaced violet/lime tokens in light and dark modes.
- Updated MUI, Tailwind/CSS variables and canonical design tokens.
- Preserved and re-ran WCAG contrast tests; all tested pairs pass AA.
- Rebuilt the Cartly wordmark.
- Moved primary navigation into the main header and reduced search width.
- Replaced navigation pills with editorial underline states.
- Rebuilt the homepage hero into image + editorial copy.
- Replaced boxed trust cards with a single information rail.
- Replaced letter-box category cards with circular product photography when available.
- Removed borders, rounded containers and resting shadows from product cards.
- Changed product imagery to a taller 4:5 editorial ratio.
- Updated default CMS hero copy for the selected position.
- Removed the secondary “Browse” category rail from beneath the header.
- Removed the sticky catalog search/filter/sort bar that obscured product content.
- Kept desktop refinement in a quiet left sidebar; mobile uses a small “Refine” text action and bottom sheet.
- Moved sorting into the refinement panel and kept active filters as lightweight removable tags.

## Next build pass

1. Art-direct real category and hero imagery rather than reusing arbitrary catalog covers.
2. **Done:** reworked product detail into a tall editorial gallery + quiet sticky purchasing column; removed the duplicate selection rail and boxed tabs.
3. Rework cart and checkout typography/surfaces to this visual language.
4. Redraw the SVG wireframes from the selected concept rather than recoloring the rejected structure.
5. Run responsive visual review at 390, 768, 1280 and 1440px before continuing to admin screens.

Exploratory images live in `design/concepts/`. They are mood concepts, not production product photography.
