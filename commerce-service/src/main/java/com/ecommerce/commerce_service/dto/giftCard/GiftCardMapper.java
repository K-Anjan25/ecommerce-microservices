package com.ecommerce.commerce_service.dto.giftCard;

import com.ecommerce.commerce_service.model.GiftCard;
import com.ecommerce.commerce_service.model.GiftCardStatus;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.UUID;

@Component
public class GiftCardMapper {

    public GiftCardDto giftCardToGiftCardDto(GiftCard giftCard) {
        return GiftCardDto.builder()
                .id(giftCard.getId())
                .code(giftCard.getCode())
                .balance(giftCard.getBalance())
                .initialBalance(giftCard.getInitialBalance())
                .expiryDate(giftCard.getExpiryDate())
                .status(giftCard.getStatus())
                .recipientEmail(giftCard.getRecipientEmail())
                .build();
    }
}
