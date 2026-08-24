package com.ecommerce.commerce_service.service;

import com.ecommerce.commerce_service.dto.payment.PaymentStatusEvent;
import com.ecommerce.commerce_service.model.PaymentOutboxEvent;
import com.ecommerce.commerce_service.repository.PaymentOutboxRepository;
import com.ecommerce.event_bus.RabbitMQMessageProducer;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class PaymentOutboxPublisherTest {
    @Test
    void deletesEventOnlyAfterSuccessfulPublish() {
        PaymentOutboxRepository repository = mock(PaymentOutboxRepository.class);
        RabbitMQMessageProducer producer = mock(RabbitMQMessageProducer.class);
        PaymentOutboxPublisher publisher = publisher(repository, producer);
        PaymentOutboxEvent event = event();
        when(repository.findTop50ByNextAttemptAtLessThanEqualOrderByCreatedAtAsc(any()))
                .thenReturn(List.of(event));

        publisher.publishDueEvents();

        verify(producer).publish(argThat(payload -> payload instanceof PaymentStatusEvent
                        && ((PaymentStatusEvent) payload).getOrderId().equals(event.getOrderId())),
                eq("order.exchange"), eq("payment.status.updated"));
        verify(repository).delete(event);
        verify(repository, never()).save(event);
    }

    @Test
    void failedPublishRetainsEventWithBackoff() {
        PaymentOutboxRepository repository = mock(PaymentOutboxRepository.class);
        RabbitMQMessageProducer producer = mock(RabbitMQMessageProducer.class);
        PaymentOutboxPublisher publisher = publisher(repository, producer);
        PaymentOutboxEvent event = event();
        LocalDateTime before = LocalDateTime.now();
        when(repository.findTop50ByNextAttemptAtLessThanEqualOrderByCreatedAtAsc(any()))
                .thenReturn(List.of(event));
        doThrow(new RuntimeException("broker unavailable")).when(producer)
                .publish(any(), anyString(), anyString());

        publisher.publishDueEvents();

        verify(repository, never()).delete(event);
        verify(repository).save(event);
        assertThat(event.getAttempts()).isEqualTo(1);
        assertThat(event.getNextAttemptAt()).isAfter(before);
    }

    private PaymentOutboxPublisher publisher(PaymentOutboxRepository repository,
                                             RabbitMQMessageProducer producer) {
        PaymentOutboxPublisher publisher = new PaymentOutboxPublisher(repository, producer);
        ReflectionTestUtils.setField(publisher, "exchange", "order.exchange");
        ReflectionTestUtils.setField(publisher, "routingKey", "payment.status.updated");
        return publisher;
    }

    private PaymentOutboxEvent event() {
        LocalDateTime now = LocalDateTime.now();
        return PaymentOutboxEvent.builder().id(UUID.randomUUID()).orderId(UUID.randomUUID())
                .paymentStatus("SUCCESS").provider("STRIPE").transactionId("pi_1")
                .amount(new BigDecimal("100.00")).currency("INR")
                .attempts(0).nextAttemptAt(now).createdAt(now).build();
    }
}
