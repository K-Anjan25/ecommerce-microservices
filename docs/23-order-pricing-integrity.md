# Order pricing integrity

Order creation no longer accepts line prices from the browser. The request
contains only product ID, optional variant ID, and quantity.

Commerce performs a batched product-service lookup and snapshots the current
catalog price onto each order line before stock deduction and total calculation:

1. Active flash price, when present.
2. Selected variant price.
3. Base unit price.

Missing products/variants and non-positive catalog prices reject the order.
Shipping, coupon discount, gift wrap, tax, and the final payment amount are then
computed from these authoritative snapshots. Combined with server-derived
payment totals, browser manipulation cannot lower a line, subtotal, tax, or
captured amount.

Historical orders retain their price snapshots when catalog prices later change.

## Guest tracking

Post-checkout guest access uses a fragment-delivered, header-presented capability as documented in [36-guest-order-tracking.md](36-guest-order-tracking.md).
