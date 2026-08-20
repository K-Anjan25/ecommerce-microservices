# 5. Restructure Plan (execution roadmap)

Approved docs `01`–`04` define the target. This plan is the **code-change work order** to get there. Do **not** execute any phase before review.

> **Status (2026-08-18):** Phases 1/2/3/4 are **executed and verified** (full reactor `mvn test` + `mvn clean package` pass). Phase 3 §5.3.1 ES→Postgres search done (`pg_trgm`). Phase 4 done: coupons+validate, wishlist, order tracking, `CASH` provider + PENDING/REFUNDED + idempotency, order/payment emails, `comment.rating`, Actuator in all 4 services, Resilience4j on inventory Feign. Remaining: Phase 5 (compose rewrite + `.env`/secrets sweep + cleanup + README).

## 5.0 Decisions to confirm before coding

| # | Decision | Options |
|---|---|---|
| D1 | Inventory merge | **A)** stock column on `product` (recommended, kills service+3 queues) · **B)** keep separate inventory-service |
| D2 | Cart+Order+Payment merger | **A)** single `commerce-service` module (recommended) · **B)** keep 3 services but only run subset in compose |
| D3 | Notification host | **A)** consumer lives in `user-service` (recommended) · **B)** keep separate, budget 256MB |
| D4 | File serving | **A)** gateway serves `/file/**` (recommended) · **B)** keep file-service |
| D5 | Eureka/ES/Mongo/Zipkin | **A)** delete usage (recommended) · **B)** keep code, exclude from runtime |
| D6 | Roles | **A)** trim to USER/ADMIN/SUPER_ADMIN · **B)** keep HR/MANAGER dormant |
| D7 | Frontend scope in this pass | keep current MUI re-theme as-is; only fix flagged bugs (bg-background, refresh prefix, PENDING) |

My recommendation: **D1/D2/D3/D4/D5 = A, D6 = A, D7 = fix-only.**

## 5.1 Phase 1 — Infra & config correctness (foundation)

1. **Single Postgres init:** replace empty `docker/postgres/init-multiple-databases.sql` directory with a real SQL file creating `userdb`, `productdb`, `commercedb` → `CREATE DATABASE IF NOT EXISTS` (PG9+ equivalent: `SELECT ... WHERE NOT EXISTS \gexec`).
2. **Rewrite `docker-compose.yml`**:
   - Services: `postgres`, `rabbitmq`, `api-gateway`, `user-service`, `product-service`, `commerce-service`.
   - Remove: eureka-server, elasticsearch, mongodb, mongo-express, zipkin, pgadmin (or `profiles: [dev]`).
   - Add `mem_limit`, `cpus`, `restart: unless-stopped`, `JAVA_OPTS` (`-Xmx128m/192m`), healthchecks + `depends_on: condition: service_healthy`.
   - Remove `EUREKA_URI`; gateway uses static `http://<service>:<port>` URIs via docker DNS.
3. **`.env`** → fill `JWT_SECRET`, `EMAIL_*`, `STRIPE_*`, `RAZORPAY_*`, `POSTGRES_*`; ensure gitignored.
4. **Secrets sweep:** replace hardcoded JWT secret & Email constants with `${...}`; add `EMAIL_*` env binding already done (`EmailConfig`).
5. **Gas gateway AuthFilter route bug:** give distinct route ids (`product-write` / `product-read`) so `AuthFilter` applies to POST/PUT/DELETE.
6. Remove stray root files `-H`, `-d`; ensure `common/mvnw.cmd` fix retained.
7. **Memory tuning (the "≤200 MB per service" lever set).** Baseline research: a Spring Boot CRUD app on Java 17 with SerialGC commits ≈ 185 MB idle (52 heap + 61 metaspace + 17 code + threads/shared class); Tomcat's default 200 worker threads ≈ 200 MB of stacks alone; Java 17 auto-picks SerialGC below an ~1.8 GB container limit. To land every JVM at ~180–240 MB:
   - Container `mem_limit` 192–256 MB per service (never > 256).
   - JVM flags: `-XX:+UseSerialGC -XX:MaxRAM=192m -Xmx96m -Xms64m -Xss512k -XX:ActiveProcessorCount=1 -XX:+UseContainerSupport -XX:MaxRAMPercentage=50`.
   - Reduce Tomcat threads: `server.tomcat.threads.max=10` and `-Xss512k` (kills the 200 MB stack hit).
   - Multistage Dockerfiles (builder jdk + run jre-alpine, `jlink` optional) → images ≈ 120–160 MB.
   - Slugs: gateway/user 192 m, product/commerce 256 m, postgres 384 m (shared_buffers 128 MB), rabbitmq 128 m → **total ≈ 1.41 GB** with headroom in the 2 GB budget.
   - Guardian rule: `mem_limit` + `MaxRAM` must match; if a container is OOMKilled, raise the two heavy services first (not over 256 m) and re-check `docker stats`.

## 5.2 Phase 2 — Merge modules (biggest change)

### 5.2.1 `product-service` absorbs inventory
- Move `Inventory` entity, repository, `isInStock`/`deductStock` logic into product-service.
- Add `stock_quantity` column on `product`. Product create/update/delete set stock in the same transaction (drop `InventoryRequest` event chain).
- Expose `POST /v1/inventories/isInStock` + `/deductStock` (internal Feign target) from product-service.
- Delete module `inventory-service` from root pom.
- Rewrite order's Feign client to `product-service`.

### 5.2.2 New `commerce-service` (cart + order + payment + coupon + wishlist)
- Create module combining cart-service (Mongo→JPA Postgres), order-service, payment-service code.
- Scope: `/v1/carts`, `/v1/orders`, `/v1/payments`, `/v1/coupons`, `/v1/wishlist`.
- `OrderService` calls product-service Feign for `isInStock`/`deductStock` (keep), sets PENDING.
- `PaymentService` called in-process; publishes `PaymentStatusEvent` (keep `order.exchange` for portfolio) and email request on success.
- Bank provider abstraction (`StripePaymentClient`, `RazorpayPaymentClient`) stays; add `CASH` provider.
- Add `order_status_history`, `coupon`, `coupon_usage`, `wishlist` tables (greenfield in this module).
- Delete modules `cart-service`, `payment-service`, and order's old `PaymentStatusConsumer` import (now internal).

### 5.2.3 `api-gateway` absorbs file-service
- Port `FileController` (saveImage/image/removeImage) into gateway as a reactive route or delegate; expose `/file/**`.
- Delete module `file-service`.

### 5.2.4 `user-service` absorbs notification
- Move `EmailConsumer`/`EmailService`/`EmailConfig` into user-service; keep `notification.exchange`/`send.email.queue` declaration.
- Add order-confirmation + payment-receipt listeners (new commerce events).
- Delete module `notification-service`.

### 5.2.5 Delete `eureka-server`; remove Eureka + sleuth/zipkin usage
- Remove `spring-cloud-starter-eureka-*`, `spring-cloud-starter-sleuth`, `sleuth-zipkin` deps from all module poms; drop `@EnableDiscoveryClient`, eureka config blocks, zipkin config.
- Remove module `eureka-server` from root pom.
- Add `spring-boot-starter-actuator` health endpoints per service (replace zipkin observability with health/logs).

## 5.3 Phase 3 — Storage simplification

1. **Elasticsearch → Postgres search:** remove `ProductModel` ES doc, `@EnableElasticsearchRepositories`, `es-settings.json`, ES config. Implement search with `pg_trgm` (fuzzy) + full-text `tsvector` on product name/description + category filter + sort + pagination. Delete ES volume from compose.
2. **Mongo cart → Postgres:** port `Cart`/`CartItem` to JPA entities in commerce-service; drop `spring-boot-starter-data-mongodb`, `mongodb`/`mongo-express` compose services.
3. **Zipkin:** remove `spring-cloud-sleuth-zipkin` dep + `spring.zipkin.base-url` from all yml; delete zipkin from compose.
4. **Filesystem storage stays** for product/profile images (host volume mount so containers don't lose uploads).

## 5.4 Phase 4 — Feature additions (FR gaps)

- `comment.rating` (1–5) + richer review POST/GET. FR-C2/C3.
- `coupon`/`coupon_usage` + `POST /v1/coupons/validate`, apply at checkout. FR-E7.
- `order_status_history` + `GET /v1/orders/{id}/track`. FR-E6.
- `wishlist` endpoints. FR-C4.
- Payment `CASH` provider; extend `PaymentStatus` with `PENDING`/`REFUNDED`; idempotent guard on `order_id`. FR-F2/F4.
- Emails: order placed, payment success/failure. FR-H2/H3.
- Admin: user list/disable; low-stock warning. FR-A7/G3.
- Product card shows stock. FR-G4.
- **Resilience4j** circuit breaker + retry on `InventoryServiceClient` (product-service down → "out of stock" downgrade, not 500). FR-B1.
- **Spring Boot Actuator** health/info endpoints per service (replace zipkin). FR-I1.
- **Redis** (Spring Cache): hot product reads; token blacklist for logout. FR-C1. Optional — drop if memory is tight.

## 5.5 Phase 5 — Cleanup sweep (delete cruft)

Files to delete / deactivate (verify references first):
- `inventory-service/` (Ph2) · `cart-service/` (Ph2) · `payment-service/` (Ph2) · `notification-service/` (Ph2) · `file-service/` (Ph2) · `eureka-server/` (Ph2)
- order `service/ProductClient.java` (already deleted in working tree — drop from git)
- `user-service` unused role constants if D6=A
- `product-service` unused `dto/InventoryDto` etc.
- `frontend/src/components/SearchBar/style.css` (orphaned)
- commented-out blocks in `product-service/application.yml` (the big commented docker block)
- stray `-H`, `-d` files
- `frontend/src/**/*.tsx` fintech leftovers already removed in working tree — keep them deleted

Keep (don't delete): `common/`, `event-bus/` (shared libraries), user tests, new cart/inventory/order/product tests (retarget to merged modules).

## 5.6 Resource limits (docker-compose snippet to apply)

```yaml
x-service-defaults: &defaults
  restart: unless-stopped
  mem_limit: 256m
  cpus: 0.5
  environment: &env
    JAVA_OPTS: -Xmx128m -Xms64m -XX:+UseSerialGC -XX:MaxRAM=256m

services:
  postgres:
    image: postgres:15-alpine
    mem_limit: 512m
    command: ["postgres", "-c", "shared_buffers=128MB", "-c", "work_mem=4MB"]
    volumes:
      - ./docker/postgres/init-multiple-databases.sql:/docker-entrypoint-initdb.d/init.sql:ro
      - postgres:/var/lib/postgresql/data
  rabbitmq:
    image: rabbitmq:3.11-management-alpine
    mem_limit: 256m
  api-gateway:   # + file serving
    build: ./api-gateway
    mem_limit: 256m
    ports: ["8889:8889"]
    depends_on: { user-service: { condition: service_healthy }, product-service: { condition: service_healthy }, commerce-service: { condition: service_healthy } }
  user-service:
    build: ./user-service
    mem_limit: 256m
    environment: { SPRING_DATASOURCE_URL: "jdbc:postgresql://postgres:5432/userdb", SPRING_RABBITMQ_HOST: rabbitmq, ... }
  product-service:
    build: ./product-service
    mem_limit: 384m
  commerce-service:
    build: ./commerce-service
    mem_limit: 384m
```

> Ports: user `:8084`, product `:8080`, commerce `:8081`, gateway `:8889` (docker-compose networking uses docker DNS; only gateway + infra exposed).

## 5.7 Testing & verification gates

1. `./mvnw clean package` — all remaining modules compile.
2. Per-service tests (`-pl product-service`, `-pl commerce-service`, `-pl user-service`) pass with Mockito (no infra needed).
3. `docker-compose config` valid; `docker-compose up -d` → all healthy under 2 GB total (`docker stats` < 2 GB).
4. `frontend`: `npm run build` + smoke test login → browse → cart → checkout(pay) → track.
5. Security smoke: unauthenticated write → 401/403; non-admin product write → 403.

## 5.8 Risks

| Risk | Mitigation |
|---|---|
| Merging modules breaks package structure | Do Ph2 as new modules, then delete olds; keep `common`/`event-bus` bounds |
| Postgres FTS quality < Elasticsearch | Keep `pg_trgm` + index; acceptable for catalog size |
| One commerce-service couples cart/order/payment | Keep separate packages + in-process events; event bus preserved for future split |
| 2GB ceiling while dev runs IDE services too | JVM cap flags; optionally run services via compose only |
| Frontend refresh header inconsistency | Fix `refreshToken()` action to send `Bearer ` (D7) |

## 5.9 Final repository shape (target)

```
ecommerce-microservices/
├─ docs/                      ← these five documents
├─ common/  event-bus/        ← shared libs
├─ api-gateway/               ← routes + AuthFilter + /file
├─ user-service/              ← auth + email notifier
├─ product-service/           ← catalog + search + inventory + reviews
├─ commerce-service/          ← cart + order + payment + coupon + wishlist
├─ docker/postgres/init-multiple-databases.sql
├─ docker-compose.yml         ← 6 services, all resource-capped
├─ frontend/                  ← React (rethemed, fixes in D7)
└─ README.md                  ← rewrite for target architecture
```