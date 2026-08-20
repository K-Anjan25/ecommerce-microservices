package com.ecommerce.commerce_service.service;

import com.ecommerce.commerce_service.dto.payment.PaymentRequest;
import com.ecommerce.commerce_service.dto.payment.PaymentResponse;
import com.ecommerce.commerce_service.dto.payment.PaymentStatusEvent;
import com.ecommerce.commerce_service.exception.DuplicatePaymentException;
import com.ecommerce.commerce_service.model.Order;
import com.ecommerce.commerce_service.model.Payment;
import com.ecommerce.commerce_service.model.PaymentProvider;
import com.ecommerce.commerce_service.model.PaymentStatus;
import com.ecommerce.commerce_service.repository.OrderRepository;
import com.ecommerce.commerce_service.repository.PaymentRepository;
import com.ecommerce.commerce_service.service.provider.PaymentProviderClient;
import com.ecommerce.commerce_service.service.provider.ProviderPaymentResult;
import com.ecommerce.event_bus.RabbitMQMessageProducer;
import com.ecommerce.event_bus.dto.EmailRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final RabbitMQMessageProducer rabbitMQMessageProducer;
    private final List<PaymentProviderClient> providerClients;

    @Value("${rabbitmq.exchanges.internal}")
    private String exchange;

    @Value("${rabbitmq.routing-keys.payment-status}")
    private String paymentStatusRoutingKey;

    @Value("${rabbitmq.exchanges.notification}")
    private String notificationExchange;

    @Value("${rabbitmq.routing-keys.send-email}")
    private String sendEmailRoutingKey;

    @Transactional
    public PaymentResponse processPayment(PaymentRequest request, UUID userId) {
        log.info("Processing payment for order {} by user {}", request.getOrderId(), userId);

        paymentRepository.findByOrderId(request.getOrderId()).ifPresent(existing -> {
            throw new DuplicatePaymentException("Payment already processed for order " + request.getOrderId());
        });

        Map<PaymentProvider, PaymentProviderClient> providers = providerClients.stream()
                .collect(Collectors.toMap(PaymentProviderClient::provider, Function.identity()));
        PaymentProviderClient paymentProviderClient = providers.get(request.getProvider());

        if (paymentProviderClient == null) {
            log.error("Unsupported payment provider: {}", request.getProvider());
            throw new IllegalArgumentException("Unsupported payment provider: " + request.getProvider());
        }

        Payment payment = Payment.builder()
                .orderId(request.getOrderId())
                .userId(userId)
                .amount(request.getAmount())
                .currency(request.getCurrency())
                .provider(request.getProvider())
                .status(PaymentStatus.FAILED.name())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        ProviderPaymentResult result = paymentProviderClient.charge(payment);

        String resolvedStatus;
        if (result.isSuccess()) {
            resolvedStatus = request.getProvider() == PaymentProvider.CASH
                    ? PaymentStatus.PENDING.name()
                    : PaymentStatus.SUCCESS.name();
        } else {
            resolvedStatus = PaymentStatus.FAILED.name();
        }
        payment.setStatus(resolvedStatus);
        payment.setTransactionId(result.getTransactionId());
        payment.setFailureReason(result.isSuccess() ? null : result.getMessage());
        payment.setUpdatedAt(LocalDateTime.now());
        Payment savedPayment = paymentRepository.save(payment);

        log.info("Payment {} saved with status {}", savedPayment.getId(), savedPayment.getStatus());

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

        sendPaymentEmail(savedPayment);

        log.info("Payment status event published for order {}", savedPayment.getOrderId());

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

    private void sendPaymentEmail(Payment payment) {
        String customerEmail = orderRepository.findById(payment.getOrderId())
                .map(Order::getCustomerEmail)
                .orElse(null);
        if (customerEmail == null || customerEmail.isBlank()) {
            return;
        }
        boolean success = PaymentStatus.SUCCESS.name().equalsIgnoreCase(payment.getStatus());
        String subject = success ? "CARTLY - Payment successful" : "CARTLY - Payment failed";
        String text = success
                ? "Your payment for order " + payment.getOrderId() + " was successful.\nAmount: " + payment.getAmount() + " " + payment.getCurrency() + "\nTransaction id: " + payment.getTransactionId()
                : "Your payment for order " + payment.getOrderId() + " failed.\nReason: " + payment.getFailureReason();
        rabbitMQMessageProducer.publish(new EmailRequest(text, customerEmail, subject), notificationExchange, sendEmailRoutingKey);
    }
}