package com.ecommerce.commerce_service.service;

import com.ecommerce.commerce_service.dto.giftCard.GiftCardDto;
import com.ecommerce.commerce_service.model.GiftCardPurchaseIntent;
import com.ecommerce.commerce_service.model.GiftCardPurchaseStatus;
import com.ecommerce.commerce_service.model.Order;
import com.ecommerce.commerce_service.model.OrderStatus;
import com.ecommerce.commerce_service.model.Payment;
import com.ecommerce.commerce_service.model.PaymentStatus;
import com.ecommerce.commerce_service.repository.GiftCardPurchaseIntentRepository;
import com.ecommerce.commerce_service.repository.OrderRepository;
import com.ecommerce.commerce_service.repository.OrderStatusHistoryRepository;
import com.ecommerce.commerce_service.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/** Mints purchased stored value only after PaymentService has verified settlement. */
@Service
@RequiredArgsConstructor
@Slf4j
public class GiftCardPurchaseFinalizer {
    private final GiftCardPurchaseIntentRepository intentRepository;
    private final GiftCardService giftCardService;
    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final OrderStatusHistoryRepository orderStatusHistoryRepository;

    @Value("${gift-card.purchase.pending-ttl:PT30M}")
    private Duration pendingTtl = Duration.ofMinutes(30);

    @Value("${gift-card.purchase.lifecycle-batch-size:100}")
    private int batchSize = 100;

    @Transactional
    public void applyPaymentStatus(UUID orderId, String paymentStatus) {
        GiftCardPurchaseIntent intent = intentRepository.findLockedByOrderId(orderId).orElse(null);
        if (intent == null) {
            return;
        }

        if ("SUCCESS".equalsIgnoreCase(paymentStatus)) {
            if (intent.getStatus() == GiftCardPurchaseStatus.ISSUED) {
                return;
            }
            if (intent.getStatus() != GiftCardPurchaseStatus.PENDING_PAYMENT) {
                log.warn("Ignoring successful payment for gift-card purchase {} in state {}",
                        intent.getId(), intent.getStatus());
                return;
            }
            GiftCardDto card = giftCardService.issuePurchasedGiftCard(
                    intent.getCustomerId(), intent.getAmount(), intent.getExpiryDate(), intent.getRecipientEmail());
            intent.setGiftCardId(card.getId());
            intent.setStatus(GiftCardPurchaseStatus.ISSUED);
            intent.setIssuedAt(LocalDateTime.now());
            intent.setUpdatedAt(LocalDateTime.now());
            intentRepository.save(intent);
            log.info("Issued gift card {} for settled purchase {}", card.getId(), intent.getId());
        } else if ("FAILED".equalsIgnoreCase(paymentStatus)
                && intent.getStatus() == GiftCardPurchaseStatus.PENDING_PAYMENT) {
            markFailed(intent, "Linked payment failed");
        }
    }

    /**
     * Cleans up abandoned purchase attempts without cancelling live provider
     * operations. A failed local payment is safe to close immediately; an
     * intent with no payment row is cancelled only after the pending TTL.
     */
    @Scheduled(fixedDelayString = "${gift-card.purchase.lifecycle-scan-delay-ms:60000}")
    @Transactional
    public void expireAbandonedPurchases() {
        int safeBatchSize = Math.max(1, Math.min(batchSize, 500));
        LocalDateTime cutoff = LocalDateTime.now().minus(pendingTtl);
        List<GiftCardPurchaseIntent> pending = intentRepository.findByStatusOrderByCreatedAtAsc(
                GiftCardPurchaseStatus.PENDING_PAYMENT, PageRequest.of(0, safeBatchSize));
        for (GiftCardPurchaseIntent intent : pending) {
            Payment payment = paymentRepository.findByOrderId(intent.getOrderId()).orElse(null);
            if (payment != null) {
                if (PaymentStatus.FAILED.name().equals(payment.getStatus())) {
                    markFailed(intent, "Linked payment failed");
                }
                // A PENDING provider operation may still capture. Leave both
                // the order and intent untouched for provider reconciliation.
                continue;
            }
            if (intent.getCreatedAt() == null || intent.getCreatedAt().isAfter(cutoff)) {
                continue;
            }

            Order order = orderRepository.findById(intent.getOrderId()).orElse(null);
            if (order != null && order.getOrderStatus() == OrderStatus.PENDING) {
                order.setOrderStatus(OrderStatus.CANCELLED);
                orderRepository.save(order);
                recordCancellation(order.getId(), "Gift-card payment was never started; purchase expired");
            }
            markFailed(intent, "No payment was started before the purchase TTL");
        }
    }

    private void markFailed(GiftCardPurchaseIntent intent, String reason) {
        intent.setStatus(GiftCardPurchaseStatus.FAILED);
        intent.setUpdatedAt(LocalDateTime.now());
        intentRepository.save(intent);
        log.info("Gift-card purchase {} moved to FAILED: {}", intent.getId(), reason);
    }

    private void recordCancellation(UUID orderId, String note) {
        if (!orderStatusHistoryRepository.existsByOrderIdAndStatusAndNote(
                orderId, OrderStatus.CANCELLED, note)) {
            orderStatusHistoryRepository.save(com.ecommerce.commerce_service.model.OrderStatusHistory.builder()
                    .orderId(orderId)
                    .status(OrderStatus.CANCELLED)
                    .note(note)
                    .changedAt(LocalDateTime.now())
                    .build());
        }
    }
}
