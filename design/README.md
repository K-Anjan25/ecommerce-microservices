# Cartly Editorial — design kit

This directory documents the **currently shipped Editorial Warmth direction** for the React platform. The canonical visual system is warm cream, espresso, rust and muted brass with image-led layouts and restrained commerce controls.

## Canonical sources

| Source | Purpose |
|---|---|
| `tokens.json` | Canonical semantic tokens shared with the platform and the separate WooCommerce theme |
| `wireframes/generate.mjs` | Source of truth for the seven current implementation-aligned wireframes |
| `wireframes/*.svg` | Editable Figma-ready artboards generated from the source above |
| `concepts/concept-a-editorial.jpg` | Selected visual-direction concept |
| `frontend/src/tokens.css` | Runtime CSS token projection |
| `frontend/src/globalTheme.ts` | MUI token projection |

The files under `design/palettes/` are **archived exploration only**. Ink/violet, lime and the earlier forest treatment are rejected directions and are not implementation guidance.

## Current wireframes

```text
wireframes/
├── 01-global-shell-desktop.svg
├── 02-storefront-desktop.svg
├── 03-product-detail-desktop.svg
├── 04-cart-checkout-desktop.svg
├── 05-admin-console-desktop.svg
├── 06-mobile-flows.svg
├── 07-component-sheet.svg
└── generate.mjs
```

Regenerate them with:

```bash
node design/wireframes/generate.mjs
```

Edit the generator, not generated SVG markup.

## Figma import

1. Create a Figma file named `Cartly Editorial — Current Wireframes`.
2. Drag all seven SVG files into one page in numeric order.
3. Wrap each imported artboard in a frame and retain its filename.
4. Import `design/tokens.json` with Tokens Studio and create `light` and `dark` modes.
5. Treat annotations as review notes; they may be moved to a toggleable layer.

Suggested pages:

| Page | Contents |
|---|---|
| `00 · Cover` | Selected editorial concept and current version |
| `01 · Foundations` | Frame 07 and imported variables |
| `02 · Storefront` | Frames 01–03 |
| `03 · Checkout` | Frame 04 |
| `04 · Administration` | Frame 05 |
| `05 · Mobile` | Frame 06 |
| `99 · Rejected archive` | Legacy palette explorations, never current components |

## Editorial Warmth contract

- Canvas `#F4F0E8`; paper `#FBF9F4`; espresso `#221A16`.
- Rust `#A4472D` is the filled action color; hover uses `#8E3823`.
- Muted brass `#C8A96B` is supporting detail, not a neon promotion color.
- Instrument Serif owns the wordmark, hero and editorial headings.
- Inter owns operational UI; Noto Sans Devanagari supports Hindi.
- Product and category imagery create hierarchy; cards stay quiet and flat.
- Small radii are normal. Pills are reserved for compact choices and status.
- The brand is a typographic wordmark, not a generic app/cart icon.
- No purple, neon lime, dark grain hero, SaaS-card density or shadow-heavy surfaces.

## Current commerce behavior represented in the frames

- The shell has a concise primary nav and compact visual autocomplete.
- There is **no Browse category rail** under the header.
- The catalog has **no floating or sticky search/filter/sort toolbar**. Results use an inline heading/sort treatment and a quiet facet column on desktop.
- Checkout is enclosed and supports guest details, shipping, tax, coupon, loyalty and gift-card tender.
- The server calculates all monetary values. Gift cards apply after tax and the provider sees only the remainder.
- Provider initiation is not presented as paid. Stripe/Razorpay settlement requires a signed provider result.
- Gift-card customer purchases are disabled until provider-backed issuance exists; existing cards remain usable.
- Mixed-tender refunds return gift-card value first, then the provider remainder.
- Admin uses a separate ink shell with Manager role restrictions and an audit ledger.
- Mobile storefront keeps bottom navigation; checkout removes it and docks only the total/action.

## Architecture boundary

The React platform in this repository is the portfolio/demo implementation. The sellable WooCommerce theme remains a separate repository: <https://github.com/K-Anjan25/cartly-wp-theme>. Exactly one implementation should be treated as the live store at a time; both consume the semantic direction established here.
