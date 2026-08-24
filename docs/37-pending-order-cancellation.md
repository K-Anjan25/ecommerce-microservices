# Pending order cancellation

Signed-in customers and guests with the private tracking capability can cancel eligible pending orders.

## Eligibility

- The order must still be `PENDING`.
- A signed-in caller must own the order.
- A guest must present the valid `X-Checkout-Token` capability.
- Orders with an unsettled or successful online provider payment are not cancelled automatically. They require provider cancellation/reconciliation so a late capture cannot occur after inventory is released.
- Cash-on-delivery payments can be cancelled locally before delivery.

## Compensation

Cancellation holds the order lock and restores:

- product and variant inventory through the idempotent stock mutation path;
- reserved gift-card balance;
- redeemed loyalty points;
- coupon usage and its aggregate usage count.

The COD payment row is marked failed with a cancellation reason, and order history records the customer cancellation once. Repeated cancellation attempts are rejected by state and cannot restore balances twice.

Guest cancellation is rate-limited at the gateway. Both signed-in order detail and private guest tracking surfaces show the action only while the order is pending.
