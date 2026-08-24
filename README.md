# Cartly — E-Commerce Microservices

A full-stack e-commerce platform: **Spring Boot** microservices + **React + TypeScript** frontend, sized to run on a Docker Desktop host with a **2 GB memory budget**.

> Design docs (architecture, requirements, system design, UML/flows, restructure plan): see [`docs/`](docs/).

## Architecture

4 Java services + 2 infra containers. Eureka, Elasticsearch, MongoDB, Zipkin and 6 extra services were consolidated/removed to fit the budget (see `docs/05`).

```
                 ┌────────────────────────────┐
                 │      React Frontend        │  (:3000)
                 └────────────┬───────────────┘
                              │ /api
               ┌──────────────▼───────────────┐
               │   API Gateway  (:8889)        │  AuthFilter + /file serving
               └───┬────────┬─────────┬────────┘
        ┌──────────▼──┐ ┌───▼──────┐ ┌▼──────────────┐
        │ user-service│ │ product  │ │ commerce      │
        │  :8084      │ │  :8080   │ │  :8081        │
        │ auth, users,│ │ catalog, │ │ cart, order,  │
        │ email notify│ │ category,│ │ payment,      │
        │ (consumer)  │ │ comments,│ │ coupons,      │
        │             │ │ search   │ │ wishlist,     │
        │             │ │ (pg_trgm)│ │ tracking      │
        │             │ │ inventory│ │              │
        └──────────────┘ └──────────┘ └──────────────┘
               └───────────┬─────┬───────────┘
                   ┌──────▼─────▼──────┐
                   │ postgres │ rabbitmq│
                   └───────────────────┘
```

## Services

| Service | Port | Tech | Database |
|---------|------|------|----------|
| `api-gateway` | 8889 | Spring Cloud Gateway (reactive) + file serving | - |
| `user-service` | 8084 | Spring Boot + Security + JavaMail | `userdb` |
| `product-service` | 8080 | Spring Boot + JPA + pg_trgm search | `productdb` |
| `commerce-service` | 8081 | Spring Boot (cart/order/payment/coupon/wishlist) | `commercedb` |

## Communication

- **REST/Feign**: Gateway → services; commerce → product (`isInStock` / `deductStock`, wrapped in a Resilience4j circuit breaker).
- **Async (RabbitMQ)**: payment → order status (`order.exchange`); commerce → user email (`notification.exchange` → `send.email.queue`) — order confirmation, payment status, and PDF invoice (on payment success) with attachment support.
- **Auth**: stateless JWT (access 2d / refresh 24d). Gateway `AuthFilter` validates the token against user-service and injects `userId` / `authorities` headers downstream. RBAC `ROLE_USER` / `ROLE_ADMIN` / `ROLE_SUPER_ADMIN`.
- **Guest checkout**: `POST /v1/orders` and `POST /v1/payments` are public (headerless requests bypass `AuthFilter` via dedicated gateway routes; requests carrying a Bearer token still match the guarded routes first). Guest orders need a contact email and are paid via COD or Razorpay.

## Prerequisites

- Java 17 (build only — Maven is invoked via the Maven wrapper command in `common/` or a local Maven 3.9+)
- Docker Desktop with **2 GB memory** allocated (Docker Compose v2)
- Node.js 16+ (frontend)

## Quick Start

```bash
# 1. Configure secrets (required: JWT_SECRET; optional: email + payment keys)
cp .env.example .env      # then edit

# 2. Build + start the whole stack (postgres, rabbitmq, 4 services)
docker compose up -d --build

# 3. Check health
docker compose ps
curl http://localhost:8889/actuator/health

# 4. Start frontend
cd frontend
npm install
npm start
```

Everything (DBs `userdb`/`productdb`/`commercedb`, queues/exchanges, tables) is created automatically on first boot.

### Local (no Docker) backend

```bash
# one Postgres instance + RabbitMQ running locally, then per service:
./common/mvnw -pl product-service -am spring-boot:run   # or mvn -pl <module> -am spring-boot:run
```

## Environment Variables

See `.env.example`. Never commit real `.env` values.

| Variable | Used by |
|---|---|
| `POSTGRES_USERNAME`, `POSTGRES_PASSWORD` | all services / postgres |
| `JWT_SECRET` | user-service (token signing) |
| `CORS_ALLOWED_ORIGIN` | API gateway (exact production storefront origin) |
| `APP_FRONTEND_URL` | user/product services (password reset and alert links) |
| `INTERNAL_SERVICE_SECRET` | commerce/product services (stock-call authentication) |
| `EMAIL_USERNAME`, `EMAIL_PASSWORD`, `EMAIL_FROM` | user-service (SMTP) |
| `STRIPE_SECRET_KEY`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | commerce-service (payments) |

## Frontend

React 18 + TypeScript, Redux, Material UI, Tailwind CSS — **Cartly editorial commerce system**.

- **Proxy**: `/api` → `http://localhost:8889` (API Gateway)
- **Auth**: JWT with auto-refresh (Bearer prefix handled in the refresh interceptor)
- **Admin**: `/admin/*` (requires `ROLE_ADMIN` / `ROLE_SUPER_ADMIN`)
- **Design kit**: wireframes, tokens and the Figma handoff live in [`design/`](design/);
  the engineering record is [`docs/08-frontend-redesign.md`](docs/08-frontend-redesign.md).

### WordPress theme — separate repository

The same design system also ships as an installable WordPress + WooCommerce
theme: **[`cartly-wp-theme`](https://github.com/K-Anjan25/cartly-wp-theme)**. Same tokens, same shell, same product
card, rendered by PHP instead of React.

It lives in its own repo because it has a different audience and release
cadence — see [`docs/09-frontend-strategy.md`](docs/09-frontend-strategy.md).
`design/tokens.json` stays canonical **here**; the theme pulls it and its CI
fails if the two drift.

### Reviewing the UI without the backend

```bash
node design/preview-mock-server.mjs   # dev-only fake gateway on :8889
cd frontend && npm start              # http://localhost:3000
```

## Testing

```bash
mvn test                                   # all modules (unit tests, no infra needed)
mvn -pl product-service test               # per service
cd frontend && npm run build               # frontend type-check + build
```

## Resource Budget

Per-container caps (`docker-compose.yml`): postgres 384m, rabbitmq 128m, gateway 192m, user 192m, product 256m, commerce 256m → **≈ 1.4 GB ceiling**, leaving headroom in the 2 GB budget. Every JVM is pinned with `-XX:+UseSerialGC -XX:MaxRAM=… -Xmx… -Xms… -Xss512k -XX:ActiveProcessorCount=1 -XX:MaxRAMPercentage=50` and `server.tomcat.threads.max=10` so no container can OOM the host.

## Docs

- `docs/01-system-architecture.md` — target architecture + memory budget + market-grade stack
- `docs/02-requirements.md` — FR/NFR matrix with status
- `docs/03-system-design.md` — components, sequence flows, data model
- `docs/04-uml-and-flows.md` — UML diagrams + state machines
- `docs/05-restructure-plan.md` — how the old 10-service stack was consolidated
- `docs/06-roadmap.md` — phased roadmap (6 → 10) and guardrails
- `docs/07-handoff-opencode.md` — running session log / handoff notes
- `docs/08-frontend-redesign.md` — Cartly 2.0 frontend redesign
- `docs/09-frontend-strategy.md` — React platform + standalone WooCommerce theme decision
- `docs/10-brand-and-storefront-benchmark.md` — brand scorecard and storefront benchmark
- `docs/11-woocommerce-pattern-research-and-frontend-architecture.md` — Cartly 3.0 WooCommerce pattern research, token corrections and feature architecture
- `design/README.md` — design tokens, wireframes and the Figma handoff
- [`cartly-wp-theme`](https://github.com/K-Anjan25/cartly-wp-theme) — the design system as a WordPress/WooCommerce theme (separate repo)
