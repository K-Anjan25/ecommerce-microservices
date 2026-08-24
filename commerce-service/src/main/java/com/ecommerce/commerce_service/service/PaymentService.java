package com.ecommerce.commerce_service.service;

import com.ecommerce.commerce_service.dto.payment.PaymentRequest;
import com.ecommerce.commerce_service.dto.payment.PaymentResponse;
import com.ecommerce.commerce_service.dto.payment.PaymentStatusEvent;
import com.ecommerce.commerce_service.exception.DuplicatePaymentException;
import com.ecommerce.commerce_service.model.Order;
import com.ecommerce.commerce_service.model.OrderStatus;
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
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.math.BigDecimal;
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

    /**
     * Payments for guest checkouts are attributed to this pseudo-user
     * (payment.user_id is NOT NULL; guest payments carry no real user id).
     */
    private static final UUID GUEST_USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000000");

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final RabbitMQMessageProducer rabbitMQMessageProducer;
    private final List<PaymentProviderClient> providerClients;
    private final InvoiceService invoiceService;
    private final CheckoutTokenService checkoutTokenService;
    private final LoyaltyPointService loyaltyPointService;
    private final OrderService orderService;
    private final PaymentOutboxService paymentOutboxService;

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

        // Serialize payment initiation on the order before checking the unique
        // payment row. Two concurrent requests can no longer both reach the
        // provider while the payment table is still empty.
        Order order = orderRepository.findLockedById(request.getOrderId());
        if (order == null) {
            throw new IllegalArgumentException("Order not found: " + request.getOrderId());
        }
        paymentRepository.findByOrderId(request.getOrderId()).ifPresent(existing -> {
            throw new DuplicatePaymentException("Payment already processed for order " + request.getOrderId());
        });
        if (order.getOrderStatus() != OrderStatus.PENDING) {
            throw new IllegalArgumentException("Order is not awaiting payment");
        }
        if (order.getCustomerId() != null) {
            if (userId == null || !order.getCustomerId().equals(userId)) {
                throw new SecurityException("Payment does not belong to this customer");
            }
        } else if (!checkoutTokenService.matches(request.getCheckoutToken(), order.getCheckoutTokenHash(),
                order.getCheckoutTokenExpiresAt())) {
            throw new SecurityException("Guest checkout token is invalid");
        }

        BigDecimal authoritativeAmount = order.getTotalAmount();
        String authoritativeCurrency = "INR";

        Map<PaymentProvider, PaymentProviderClient> providers = providerClients.stream()
                .collect(Collectors.toMap(PaymentProviderClient::provider, Function.identity()));
        PaymentProviderClient paymentProviderClient = providers.get(request.getProvider());

        if (paymentProviderClient == null) {
            log.error("Unsupported payment provider: {}", request.getProvider());
            throw new IllegalArgumentException("Unsupported payment provider: " + request.getProvider());
        }

        Payment payment = Payment.builder()
                .orderId(request.getOrderId())
                .userId(userId != null ? userId : GUEST_USER_ID)
                .amount(authoritativeAmount)
                .currency(authoritativeCurrency)
                .provider(request.getProvider())
                .status(PaymentStatus.FAILED.name())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        ProviderPaymentResult result = paymentProviderClient.charge(payment);

        String resolvedStatus;
        if (result.isSuccess()) {
            resolvedStatus = request.getProvider() == PaymentProvider.CASH || !result.isSettled()
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

        if (PaymentStatus.SUCCESS.name().equals(savedPayment.getStatus()) && order.getCustomerId() != null) {
            try {
                loyaltyPointService.earnPoints(order.getCustomerId(), order.getTotalAmount(), "Paid order #" + order.getId());
            } catch (RuntimeException loyaltyFailure) {
                // A rewards outage must never roll back an external provider charge.
                log.error("Payment {} succeeded but loyalty points could not be credited", savedPayment.getId(), loyaltyFailure);
            }
        }

        // The order and its compensation state are committed in the same local
        // transaction as the payment. RabbitMQ is notification/event transport,
        // not the source of truth for this in-process commerce boundary.
        orderService.applyPaymentStatus(savedPayment.getOrderId(), savedPayment.getStatus(),
                savedPayment.getProvider().name());

        PaymentStatusEvent statusEvent = PaymentStatusEvent.builder()
                .orderId(savedPayment.getOrderId())
                .status(savedPayment.getStatus())
                .provider(savedPayment.getProvider().name())
                .transactionId(savedPayment.getTransactionId())
                .amount(savedPayment.getAmount())
                .currency(savedPayment.getCurrency())
                .build();
        paymentOutboxService.enqueue(statusEvent);
        scheduleAfterCommit(() -> {
            try {
                sendPaymentEmail(savedPayment);
            } catch (RuntimeException notificationFailure) {
                log.error("Payment {} committed but email could not be queued", savedPayment.getId(), notificationFailure);
            }
            if (PaymentStatus.SUCCESS.name().equals(savedPayment.getStatus())) {
                invoiceService.emailInvoice(order);
            }
        });

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

    /** Applies a signature-verified asynchronous provider result exactly once. */
    @Transactional
    public void reconcileProviderPayment(PaymentProvider provider, String transactionId,
                                         boolean succeeded, String failureReason,
                                         BigDecimal providerAmount, String providerCurrency) {
        Payment candidate = paymentRepository.findByProviderAndTransactionId(provider, transactionId)
                .orElseThrow(() -> new IllegalArgumentException("Payment reference was not found"));
        Order order = orderRepository.findLockedById(candidate.getOrderId());
        if (order == null) throw new IllegalArgumentException("Order not found for payment reference");
        Payment payment = paymentRepository.findLockedByProviderAndTransactionId(provider, transactionId)
                .orElseThrow(() -> new IllegalArgumentException("Payment reference was not found"));
        if (providerAmount == null || payment.getAmount() == null
                || providerAmount.compareTo(payment.getAmount()) != 0) {
            throw new SecurityException("Provider payment amount does not match the order");
        }
        if (providerCurrency == null || payment.getCurrency() == null
                || !payment.getCurrency().equalsIgnoreCase(providerCurrency)) {
            throw new SecurityException("Provider payment currency does not match the order");
        }
        String targetStatus = succeeded ? PaymentStatus.SUCCESS.name() : PaymentStatus.FAILED.name();
        if (targetStatus.equals(payment.getStatus())) return;
        if (!PaymentStatus.PENDING.name().equals(payment.getStatus())) {
            log.warn("Ignoring {} webhook for payment {} already in state {}",
                    targetStatus, payment.getId(), payment.getStatus());
            return;
        }

        payment.setStatus(targetStatus);
        payment.setFailureReason(succeeded ? null : failureReason);
        payment.setUpdatedAt(LocalDateTime.now());
        Payment saved = paymentRepository.save(payment);
        orderService.applyPaymentStatus(order.getId(), targetStatus, provider.name());

        if (succeeded && order.getCustomerId() != null) {
            try {
                loyaltyPointService.earnPoints(order.getCustomerId(), order.getTotalAmount(),
                        "Paid order #" + order.getId());
            } catch (RuntimeException loyaltyFailure) {
                log.error("Webhook settled payment {} but loyalty points could not be credited", saved.getId(), loyaltyFailure);
            }
        }

        PaymentStatusEvent event = PaymentStatusEvent.builder()
                .orderId(order.getId()).status(targetStatus).provider(provider.name())
                .transactionId(transactionId).amount(payment.getAmount()).currency(payment.getCurrency()).build();
        paymentOutboxService.enqueue(event);
        scheduleAfterCommit(() -> {
            try {
                sendPaymentEmail(saved);
            } catch (RuntimeException notificationFailure) {
                log.error("Reconciled payment {} committed but email could not be queued", saved.getId(), notificationFailure);
            }
            if (succeeded) invoiceService.emailInvoice(order);
        });
    }

    /**
     * Refunds {@code amount} of the order's original payment through its
     * provider. On success a REFUNDED payment-status event is published
     * (order transitions to REFUNDED); a failed refund only logs — it must
     * never cancel the order.
     */
    @Transactional
    public ProviderPaymentResult refundOrderPayment(UUID orderId, BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Refund amount must be positive");
        }
        Payment payment = paymentRepository.findLockedByOrderId(orderId)
                .orElseThrow(() -> new IllegalArgumentException("No payment found for order " + orderId));
        if (!PaymentStatus.SUCCESS.name().equals(payment.getStatus())) {
            throw new IllegalArgumentException("Only a captured successful payment can be refunded");
        }
        BigDecimal alreadyRefunded = payment.getRefundedAmount() == null ? BigDecimal.ZERO : payment.getRefundedAmount();
        if (alreadyRefunded.add(amount).compareTo(payment.getAmount()) > 0) {
            throw new IllegalArgumentException("Refund exceeds the captured provider payment");
        }

        Map<PaymentProvider, PaymentProviderClient> providers = providerClients.stream()
                .collect(Collectors.toMap(PaymentProviderClient::provider, Function.identity()));
        PaymentProviderClient client = providers.get(payment.getProvider());
        if (client == null) {
            throw new IllegalArgumentException("Unsupported payment provider: " + payment.getProvider());
        }

        ProviderPaymentResult result = client.refund(payment, amount);
        log.info("Refund for order {} via {}: success={}, message={}",
                orderId, payment.getProvider(), result.isSuccess(), result.getMessage());

        if (result.isSuccess()) {
            BigDecimal cumulativeRefund = alreadyRefunded.add(amount);
            payment.setRefundedAmount(cumulativeRefund);
            payment.setUpdatedAt(LocalDateTime.now());
            boolean fullyRefunded = cumulativeRefund.compareTo(payment.getAmount()) == 0;
            if (fullyRefunded) {
                payment.setStatus(PaymentStatus.REFUNDED.name());
                PaymentStatusEvent refundEvent = PaymentStatusEvent.builder()
                        .orderId(orderId)
                        .status(PaymentStatus.REFUNDED.name())
                        .provider(payment.getProvider().name())
                        .transactionId(result.getTransactionId())
                        .amount(cumulativeRefund)
                        .currency(payment.getCurrency())
                        .build();
                paymentOutboxService.enqueue(refundEvent);
            }
            paymentRepository.save(payment);
            scheduleAfterCommit(() -> {
                try {
                    sendRefundEmail(payment, amount, result);
                } catch (RuntimeException notificationFailure) {
                    log.error("Refund for order {} committed but email could not be queued", orderId, notificationFailure);
                }
            });
        }
        return result;
    }

    private void scheduleAfterCommit(Runnable action) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            action.run();
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                action.run();
            }
        });
    }

    private void sendRefundEmail(Payment payment, BigDecimal amount, ProviderPaymentResult result) {
        String customerEmail = orderRepository.findById(payment.getOrderId())
                .map(Order::getCustomerEmail)
                .orElse(null);
        if (customerEmail == null || customerEmail.isBlank()) {
            return;
        }
        String text = "Your refund for order " + payment.getOrderId() + " has been processed.\n"
                + "Amount: " + amount + " " + payment.getCurrency() + "\n"
                + "Refund reference: " + result.getTransactionId();
        rabbitMQMessageProducer.publish(
                new EmailRequest(text, customerEmail, "CARTLY - Refund processed"),
                notificationExchange, sendEmailRoutingKey);
    }

    private void sendPaymentEmail(Payment payment) {
        String customerEmail = orderRepository.findById(payment.getOrderId())
                .map(Order::getCustomerEmail)
                .orElse(null);
        if (customerEmail == null || customerEmail.isBlank()) {
            return;
        }
        boolean success = PaymentStatus.SUCCESS.name().equalsIgnoreCase(payment.getStatus());
        boolean cashPending = PaymentStatus.PENDING.name().equalsIgnoreCase(payment.getStatus())
                && payment.getProvider() == PaymentProvider.CASH;
        String subject = success
                ? "CARTLY - Payment successful"
                : cashPending ? "CARTLY - Cash on delivery confirmed" : "CARTLY - Payment failed";
        String text = success
                ? "Your payment for order " + payment.getOrderId() + " was successful.\nAmount: " + payment.getAmount() + " " + payment.getCurrency() + "\nTransaction id: " + payment.getTransactionId()
                : cashPending
                ? "Your order " + payment.getOrderId() + " is confirmed for cash on delivery.\nAmount due: " + payment.getAmount() + " " + payment.getCurrency()
                : "Your payment for order " + payment.getOrderId() + " failed.\nReason: " + payment.getFailureReason();
        rabbitMQMessageProducer.publish(new EmailRequest(text, customerEmail, subject), notificationExchange, sendEmailRoutingKey);
    }
}