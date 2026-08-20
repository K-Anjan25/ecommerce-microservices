# 1. System Architecture

> Target state after restructure. Constraint driving the design: **Docker Desktop limited to 2 GB total RAM for all running containers, 2 vCPU, 8 GB host**.

## 1.1 Current State (As-Is)

```
                 ┌─────────────────────┐
                 │   React Frontend    │
                 │  (Vite/CRA, :3000)  │
                 └──────────┬──────────┘
                            │ proxy
              ┌─────────────▼─────────────┐
              │   API Gateway  (:8889)    │──┬─◄ user-service   (:8084)
              │  (Spring Cloud Gateway)   │  ├─◄ product-service(:8080)
              └───────────────────────────┘  ├─◄ order-service  (:8081)
                                             ├─◄ payment-service(:8082)
                                             ├─◄ cart-service   (:8083)  ✗ NOT ROUTED
                                             ├─◄ inventory-service(:8881)
                                             ├─◄ file-service   (:8086)
                                             └─◄ eureka-server  (:8761)

  Infra: postgres(5432) · elasticsearch(9200) · mongodb(27017) · rabbitmq(5672)
         zipkin(9411) · pgadmin(5050) · mongo-express(9081)
```

**10 runnable components + 7 infra containers. Impossible to fit in 2 GB:**

| Component | Approx RAM | Verdict |
|---|---|---|
| Elasticsearch (2×512M heap + overhead) | ~1.2 GB | **Remove** → Postgres search |
| PostgreSQL + pgadmin + mongo + mongo-express | ~1.5 GB | Slim to one PG; stop mongo/express/pgadmin |
| zipkin + eureka-server | ~400 MB | Remove (not needed at this scale) |
| 10 Spring Boot JVMs | 10 × 250–400 MB | **Cannot run** — consolidate to 4 |

## 1.2 Problems Found (why restructure)

1. **Resource mismatch** — architecture designed for a big cluster; runtime host has 2 GB.
2. `docker-compose.yml` has **every app service commented out**, only infra runs. No working single-command stack.
3. `docker/postgres/init-multiple-databases.sql` is an **empty directory** mounted as a file → no DBs created.
4. **Duplicate route id `product-service`** in gateway kills the write-route AuthFilter (security gap).
5. **Hardcoded secrets** committed: Gmail app password, JWT secret in `application.yml`.
6. `cart-service` is **off the gateway** (no route, no Eureka, reachable only directly) and unauthenticated.
7. Dead code/cruft: unused `ProductClient`, stale commented blocks, `System.out.println`, unused DTOs, `SearchBar/style.css` orphaned, `-H`/`-d` stray files.
8. Two datastores for no reason: cart in Mongo while everything else is Postgres.

## 1.3 Target Architecture (To-Be)

**4 runnable Java services + 2 infra containers.** Keeps the microservice story (separate bounded contexts, gateway, async events) while fitting the budget.

```
                 ┌────────────────────────────┐
                 │      React Frontend        │  (:3000)
                 └────────────┬───────────────┘
                              │ /api
              ┌───────────────▼───────────────┐
              │   API Gateway  (:8889)        │   auth filter + static file serving
              │  (gateway + file endpoints)   │   stateless, own DB access
              └───┬────────┬─────────┬────────┘
                  │        │         │
      ┌───────────▼──┐ ┌───▼──────┐ ┌▼──────────────┐
      │ user-service │ │ product  │ │ commerce      │
      │  :8084       │ │  :8080   │ │  :8081        │
      │ auth, users, │ │ catalog, │ │ cart, order,  │
      │ email notify │ │ category │ │ payment,      │
      │ (consumes)   │ │ comments,│ │ coupons,      │
      │              │ │ search,  │ │ order tracking│
      │              │ │ inventory│ │              │
      └──────────────┘ └──────────┘ └──────────────┘
             │                │              │
             └───────────┬────┴───────┬──────┘
                  ┌──────▼─────┐ ┌────▼──────┐
                  │ postgres   │ │ rabbitmq  │
                  │ single     │ │ async     │
                  │ instance   │ │ events    │
                  └────────────┘ └───────────┘
```

Runnables removed/merged:

| Old | New home | Why |
|---|---|---|
| `eureka-server` | **deleted** | Only runs everything else; with 3 services, gateway uses static docker DNS (`http://user-service:8084`). Saves a whole JVM + discovery latency. |
| `event-bus` (library) | **kept as jar** | Shared RabbitMQ producer/config — still used. |
| `cart-service` (Mongo) | merge → **commerce-service** | One checkout pipeline (cart→order→payment), one Postgres. |
| `payment-service` | merge → **commerce-service** | Tight coupling to order (stock check, status events); frees a JVM. |
| `inventory-service` | merge → **product-service** | Stock = quantity column on product; kills 3 RabbitMQ queues + a whole service. |
| `file-service` | merge → **api-gateway** | Gateway already handles multipart/routes; one upload/download surface. |
| `notification-service` | merge → **user-service** | Only email consumer; runs in user's JVM. |
| `zipkin` / sleuth | **removed** | No tracing infra budget; structured logs instead. |

## 1.4 Container Memory Budget (2 GB Total)

Cap every container with `mem_limit` + JVM `-Xmx` so one runaway service can't OOM the host. Total ≈ 1.55 GB, leaving headroom.

| Container | mem_limit | JVM/notes |
|---|---|---|
| postgres | 384 MB | `shared_buffers=128MB, work_mem=4MB` |
| rabbitmq | 128 MB | default |
| api-gateway (incl. files) | 192 MB | `-Xmx64m`, Reactor Netty |
| user-service | 192 MB | `-Xmx64m` |
| product-service | 256 MB | `-Xmx96m` |
| commerce-service | 256 MB | `-Xmx96m` |

> Total ceiling ≈ 1.4 GB, leaving headroom in the 2 GB budget (limits per `docker-compose.yml`, §5.6).

> **Scaling rule:** with the single host at 2 GB, do NOT add more services. Grow by adding a replica of a stateless service **only** after raising Docker's memory limit. Each extra JVM costs ≈ 200 MB.

## 1.5 Missing vs Removed Capability Check

Nothing on the current feature list forces a **new** service. Gaps map onto existing contexts:

| Wanted capability (per FR doc) | Where it lives | Status |
|---|---|---|
| Coupon / promo codes | `commerce-service` (`coupon` tables) | ✅ Done |
| Order tracking / status history | `commerce-service` (`order_status_history`) | ✅ Done |
| Wishlist | `commerce-service` (`wishlist_items`) | ✅ Done |
| Review ratings (stars) | `product-service` (`comment.rating`) | ✅ Done |
| Order/payment confirmation emails | user-service email consumer (`send.email.queue`) | ✅ Done |
| Search | product-service over Postgres (`pg_trgm`, tsvector) | ✅ Done |
| Cash on Delivery | commerce-service (`CASH` provider, order stays PENDING) | ✅ Done |

## 1.6 Alternatives Considered

| Option | RAM | Pros | Cons | Verdict |
|---|---|---|---|---|
| **A. Consolidate to 4 services (selected)** | ~1.55 GB | fits budget, real microservices, single compose | less "many services" on portfolio | ✅ |
| B. Full 10-service microservices | 3.5+ GB | classic demo | cannot run | ❌ |
| C. Modular monolith (1 JVM) | <1 GB | smallest | loses gateway/Eureka/Rabbit story | keep as fallback |

## 1.7 What Stays (portfolio microservice story)

- **Spring Cloud Gateway** with a real `AuthFilter` (validate JWT → inject `userId`/`authorities`/`username` headers).
- **Bounded contexts** as separate Maven modules with their own DB schema.
- **RabbitMQ async**: product→stock; payment→order status; user→email.
- **JWT auth** with refresh flow and RBAC (ROLE_USER / ROLE_ADMIN / ROLE_SUPER_ADMIN).
- **Single command bring-up**: `docker-compose up -d` runs the whole stack.

## 1.8 Market-Grade Stack (recommended, optional)

Keeps the portfolio honest about production patterns without breaking the 2 GB budget. All three are small JVM/container footprints; the phases are spelled out in docs/05 §5.4.

| Addition | Why | Footprint | Where |
|---|---|---|---|
| **Spring Boot Actuator** | health, readiness, `info` per service; replaces zipkin observability | +0 (spring-boot-starter) | every service |
| **Resilience4j** (circuit breaker + retry) | Feign call `isInStock`/`deductStock` to product-service — downgrade to "out of stock" instead of 500 when product-service is down/overloaded | +~30 MB | `commerce-service` (`client/CommerceInventoryService`) |
| **Redis** (Spring Cache) | cache hot catalog reads (`GET /v1/products`), token blacklist for logout | +1 container 128 MB | `product-service`, `user-service` |

> Status: Actuator ✅ and Resilience4j ✅ are implemented (Phase 4). Redis is **deferred** — optional tier, drop if memory is tight.