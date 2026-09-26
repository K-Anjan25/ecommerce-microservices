package com.ecommerce.commerce_service.dto.subscription;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionDto {
    private UUID id;
    private UUID productId;
    private String productName;
    private UUID variantId;
    private String variantName;
    private BigDecimal unitPrice;
    private Integer quantity;
    private Integer intervalDays;
    private LocalDateTime nextRunAt;
    private boolean active;
    /** ACTIVE | PAUSED | CANCELED */
    private String status;
    private BigDecimal discountPercent;
    private LocalDateTime pausedUntil;
    private boolean skipNext;
    /** SKIP | WAIT | CANCEL */
    private String oosPolicy;
    private UUID lastOrderId;
    private LocalDateTime createdAt;
}
