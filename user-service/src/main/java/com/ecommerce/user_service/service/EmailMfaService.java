package com.ecommerce.user_service.service;

import com.ecommerce.event_bus.dto.EmailRequest;
import com.ecommerce.user_service.dto.LoginResponse;
import com.ecommerce.user_service.model.EmailMfaCode;
import com.ecommerce.user_service.model.User;
import com.ecommerce.user_service.model.UserPrincipal;
import com.ecommerce.user_service.repository.EmailMfaRepository;
import com.ecommerce.user_service.repository.UserRepository;
import com.ecommerce.user_service.util.AuthenticationHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * E-mail second factor (MFA step-up) for password sign-in. Passwords are
 * checked first by the normal flow; only then is a 6-digit code e-mailed.
 * Codes are stored hashed, expire in 5 minutes, allow 5 attempts, and only
 * the newest code per email is valid.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailMfaService {

    private static final int MAX_ATTEMPTS = 5;
    private static final int TTL_MINUTES = 5;

    private final EmailMfaRepository mfaRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final AuthenticationHelper authenticationHelper;
    private final SecureRandom random = new SecureRandom();

    /**
     * When true (development/preview only) the code is echoed back in the
     * response because there is no live SMTP provider in those environments.
     */
    @Value("${mfa.debug-code:true}")
    private boolean debugCodeEnabled;

    /** Issue (or re-issue) the MFA code for a fully authenticated login. */
    @Transactional
    public String issueCode(String email) {
        String normalized = email.trim().toLowerCase();
        String code = String.format("%06d", random.nextInt(1_000_000));
        EmailMfaCode mfa = mfaRepository.findByEmail(normalized).orElseGet(EmailMfaCode::new);
        mfa.setEmail(normalized);
        mfa.setCodeHash(hash(normalized, code));
        mfa.setExpiresAt(LocalDateTime.now().plusMinutes(TTL_MINUTES));
        mfa.setAttempts(0);
        mfa.setConsumed(false);
        mfaRepository.save(mfa);

        try {
            emailService.sendEmail(new EmailRequest(
                    "Your Cartly verification code is " + code
                            + ". It expires in " + TTL_MINUTES + " minutes."
                            + " If you didn't try to sign in, change your password immediately.",
                    normalized,
                    "Your Cartly sign-in code"));
        } catch (Exception e) {
            log.error("MFA email could not be delivered to {}: {}", normalized, e.getMessage());
        }
        log.info("MFA code issued for {}", normalized);
        return debugCodeEnabled ? code : null;
    }

    /** Exchange a valid code for the same token pair password login returns. */
    @Transactional
    public LoginResponse verify(String email, String code) {
        String normalized = email.trim().toLowerCase();
        EmailMfaCode mfa = mfaRepository.findByEmail(normalized)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "No verification code was issued for this email"));

        if (mfa.isConsumed()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This code was already used");
        }
        if (mfa.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "This code has expired — request a new one");
        }
        if (mfa.getAttempts() >= MAX_ATTEMPTS) {
            mfa.setConsumed(true);
            mfaRepository.save(mfa);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Too many attempts — request a new code");
        }
        if (!hash(normalized, code.trim()).equals(mfa.getCodeHash())) {
            mfa.setAttempts(mfa.getAttempts() + 1);
            mfaRepository.save(mfa);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Incorrect verification code");
        }

        mfa.setConsumed(true);
        mfaRepository.save(mfa);

        User user = userRepository.findUserByEmail(normalized)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Account could not be found"));
        return authenticationHelper.getLoginResponse(new UserPrincipal(user));
    }

    /** Enable/disable MFA for the signed-in account. */
    @Transactional
    public boolean setMfaEnabled(UUID userId, boolean enabled) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Account not found"));
        user.setMfaEnabled(enabled);
        userRepository.save(user);
        try {
            emailService.sendEmail(new EmailRequest(
                    enabled
                            ? "Two-step verification is now ON for your Cartly account. "
                              + "Sign-in will now ask for an e-mailed code after your password."
                            : "Two-step verification is now OFF for your Cartly account.",
                    user.getEmail(),
                    enabled ? "Two-step verification enabled" : "Two-step verification disabled"));
        } catch (Exception e) {
            log.error("MFA toggle email failed for {}: {}", user.getEmail(), e.getMessage());
        }
        return enabled;
    }

    private String hash(String email, String code) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] out = digest.digest((email + ":" + code).getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(out.length * 2);
            for (byte b : out) {
                hex.append(Character.forDigit((b >> 4) & 0xF, 16));
                hex.append(Character.forDigit(b & 0xF, 16));
            }
            return hex.toString();
        } catch (Exception e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }
}
