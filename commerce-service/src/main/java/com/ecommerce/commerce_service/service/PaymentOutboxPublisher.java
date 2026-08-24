package com.ecommerce.commerce_service.service;

import com.ecommerce.commerce_service.dto.payment.PaymentStatusEvent;
import com.ecommerce.commerce_service.model.PaymentOutboxEvent;
import com.ecommerce.commerce_service.repository.PaymentOutboxRepository;
import com.ecommerce.event_bus.RabbitMQMessageProducer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentOutboxPublisher {
    private final PaymentOutboxRepository repository;
    private final RabbitMQMessageProducer producer;

    @Value("${rabbitmq.exchanges.internal}")
    private String exchange;
    @Value("${rabbitmq.routing-keys.payment-status}")
    private String routingKey;

    @Scheduled(fixedDelayString = "${payment.outbox.publish-delay-ms:5000}")
    @Transactional
    public void publishDueEvents() {
        for (PaymentOutboxEvent outbox : repository
                .findTop50ByNextAttemptAtLessThanEqualOrderByCreatedAtAsc(LocalDateTime.now())) {
            try {
                producer.publish(toEvent(outbox), exchange, routingKey);
                repository.delete(outbox);
            } catch (RuntimeException failure) {
                int attempts = outbox.getAttempts() == null ? 1 : outbox.getAttempts() + 1;
                long delaySeconds = Math.min(3600L, 1L << Math.min(attempts, 11));
                outbox.setAttempts(attempts);
                outbox.setNextAttemptAt(LocalDateTime.now().plusSeconds(delaySeconds));
                repository.save(outbox);
                log.error("Payment outbox event {} delivery failed on attempt {}; retry scheduled",
                        outbox.getId(), attempts, failure);
            }
        }
    }

    private PaymentStatusEvent toEvent(PaymentOutboxEvent outbox) {
        return PaymentStatusEvent.builder()
                .orderId(outbox.getOrderId())
                .status(outbox.getPaymentStatus())
                .provider(outbox.getProvider())
                .transactionId(outbox.getTransactionId())
                .amount(outbox.getAmount())
                .currency(outbox.getCurrency())
                .build();
    }
}
