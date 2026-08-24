# Mixed-tender return refunds

Return refunds now use the order's authoritative price and tender snapshots instead of refunding the undiscounted browser-visible line price entirely through the payment provider.

## Refund calculation

For each approved returned quantity, commerce calculates:

1. The authoritative line gross from the order snapshot.
2. A proportional share of coupon and loyalty discounts.
3. The refundable net merchandise amount.
4. A proportional share of tax on that discounted merchandise.

Shipping and gift-wrap charges are not refunded by an individual line return. Loyalty points used as a discount are not reissued; the customer receives only the net value originally paid.

## Tender allocation

Cartly uses a deterministic gift-card-first policy:

1. Restore value to the original gift card, up to the amount that card contributed and has not already been refunded.
2. Refund only the remaining amount through the captured payment provider.

Orders and return records persist cumulative and per-return tender allocations. Customer and admin return views show the split.

## Concurrency and provider caps

- Return requests and their parent order are pessimistically locked during refund processing.
- Provider payments are locked before refunding.
- Cumulative provider refunds cannot exceed the captured payment amount.
- Only successful captured provider payments can be refunded; pending COD and failed payments are rejected from the automated provider-refund path.
- Partial provider refunds no longer mark the entire payment or order as refunded. A `REFUNDED` payment event is emitted only when cumulative provider refunds equal the captured amount.

## Operational boundary

Provider calls are external side effects. Production deployment should additionally use provider idempotency keys and webhook reconciliation so a process failure after provider acceptance can be repaired deterministically.
