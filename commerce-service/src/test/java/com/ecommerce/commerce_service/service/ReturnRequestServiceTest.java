package com.ecommerce.commerce_service.service;

import com.ecommerce.commerce_service.client.CommerceInventoryService;
import com.ecommerce.commerce_service.dto.returnRequest.CreateReturnRequest;
import com.ecommerce.commerce_service.dto.returnRequest.ReturnRequestMapper;
import com.ecommerce.commerce_service.service.provider.ProviderPaymentResult;
import com.ecommerce.commerce_service.model.*;
import com.ecommerce.commerce_service.repository.OrderRepository;
import com.ecommerce.commerce_service.repository.ReturnRequestRepository;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

class ReturnRequestServiceTest {
    private final ReturnRequestRepository returns = mock(ReturnRequestRepository.class);
    private final ReturnRequestMapper mapper = mock(ReturnRequestMapper.class);
    private final OrderRepository orders = mock(OrderRepository.class);
    private final CommerceInventoryService inventory = mock(CommerceInventoryService.class);
    private final PaymentService payments = mock(PaymentService.class);
    private final GiftCardService giftCards = mock(GiftCardService.class);
    private final ReturnRequestService service = new ReturnRequestService(
            returns, mapper, orders, inventory, payments, giftCards);

    @Test
    void rejectsReturnForAnotherCustomer() {
        UUID orderId = UUID.randomUUID();
        UUID productId = UUID.randomUUID();
        UUID owner = UUID.randomUUID();
        Order order = Order.builder().id(orderId).customerId(owner)
                .items(List.of(OrderItem.builder().productId(productId).quantity(1).build())).build();
        when(orders.findLockedById(orderId)).thenReturn(order);
        CreateReturnRequest request = request(orderId, productId, 1);

        assertThatThrownBy(() -> service.createReturnRequest(request, UUID.randomUUID()))
                .isInstanceOf(SecurityException.class);
        verifyNoInteractions(mapper);
    }

    @Test
    void rejectsQuantityAlreadyCoveredByExistingReturn() {
        UUID orderId = UUID.randomUUID();
        UUID productId = UUID.randomUUID();
        UUID owner = UUID.randomUUID();
        Order order = Order.builder().id(orderId).customerId(owner)
                .items(List.of(OrderItem.builder().productId(productId).quantity(2).build())).build();
        when(orders.findLockedById(orderId)).thenReturn(order);
        when(returns.findByOrderId(orderId)).thenReturn(List.of(ReturnRequest.builder()
                .productId(productId).quantity(1).status(ReturnStatus.REQUESTED).build()));

        assertThatThrownBy(() -> service.createReturnRequest(request(orderId, productId, 2), owner))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("remaining eligible quantity");
        verifyNoInteractions(mapper);
    }

    @Test
    void refundAllocatesDiscountAndTaxThenRestoresGiftCardBeforeProvider() {
        UUID returnId = UUID.randomUUID();
        UUID orderId = UUID.randomUUID();
        UUID productId = UUID.randomUUID();
        UUID giftCardId = UUID.randomUUID();
        ReturnRequest returned = ReturnRequest.builder().id(returnId).orderId(orderId)
                .productId(productId).quantity(1).status(ReturnStatus.APPROVED).build();
        Order order = Order.builder().id(orderId)
                .items(List.of(OrderItem.builder().productId(productId).quantity(2)
                        .price(new BigDecimal("50.00")).build()))
                .discountAmount(new BigDecimal("10.00"))
                .loyaltyDiscountAmount(new BigDecimal("10.00"))
                .shippingAmount(new BigDecimal("10.00"))
                .taxAmount(new BigDecimal("18.00"))
                .giftCardId(giftCardId).giftCardAmount(new BigDecimal("30.00"))
                .build();
        when(returns.findLockedById(returnId)).thenReturn(returned);
        when(orders.findLockedById(orderId)).thenReturn(order);
        when(payments.refundOrderPayment(orderId, new BigDecimal("18.00")))
                .thenReturn(ProviderPaymentResult.builder().success(true).transactionId("refund-1").build());
        when(returns.save(returned)).thenReturn(returned);

        service.refundReturnRequest(returnId);

        assertThat(returned.getRefundAmount()).isEqualByComparingTo("48.00");
        assertThat(returned.getGiftCardRefundAmount()).isEqualByComparingTo("30.00");
        assertThat(returned.getProviderRefundAmount()).isEqualByComparingTo("18.00");
        verify(giftCards).restoreOrderCredit(giftCardId, new BigDecimal("30.00"));
        verify(payments).refundOrderPayment(orderId, new BigDecimal("18.00"));
        assertThat(order.getGiftCardRefundedAmount()).isEqualByComparingTo("30.00");
        assertThat(order.getProviderRefundedAmount()).isEqualByComparingTo("18.00");
    }

    private CreateReturnRequest request(UUID orderId, UUID productId, int quantity) {
        CreateReturnRequest request = new CreateReturnRequest();
        request.setOrderId(orderId);
        request.setProductId(productId);
        request.setQuantity(quantity);
        return request;
    }
}
