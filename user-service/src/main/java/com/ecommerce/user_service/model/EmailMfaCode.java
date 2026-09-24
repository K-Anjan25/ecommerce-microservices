package com.ecommerce.user_service.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.GenericGenerator;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.Table;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Second-factor code e-mailed during sign-in for accounts with MFA enabled.
 * Same lifecycle rules as phone OTP: hashed, 5-minute TTL, 5 attempts, and
 * only the newest code per email is valid.
 */
@Entity(name = "email_mfa_code")
@Table
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailMfaCode {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    private UUID id;

    private String email;

    private String codeHash;

    private LocalDateTime expiresAt;

    private int attempts;

    private boolean consumed;
}
