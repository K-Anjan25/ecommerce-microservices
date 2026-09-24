package com.ecommerce.commerce_service.membership;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/** Cartly Plus status as shown in the account hub and used across the store. */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MembershipStatusDto {
    /** NONE | ACTIVE | EXPIRED */
    private String status;
    private String plan;
    private BigDecimal pricePaid;
    private LocalDateTime startedAt;
    private LocalDateTime currentPeriodEnd;
    private boolean autoRenew;
    private UUID userId;
}
