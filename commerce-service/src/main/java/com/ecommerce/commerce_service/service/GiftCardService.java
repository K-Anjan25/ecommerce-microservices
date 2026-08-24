package com.ecommerce.commerce_service.service;

import com.ecommerce.commerce_service.dto.giftCard.GiftCardDto;
import com.ecommerce.commerce_service.dto.giftCard.GiftCardMapper;
import com.ecommerce.commerce_service.dto.giftCard.IssueGiftCardRequest;
import com.ecommerce.commerce_service.model.GiftCard;
import com.ecommerce.commerce_service.model.GiftCardStatus;
import com.ecommerce.commerce_service.repository.GiftCardRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class GiftCardService {
    private final GiftCardRepository giftCardRepository;
    private final GiftCardMapper giftCardMapper;

    public GiftCardDto issueGiftCard(IssueGiftCardRequest request, UUID issuedBy) {
        String code = generateGiftCardCode();
        GiftCard giftCard = GiftCard.builder()
                .code(code)
                .balance(request.getAmount())
                .initialBalance(request.getAmount())
                .expiryDate(request.getExpiryDate())
                .status(GiftCardStatus.ACTIVE)
                .purchasedBy(issuedBy)
                .recipientEmail(request.getRecipientEmail())
                .build();
        GiftCard saved = giftCardRepository.save(giftCard);
        return giftCardMapper.giftCardToGiftCardDto(saved);
    }

    /**
     * Internal settlement path for customer purchases. This method is called
     * only from GiftCardPurchaseFinalizer after PaymentService has applied a
     * verified provider settlement.
     */
    @Transactional
    public GiftCardDto issuePurchasedGiftCard(UUID customerId, BigDecimal amount,
                                               LocalDate expiryDate, String recipientEmail) {
        if (customerId == null || amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("A customer and positive gift-card amount are required");
        }
        if (expiryDate == null || expiryDate.isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Gift card expiry date must be today or later");
        }
        GiftCard giftCard = GiftCard.builder()
                .code(generateGiftCardCode())
                .balance(amount)
                .initialBalance(amount)
                .expiryDate(expiryDate)
                .status(GiftCardStatus.ACTIVE)
                .purchasedBy(customerId)
                .recipientEmail(recipientEmail)
                .build();
        return giftCardMapper.giftCardToGiftCardDto(giftCardRepository.save(giftCard));
    }

    public GiftCardDto getGiftCardByCode(String code) {
        GiftCard giftCard = giftCardRepository.findByCode(code)
                .orElseThrow(() -> new RuntimeException("Gift card not found"));
        validateGiftCard(giftCard);
        return giftCardMapper.giftCardToGiftCardDto(giftCard);
    }

    @Transactional
    public GiftCardDto redeemGiftCard(String code, BigDecimal orderAmount) {
        if (orderAmount == null || orderAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Redemption amount must be positive");
        }
        GiftCard giftCard = giftCardRepository.findLockedByCode(code)
                .orElseThrow(() -> new RuntimeException("Gift card not found"));
        validateGiftCard(giftCard);

        if (giftCard.getBalance().compareTo(orderAmount) < 0) {
            throw new RuntimeException("Insufficient gift card balance");
        }

        giftCard.setBalance(giftCard.getBalance().subtract(orderAmount));
        if (giftCard.getBalance().compareTo(BigDecimal.ZERO) == 0) {
            giftCard.setStatus(GiftCardStatus.REDEEMED);
        }
        GiftCard saved = giftCardRepository.save(giftCard);
        return giftCardMapper.giftCardToGiftCardDto(saved);
    }

    /**
     * Applies up to the amount still due. The row lock makes a card a safe
     * payment tender even when two checkouts submit the same code together.
     */
    @Transactional
    public GiftCardApplication applyToOrder(String code, BigDecimal amountDue) {
        if (code == null || code.isBlank() || amountDue == null || amountDue.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Gift card and a positive order balance are required");
        }
        String normalized = code.trim().toUpperCase(Locale.ROOT);
        GiftCard giftCard = giftCardRepository.findLockedByCode(normalized)
                .orElseThrow(() -> new IllegalArgumentException("Gift card not found"));
        validateGiftCard(giftCard);
        BigDecimal applied = giftCard.getBalance().min(amountDue).setScale(2, java.math.RoundingMode.HALF_UP);
        giftCard.setBalance(giftCard.getBalance().subtract(applied));
        if (giftCard.getBalance().compareTo(BigDecimal.ZERO) == 0) {
            giftCard.setStatus(GiftCardStatus.REDEEMED);
        }
        giftCardRepository.save(giftCard);
        String last4 = normalized.substring(Math.max(0, normalized.length() - 4));
        return new GiftCardApplication(giftCard.getId(), last4, applied);
    }

    @Transactional
    public void restoreOrderCredit(UUID giftCardId, BigDecimal amount) {
        if (giftCardId == null || amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) return;
        GiftCard giftCard = giftCardRepository.findLockedById(giftCardId)
                .orElseThrow(() -> new IllegalStateException("Gift card for failed order no longer exists"));
        BigDecimal restored = giftCard.getBalance().add(amount);
        if (restored.compareTo(giftCard.getInitialBalance()) > 0) {
            throw new IllegalStateException("Gift card restoration would exceed its issued balance");
        }
        giftCard.setBalance(restored);
        if (!giftCard.getExpiryDate().isBefore(LocalDate.now())) {
            giftCard.setStatus(GiftCardStatus.ACTIVE);
        }
        giftCardRepository.save(giftCard);
    }

    public static final class GiftCardApplication {
        private final UUID giftCardId;
        private final String codeLast4;
        private final BigDecimal amount;

        public GiftCardApplication(UUID giftCardId, String codeLast4, BigDecimal amount) {
            this.giftCardId = giftCardId;
            this.codeLast4 = codeLast4;
            this.amount = amount;
        }
        public UUID getGiftCardId() { return giftCardId; }
        public String getCodeLast4() { return codeLast4; }
        public BigDecimal getAmount() { return amount; }
    }

    public List<GiftCardDto> getGiftCardsByUser(UUID userId) {
        return giftCardRepository.findByPurchasedByOrderByCreatedDateDesc(userId).stream()
                .map(giftCardMapper::giftCardToGiftCardDto)
                .collect(Collectors.toList());
    }

    private void validateGiftCard(GiftCard giftCard) {
        if (giftCard.getStatus() == GiftCardStatus.REDEEMED) {
            throw new RuntimeException("Gift card has already been redeemed");
        }
        if (giftCard.getStatus() == GiftCardStatus.EXPIRED) {
            throw new RuntimeException("Gift card has expired");
        }
        if (giftCard.getStatus() == GiftCardStatus.REFUNDED) {
            throw new RuntimeException("Gift card has been refunded");
        }
        if (giftCard.getExpiryDate().isBefore(LocalDate.now())) {
            giftCard.setStatus(GiftCardStatus.EXPIRED);
            giftCardRepository.save(giftCard);
            throw new RuntimeException("Gift card has expired");
        }
    }

    private String generateGiftCardCode() {
        String code;
        do {
            code = "GC-" + UUID.randomUUID().toString().replace("-", "").toUpperCase();
        } while (giftCardRepository.findByCode(code).isPresent());
        return code;
    }
}
