# Gift-card issuance boundary

Customer self-service gift-card purchasing now has a payment-backed issuance intent. The purchase endpoint never creates a spendable card at checkout time: it creates a pending virtual order, takes an online provider through the normal payment boundary, and waits for verified settlement before issuing stored value.

## Current behavior

- Customers can view cards issued to their account and use active codes during authoritative checkout.
- The customer wallet can start a Stripe-backed gift-card purchase with an amount, expiry and optional recipient email.
- `POST /v1/gift-cards/purchase` accepts only `STRIPE` or `RAZORPAY`; COD cannot purchase stored value.
- The endpoint creates a `GiftCardPurchaseIntent` in `PENDING_PAYMENT` and a linked virtual order.
- The linked payment may be `PENDING` while the browser completes Stripe/Razorpay checkout.
- `GiftCardPurchaseFinalizer` creates the active card only after `PaymentService` applies a provider-verified `SUCCESS` transition.
- Repeated success callbacks are idempotent because the intent is locked and moves to `ISSUED` once.
- Failed payments move the intent to `FAILED` without creating a card.
- `POST /v1/gift-cards/issue` remains restricted to `ROLE_ADMIN` and `ROLE_SUPER_ADMIN`.
- Administrative issuance still requires an amount, future expiry and a non-empty reason, and records an audit event.
- Customer card lookup uses a customer-scoped repository query instead of loading every card and filtering in memory.

## Trust boundary

A browser callback, redirect status or client-reported success never mints stored value. Stripe/Razorpay signed webhooks and authenticated provider reconciliation are the only paths that can cause `GiftCardPurchaseFinalizer` to issue a card.

## Purchase lifecycle cleanup

A scheduled lifecycle worker marks a purchase `FAILED` immediately when its linked payment is already failed. If no payment row was ever created, it cancels the virtual order and marks the intent failed after the configured pending TTL. A still-`PENDING` provider payment is never expired locally because the provider may still capture it; it remains with the reconciliation worker and operations queue.

## Remaining production boundary

Live provider certification, expiry/late-capture decisions, refund handling for gift-card purchases and operational monitoring remain required before treating customer gift-card purchasing as production-certified.
