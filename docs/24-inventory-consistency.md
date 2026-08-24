# Inventory consistency during order creation

Product inventory deduction now acquires a pessimistic database write lock for
the base inventory row or selected variant. It rechecks quantity under that lock
and fails the transaction instead of clamping a negative result to zero. This
closes the check-then-deduct race between concurrent checkouts.

Commerce performs all catalog price, shipping, coupon, gift-wrap, and tax
validation before requesting deduction. Deduction failures are no longer swallowed
by the circuit-breaker fallback, so an order cannot be created without stock
actually being reserved.

Order creation is a local database transaction. After remote stock deduction it
registers a transaction completion callback: if the order transaction rolls back,
Commerce calls inventory restoration with the same product/variant quantities.
Notification failures are logged separately and do not roll back a valid order.

This is a lightweight compensating transaction suitable for the current stack.
At larger scale, replace the synchronous boundary with an idempotent reservation
and outbox/saga workflow.

## Idempotent failure restoration

Post-order payment failures and replay-safe product-service mutation keys are documented in [31-inventory-mutation-idempotency.md](31-inventory-mutation-idempotency.md).
