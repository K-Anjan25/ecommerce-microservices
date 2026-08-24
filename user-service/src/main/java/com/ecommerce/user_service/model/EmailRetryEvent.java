package com.ecommerce.user_service.model;

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
import javax.persistence.Lob;
import javax.persistence.Table;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Encrypted retry envelope for a failed email delivery. Email bodies,
 * recipient addresses and invoice bytes are never stored as plaintext.
 */
@Entity(name = "email_retry_events")
@Table(indexes = @Index(name = "idx_email_retry_due", columnList = "next_attempt_at,created_at"))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailRetryEvent {
    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    private UUID id;

    @Lob
    @Column(nullable = false, columnDefinition = "TEXT")
    private String encryptedPayload;

    @Column(nullable = false, length = 24)
    private String initializationVector;

    @Column(nullable = false)
    private Integer attempts;

    @Column(name = "next_attempt_at", nullable = false)
    private LocalDateTime nextAttemptAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime lastAttemptAt;
}
