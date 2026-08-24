# Durable payment-status outbox

Payment status events now use a PostgreSQL transactional outbox instead of a best-effort RabbitMQ publish after commit.

## Atomic write

Payment initiation, signed webhook reconciliation and full provider refund write a `PaymentOutboxEvent` in the same local transaction as payment/order state. A committed state transition therefore always has a durable event waiting for delivery; a rolled-back transition cannot leak a phantom event.

The outbox contains only the non-secret payment status envelope: order ID, status, provider, provider reference, amount and currency. Guest capabilities and email bodies are never stored in it.

## Publisher

A lightweight scheduled publisher runs inside commerce-service every five seconds:

1. Select up to 50 due rows under a pessimistic lock.
2. Publish the existing `PaymentStatusEvent` to RabbitMQ.
3. Delete the row only after publish succeeds.
4. On failure, retain it and schedule exponential backoff capped at one hour.

A crash after RabbitMQ acceptance but before database deletion can deliver a duplicate. The local payment-status consumer is intentionally idempotent and order transitions/history are protected under the order lock.

## Pending payment boundary

Stale online payments are now surfaced separately through the durable reconciliation queue described in [40-payment-reconciliation-queue.md](40-payment-reconciliation-queue.md). The payment outbox remains responsible only for status-event delivery; it does not decide whether an unsettled provider operation should be released or refunded.

## Email delivery boundary

Commerce still uses guarded post-commit publication for transactional email requests, while user-service now encrypts and durably retries SMTP failures. See [41-email-retry-outbox.md](41-email-retry-outbox.md). Guest capabilities and personal data are never written as plaintext retry payloads.
