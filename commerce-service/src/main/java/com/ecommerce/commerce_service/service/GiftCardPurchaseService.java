package com.ecommerce.commerce_service.service;

import com.ecommerce.commerce_service.dto.giftCard.CreateGiftCardPurchaseRequest;
import com.ecommerce.commerce_service.dto.giftCard.GiftCardPurchaseAdminDto;
import com.ecommerce.commerce_service.dto.payment.PaymentRequest;
import com.ecommerce.commerce_service.model.GiftCardPurchaseIntent;
import com.ecommerce.commerce_service.model.GiftCardPurchaseStatus;
import com.ecommerce.commerce_service.model.Order;
import com.ecommerce.commerce_service.model.OrderStatus;
import com.ecommerce.commerce_service.model.PaymentProvider;
import com.ecommerce.commerce_service.repository.GiftCardPurchaseIntentRepository;
import com.ecommerce.commerce_service.repository.OrderRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/** Creates a payment order without minting stored value before settlement. */
@Service
@AllArgsConstructor
public class GiftCardPurchaseService {
    public static final String GIFT_CARD_PURCHASE_ORDER = "GIFT_CARD_PURCHASE";

    private final OrderRepository orderRepository;
    private final GiftCardPurchaseIntentRepository intentRepository;

    @Transactional
    public PurchaseStart create(CreateGiftCardPurchaseRequest request, UUID customerId) {
        if (customerId == null) {
            throw new SecurityException("A signed-in customer is required to purchase a gift card");
        }
        if (request.getProvider() != PaymentProvider.STRIPE
                && request.getProvider() != PaymentProvider.RAZORPAY) {
            throw new IllegalArgumentException("Gift card purchases require a supported online provider");
        }
        if (request.getContactEmail() == null || request.getContactEmail().isBlank()) {
            throw new IllegalArgumentException("A receipt email is required");
        }
        if (request.getExpiryDate() == null || request.getExpiryDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Gift card expiry date must be today or later");
        }
        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ONE) < 0
                || request.getAmount().compareTo(new BigDecimal("100000.00")) > 0
                || request.getAmount().stripTrailingZeros().scale() > 2) {
            throw new IllegalArgumentException("Gift card amount must use at most two decimal places");
        }

        BigDecimal amount = request.getAmount().setScale(2, RoundingMode.UNNECESSARY);
        LocalDateTime now = LocalDateTime.now();
        Order order = Order.builder()
                .customerId(customerId)
                .orderType(GIFT_CARD_PURCHASE_ORDER)
                .orderStatus(OrderStatus.PENDING)
                .items(new ArrayList<>())
                .totalAmount(amount)
                .discountAmount(BigDecimal.ZERO)
                .shippingAmount(BigDecimal.ZERO)
                .taxAmount(BigDecimal.ZERO)
                .giftWrap(Boolean.FALSE)
                .giftWrapFee(BigDecimal.ZERO)
                .giftCardAmount(BigDecimal.ZERO)
                .loyaltyPointsRedeemed(0)
                .loyaltyDiscountAmount(BigDecimal.ZERO)
                .inventoryRestored(true)
                .creditsRestored(true)
                .customerEmail(request.getContactEmail().trim())
                .build();
        Order savedOrder = orderRepository.save(order);

        GiftCardPurchaseIntent intent = GiftCardPurchaseIntent.builder()
                .orderId(savedOrder.getId())
                .customerId(customerId)
                .amount(amount)
                .expiryDate(request.getExpiryDate())
                .recipientEmail(blankToNull(request.getRecipientEmail()))
                .status(GiftCardPurchaseStatus.PENDING_PAYMENT)
                .createdAt(now)
                .updatedAt(now)
                .build();
        GiftCardPurchaseIntent savedIntent = intentRepository.save(intent);

        PaymentRequest payment = new PaymentRequest();
        payment.setOrderId(savedOrder.getId());
        payment.setProvider(request.getProvider());
        return new PurchaseStart(savedIntent.getId(), savedOrder.getId(), payment);
    }

    @Transactional(readOnly = true)
    public List<GiftCardPurchaseAdminDto> findByStatus(GiftCardPurchaseStatus status) {
        return intentRepository.findByStatusOrderByCreatedAtDesc(status).stream()
                .map(GiftCardPurchaseAdminDto::from)
                .collect(Collectors.toList());
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    @AllArgsConstructor
    public static class PurchaseStart {
        private final UUID purchaseId;
        private final UUID orderId;
        private final PaymentRequest paymentRequest;

        public UUID getPurchaseId() { return purchaseId; }
        public UUID getOrderId() { return orderId; }
        public PaymentRequest getPaymentRequest() { return paymentRequest; }
    }
}
