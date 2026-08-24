# Pending order cancellation

Signed-in customers and guests with the private tracking capability can cancel eligible pending orders.

## Eligibility

- The order must still be `PENDING`.
- A signed-in caller must own the order.
- A guest must present the valid `X-Checkout-Token` capability.
- Cash-on-delivery payments can be cancelled locally before delivery.
- Pending Stripe PaymentIntents are cancelled at Stripe with a deterministic idempotency key before local reservations are released.
- Razorpay Orders do not expose an equivalent cancellation endpoint. Those orders remain blocked from automatic local cancellation and require provider reconciliation.
- Settled online payments must use the refund flow.

## Compensation

Cancellation holds the order lock and restores:

- product and variant inventory through the idempotent stock mutation path;
- reserved gift-card balance;
- redeemed loyalty points;
- coupon usage and its aggregate usage count.

The COD payment row is marked failed with a cancellation reason, and order history records the customer cancellation once. Repeated cancellation attempts are rejected by state and cannot restore balances twice.

Guest cancellation is rate-limited at the gateway. Both signed-in order detail and private guest tracking surfaces show the action only while the order is pending.
