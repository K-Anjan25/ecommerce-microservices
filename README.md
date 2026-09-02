# Cartly — E-Commerce Microservices

A full-stack e-commerce platform: **Spring Boot** microservices + **React + TypeScript** frontend
> Platform brief (architecture, status, conventions, roadmap): see [`docs/README.md`](docs/README.md).

## Architecture

4 Java services + 2 infra containers. Eureka, Elasticsearch, MongoDB and Zipkin. 

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
- Docker Desktop 
- Node.js 16+ (frontend)

## Quick Start

```bash
# 1. Configure secrets (required: JWT_SECRET; optional: email + payment keys)
cp .env.example .env      

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
| `APP_TIMEZONE` | all Spring services (business clock for zone-less dates; default `Asia/Kolkata`) |
| `INTERNAL_SERVICE_SECRET` | commerce/product services (stock-call authentication) |
| `EMAIL_USERNAME`, `EMAIL_PASSWORD`, `EMAIL_FROM` | user-service (SMTP) |
| `EMAIL_OUTBOX_ENCRYPTION_KEY` | user-service (AES-256 encrypted email retry envelope) |
| `STRIPE_SECRET_KEY`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | commerce-service (payments) |

## Frontend

React 18 + TypeScript, Redux, Material UI, Tailwind CSS — **Cartly editorial commerce system**.

- **Proxy**: relative requests go through the API Gateway (`http://localhost:8889` in local development)
- **Auth**: JWT with auto-refresh (Bearer prefix handled in the refresh interceptor)
- **Provider checkout**: copy `frontend/.env.example` to `frontend/.env` and set public `VITE_RAZORPAY_KEY_ID` and/or `VITE_STRIPE_PUBLISHABLE_KEY`; provider secrets stay server-side
- **Admin**: `/admin/*` (requires `ROLE_ADMIN` / `ROLE_SUPER_ADMIN`)
- **Design kit**: wireframes, tokens and the Figma handoff live in [`design/`](design/);
  the engineering record is [`docs/README.md`](docs/README.md).


## Testing

```bash
mvn test                                   # all modules (unit tests, no infra needed)
mvn -pl product-service test               # per service
cd frontend && npm run build               # frontend type-check, build, sitemap + robots generation
```
