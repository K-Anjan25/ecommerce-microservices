# Gift-card issuance boundary

Customer self-service gift-card issuance has been disabled. The former `POST /v1/gift-cards/purchase` route created spendable stored value without proving that a payment had been captured, so it was not a purchase and could not safely remain customer-accessible.

## Current behavior

- Customers can view cards previously issued to their account and use active codes during authoritative checkout.
- The customer wallet clearly states that new purchases are unavailable until provider capture and webhook reconciliation exist.
- `POST /v1/gift-cards/issue` is restricted to `ROLE_ADMIN` and `ROLE_SUPER_ADMIN`.
- Administrative issuance requires an amount, future expiry, and a non-empty reason.
- Each issuance records an audit event containing the issuer, card identifier, amount, expiry, and reason.
- Customer card lookup uses a customer-scoped repository query instead of loading every card and filtering in memory.

## Restoring customer purchases

A future purchase flow must create a pending issuance intent, charge an authoritative server amount, verify the provider webhook idempotently, and only then activate the card. A browser redirect or client-reported success must never mint stored value.
