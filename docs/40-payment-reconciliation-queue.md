# Pending payment reconciliation queue

Cartly now creates a durable operations case when a non-COD payment remains `PENDING` beyond the configured reconciliation window. The default window is 30 minutes:

- `PAYMENT_RECONCILIATION_PENDING_TTL`
- `PAYMENT_RECONCILIATION_SCAN_DELAY_MS`
- `PAYMENT_RECONCILIATION_BATCH_SIZE`

## Safety boundary

The scheduled scanner only creates a `PaymentReconciliationCase`. It does **not**:

- mark the payment failed;
- cancel or refund a provider operation;
- release inventory, coupon usage, gift-card value or loyalty points;
- mark the order paid.

Those state changes remain behind a signature-verified provider webhook. This is especially important for Razorpay Orders, which do not expose the same server-side cancellation operation as Stripe PaymentIntents. A late `payment.captured` or `payment.failed` callback is still reconciled by the existing locked, amount-and-currency-verified payment flow.

When that verified transition is applied, its open case is marked `RESOLVED` in the same commerce transaction. The unique payment constraint prevents duplicate cases, and resolved cases are not reopened by later scans.

## Operations API

Admins and super-admins can inspect the read-only queue through the gateway:

```http
GET /v1/payments/reconciliation?status=OPEN
```

`status` may be `OPEN` or `RESOLVED`. The response contains payment/order references, provider, amount, currency, timestamps and the reason for review. It never contains provider credentials, customer checkout capabilities or email bodies. There is intentionally no manual “resolve” endpoint: operations must use provider reconciliation and the signed webhook path rather than overriding payment truth in the database.

The admin console exposes the same queue at **Admin → Payment review** with automatic refresh and an explicit read-only warning. Managers do not receive access to this financial operations surface.

## Remaining production work

This queue makes stale pending payments observable and durable, but it is not a provider reconciliation engine. Production still needs provider API status polling/expiry rules, late-capture handling (including any required refund or fulfilment decision), alerting, retention and an exercised operations runbook for each enabled provider.
