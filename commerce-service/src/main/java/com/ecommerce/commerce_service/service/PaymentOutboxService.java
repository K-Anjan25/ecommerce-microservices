package com.ecommerce.commerce_service.service;

import com.ecommerce.commerce_service.dto.payment.PaymentStatusEvent;
import com.ecommerce.commerce_service.model.PaymentOutboxEvent;
import com.ecommerce.commerce_service.repository.PaymentOutboxRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class PaymentOutboxService {
    private final PaymentOutboxRepository repository;

    /** Called inside the payment transaction so state and event commit atomically. */
    public void enqueue(PaymentStatusEvent event) {
        LocalDateTime now = LocalDateTime.now();
        repository.save(PaymentOutboxEvent.builder()
                .orderId(event.getOrderId())
                .paymentStatus(event.getStatus())
                .provider(event.getProvider())
                .transactionId(event.getTransactionId())
                .amount(event.getAmount())
                .currency(event.getCurrency())
                .attempts(0)
                .nextAttemptAt(now)
                .createdAt(now)
                .build());
    }
}
