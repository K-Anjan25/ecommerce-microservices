package com.ecommerce.user_service.model;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;
import javax.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "password_reset_tokens", indexes = @Index(name = "idx_password_reset_hash", columnList = "tokenHash", unique = true))
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class PasswordResetToken {
    @Id @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    private UUID id;
    @Column(nullable = false) private UUID userId;
    @Column(nullable = false, length = 64) private String tokenHash;
    @Column(nullable = false) private LocalDateTime expiresAt;
    private LocalDateTime usedAt;
}
