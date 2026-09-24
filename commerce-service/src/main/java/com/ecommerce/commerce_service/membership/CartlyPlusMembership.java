package com.ecommerce.commerce_service.membership;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Table;
import javax.persistence.Id;
import javax.persistence.UniqueConstraint;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * A customer's Cartly Plus membership (Prime-style paid program). Cancel keeps
 * benefits until the period ends (autoRenew=false), mirroring Prime.
 */
@Entity
@Table(name = "cartly_plus_memberships", uniqueConstraints = {
        @UniqueConstraint(name = "uk_cartly_plus_user", columnNames = "user_id")})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartlyPlusMembership {

    @Id
    @Builder.Default
    private UUID id = UUID.randomUUID();

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    /** ACTIVE | EXPIRED */
    @Column(nullable = false, length = 16)
    @Builder.Default
    private String status = "ACTIVE";

    /** MONTHLY | ANNUAL */
    @Column(nullable = false, length = 16)
    private String plan;

    @Column(name = "price_paid", nullable = false, precision = 10, scale = 2)
    private BigDecimal pricePaid;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "current_period_end", nullable = false)
    private LocalDateTime currentPeriodEnd;

    @Column(name = "auto_renew", nullable = false)
    @Builder.Default
    private boolean autoRenew = true;

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}
