# Operations health signals

Commerce-service and user-service now expose queue pressure through their existing Actuator health endpoint without exposing customer data.

## Signals

Commerce includes `paymentReconciliation` details:

- `openCases`
- `threshold`
- review location

User-service includes `emailDelivery` details:

- `pendingRetries`
- `deadRetries`
- `threshold`
- review location

The indicators remain `UP` when business work exceeds a threshold so an operations backlog does not cause an automatic container restart. They return `UNKNOWN` if queue status cannot be read. Alerting should monitor the numeric details and the warning condition rather than treating the application as unavailable.

Thresholds are configurable through:

- `PAYMENT_RECONCILIATION_HEALTH_OPEN_CASE_THRESHOLD`
- `EMAIL_OUTBOX_HEALTH_DEAD_THRESHOLD`

The health response contains counts and metadata only. It never includes email payloads, recipients, checkout capabilities, provider credentials, or invoice bytes.
