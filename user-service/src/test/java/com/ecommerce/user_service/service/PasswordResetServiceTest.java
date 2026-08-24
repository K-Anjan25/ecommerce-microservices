package com.ecommerce.user_service.service;

import com.ecommerce.event_bus.RabbitMQMessageProducer;
import com.ecommerce.event_bus.dto.EmailRequest;
import com.ecommerce.user_service.model.PasswordResetToken;
import com.ecommerce.user_service.model.User;
import com.ecommerce.user_service.repository.PasswordResetTokenRepository;
import com.ecommerce.user_service.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PasswordResetServiceTest {
    @Mock UserRepository userRepository;
    @Mock PasswordResetTokenRepository tokenRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock RabbitMQMessageProducer producer;

    @Test
    void tokenIsHashedSingleUseAndChangesPassword() {
        UUID userId = UUID.randomUUID();
        User user = new User();
        user.setId(userId);
        user.setEmail("shopper@example.com");
        user.setFirstName("Shopper");
        when(userRepository.findUserByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(tokenRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        PasswordResetService service = new PasswordResetService(userRepository, tokenRepository, passwordEncoder, producer);
        ReflectionTestUtils.setField(service, "frontendUrl", "https://cartly.example");

        service.request(user.getEmail());

        ArgumentCaptor<PasswordResetToken> tokenCapture = ArgumentCaptor.forClass(PasswordResetToken.class);
        verify(tokenRepository).save(tokenCapture.capture());
        PasswordResetToken stored = tokenCapture.getValue();
        assertThat(stored.getTokenHash()).hasSize(64).doesNotContain("=");
        ArgumentCaptor<EmailRequest> emailCapture = ArgumentCaptor.forClass(EmailRequest.class);
        verify(producer).publish(emailCapture.capture(), eq("notification.exchange"), eq("send.email.routing-key"));
        String rawToken = emailCapture.getValue().getText().split("token=")[1].split("\\n")[0];
        assertThat(stored.getTokenHash()).doesNotContain(rawToken);

        when(tokenRepository.findByTokenHash(stored.getTokenHash())).thenReturn(Optional.of(stored));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(passwordEncoder.encode("new-password")).thenReturn("encoded-password");

        service.confirm(rawToken, "new-password");

        assertThat(user.getPassword()).isEqualTo("encoded-password");
        assertThat(user.getTokenVersion()).isEqualTo(1);
        assertThat(stored.getUsedAt()).isNotNull();
        verify(userRepository).save(user);
    }

    @Test
    void missingEmailDoesNotRevealAccountExistenceOrSendMail() {
        when(userRepository.findUserByEmail("missing@example.com")).thenReturn(Optional.empty());
        PasswordResetService service = new PasswordResetService(userRepository, tokenRepository, passwordEncoder, producer);

        service.request("missing@example.com");

        verifyNoInteractions(tokenRepository, producer, passwordEncoder);
    }
}
