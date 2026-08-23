# Accessibility baseline

Cartly's customer and studio shells now provide keyboard-visible skip links to
focusable main landmarks. Product cards that navigate on click expose link
semantics and Enter/Space keyboard activation without hijacking their nested
quantity and comparison controls.

Existing baseline protections remain:

- visible `:focus-visible` treatment;
- reduced-motion support;
- semantic navigation/main/footer landmarks;
- labelled search, drawer, cart, quantity, and modal controls;
- responsive admin tables with mobile record layouts;
- automated WCAG AA contrast checks in every frontend build;
- language-aware `<html lang>` updates;
- Noto Sans Devanagari for readable Hindi controls and navigation.

Automated contrast is not a substitute for assistive-technology testing. Before
production release, run keyboard-only navigation and current NVDA/VoiceOver
checks across browse, product, cart, checkout, login, and admin mutation flows.
