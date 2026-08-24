package com.ecommerce.commerce_service.service;

import com.ecommerce.commerce_service.client.CommerceInventoryService;
import com.ecommerce.commerce_service.dto.returnRequest.CreateReturnRequest;
import com.ecommerce.commerce_service.dto.returnRequest.ReturnRequestMapper;
import com.ecommerce.commerce_service.model.*;
import com.ecommerce.commerce_service.repository.OrderRepository;
import com.ecommerce.commerce_service.repository.ReturnRequestRepository;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

class ReturnRequestServiceTest {
    private final ReturnRequestRepository returns = mock(ReturnRequestRepository.class);
    private final ReturnRequestMapper mapper = mock(ReturnRequestMapper.class);
    private final OrderRepository orders = mock(OrderRepository.class);
    private final ReturnRequestService service = new ReturnRequestService(
            returns, mapper, orders, mock(CommerceInventoryService.class), mock(PaymentService.class));

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

    private CreateReturnRequest request(UUID orderId, UUID productId, int quantity) {
        CreateReturnRequest request = new CreateReturnRequest();
        request.setOrderId(orderId);
        request.setProductId(productId);
        request.setQuantity(quantity);
        return request;
    }
}
