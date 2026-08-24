# Gift-card and loyalty integrity

Loyalty points are now earned only after a successful non-COD provider payment,
not when a pending order is created. Repeated unpaid order creation can no longer
mint rewards. A loyalty outage is logged without rolling back an external charge.

Negative/zero loyalty and gift-card redemptions are rejected, closing arithmetic
paths that could increase balances. Redemptions lock the relevant ledger/card
rows to serialize concurrent use. New gift-card codes use 128 random bits rather
than an eight-hex-character prefix.

Standalone browser redemption endpoints were removed: credit mutation must be
bound to an authoritative order transaction, not an arbitrary amount supplied by
a client. The service methods remain internal building blocks for that checkout
integration. Gift-card purchase remains a demo issuance flow until live provider
capture is connected; it must not be presented as production stored value.
