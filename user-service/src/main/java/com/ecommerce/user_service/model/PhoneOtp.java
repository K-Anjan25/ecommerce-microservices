package com.ecommerce.user_service.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.GenericGenerator;

import javax.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * One-time code for phone sign-in. Only the hash is stored; the latest code
 * per phone replaces the previous one and codes expire quickly.
 */
@Entity(name = "phone_otp")
@Table
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PhoneOtp {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    private UUID id;

    /** E.164 phone, e.g. +919876543210 (one active row per phone). */
    @Column(name = "phone_number", nullable = false, unique = true, length = 20)
    private String phoneNumber;

    /** SHA-256(phone + ":" + code) — the plaintext code is never stored. */
    @Column(nullable = false, length = 64)
    private String codeHash;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    @Column(nullable = false)
    private int attempts;

    @Column(nullable = false)
    private boolean consumed;

    /** True once the code was proven correct and no account exists yet —
     *  the number is cleared to complete sign-up (register endpoint). */
    @Column(nullable = false)
    private boolean verified;
}
