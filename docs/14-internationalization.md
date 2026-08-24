# Cartly internationalization

Cartly ships a lightweight English/Hindi (`en-IN` / `hi-IN`) message layer under
`frontend/src/features/i18n`. It avoids adding a runtime dependency for the
current two-language scope while keeping one typed dictionary and hook.

## Behavior

- The header language control switches between English and हिन्दी.
- Selection persists in `localStorage` as `cartly-language`.
- `<html lang>` updates immediately for assistive technology and browser tools.
- Desktop and mobile navigation, product search, product/cart actions, mini-cart,
  cart, and checkout commitment labels use the shared dictionary.
- Admin remains English: it is an internal operational surface, not the localized
  customer storefront.

## Adding a message

1. Add the same key to `messages.en` and `messages.hi`.
2. Consume it with `const { t } = useI18n()` and `t("key")`.
3. Never build a sentence from translated fragments; add a complete message key.
4. Keep product, brand, SKU, coupon, and user-entered values untranslated.

TypeScript requires Hindi to contain every English key, preventing incomplete
message bundles at build time.

## CMS content

Hero and announcement copy is merchant-authored through Storefront Settings and
is currently one shared value. It is intentionally not machine-translated.
Production multilingual content should add locale-keyed CMS fields
(`heroTitle.en`, `heroTitle.hi`, etc.) so a merchant controls both versions.

## Formatting

Both locales use Indian currency and grouping. Future locale-sensitive dates and
plural rules should use the `locale` returned by `useI18n` with `Intl.DateTimeFormat`
and `Intl.PluralRules`; do not add manual Hindi numeral substitution unless
customer research asks for it.
