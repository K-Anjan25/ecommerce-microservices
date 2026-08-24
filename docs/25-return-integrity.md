# Return-request integrity

Customers can no longer submit `customerId`; commerce derives it from the
authenticated gateway principal and locks the order while validating the request.

A return is accepted only when the exact product/variant belongs to that
customer's order and the requested quantity does not exceed the ordered quantity
minus existing non-rejected requests. Concurrent submissions serialize on the
order lock.

Approve, reject, and refund transitions lock the return row and enforce legal
source states. This prevents duplicate stock restoration and concurrent duplicate
refund attempts. Refund price lookup matches the exact variant snapshot.

Inventory restoration failure now fails approval instead of silently marking a
return approved without restoring stock.

## Mixed-tender follow-up

Discount-aware tax calculation, gift-card-first allocation, provider refund caps, and partial-refund state handling are documented in [30-mixed-tender-refunds.md](30-mixed-tender-refunds.md).
