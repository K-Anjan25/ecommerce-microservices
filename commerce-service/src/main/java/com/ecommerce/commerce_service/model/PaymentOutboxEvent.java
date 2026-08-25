package com.ecommerce.commerce_service.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.GenericGenerator;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.Index;
import javax.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/** Durable, non-sensitive payment status message waiting for RabbitMQ delivery. */
@Entity(name = "payment_outbox_events")
@Table(indexes = @Index(name = "idx_payment_outbox_due", columnList = "next_attempt_at,created_at"))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentOutboxEvent {
    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    private UUID id;

    @Column(name = "order_id", nullable = false)
    private UUID orderId;
    @Column(name = "payment_status", nullable = false, length = 30)
    private String paymentStatus;
    @Column(name = "provider", nullable = false, length = 20)
    private String provider;
    @Column(name = "transaction_id")
    private String transactionId;
    @Column(name = "amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;
    @Column(name = "currency", nullable = false, length = 10)
    private String currency;
    @Column(name = "attempts", nullable = false)
    private Integer attempts;
    @Column(name = "next_attempt_at", nullable = false)
    private LocalDateTime nextAttemptAt;
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
