package com.ecommerce.commerce_service.service;

import com.ecommerce.commerce_service.dto.giftCard.GiftCardMapper;
import com.ecommerce.commerce_service.dto.giftCard.IssueGiftCardRequest;
import com.ecommerce.commerce_service.controller.GiftCardController;
import com.ecommerce.commerce_service.controller.GiftCardPurchaseController;
import com.ecommerce.commerce_service.dto.giftCard.CreateGiftCardPurchaseRequest;
import com.ecommerce.commerce_service.dto.loyaltyPoint.LoyaltyPointMapper;
import com.ecommerce.commerce_service.repository.GiftCardRepository;
import com.ecommerce.commerce_service.repository.LoyaltyPointRepository;
import com.ecommerce.commerce_service.model.GiftCard;
import com.ecommerce.commerce_service.model.GiftCardStatus;
import com.ecommerce.commerce_service.model.LoyaltyPoint;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.prepost.PreAuthorize;

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
    void giftCardApplicationIsPartialAndPreservesRemainder() {
        GiftCardRepository repository = mock(GiftCardRepository.class);
        GiftCard card = GiftCard.builder()
                .id(UUID.randomUUID()).code("GC-ABCD")
                .balance(new BigDecimal("100.00")).initialBalance(new BigDecimal("100.00"))
                .expiryDate(LocalDate.now().plusDays(1)).status(GiftCardStatus.ACTIVE).build();
        when(repository.findLockedByCode("GC-ABCD")).thenReturn(Optional.of(card));
        GiftCardService service = new GiftCardService(repository, mock(GiftCardMapper.class));

        GiftCardService.GiftCardApplication applied = service.applyToOrder("GC-ABCD", new BigDecimal("35.50"));

        assertThat(applied.getAmount()).isEqualByComparingTo("35.50");
        assertThat(card.getBalance()).isEqualByComparingTo("64.50");
        verify(repository).save(card);
    }

    @Test
    void loyaltyChecksFreshAggregateAfterTakingCustomerLock() {
        LoyaltyPointRepository repository = mock(LoyaltyPointRepository.class);
        when(repository.findLockedByCustomerId(any())).thenReturn(List.of(LoyaltyPoint.builder().points(60).build()));
        when(repository.sumPointsByCustomerId(any())).thenReturn(40);
        LoyaltyPointService service = new LoyaltyPointService(repository, mock(LoyaltyPointMapper.class));

        assertThatThrownBy(() -> service.redeemPoints(UUID.randomUUID(), 50, "order"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Insufficient");
        verify(repository).findLockedByCustomerId(any());
        verify(repository).sumPointsByCustomerId(any());
        verify(repository, never()).save(any());
    }

    @Test
    void giftCardIssuanceEndpointExcludesCustomers() throws Exception {
        PreAuthorize policy = GiftCardController.class
                .getDeclaredMethod("issueGiftCard", IssueGiftCardRequest.class)
                .getAnnotation(PreAuthorize.class);

        assertThat(policy).isNotNull();
        assertThat(policy.value()).contains("ROLE_ADMIN", "ROLE_SUPER_ADMIN").doesNotContain("ROLE_USER");
        assertThat(java.util.Arrays.stream(GiftCardController.class.getDeclaredMethods())
                .noneMatch(method -> method.getName().equals("purchaseGiftCard"))).isTrue();

        PreAuthorize purchasePolicy = GiftCardPurchaseController.class
                .getDeclaredMethod("purchase", CreateGiftCardPurchaseRequest.class)
                .getAnnotation(PreAuthorize.class);
        assertThat(purchasePolicy).isNotNull();
        assertThat(purchasePolicy.value()).contains("ROLE_USER");

        PreAuthorize refundPolicy = GiftCardPurchaseController.class
                .getDeclaredMethod("refund", UUID.class)
                .getAnnotation(PreAuthorize.class);
        assertThat(refundPolicy).isNotNull();
        assertThat(refundPolicy.value()).contains("ROLE_ADMIN", "ROLE_SUPER_ADMIN")
                .doesNotContain("ROLE_USER");
    }

}
