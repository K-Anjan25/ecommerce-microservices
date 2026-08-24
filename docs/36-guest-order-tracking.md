# Guest order tracking capability

Guest checkout now includes a private tracking path without creating an account or exposing order data by identifier alone.

## Capability design

- Guest order creation issues 256 random bits, stores only its SHA-256 hash, and records a configurable expiry (`CHECKOUT_CAPABILITY_TTL`, 30 days by default).
- The same capability can authorize `GET /v1/orders/{orderId}/guest` through the `X-Checkout-Token` header.
- Capabilities are never accepted in query strings.
- The order confirmation email uses `/guest-order/{orderId}#capability`. URL fragments are not sent to HTTP servers, gateways, access logs, or referrer headers.
- The React page reads the fragment once into component memory and immediately removes it from browser history with `replaceState`.
- The token is not written to local storage or session storage.
- Expired capabilities cannot authorize tracking, payment initiation or cancellation.
- Signed-in orders cannot be opened through the guest capability endpoint.
- Invalid capabilities receive no order DTO and the public route is rate-limited.

## Email and logs

`STOREFRONT_PUBLIC_URL` controls the origin used in guest tracking emails. It must be set to the production HTTPS storefront origin.

Order email is queued only after the local order transaction commits. The shared RabbitMQ producer no longer logs payload bodies; it logs only event type, exchange and routing key so email capabilities, password-reset links and other sensitive message contents cannot enter application logs.

## Frontend

The guest tracking page shows order state, item names, address, authoritative provider/COD amount, shipping, tax and gift-card tender. It does not expose invoice or return mutations, which remain authenticated customer operations.
