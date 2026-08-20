# 4. UML Diagrams & User / Design Flows

## 4.1 Use-Case Diagram

```mermaid
flowchart TB
  subgraph Actors
    C[Customer]
    A[Admin]
    S[System]
  end

  subgraph Account
    C --> UC1[Register / Login / Refresh]
    C --> UC2[Update profile & password]
    C --> UC3[Reset password via email]
    A --> UC4[Manage users]
  end

  subgraph Catalog[Catalog]
    C --> UC5[Browse & search products]
    C --> UC6[View product detail]
    C --> UC7[Review & rate product]
    C --> UC8[Add to wishlist]
    A --> UC9[CRUD products & categories]
    A --> UC10[Upload product images]
    S --> UC11[Keep stock in sync]
  end

  subgraph Commerce[Commerce]
    C --> UC12[Manage cart items]
    C --> UC13[Checkout with address]
    C --> UC14[Apply coupon]
    C --> UC15[Pay Razorpay / Stripe / Cash]
    C --> UC16[View orders & track status]
    A --> UC17[View all orders / Approve / Cancel]
    S --> UC18[Validate & deduct stock]
    S --> UC19[Notify payment status + emails]
  end
```

## 4.2 Class Diagram (core domain, per bounded context)

```mermaid
classDiagram
  class User {
    <<entity>>
    +UUID id
    +String email
    +String password
    +String role
    +String[] authorities
    +boolean isActive
  }
  class Product {
    <<entity>>
    +UUID id
    +String name
    +BigDecimal unitPrice
    +int stockQuantity
    +String imageUrl
    +boolean deleted
  }
  class Category {
    <<entity>>
    +Long id
    +String name
  }
  class Comment {
    <<entity>>
    +UUID id
    +String text
    +int rating
  }
  class Cart {
    <<entity>>
    +UUID id
    +UUID customerId
    +BigDecimal totalPrice
  }
  class CartItem {
    <<entity>>
    +UUID productId
    +String name
    +BigDecimal price
    +int quantity
    +BigDecimal totalPrice
  }
  class Order {
    <<entity>>
    +UUID id
    +UUID customerId
    +OrderStatus status
  }
  class OrderItem {
    <<entity>>
    +UUID productId
    +int quantity
  }
  class OrderAddress {
    <<entity>>
    +String state
    +String district
    +String addressDetail
  }
  class OrderStatusHistory {
    <<entity>>
    +OrderStatus fromStatus
    +OrderStatus toStatus
    +LocalDateTime changedAt
  }
  class Payment {
    <<entity>>
    +UUID orderId
    +UUID userId
    +BigDecimal amount
    +PaymentProvider provider
    +PaymentStatus status
    +String transactionId
  }
  class Coupon {
    <<entity>>
    +String code
    +DiscountType type
    +BigDecimal value
    +LocalDateTime expiresAt
    +int maxUses
  }

  Category "1" o-- "0..*" Product : has
  Product "1" o-- "0..*" Comment : receives
  Cart "1" *-- "0..*" CartItem : contains
  Order "1" *-- "0..*" OrderItem : contains
  Order "1" o-- "1" OrderAddress : ships to
  Order "1" o-- "0..*" OrderStatusHistory : tracks
  Order "1" o-- "1" Payment : paid by
  Payment "0..*" o-- "0..1" Coupon : applied
```

## 4.3 ERD (physical)

```mermaid
erDiagram
  USERS ||--o{ CART : owns
  USERS ||--o{ ORDERS : places
  USERS ||--o{ WISHLIST : saves
  PRODUCT ||--o{ COMMENT : receives
  CATEGORY ||--o{ PRODUCT : contains
  PRODUCT ||--o{ CART_ITEM : included
  PRODUCT ||--o{ ORDER_ITEM : sold
  CART ||--o{ CART_ITEM : holds
  ORDERS ||--o{ ORDER_ITEM : has
  ORDERS ||--|| ORDER_ADDRESS : ships_to
  ORDERS ||--o{ ORDER_STATUS_HISTORY : tracks
  ORDERS ||--|| PAYMENT : paid_by
  COUPON ||--o{ COUPON_USAGE : consumed
  COUPON_USAGE }o--|| ORDERS : on
  COUPON_USAGE }o--|| USERS : by
```

## 4.4 State Machines

### Order lifecycle (existing enum)
```mermaid
stateDiagram-v2
  [*] --> PENDING : create (stock verified+deducted)
  PENDING --> PAID : payment SUCCESS (CASH online)
  PENDING --> CANCELLED : payment FAILED / user cancel
  PAID --> APPROVED : admin approves
  APPROVED --> CANCELLING : admin request cancel
  CANCELLING --> CANCELLED : refunded
  CANCELLED --> [*]
```

### Payment lifecycle (new enum includes PENDING/REFUNDED)
```mermaid
stateDiagram-v2
  [*] --> PENDING : initiated
  PENDING --> SUCCESS : provider charge ok
  PENDING --> FAILED : provider declined / timeout
  SUCCESS --> REFUNDED : cancel+refund
  FAILED --> [*]
  REFUNDED --> [*]
```

## 4.5 User Flows

### Customer journey
```mermaid
flowchart LR
  A[Register/Login] --> B[Browse Home]
  B --> C{Search / filter?}
  C -->|yes| D[Search results]
  C -->|no| B
  D --> E[Product detail]
  E --> F{Add to cart?}
  F -->|yes| G[Cart]
  G --> H[Checkout]
  H --> I{Apply coupon?}
  I -->|yes| J[Apply & verify]
  J --> K[Choose payment]
  I -->|no| K
  K --> L[Cash / Razorpay / Stripe]
  L --> M[Order confirmation email]
  M --> N[Track order status]
  N --> O{Reorder? / Review?}
  O -->|review| P[Rate & comment]
  O -->|share/wishlist| Q[Wishlist]
```

### Admin flow
```mermaid
flowchart LR
  A[Admin login] --> B[Dashboard]
  B --> C{Action}
  C -->|Products| D[Create/Edit product + stock + images]
  C -->|Categories| E[Manage categories]
  C -->|Orders| F[View orders, approve/cancel]
  C -->|Users| G[List / disable users]
  C -->|Coupons| H[Create/expire coupons]
```

## 4.6 Design Flows (screen-level)

```
/login ──▶ /register ──▶ / (home w/ Navbar CARTLY)
                            │
                            ├─ /products?search=&page=
                            │     └─ /products/:id  (review form, add-to-cart, wishlist)
                            ├─ /cart  ──▶ "Checkout with payment"
                            │               └─ /checkout (address form + order summary + pay)
                            ├─ /account (profile, password, image)
                            ├─ /profile (update info)
                            └─ /admin
                                 ├─ /admin/products (+ AddEditProduct w/ image upload)
                                 ├─ /admin/categories
                                 ├─ /admin/orders (+ OrderDetail approve/cancel)
                                 └─ (users, coupons — extend admin nav)
```

Frontend notes from current code that the redesign must respect:
- `axios` base `http://localhost:8889`, Bearer header, 401 auto-refresh (keep).
- Checkout = create order → `POST /v1/payments` → on SUCCESS clear cart & redirect home (keep; decide `PENDING` handling).
- `DashboardLayout` `bg-background` class is gone → use a defined color (`bg-slate-50`).
- Store refresh action must send `Bearer ` prefix consistently.