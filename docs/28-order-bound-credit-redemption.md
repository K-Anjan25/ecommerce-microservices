# Order-bound credit redemption

Gift cards and loyalty points are now inputs to authoritative order creation rather than standalone balance-mutation endpoints.

## Pricing order

The commerce service calculates values in this order:

1. Catalog prices produce the merchandise subtotal.
2. The validated coupon reduces merchandise.
3. Loyalty reduces the remaining eligible merchandise at **10 points = ₹1**.
4. Shipping and gift wrap are added.
5. Tax is calculated on the resulting non-negative taxable amount.
6. A gift card is applied as payment tender after tax, up to the amount due.
7. `Order.totalAmount` stores only the remaining amount to charge through the selected payment provider.

The browser displays an estimate, but cannot set any monetary amount. The order stores loyalty points/discount, gift-card amount, and only the card's last four characters. The internal gift-card ID is retained for compensation; the full code is not copied onto the order.

## Concurrency and rollback

- Gift-card rows are pessimistically locked while balance is applied or restored.
- Loyalty redemption locks the customer's existing ledger before running a fresh aggregate balance query, serializing concurrent redemption attempts.
- Credit mutations participate in the same PostgreSQL transaction as order persistence.
- Remote inventory is compensated when that local transaction rolls back.
- Credits remain reserved while an order awaits external payment. A failed payment cancels the order and restores gift-card value and loyalty points exactly once under an order lock.
- A gift card that covers the complete post-tax amount marks the order paid without invoking an external provider.

## Gift-card purchase boundary

Customer gift-card purchasing now creates a payment-backed pending issuance intent. Order redemption does not make that issuance endpoint production stored value: only a verified provider settlement can activate the separately issued card. Live provider certification, late-capture/refund decisions and operational monitoring remain production work.
