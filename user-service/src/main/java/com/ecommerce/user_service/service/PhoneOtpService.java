package com.ecommerce.user_service.service;

import com.ecommerce.user_service.model.PhoneOtp;
import com.ecommerce.user_service.model.User;
import com.ecommerce.user_service.model.UserPrincipal;
import com.ecommerce.user_service.repository.PhoneOtpRepository;
import com.ecommerce.user_service.repository.UserRepository;
import com.ecommerce.user_service.util.AuthenticationHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ecommerce.user_service.dto.PhoneOtpSentResponse;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.regex.Pattern;

/**
 * Passwordless sign-in: a 6-digit code is texted to the phone and exchanged
 * for the same token pair email/password sign-in returns. Codes are stored
 * hashed, expire in 5 minutes, allow 5 verification attempts, and only the
 * newest code per phone is valid.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PhoneOtpService {

    private static final Pattern E164 = Pattern.compile("^\\+[1-9]\\d{6,14}$");
    private static final int MAX_ATTEMPTS = 5;
    private static final int TTL_MINUTES = 5;

    /** Error code the frontend maps to "create your account" step. */
    public static final String NEW_NUMBER = "NO_ACCOUNT";

    private final PhoneOtpRepository otpRepository;
    private final UserRepository userRepository;
    private final UserService userService;
    private final AuthenticationHelper authenticationHelper;
    private final SecureRandom random = new SecureRandom();

    /**
     * When true (development/preview only) the OTP is echoed back in the
     * response because there is no live SMS provider to deliver it.
     */
    @Value("${sms.debug-code:true}")
    private boolean debugCodeEnabled;

    @Transactional
    public PhoneOtpSentResponse request(String phone) {
        String normalized = normalize(phone);
        if (!E164.matcher(normalized).matches()) {
            throw new IllegalArgumentException("Phone must include the country code, e.g. +919876543210");
        }

        String code = String.format("%06d", random.nextInt(1_000_000));
        PhoneOtp otp = otpRepository.findByPhoneNumber(normalized).orElseGet(PhoneOtp::new);
        otp.setPhoneNumber(normalized);
        otp.setCodeHash(hash(normalized, code));
        otp.setExpiresAt(LocalDateTime.now().plusMinutes(TTL_MINUTES));
        otp.setAttempts(0);
        otp.setConsumed(false);
        otpRepository.save(otp);

        sendSms(normalized, code);
        log.info("OTP issued for {}", masked(normalized));

        return PhoneOtpSentResponse.builder()
                .sent(true)
                .expiresInSeconds(TTL_MINUTES * 60L)
                .devCode(debugCodeEnabled ? code : null)
                .build();
    }

    @Transactional
    public com.ecommerce.user_service.dto.LoginResponse verify(String phone, String code) {
        String normalized = normalize(phone);
        if (!E164.matcher(normalized).matches()) {
            throw new IllegalArgumentException("Phone must include the country code, e.g. +919876543210");
        }
        if (code == null || !code.trim().matches("^\\d{6}$")) {
            throw new IllegalArgumentException("Enter the 6-digit code from the SMS");
        }

        PhoneOtp otp = otpRepository.findByPhoneNumber(normalized)
                .orElseThrow(() -> new IllegalArgumentException("Request a code first"));

        if (otp.isConsumed()) {
            throw new IllegalArgumentException("This code was already used — request a new one");
        }
        if (otp.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("This code has expired — request a new one");
        }
        if (otp.getAttempts() >= MAX_ATTEMPTS) {
            throw new IllegalArgumentException("Too many attempts — request a new code");
        }

        if (!hash(normalized, code.trim()).equals(otp.getCodeHash())) {
            otp.setAttempts(otp.getAttempts() + 1);
            otpRepository.save(otp);
            throw new IllegalArgumentException("Incorrect code — please try again");
        }

        User user = userRepository.findByPhoneNumber(normalized).orElse(null);

        if (user == null) {
            // Correct code, but the number has no account yet: flag the OTP as
            // verified so the sign-up step can complete with this same code.
            otp.setVerified(true);
            otpRepository.save(otp);
            throw new IllegalArgumentException(NEW_NUMBER);
        }
        if (!user.isActive()) {
            otp.setConsumed(true);
            otpRepository.save(otp);
            throw new IllegalArgumentException("Your account has been disabled. Please contact support");
        }

        otp.setConsumed(true);
        otpRepository.save(otp);

        log.info("Phone sign-in for {}", masked(normalized));
        return authenticationHelper.getLoginResponse(new UserPrincipal(user));
    }

    /**
     * Finish creating an account for a number whose code was verified but
     * which had no account. Re-checks the same code, so the client sends the
     * unchanged pair; email and password are optional (phone-only accounts).
     */
    @Transactional
    public com.ecommerce.user_service.dto.LoginResponse completeSignUp(
            com.ecommerce.user_service.dto.PhoneRegisterRequest request) {
        String normalized = normalize(request.getPhone());
        String code = request.getCode() == null ? "" : request.getCode().trim();

        if (userRepository.findByPhoneNumber(normalized).isPresent()) {
            throw new IllegalArgumentException("An account with this phone number already exists — sign in instead");
        }

        PhoneOtp otp = otpRepository.findByPhoneNumber(normalized)
                .orElseThrow(() -> new IllegalArgumentException("Request a code first"));

        if (otp.isConsumed()) {
            throw new IllegalArgumentException("This code was already used — request a new one");
        }
        if (otp.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("This code has expired — request a new one");
        }
        if (!otp.isVerified() || !hash(normalized, code).equals(otp.getCodeHash())) {
            throw new IllegalArgumentException("Verify the code sent to this phone before creating the account");
        }

        User user = userService.registerPhone(request);
        otp.setConsumed(true);
        otp.setVerified(false);
        otpRepository.save(otp);

        log.info("Phone sign-up for {}", masked(normalized));
        return authenticationHelper.getLoginResponse(new UserPrincipal(user));
    }

    /** Carrier delivery is provider-gated; log for now instead of pretending. */
    private void sendSms(String phone, String code) {
        log.info("SMS to {}: your Cartly verification code is {} (valid {} minutes)",
                masked(phone), code, TTL_MINUTES);
    }

    private String hash(String phone, String code) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] out = digest.digest((phone + ":" + code).getBytes(StandardCharsets.UTF_8));
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

    private String normalize(String phone) {
        String trimmed = phone == null ? "" : phone.trim();
        if (!trimmed.startsWith("+")) {
            trimmed = "+" + trimmed;
        }
        return trimmed;
    }

    private String masked(String phone) {
        return phone.length() <= 4 ? phone : "****" + phone.substring(phone.length() - 4);
    }

}
