# Frontend performance notes

## Removed Moment.js

Moment was used only for two date-format calls but added roughly 60 kB raw / 20
kB gzip as a separate production chunk. Cartly now uses the browser's native
`Intl.DateTimeFormat` for localized English/Hindi Indian dates and times.

Benefits:

- one dependency and production chunk removed;
- no locale bundle management;
- formatting follows the active `<html lang>` value;
- invalid dates return a stable em dash instead of leaking `Invalid Date`.

`formatDate` includes date and time, matching the previous Moment `LLL` output.
`formatCalendarDate` is available for date-only surfaces.

The remaining large application/vendor chunks are primarily Material UI and
Axios. Replacing either is an architectural migration, not a safe tree-shaking
change; continue route-level lazy loading before considering those rewrites.
