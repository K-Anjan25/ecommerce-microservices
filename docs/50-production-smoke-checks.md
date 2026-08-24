# Read-only production smoke checks

`tools/production-smoke.sh` provides a safe post-deployment smoke test. It only checks:

- gateway Actuator health is `UP`;
- public product reads respond;
- optional frontend `robots.txt` and `sitemap.xml` are reachable;
- optional HTTPS enforcement.

It never creates an order, charges a provider, mutates inventory, or calls an authenticated customer/admin endpoint.

Usage:

```bash
BASE_URL=https://api.example.com \
FRONTEND_URL=https://shop.example.com \
REQUIRE_HTTPS=true \
./tools/production-smoke.sh
```

Run it after migrations, canary startup, and each production rollout. Payment, webhook, restore, load, and disaster drills remain separate certification procedures and are intentionally not automated by this read-only script.
