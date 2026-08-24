# Payment initiation consistency

Payment initiation now treats the commerce database as the source of truth and RabbitMQ as post-commit event transport.

## Concurrent initiation

The payment service pessimistically locks the order before checking for an existing payment. This closes the check-then-charge race where two requests could both observe an empty payment table and contact the provider before the unique payment row was inserted.

Stripe and Razorpay initiation requests also carry a deterministic provider idempotency key derived from the Cartly order ID. If the local transaction must be retried after provider acceptance, the provider can return the original operation rather than creating a second one.

## Local state before messaging

Payment status is applied synchronously to the locked order in the same local transaction as the payment record. Failed payments therefore restore inventory and reserved credits before the transaction commits.

Status events, payment email, refund email, and invoice email are scheduled after commit. Broker or notification failure is logged and cannot roll back a captured payment or erase its local record.

The existing RabbitMQ payment-status event remains available for architecture demonstration and additional consumers. Its local consumer is idempotent:

- repeated terminal statuses do not duplicate transitions;
- a late failure cannot cancel a paid order;
- a late success cannot resurrect a cancelled order;
- status-history entries are recorded once.

## Remaining production boundary

Provider webhook signature verification and reconciliation are still required for production. In particular, creating a provider-side payment order or intent is not equivalent to settlement unless the provider reports a captured/succeeded state.

## Durable status delivery

Payment-status events now commit through the PostgreSQL outbox described in [39-payment-event-outbox.md](39-payment-event-outbox.md). Email delivery remains a separate privacy-sensitive retry boundary.
