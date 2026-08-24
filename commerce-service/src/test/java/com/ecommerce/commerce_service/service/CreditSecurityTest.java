package com.ecommerce.commerce_service.service;

import com.ecommerce.commerce_service.dto.giftCard.GiftCardMapper;
import com.ecommerce.commerce_service.dto.loyaltyPoint.LoyaltyPointMapper;
import com.ecommerce.commerce_service.repository.GiftCardRepository;
import com.ecommerce.commerce_service.repository.LoyaltyPointRepository;
import com.ecommerce.commerce_service.model.GiftCard;
import com.ecommerce.commerce_service.model.GiftCardStatus;
import com.ecommerce.commerce_service.model.LoyaltyPoint;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
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
    @Test
    void giftCardApplicationUsesOnlyAmountDueAndKeepsRemainder() {
        GiftCardRepository repository = mock(GiftCardRepository.class);
        GiftCardService service = new GiftCardService(repository, mock(GiftCardMapper.class));
        GiftCard card = GiftCard.builder()
                .id(UUID.randomUUID())
                .code("GC-ABCD")
                .balance(new BigDecimal("100.00"))
                .initialBalance(new BigDecimal("100.00"))
                .expiryDate(LocalDate.now().plusDays(10))
                .status(GiftCardStatus.ACTIVE)
                .build();
        when(repository.findLockedByCode("GC-ABCD")).thenReturn(Optional.of(card));

        GiftCardService.GiftCardApplication result = service.applyToOrder(" gc-abcd ", new BigDecimal("35.50"));

        assertThat(result.getAmount()).isEqualByComparingTo("35.50");
        assertThat(result.getCodeLast4()).isEqualTo("ABCD");
        assertThat(card.getBalance()).isEqualByComparingTo("64.50");
        assertThat(card.getStatus()).isEqualTo(GiftCardStatus.ACTIVE);
    }

    @Test
    void loyaltyRedemptionRecalculatesBalanceAfterTakingLedgerLock() {
        LoyaltyPointRepository repository = mock(LoyaltyPointRepository.class);
        LoyaltyPointMapper mapper = mock(LoyaltyPointMapper.class);
        LoyaltyPointService service = new LoyaltyPointService(repository, mapper);
        when(repository.findLockedByCustomerId(any())).thenReturn(List.of(LoyaltyPoint.builder().points(100).build()));
        when(repository.sumPointsByCustomerId(any())).thenReturn(60);
        when(repository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        service.redeemPoints(UUID.randomUUID(), 50, "order");

        InOrder calls = inOrder(repository);
        calls.verify(repository).findLockedByCustomerId(any());
        calls.verify(repository).sumPointsByCustomerId(any());
        calls.verify(repository).save(argThat(point -> point.getPoints() == -50));
    }

}
