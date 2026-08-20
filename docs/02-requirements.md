# 2. Functional & Non-Functional Requirements

IDs used by the design docs: `FR-*`, `NFR-*`. Status legend: ✅ exists · ⬜ add · 🔶 extend.

## 2.1 Functional Requirements

### A. Account & Authentication (`user-service`)
| ID | Requirement | Status |
|---|---|---|
| FR-A1 | Customer/Admin can register with name, email, password. | ✅ |
| FR-A2 | User can log in and receives access (2d) + refresh (24d) JWT. | ✅ |
| FR-A3 | Frontend auto-refreshes access token on 401 via refresh endpoint. | ✅ (axios interceptor) |
| FR-A4 | Password reset via email link (async email). | ✅ |
| FR-A5 | User can update profile, change password, upload profile image. | ✅ |
| FR-A6 | RBAC: `ROLE_USER`, `ROLE_ADMIN`, `ROLE_SUPER_ADMIN` gate admin routes/services. | 🔶 trim ROLE_HR/MANAGER or keep dormant |
| FR-A7 | Admin can list/update/disable users. | 🔶 list/disable missing |

### B. Catalog (`product-service`)
| ID | Requirement | Status |
|---|---|---|
| FR-B1 | List products with pagination (`pageNo, pageSize`). | ✅ |
| FR-B2 | Search products by term, filter by category, sort (price/date), typo tolerance. | ✅ (ES now → Postgres FTS) |
| FR-B3 | View product detail + its images. | ✅ |
| FR-B4 | Admin creates/updates/deletes products (soft-delete) and categories. | ✅ |
| FR-B5 | Product images upload (multipart) & serve. | ✅ (gateway merge) |
| FR-B6 | Category listing. | ✅ |
| FR-B7 | Product inventory (quantityInStock) is kept in sync on create/update/delete. | 🔶 moved in-process |

### C. Reviews & Wishlist (`product-service` / `commerce-service`)
| ID | Requirement | Status |
|---|---|---|
| FR-C1 | Logged-in user adds a comment on a product. | ✅ |
| FR-C2 | List comments for a product. | ✅ |
| FR-C3 | Rating (1–5 stars) attached to a review. | ✅ (comment.rating) |
| FR-C4 | Wishlist: add/remove/view products per user. | ✅ (commerce `/v1/wishlist`) |

### D. Cart (`commerce-service`)
| ID | Requirement | Status |
|---|---|---|
| FR-D1 | Add product to cart for a customer (merge same product, compute line total). | ✅ |
| FR-D2 | Update quantity, remove item, clear cart. | ✅ |
| FR-D3 | Cart total is recomputed server-side. | ✅ |
| FR-D4 | Cart cleared on successful order placement. | ✅ |
| FR-D5 | Persisted per customer (survives refresh/re-login). | ✅ (Mongo → Postgres migration) |

### E. Checkout & Orders (`commerce-service`)
| ID | Requirement | Status |
|---|---|---|
| FR-E1 | Checkout: State, District, detailed address captured and validated. | ✅ |
| FR-E2 | Order creation verifies stock (batch) then deducts. | ✅ (Feign→ now in-process) |
| FR-E3 | Order status lifecycle: `PENDING → PAID → APPROVED → CANCELLING → CANCELLED`. | ✅ |
| FR-E4 | Order history per user, paginated. | ✅ |
| FR-E5 | Admin can view all orders, approve, cancel. Admin order detail. | ✅ |
| FR-E6 | Order tracking: status timeline/history visible to customer. | ✅ (`/v1/orders/{id}/track`) |
| FR-E7 | Coupon/promo code applied at checkout (percent / flat, expiry, max uses). | ✅ (coupons + `/v1/coupons/validate`) |
| FR-E8 | Shipping details (state/district) reused for order address. | 🔶 |

### F. Payments (`commerce-service`)
| ID | Requirement | Status |
|---|---|---|
| FR-F1 | Pay with Razorpay or Stripe (provider abstraction). | ✅ |
| FR-F2 | Cash on Delivery option (no online charge). | ✅ (as `CASH` provider) |
| FR-F3 | Payment result (`SUCCESS`/`FAILED`) async-updates order (RabbitMQ). | ✅ (in-process now) |
| FR-F4 | One payment per orderId; idempotent retry. | ✅ (duplicate-orderId guard) |
| FR-F5 | Payment recorded with userId + amount + currency + transactionId. | ✅ |
| FR-F6 | Webhook/provider verification before marking SUCCESS (test-mode pm_card). | 🔶 |

### G. Inventory (`product-service`)
| ID | Requirement | Status |
|---|---|---|
| FR-G1 | `isInStock(ids, qty)` batch check. | ✅ (moved in-process) |
| FR-G2 | `deductStock(ids, qty)` on order; never negative (clamp 0). | ✅ |
| FR-G3 | Low-stock warning for admins (optional). | ⬜ |
| FR-G4 | Stock display on product card. | 🔶 |

### H. Notifications (`user-service` email consumer)
| ID | Requirement | Status |
|---|---|---|
| FR-H1 | Password reset email. | ✅ |
| FR-H2 | Order confirmation email on payment success. | ✅ (`order.exchange` → notification; order-placed email) |
| FR-H3 | Payment receipt/failure email. | ✅ (published on payment success/failure) |
| FR-H4 | Email config via env (`EMAIL_USERNAME/PASSWORD/FROM`), no committed secrets. | ✅ (already moved) |

### I. File storage (`api-gateway`)
| ID | Requirement | Status |
|---|---|---|
| FR-I1 | Upload product image (validate MIME) → returns URL. | ✅ (merge) |
| FR-I2 | Serve images by name; delete image. | ✅ (merge) |
| FR-I3 | Profile image upload/serve. | ✅ (user-service) |

## 2.2 Non-Functional Requirements

### Resources & Operations
| ID | Requirement | Status |
|---|---|---|
| NFR-R1 | Full stack must run **within 2 GB** Docker memory, 2 vCPU (see §1.4 budget). | ⬜ enforce `mem_limit` + `-Xmx` |
| NFR-R2 | Single-command bring-up: `docker-compose up -d` starts DB, broker + all 4 services, with healthchecks and `restart: unless-stopped`. | ⬜ |
| NFR-R3 | Every container capped so one OOM cannot kill the host. | ⬜ |
| NFR-R4 | Deployment is push-to-Docker-compose, no cluster needed. | ✅ |

### Performance
| ID | Requirement | Status |
|---|---|---|
| NFR-P1 | Catalog search/paginate P95 < 300 ms (Postgres FTS). | 🔶 |
| NFR-P2 | Checkout (create+pay) P95 < 2 s incl. stock check. | 🔶 |
| NFR-P3 | API responses paginated everywhere list endpoints exist. | ✅/🔶 |
| NFR-P4 | Startup: all services healthy under 60 s on 2 vCPU. | 🔶 (JVM flags, slim images) |

### Security
| ID | Requirement | Status |
|---|---|---|
| NFR-S1 | No secrets in code; all via env (`.env` → compose). Remove Gmail app password + JWT secret from yml. | ⬜ |
| NFR-S2 | Gate every write endpoint: gateway AuthFilter + service-level role checks (fix duplicate route bug). | ⬜ |
| NFR-S3 | Cart/commerce endpoints authenticated via gateway-injected `userId`, never trust client-supplied customerId. | ⬜ |
| NFR-S4 | Passwords hashed (BCrypt), JWT HMAC512, refresh rotation. | ✅ |
| NFR-S5 | Validate all inputs (create/update DTOs, `@Valid`); no `System.out.println` debug. | 🔶 |

### Reliability & Data
| ID | Requirement | Status |
|---|---|---|
| NFR-RB1 | Payment→order status update is idempotent and durable (RabbitMQ persistence). | 🔶 |
| NFR-RB2 | Order creation is transactional (stock deduct + order save); compensate on failure. | 🔶 |
| NFR-RB3 | DB init creates all schemas/roles deterministically (init SQL shipped). | ⬜ |
| NFR-RB4 | Catalog reads degrade gracefully if payment provider down (isolation). | ✅ (separation) |
| NFR-RB5 | Logs are structured (`logback` JSON) for grepping; no zipkin dependency runtime. | ⬜ |

### Maintainability
| ID | Requirement | Status |
|---|---|---|
| NFR-M1 | Maven modules still build cleanly (`./mvnw clean package`), each module self-contained. | 🔶 |
| NFR-M2 | Dead code, orphaned files, commented blocks removed from repo. | ⬜ |
| NFR-M3 | Tests exist for cart, inventory, order, product services; extend to new modules. | 🔶 |
| NFR-M4 | One consistent naming: paths under `/v1/...`, DTO names, event names. | 🔶 |
| NFR-M5 | README mirrors target architecture and run instructions. | ⬜ |