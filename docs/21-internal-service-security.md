# Internal service authentication

Inventory check, deduction, and restoration are private commerce-to-product
operations. They are no longer routed by the public API gateway.

Commerce Feign calls include `X-Internal-Service`; product-service compares the
value in constant time before any stock operation. Both services read the same
`INTERNAL_SERVICE_SECRET`. Generate it independently from `JWT_SECRET` and rotate
it through the deployment secret manager.

The development fallback exists for local zero-config Compose only. Production
must set a long random value:

```bash
openssl rand -base64 48
```

This is a lightweight shared-secret boundary suited to the current single-host
Docker network. If services later span hosts or teams, replace it with mTLS or
short-lived workload identity rather than expanding shared-secret use.
