package com.ecommerce.commerce_service.service;

import com.ecommerce.commerce_service.dto.giftCard.GiftCardDto;
import com.ecommerce.commerce_service.dto.giftCard.GiftCardMapper;
import com.ecommerce.commerce_service.dto.giftCard.PurchaseGiftCardRequest;
import com.ecommerce.commerce_service.model.GiftCard;
import com.ecommerce.commerce_service.model.GiftCardStatus;
import com.ecommerce.commerce_service.repository.GiftCardRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class GiftCardService {
    private final GiftCardRepository giftCardRepository;
    private final GiftCardMapper giftCardMapper;

    public GiftCardDto purchaseGiftCard(PurchaseGiftCardRequest request, UUID purchasedBy) {
        String code = generateGiftCardCode();
        GiftCard giftCard = GiftCard.builder()
                .code(code)
                .balance(request.getAmount())
                .initialBalance(request.getAmount())
                .expiryDate(request.getExpiryDate())
                .status(GiftCardStatus.ACTIVE)
                .purchasedBy(purchasedBy)
                .recipientEmail(request.getRecipientEmail())
                .build();
        GiftCard saved = giftCardRepository.save(giftCard);
        return giftCardMapper.giftCardToGiftCardDto(saved);
    }

    public GiftCardDto getGiftCardByCode(String code) {
        GiftCard giftCard = giftCardRepository.findByCode(code)
                .orElseThrow(() -> new RuntimeException("Gift card not found"));
        validateGiftCard(giftCard);
        return giftCardMapper.giftCardToGiftCardDto(giftCard);
    }

    public GiftCardDto redeemGiftCard(String code, BigDecimal orderAmount) {
        GiftCard giftCard = giftCardRepository.findByCode(code)
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

    public List<GiftCardDto> getGiftCardsByUser(UUID userId) {
        return giftCardRepository.findAll().stream()
                .filter(g -> g.getPurchasedBy() != null && g.getPurchasedBy().equals(userId))
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
        if (giftCard.getExpiryDate().isBefore(LocalDate.now())) {
            giftCard.setStatus(GiftCardStatus.EXPIRED);
            giftCardRepository.save(giftCard);
            throw new RuntimeException("Gift card has expired");
        }
    }

    private String generateGiftCardCode() {
        String code;
        do {
            code = "GC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        } while (giftCardRepository.findByCode(code).isPresent());
        return code;
    }
}
