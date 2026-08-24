# Inventory mutation idempotency

Order creation already compensated remote stock when its local transaction rolled back, but a payment that failed after order creation left inventory reserved indefinitely. Retrying a restoration was also unsafe because the product service would increment stock more than once.

## Operation keys

Commerce now sends an `X-Idempotency-Key` on every stock deduction and restoration:

- `order-deduct-{inventoryOperationId}`
- `order-rollback-{inventoryOperationId}`
- `order-payment-failed-{inventoryOperationId}`
- `return-approved-{returnRequestId}`

The product service writes a unique `InventoryMutation` claim and flushes it before touching stock. Repeating a completed key returns successfully without applying the quantity again. Concurrent duplicate claims are rejected by the unique primary key before the losing transaction can touch inventory and are acknowledged as an idempotent success.

The claim and stock update share one database transaction. A failed stock mutation rolls back its claim, allowing a later retry to perform the operation.

## Failed payments

A failed payment now locks the order and restores all ordered product/variant quantities together with reserved gift-card and loyalty credits. Local `inventoryRestored` and `creditsRestored` markers avoid repeated work; product-service operation keys protect the remote mutation if delivery is repeated after a process or transaction failure.

Stock restoration now uses the same pessimistic product/variant row locks as deduction and fails rather than silently ignoring a missing inventory record.

## Operations

The mutation ledger is intentionally small and database-backed. At higher order volume, add a scheduled retention policy that only removes keys older than the maximum message retry and reconciliation window.
