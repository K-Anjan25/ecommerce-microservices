# Localized storefront content

Storefront CMS content now supports English and Hindi values for announcement copy, hero copy and call-to-action labels.

## Behavior

- English fields remain required for a publishable configuration.
- Hindi fields are optional and fall back to English when empty.
- The existing `announcementLinkUrl` and commercial threshold remain language-neutral.
- The storefront selects the localized values from the existing `cartly-language` preference.
- Admin → Storefront edits both languages side by side.
- Existing single-language rows remain valid because empty Hindi columns fall back safely.

## Boundary

This is localized content selection inside the React application. It does not provide SSR or pre-rendered localized HTML. Search crawlers and first-load users still receive the SPA shell before client-side language and CMS content resolve; high-assurance SEO rendering remains a separate production task.
