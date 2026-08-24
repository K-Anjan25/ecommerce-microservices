# Payment integrity and guest checkout capability

Payment initiation no longer trusts client-supplied amount or currency. Commerce
loads the order and always charges its persisted `totalAmount` in INR.

For authenticated orders, the gateway user ID must equal `order.customerId`.
For guest orders, order creation returns a random 256-bit checkout capability;
only its SHA-256 hash is stored. The raw capability must accompany payment and
is compared in constant time. It is returned only in the creation response and
is absent from later order DTOs.

Payments are accepted only while an order is `PENDING`, and the existing unique
order-payment check prevents duplicate processing. Invalid ownership/capability
returns 403; invalid order state returns 400.

This prevents amount tampering, currency substitution, cross-customer payment
mutation, and guessing a guest order UUID to change its payment state.
