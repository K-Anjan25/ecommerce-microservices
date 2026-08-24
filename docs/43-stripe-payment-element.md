# Stripe Payment Element handoff

Stripe checkout now uses a browser-confirmed PaymentIntent instead of the old hard-coded test payment method.

## Flow

1. Cartly calculates the order total and reserves inventory.
2. Commerce-service creates a Stripe PaymentIntent with automatic payment methods enabled and `confirm=false`.
3. The response includes the PaymentIntent ID and browser-scoped `client_secret`.
4. The frontend mounts Stripe Payment Element and calls `stripe.confirmPayment`.
5. Card payments can complete inline; 3DS and other provider challenges return through `/stripe-payment-return`.
6. Browser success is never copied into Cartly settlement state. Cartly waits for the signed `payment_intent.succeeded` webhook or authenticated reconciliation lookup.

The client secret is held in route state for the active checkout and is not written to local or session storage. Stripe may append its client-secret query parameter during a challenge redirect; `/stripe-payment-return` scrubs the URL immediately and never forwards that value to Cartly APIs. Only non-secret order context is stored temporarily so the redirect can return to the pending confirmation screen.

## Configuration

Create `frontend/.env` from `frontend/.env.example`:

```dotenv
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

Only the publishable key belongs in frontend configuration. `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` remain server-side environment variables.

## Boundary

The browser handoff now supports Stripe Payment Element and provider-required redirect/challenge entry. Production still requires live-provider certification, return-path testing, webhook monitoring, and provider-specific expiry/late-capture handling. The server-side signed webhook remains authoritative even when the browser reports success.
