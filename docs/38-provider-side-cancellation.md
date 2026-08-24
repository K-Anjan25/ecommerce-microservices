# Provider-side pending payment cancellation

Cartly now cancels supported unsettled provider operations before releasing order inventory or credits.

## Stripe

For a pending Stripe payment, customer cancellation calls:

`POST /v1/payment_intents/{paymentIntentId}/cancel`

The request uses the authoritative stored PaymentIntent reference and a deterministic `cartly-cancel-{orderId}` idempotency key. Cartly changes the payment/order state and restores reservations only when Stripe returns the `canceled` state. Missing credentials, missing references, network failures and non-cancelable states leave the local order pending for reconciliation.

## Razorpay

Razorpay Orders do not provide an equivalent cancellation operation. Cartly therefore fails closed: it does not release reservations while that order may still capture. An operations reconciliation or provider-expiry workflow remains required.

## Cash on delivery

COD has no external capture to cancel. Its local pending payment can be marked failed and reservations restored immediately.

Settled provider payments never use this path; they require the mixed-tender refund workflow.
