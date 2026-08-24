package com.ecommerce.user_service.service;

import com.ecommerce.event_bus.dto.EmailRequest;
import com.ecommerce.user_service.model.EmailRetryEvent;
import com.ecommerce.user_service.repository.EmailRetryEventRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;

/**
 * Durable, encrypted retry boundary for SMTP failures. RabbitMQ remains the
 * first delivery transport; this outbox is written before the listener
 * acknowledges a failed message so a temporary mail outage does not lose it.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailRetryOutboxService {
    private static final String CIPHER = "AES/GCM/NoPadding";
    private static final int KEY_BYTES = 32;
    private static final int IV_BYTES = 12;
    private static final int TAG_BITS = 128;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final EmailRetryEventRepository repository;
    private final ObjectMapper objectMapper;
    private final EmailService emailService;

    @Value("${email.outbox.encryption-key:}")
    private String encodedEncryptionKey;

    @Value("${email.outbox.batch-size:50}")
    private int batchSize = 50;

    /** The outbox is intentionally slower than RabbitMQ consumption to avoid SMTP pressure. */
    @Scheduled(fixedDelayString = "${email.outbox.publish-delay-ms:30000}")
    @Transactional
    public void deliverDueEmails() {
        int safeBatchSize = Math.max(1, Math.min(batchSize, 200));
        List<EmailRetryEvent> due = repository.findByNextAttemptAtLessThanEqualOrderByCreatedAtAsc(
                LocalDateTime.now(), PageRequest.of(0, safeBatchSize));
        for (EmailRetryEvent event : due) {
            try {
                emailService.sendEmail(decrypt(event));
                repository.delete(event);
            } catch (RuntimeException failure) {
                reschedule(event);
                log.error("Email retry event {} failed on attempt {}; retry scheduled",
                        event.getId(), event.getAttempts(), failure);
            }
        }
    }

    /**
     * Encrypts the complete email envelope before writing it to PostgreSQL.
     * The raw request remains only in the failed listener invocation.
     */
    @Transactional
    public void enqueue(EmailRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Email request is required");
        }
        byte[] iv = new byte[IV_BYTES];
        RANDOM.nextBytes(iv);
        try {
            String json = objectMapper.writeValueAsString(request);
            LocalDateTime now = LocalDateTime.now();
            repository.save(EmailRetryEvent.builder()
                    .encryptedPayload(Base64.getEncoder().encodeToString(encrypt(json, iv)))
                    .initializationVector(Base64.getEncoder().encodeToString(iv))
                    .attempts(0)
                    .nextAttemptAt(now)
                    .createdAt(now)
                    .build());
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Could not serialize email retry envelope", exception);
        }
    }

    private EmailRequest decrypt(EmailRetryEvent event) {
        try {
            byte[] iv = Base64.getDecoder().decode(event.getInitializationVector());
            String json = new String(decrypt(
                    Base64.getDecoder().decode(event.getEncryptedPayload()), iv), StandardCharsets.UTF_8);
            return objectMapper.readValue(json, EmailRequest.class);
        } catch (Exception exception) {
            throw new IllegalStateException("Could not decrypt email retry envelope", exception);
        }
    }

    private byte[] encrypt(String plaintext, byte[] iv) {
        try {
            Cipher cipher = Cipher.getInstance(CIPHER);
            cipher.init(Cipher.ENCRYPT_MODE, key(), new GCMParameterSpec(TAG_BITS, iv));
            return cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));
        } catch (IllegalStateException exception) {
            // Preserve configuration errors so the listener can fail closed
            // and RabbitMQ can redeliver rather than acknowledge a lost email.
            throw exception;
        } catch (Exception exception) {
            throw new IllegalStateException("Could not encrypt email retry envelope", exception);
        }
    }

    private byte[] decrypt(byte[] ciphertext, byte[] iv) {
        try {
            Cipher cipher = Cipher.getInstance(CIPHER);
            cipher.init(Cipher.DECRYPT_MODE, key(), new GCMParameterSpec(TAG_BITS, iv));
            return cipher.doFinal(ciphertext);
        } catch (IllegalStateException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new IllegalStateException("Could not decrypt email retry envelope", exception);
        }
    }

    private SecretKeySpec key() {
        if (encodedEncryptionKey == null || encodedEncryptionKey.isBlank()) {
            throw new IllegalStateException("EMAIL_OUTBOX_ENCRYPTION_KEY is not configured");
        }
        try {
            byte[] decoded = Base64.getDecoder().decode(encodedEncryptionKey);
            if (decoded.length != KEY_BYTES) {
                throw new IllegalStateException("EMAIL_OUTBOX_ENCRYPTION_KEY must decode to 32 bytes");
            }
            return new SecretKeySpec(decoded, "AES");
        } catch (IllegalArgumentException exception) {
            throw new IllegalStateException("EMAIL_OUTBOX_ENCRYPTION_KEY must be base64", exception);
        }
    }

    private void reschedule(EmailRetryEvent event) {
        int attempts = event.getAttempts() == null ? 1 : event.getAttempts() + 1;
        long delaySeconds = Math.min(3600L, 1L << Math.min(attempts, 11));
        event.setAttempts(attempts);
        event.setLastAttemptAt(LocalDateTime.now());
        event.setNextAttemptAt(LocalDateTime.now().plusSeconds(delaySeconds));
        repository.save(event);
    }
}
