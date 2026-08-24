package com.ecommerce.user_service.service;

import com.ecommerce.event_bus.dto.EmailRequest;
import com.ecommerce.user_service.model.EmailRetryEvent;
import com.ecommerce.user_service.model.EmailRetryStatus;
import com.ecommerce.user_service.repository.EmailRetryEventRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class EmailRetryOutboxServiceTest {
    private static final String KEY = Base64.getEncoder().encodeToString(new byte[32]);

    @Test
    void enqueueEncryptsSensitiveEmailEnvelope() {
        EmailRetryEventRepository repository = mock(EmailRetryEventRepository.class);
        EmailRetryOutboxService service = service(repository, mock(EmailService.class));
        EmailRequest request = new EmailRequest(
                "Reset link: https://store.example/reset?token=secret-token",
                "customer@example.com", "Reset your password");

        service.enqueue(request);

        var captured = org.mockito.ArgumentCaptor.forClass(EmailRetryEvent.class);
        verify(repository).save(captured.capture());
        EmailRetryEvent event = captured.getValue();
        assertThat(event.getEncryptedPayload()).doesNotContain("secret-token");
        assertThat(event.getEncryptedPayload()).doesNotContain("customer@example.com");
        assertThat(event.getInitializationVector()).isNotBlank();
        assertThat(event.getAttempts()).isEqualTo(0);
    }

    @Test
    void successfulRetryDecryptsAndDeletesEnvelope() {
        EmailRetryEventRepository repository = mock(EmailRetryEventRepository.class);
        EmailService emailService = mock(EmailService.class);
        EmailRetryOutboxService service = service(repository, emailService);
        EmailRequest request = new EmailRequest("Order confirmed", "customer@example.com", "Cartly order");
        service.enqueue(request);
        var captured = org.mockito.ArgumentCaptor.forClass(EmailRetryEvent.class);
        verify(repository).save(captured.capture());
        EmailRetryEvent event = captured.getValue();
        reset(repository);
        when(repository.findDue(eq(EmailRetryStatus.PENDING), any(LocalDateTime.class), any(Pageable.class))).thenReturn(List.of(event));

        service.deliverDueEmails();

        verify(emailService).sendEmail(argThat(delivered ->
                delivered != null
                        && delivered.getEmail().equals("customer@example.com")
                        && delivered.getText().equals("Order confirmed")));
        verify(repository).delete(event);
        verify(repository, never()).save(event);
    }

    @Test
    void failedRetryRemainsDurableWithBackoff() {
        EmailRetryEventRepository repository = mock(EmailRetryEventRepository.class);
        EmailService emailService = mock(EmailService.class);
        EmailRetryOutboxService service = service(repository, emailService);
        service.enqueue(new EmailRequest("Order confirmed", "customer@example.com", "Cartly order"));
        var captured = org.mockito.ArgumentCaptor.forClass(EmailRetryEvent.class);
        verify(repository).save(captured.capture());
        EmailRetryEvent event = captured.getValue();
        reset(repository);
        when(repository.findDue(eq(EmailRetryStatus.PENDING), any(LocalDateTime.class), any(Pageable.class))).thenReturn(List.of(event));
        doThrow(new RuntimeException("smtp unavailable")).when(emailService).sendEmail(any());
        LocalDateTime before = LocalDateTime.now();

        service.deliverDueEmails();

        verify(repository, never()).delete(event);
        verify(repository).save(event);
        assertThat(event.getAttempts()).isEqualTo(1);
        assertThat(event.getLastAttemptAt()).isNotNull();
        assertThat(event.getNextAttemptAt()).isAfter(before);
    }

    @Test
    void maxAttemptsMovesRetryToDeadForManualReview() {
        EmailRetryEventRepository repository = mock(EmailRetryEventRepository.class);
        EmailService emailService = mock(EmailService.class);
        EmailRetryOutboxService service = service(repository, emailService);
        service.enqueue(new EmailRequest("Order confirmed", "customer@example.com", "Cartly order"));
        var captured = org.mockito.ArgumentCaptor.forClass(EmailRetryEvent.class);
        verify(repository).save(captured.capture());
        EmailRetryEvent event = captured.getValue();
        event.setAttempts(19);
        reset(repository);
        when(repository.findDue(eq(EmailRetryStatus.PENDING), any(LocalDateTime.class), any(Pageable.class)))
                .thenReturn(List.of(event));
        doThrow(new RuntimeException("smtp unavailable")).when(emailService).sendEmail(any());

        service.deliverDueEmails();

        assertThat(event.getAttempts()).isEqualTo(20);
        assertThat(event.getStatus()).isEqualTo(EmailRetryStatus.DEAD);
        verify(repository).save(event);
        verify(repository, never()).delete(event);
    }

    @Test
    void purgesOnlyDeadRetryMetadataAfterRetentionWindow() {
        EmailRetryEventRepository repository = mock(EmailRetryEventRepository.class);
        EmailRetryOutboxService service = service(repository, mock(EmailService.class));
        when(repository.deleteDeadBefore(eq(EmailRetryStatus.DEAD), any(LocalDateTime.class))).thenReturn(3);

        service.purgeDeadEmails();

        verify(repository).deleteDeadBefore(eq(EmailRetryStatus.DEAD), any(LocalDateTime.class));
    }

    @Test
    void missingEncryptionKeyFailsBeforeAcknowledgementCanPersistRetry() {
        EmailRetryEventRepository repository = mock(EmailRetryEventRepository.class);
        EmailRetryOutboxService service = new EmailRetryOutboxService(
                repository, new ObjectMapper(), mock(EmailService.class));
        ReflectionTestUtils.setField(service, "encodedEncryptionKey", "");

        assertThatThrownBy(() -> service.enqueue(new EmailRequest(
                "body", "customer@example.com", "subject")))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("EMAIL_OUTBOX_ENCRYPTION_KEY");
        verify(repository, never()).save(any());
    }

    private EmailRetryOutboxService service(EmailRetryEventRepository repository, EmailService emailService) {
        EmailRetryOutboxService service = new EmailRetryOutboxService(repository, new ObjectMapper(), emailService);
        ReflectionTestUtils.setField(service, "encodedEncryptionKey", KEY);
        ReflectionTestUtils.setField(service, "batchSize", 50);
        return service;
    }
}
