# Provider-confirmed payment settlement

Cartly no longer treats successful provider object creation as proof that money settled.

## Initiation outcomes

`ProviderPaymentResult` distinguishes an accepted initiation from settled funds:

- Cash on delivery remains `PENDING`.
- Creating a Razorpay order remains `PENDING`; it is not a captured payment.
- Stripe is `SUCCESS` only when the returned PaymentIntent status is `succeeded`.
- Other accepted but unsettled Stripe states remain `PENDING`.

The checkout UI tells customers when provider confirmation is still pending instead of presenting that state as cash on delivery or completed payment.

## Signed callbacks

Public callback routes are limited to:

- `POST /v1/payments/webhooks/stripe`
- `POST /v1/payments/webhooks/razorpay`

They bypass customer JWT authentication because providers authenticate with HMAC signatures. Both routes are rate-limited at the gateway.

Stripe verification checks the `Stripe-Signature` HMAC and enforces a five-minute timestamp replay window. Razorpay verification uses `X-Razorpay-Signature` with its dedicated webhook secret. Signatures are compared in constant time before JSON is parsed or payment state is touched.

Verified settlement/failure events reconcile the provider reference under payment and order locks. Only a `PENDING` payment can transition, making repeated callbacks idempotent. Successful reconciliation awards loyalty once; failures trigger the existing credit and inventory compensation path.

Configure `STRIPE_WEBHOOK_SECRET` and `RAZORPAY_WEBHOOK_SECRET` separately from provider API credentials.

## Boundary

The frontend still needs provider SDK handoff for interactive authentication and challenge flows. Webhook reconciliation establishes the server-side trust boundary: only provider-confirmed settlement can mark a pending initiation paid.
