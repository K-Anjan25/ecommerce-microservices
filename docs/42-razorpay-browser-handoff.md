# Razorpay browser checkout handoff

The checkout now opens the Razorpay Checkout browser SDK after commerce-service creates an authoritative Razorpay Order.

## Flow

1. Cartly creates the order and reserves inventory.
2. Commerce-service creates a Razorpay Order for the server-calculated total and stores its provider reference.
3. The frontend loads `https://checkout.razorpay.com/v1/checkout.js` and opens the modal with the public `VITE_RAZORPAY_KEY_ID`, amount, currency and stored provider order reference.
4. The browser callback is treated only as a handoff signal. It is never used to mark Cartly payment or order state as settled.
5. Razorpay's signed `payment.captured` or `payment.failed` webhook remains authoritative. The stale-payment reconciliation worker can also use an authenticated provider Order lookup.
6. The confirmation page continues to show `PENDING` until Cartly receives and verifies provider settlement.

If the public key is missing, the SDK cannot load, or the customer dismisses the modal, Cartly preserves the order as pending and routes to the pending confirmation state rather than claiming success. This keeps the order reference available for provider reconciliation.

## Configuration

Create `frontend/.env` from `frontend/.env.example`:

```dotenv
VITE_RAZORPAY_KEY_ID=rzp_test_...
```

Only the public key ID belongs in frontend configuration. `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` remain server-side environment variables.

## Boundary

This document covers the Razorpay browser handoff. Stripe Payment Element is documented separately in [43-stripe-payment-element.md](43-stripe-payment-element.md). Provider-specific late-capture/expiry decisions remain a production boundary. The signed webhook and authenticated reconciliation paths continue to protect the server-side payment boundary.
