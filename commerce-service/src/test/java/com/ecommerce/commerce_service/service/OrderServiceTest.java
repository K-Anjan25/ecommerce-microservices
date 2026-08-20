package com.ecommerce.commerce_service.service;

import com.ecommerce.commerce_service.client.CommerceInventoryService;
import com.ecommerce.commerce_service.dto.inventory.DeductStockRequest;
import com.ecommerce.commerce_service.dto.inventory.InventoryCheckResponse;
import com.ecommerce.commerce_service.dto.order.CreateOrderRequest;
import com.ecommerce.commerce_service.dto.order.OrderDto;
import com.ecommerce.commerce_service.dto.order.OrderMapper;
import com.ecommerce.commerce_service.exception.ProductNotInStockException;
import com.ecommerce.commerce_service.model.Order;
import com.ecommerce.commerce_service.model.OrderAddress;
import com.ecommerce.commerce_service.model.OrderItem;
import com.ecommerce.commerce_service.model.OrderStatus;
import com.ecommerce.commerce_service.repository.OrderRepository;
import com.ecommerce.commerce_service.repository.OrderStatusHistoryRepository;
import com.ecommerce.event_bus.RabbitMQMessageProducer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderMapper orderMapper;

    @Mock
    private CommerceInventoryService commerceInventoryService;

    @Mock
    private CouponService couponService;

    @Mock
    private OrderStatusHistoryRepository orderStatusHistoryRepository;

    @Mock
    private RabbitMQMessageProducer rabbitMQMessageProducer;

    private OrderService orderService;

    private UUID productId;
    private UUID orderId;
    private Order testOrder;
    private OrderDto testOrderDto;

    @BeforeEach
    void setUp() {
        orderService = new OrderService(orderRepository, orderMapper, commerceInventoryService,
                couponService, orderStatusHistoryRepository, rabbitMQMessageProducer);

        productId = UUID.randomUUID();
        orderId = UUID.randomUUID();

        OrderItem item = OrderItem.builder()
                .productId(productId)
                .quantity(2)
                .price(BigDecimal.TEN)
                .build();

        OrderAddress address = OrderAddress.builder()
                .state("Test State")
                .district("Test District")
                .addressDetail("Test Address")
                .build();

        testOrder = Order.builder()
                .customerId(UUID.randomUUID())
                .orderStatus(OrderStatus.PENDING)
                .address(address)
                .items(List.of(item))
                .build();

        testOrderDto = OrderDto.builder()
                .id(orderId)
                .customerId(testOrder.getCustomerId())
                .orderStatus(OrderStatus.PENDING)
                .build();
    }

    @Test
    void createOrder_shouldSucceed_whenStockAvailable() {
        CreateOrderRequest request = new CreateOrderRequest();

        when(orderMapper.orderRequestToOrder(request)).thenReturn(testOrder);
        when(commerceInventoryService.isInStock(anyList()))
                .thenReturn(InventoryCheckResponse.builder().isInStock(true).build());
        when(orderRepository.save(testOrder)).thenReturn(testOrder);
        when(orderMapper.orderToOrderDto(testOrder)).thenReturn(testOrderDto);

        OrderDto result = orderService.createOrder(request);

        assertThat(result.getOrderStatus()).isEqualTo(OrderStatus.PENDING);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<DeductStockRequest>> deductCaptor = ArgumentCaptor.forClass(List.class);
        verify(commerceInventoryService).deductStock(deductCaptor.capture());
        assertThat(deductCaptor.getValue()).hasSize(1);
        assertThat(deductCaptor.getValue().get(0).getProductId()).isEqualTo(productId);
        assertThat(deductCaptor.getValue().get(0).getQuantity()).isEqualTo(2);
    }

    @Test
    void createOrder_shouldThrowException_whenStockUnavailable() {
        CreateOrderRequest request = new CreateOrderRequest();

        when(orderMapper.orderRequestToOrder(request)).thenReturn(testOrder);
        when(commerceInventoryService.isInStock(anyList()))
                .thenReturn(InventoryCheckResponse.builder()
                        .isInStock(false)
                        .isNotInStockProductIds(List.of(productId))
                        .build());

        assertThatThrownBy(() -> orderService.createOrder(request))
                .isInstanceOf(ProductNotInStockException.class);

        verify(commerceInventoryService, never()).deductStock(any());
        verify(orderRepository, never()).save(any());
    }

    @Test
    void getAllOrders_shouldReturnPagination() {
        PageRequest pageable = PageRequest.of(0, 10);
        Page<Order> page = new PageImpl<>(List.of(testOrder));

        when(orderRepository.findAll(pageable)).thenReturn(page);
        when(orderMapper.orderToOrderDto(testOrder)).thenReturn(testOrderDto);

        var result = orderService.getAllOrders(0, 10);

        assertThat(result.getData()).hasSize(1);
        assertThat(result.getTotalSize()).isEqualTo(1);
    }

    @Test
    void applyPaymentStatus_shouldUpdateToPaid() {
        Order order = Order.builder()
                .orderStatus(OrderStatus.PENDING)
                .build();

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

        orderService.applyPaymentStatus(orderId, "SUCCESS");

        assertThat(order.getOrderStatus()).isEqualTo(OrderStatus.PAID);
    }

    @Test
    void applyPaymentStatus_shouldUpdateToCancelled() {
        Order order = Order.builder()
                .orderStatus(OrderStatus.PENDING)
                .build();

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

        orderService.applyPaymentStatus(orderId, "FAILED");

        assertThat(order.getOrderStatus()).isEqualTo(OrderStatus.CANCELLED);
    }
}
