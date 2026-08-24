# Encrypted transactional email retry outbox

User-service now has a durable retry boundary for SMTP failures. RabbitMQ remains the first delivery transport. When SMTP delivery fails, the listener encrypts the complete `EmailRequest` envelope and stores it in PostgreSQL before acknowledging the RabbitMQ message.

## Privacy boundary

The retry table stores:

- AES-GCM ciphertext for the serialized email envelope;
- a random per-message initialization vector;
- attempt and scheduling metadata.

Email bodies, recipient addresses, guest tracking capabilities, password-reset links and invoice attachment bytes are not stored as plaintext and are never logged. The encryption key is supplied through `EMAIL_OUTBOX_ENCRYPTION_KEY` as a base64-encoded 32-byte AES key. There is no insecure fallback key: if it is missing, the listener leaves the RabbitMQ message unacknowledged so broker redelivery remains the safer failure mode.

## Retry behavior

A scheduled publisher checks up to the configured batch size every 30 seconds by default:

1. Lock due rows in creation order.
2. Decrypt and deserialize the email envelope.
3. Send through the existing SMTP service.
4. Delete the row only after the send call succeeds.
5. On failure, retain it and use exponential backoff capped at one hour.
6. After the configured maximum attempts, mark the row `DEAD` for manual infrastructure review instead of retrying forever.

A process crash after SMTP acceptance but before deletion can send a duplicate. Email delivery is therefore at-least-once; production should use provider-level idempotency where available and monitor retry age/volume. Dead records are visible as metadata only in **Admin → Email delivery**; encrypted message contents and recipients are never exposed.

## Configuration

- `EMAIL_OUTBOX_ENCRYPTION_KEY` — required for durable retry storage;
- `EMAIL_OUTBOX_PUBLISH_DELAY_MS` — retry scan delay, default `30000`;
- `EMAIL_OUTBOX_BATCH_SIZE` — maximum rows per scan, default `50`;
- `EMAIL_OUTBOX_MAX_ATTEMPTS` — attempts before manual-review state, default `20`;
- `EMAIL_OUTBOX_DEAD_RETENTION` — retention for dead encrypted rows, default `P30D`;
- `EMAIL_OUTBOX_RETENTION_SCAN_DELAY_MS` — dead-row cleanup cadence, default `21600000`.

The outbox is intentionally a delivery retry mechanism, not a replacement for the source service's post-commit notification boundary. Commerce state remains independent of SMTP availability.
