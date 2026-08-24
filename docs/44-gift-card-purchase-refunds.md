# Gift-card purchase refunds

Settled customer gift-card purchases now have a guarded administrative refund path:

```http
POST /v1/gift-cards/purchases/{purchaseId}/refund
```

The endpoint is restricted to admins and super-admins. It locks the purchase intent and card, then:

1. Rejects pending or failed purchases.
2. Rejects cards that are already spent or refunded.
3. Calculates the card's current unused balance.
4. Refunds only that unused amount through the original provider payment.
5. Zeroes the card and marks it `REFUNDED`.
6. Marks the purchase intent `REFUNDED` with the provider refund reference.

The intent state and card state are updated in one local transaction after the provider reports success. A repeated request returns the stored refund result without calling the provider again. The provider clients receive a deterministic gift-card refund idempotency key so a retry after an ambiguous network failure can be reconciled safely.

A fully spent card is not automatically refunded: the stored value has already been consumed. Gift-card purchase refund handling is intentionally separate from merchandise return calculations and does not restore ordinary order credits.

Provider and live-environment certification, including partial refund failure recovery and operations monitoring, remain required before production launch.
