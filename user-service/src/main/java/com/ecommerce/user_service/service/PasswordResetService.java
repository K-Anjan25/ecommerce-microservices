package com.ecommerce.user_service.service;

import com.ecommerce.event_bus.dto.EmailRequest;
import com.ecommerce.event_bus.RabbitMQMessageProducer;
import com.ecommerce.user_service.exception.TokenNotValidException;
import com.ecommerce.user_service.model.PasswordResetToken;
import com.ecommerce.user_service.model.User;
import com.ecommerce.user_service.repository.PasswordResetTokenRepository;
import com.ecommerce.user_service.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;

@Service
@RequiredArgsConstructor
public class PasswordResetService {
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int TOKEN_BYTES = 32;
    private static final int EXPIRY_MINUTES = 30;

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final RabbitMQMessageProducer messageProducer;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    @Transactional
    public void request(String email) {
        // Missing accounts intentionally do nothing; the controller always returns the same response.
        userRepository.findUserByEmail(email).ifPresent(this::issueToken);
    }

    private void issueToken(User user) {
        tokenRepository.deleteByUserId(user.getId());
        byte[] bytes = new byte[TOKEN_BYTES];
        RANDOM.nextBytes(bytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        tokenRepository.save(PasswordResetToken.builder()
                .userId(user.getId())
                .tokenHash(hash(rawToken))
                .expiresAt(LocalDateTime.now().plusMinutes(EXPIRY_MINUTES))
                .build());

        String link = frontendUrl.replaceAll("/$", "") + "/reset-password?token=" + rawToken;
        String text = "Hello " + user.getFirstName() + ",\n\nUse this one-time link to choose a new Cartly password:\n"
                + link + "\n\nThe link expires in 30 minutes. If you did not request it, ignore this email.";
        messageProducer.publish(new EmailRequest(text, user.getEmail(), "Reset your Cartly password"),
                "notification.exchange", "send.email.routing-key");
    }

    @Transactional
    public void confirm(String rawToken, String newPassword) {
        PasswordResetToken token = tokenRepository.findByTokenHash(hash(rawToken))
                .orElseThrow(() -> new TokenNotValidException("This reset link is invalid or expired"));
        if (token.getUsedAt() != null || token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new TokenNotValidException("This reset link is invalid or expired");
        }
        User user = userRepository.findById(token.getUserId())
                .orElseThrow(() -> new TokenNotValidException("This reset link is invalid or expired"));
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        token.setUsedAt(LocalDateTime.now());
        tokenRepository.save(token);
    }

    private String hash(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder result = new StringBuilder(digest.length * 2);
            for (byte item : digest) result.append(String.format("%02x", item));
            return result.toString();
        } catch (NoSuchAlgorithmException impossible) {
            throw new IllegalStateException("SHA-256 is unavailable", impossible);
        }
    }
}
