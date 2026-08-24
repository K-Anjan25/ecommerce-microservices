# Late provider capture safety

A provider can capture an online payment after Cartly has already cancelled the local order. Cartly now treats that as a late-capture anomaly:

1. Keep the provider capture recorded as `SUCCESS` for financial truth.
2. Do not reopen the cancelled order.
3. Do not award loyalty points.
4. Do not issue a gift card for a cancelled gift-card purchase.
5. Attempt an idempotent full provider refund using `late-capture-refund-{orderId}`.
6. If the refund succeeds, mark the payment `REFUNDED` and resolve the reconciliation case.
7. If the refund fails or cannot be attempted, keep the payment visible as an open operations case.

Razorpay stores the payment entity ID from signed payment webhooks separately from its order ID. Refund calls use that captured payment ID rather than the order reference. If no payment entity ID is available, Cartly fails closed and leaves the anomaly for operations instead of guessing at a refund target.

The order remains cancelled in every branch. Provider-specific late-capture policy, alerts and operational follow-up still require live-environment certification.
