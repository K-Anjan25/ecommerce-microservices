# 52. Date handling and admin-console completion

**Date:** 26 August 2026
**Scope:** date-selector standardization, themed calendar, business timezone, and the admin screens that were backend-complete but UI-less.

## Direct answer

The expiry-date selectors were inconsistent in three ways: two different widgets
(`date` vs `datetime-local`), two different wire formats (naive `YYYY-MM-DD` vs
UTC-converted ISO), and a native browser calendar popup that cannot be styled
and clashed with the Editorial Warmth palette. All date selection now goes
through one themed component with one payload convention, and the admin console
gained the five surfaces whose endpoints existed without a UI.

## The date/timezone bug (root cause)

The admin coupon form sent `new Date(value).toISOString()` (a UTC instant, e.g.
`2026-08-26T04:30:00.000Z`) into a zone-less `LocalDateTime` field. Jackson
stored the UTC wall-clock (`04:30`) while the admin picked `10:00` IST; every
display then re-parsed the zone-less value as browser-local, shifting all
coupons by the UTC offset and making `@Future` validation depend on the
container's default clock (UTC — no `TZ` was set anywhere).

## Conventions now (keep these)

1. **One business clock.** All Spring services run with `TZ=${APP_TIMEZONE:-Asia/Kolkata}`
   (docker-compose). Zone-less `LocalDateTime`/`LocalDate` values are business
   wall-clock everywhere — storage, `@Future` validation, audit stamps.
2. **Naive payloads, never UTC conversion.** Selectors emit
   `YYYY-MM-DD` (backend `LocalDate`) or `YYYY-MM-DDTHH:mm` (backend
   `LocalDateTime`, seconds appended by `toLocalDateTimePayload`). No
   `toISOString()` anywhere in form submission.
3. **One selector component.** `frontend/src/components/DateField` renders the
   calendar popover from the same tokens as every other surface (paper/ink/brand,
   light and dark modes), supports `min`/`max`, a time row in datetime mode, and
   a formik contract (`form`/`name`) like `TextInput`/`SelectInput`. Native
   `<input type="date|datetime-local">` is no longer used anywhere.
4. **One display path.** `utils/date.ts` (`formatDate`, `formatCalendarDate`,
   input-value helpers) is the only place dates are formatted; raw ISO strings
   are never rendered.
5. **`min` is always set** on expiry/window selectors (today / now).

## Admin console completion

Endpoints that existed without a UI now have screens:

| Screen | Route | Backend |
|---|---|---|
| Flash sales (new) | `/admin/flash-sales` | `GET /v1/flash-sales/admin/all`, `POST`, `DELETE /{id}` (product-service) |
| Shipping rates (new) | `/admin/shipping-rates` | `/v1/shipping/rates` CRUD |
| Tax rules (new) | `/admin/tax-rules` | `/v1/tax/rules` CRUD |
| Gift-card manual issuance | action on `/admin/gift-card-purchases` | `POST /v1/gift-cards/issue` |
| Coupon edit | dialog on `/admin/coupons` | `PUT /v1/coupons/{id}` (partial: constraints/window/limits; code/type/value immutable) |
| Wishlist (customer) | `/wishlist` + heart on product cards | `/v1/wishlist` GET/POST/DELETE/clear |

Flash-sale backend additions: `findAllByOrderByStartsAtDesc`, admin list
endpoint, delete endpoint, and create-validation (window ordering, one sale per
product).

## Security fix (gateway)

The `flash-sale-service` gateway route carried **no AuthFilter**: product-service
trusts the `authorities` header the gateway injects, so an unauthenticated
caller could forge `ROLE_ADMIN` on `POST /v1/flash-sales`, while real admins
could not create sales at all (no headers injected → 403). The route now runs
through `AuthFilter` like every other product/commerce write path. The
storefront Deals page already required sign-in, so no public behavior changes.

## Notes for reviewers

- Setting `TZ` changes the interpretation of *existing* naive timestamps by the
  environment offset (previously stored on UTC wall-clock). In this demo-stage
  data set that is acceptable; for a production database this belongs in the
  documented migration/rollout drill (docs 45, 51).
- Coupon code/type/value remain immutable by design (deactivate + recreate);
  the edit dialog only exposes constraints, window, limits and the active flag.
- The wishlist query is enabled only for signed-in sessions; guests who tap a
  heart are routed to login.
