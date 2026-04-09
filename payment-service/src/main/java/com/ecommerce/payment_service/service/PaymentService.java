package com.ecommerce.payment_service.service;

import com.ecommerce.event_bus.RabbitMQMessageProducer;
import com.ecommerce.payment_service.dto.PaymentRequest;
import com.ecommerce.payment_service.dto.PaymentResponse;
import com.ecommerce.payment_service.dto.PaymentStatusEvent;
import com.ecommerce.payment_service.entity.Payment;
import com.ecommerce.payment_service.model.PaymentProvider;
import com.ecommerce.payment_service.model.PaymentStatus;
import com.ecommerce.payment_service.repository.PaymentRepository;
import com.ecommerce.payment_service.service.provider.PaymentProviderClient;
import com.ecommerce.payment_service.service.provider.ProviderPaymentResult;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final RabbitMQMessageProducer rabbitMQMessageProducer;
    private final List<PaymentProviderClient> providerClients;

    @Value("${rabbitmq.exchanges.internal}")
    private String exchange;

    @Value("${rabbitmq.routing-keys.payment-status}")
    private String paymentStatusRoutingKey;

    @Transactional
    public PaymentResponse processPayment(PaymentRequest request) {
        Map<PaymentProvider, PaymentProviderClient> providers = providerClients.stream()
                .collect(Collectors.toMap(PaymentProviderClient::provider, Function.identity()));
        PaymentProviderClient paymentProviderClient = providers.get(request.getProvider());
        if (paymentProviderClient == null) {
            throw new IllegalArgumentException("Unsupported payment provider: " + request.getProvider());
        }

        Payment payment = Payment.builder()
                .orderId(request.getOrderId())
                .amount(request.getAmount())
                .currency(request.getCurrency())
                .provider(request.getProvider())
                .status(PaymentStatus.FAILED.name())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        ProviderPaymentResult result = paymentProviderClient.charge(payment);
        payment.setStatus(result.isSuccess() ? PaymentStatus.SUCCESS.name() : PaymentStatus.FAILED.name());
        payment.setTransactionId(result.getTransactionId());
        payment.setFailureReason(result.isSuccess() ? null : result.getMessage());
        payment.setUpdatedAt(LocalDateTime.now());
        Payment savedPayment = paymentRepository.save(payment);

        rabbitMQMessageProducer.publish(
                PaymentStatusEvent.builder()
                        .orderId(savedPayment.getOrderId())
                        .status(savedPayment.getStatus())
                        .provider(savedPayment.getProvider().name())
                        .transactionId(savedPayment.getTransactionId())
                        .amount(savedPayment.getAmount())
                        .currency(savedPayment.getCurrency())
                        .build(),
                exchange,
                paymentStatusRoutingKey
        );

        return PaymentResponse.builder()
                .orderId(savedPayment.getOrderId())
                .amount(savedPayment.getAmount())
                .currency(savedPayment.getCurrency())
                .provider(savedPayment.getProvider().name())
                .status(savedPayment.getStatus())
                .transactionId(savedPayment.getTransactionId())
                .message(result.getMessage())
                .build();
    }
}
