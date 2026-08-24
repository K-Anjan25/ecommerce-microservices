package com.ecommerce.commerce_service.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.GenericGenerator;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.Index;
import javax.persistence.Table;
import javax.persistence.UniqueConstraint;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Pending stored-value issuance. A card is created only after PaymentService
 * applies a verified provider settlement to the linked order.
 */
@Entity(name = "gift_card_purchase_intents")
@Table(
        uniqueConstraints = @UniqueConstraint(name = "uk_gift_card_purchase_order", columnNames = "order_id"),
        indexes = @Index(name = "idx_gift_card_purchase_customer_created", columnList = "customer_id,created_at"))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GiftCardPurchaseIntent {
    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    private UUID id;

    @Column(name = "order_id", nullable = false)
    private UUID orderId;

    @Column(nullable = false)
    private UUID customerId;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false)
    private LocalDate expiryDate;

    @Column(length = 320)
    private String recipientEmail;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private GiftCardPurchaseStatus status;

    private UUID giftCardId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime issuedAt;
}
