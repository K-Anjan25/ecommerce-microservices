package com.ecommerce.commerce_service.service;

import com.ecommerce.commerce_service.dto.giftCard.GiftCardMapper;
import com.ecommerce.commerce_service.dto.loyaltyPoint.LoyaltyPointMapper;
import com.ecommerce.commerce_service.repository.GiftCardRepository;
import com.ecommerce.commerce_service.repository.LoyaltyPointRepository;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

class CreditSecurityTest {
    @Test
    void negativeGiftCardRedemptionCannotIncreaseBalance() {
        GiftCardRepository repository = mock(GiftCardRepository.class);
        GiftCardService service = new GiftCardService(repository, mock(GiftCardMapper.class));

        assertThatThrownBy(() -> service.redeemGiftCard("GC-code", new BigDecimal("-100")))
                .isInstanceOf(IllegalArgumentException.class);
        verifyNoInteractions(repository);
    }

    @Test
    void negativeLoyaltyRedemptionCannotMintPoints() {
        LoyaltyPointRepository repository = mock(LoyaltyPointRepository.class);
        LoyaltyPointService service = new LoyaltyPointService(repository, mock(LoyaltyPointMapper.class));

        assertThatThrownBy(() -> service.redeemPoints(UUID.randomUUID(), -100, "invalid"))
                .isInstanceOf(IllegalArgumentException.class);
        verifyNoInteractions(repository);
    }

}
