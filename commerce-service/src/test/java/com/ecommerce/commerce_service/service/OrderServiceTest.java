package com.ecommerce.commerce_service.service;

import com.ecommerce.commerce_service.client.CommerceInventoryService;
import com.ecommerce.commerce_service.client.ProductCatalogClient;
import com.ecommerce.commerce_service.dto.catalog.ProductSummaryDto;
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
import com.ecommerce.commerce_service.repository.OrderItemRepository;
import com.ecommerce.commerce_service.service.LoyaltyPointService;
import com.ecommerce.commerce_service.service.ShippingRateService;
import com.ecommerce.commerce_service.service.TaxRuleService;
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

    @Mock
    private OrderItemRepository orderItemRepository;

    @Mock
    private ShippingRateService shippingRateService;

    @Mock
    private TaxRuleService taxRuleService;

    @Mock
    private CheckoutTokenService checkoutTokenService;

    @Mock
    private ProductCatalogClient productCatalogClient;

    @Mock
    private GiftCardService giftCardService;

    @Mock
    private LoyaltyPointService loyaltyPointService;

    private OrderService orderService;

    private UUID productId;
    private UUID orderId;
    private Order testOrder;
    private OrderDto testOrderDto;

    @BeforeEach
    void setUp() {
        orderService = new OrderService(orderRepository, orderMapper, commerceInventoryService,
                couponService, orderStatusHistoryRepository, rabbitMQMessageProducer, orderItemRepository,
                shippingRateService, taxRuleService, checkoutTokenService, productCatalogClient,
                giftCardService, loyaltyPointService);

        productId = UUID.randomUUID();
        orderId = UUID.randomUUID();

        OrderItem item = OrderItem.builder()
                .productId(productId)
                .quantity(2)
                .price(new BigDecimal("0.01"))
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
        when(productCatalogClient.findByIds(productId.toString())).thenReturn(List.of(
                new ProductSummaryDto(productId, "Test product", BigDecimal.TEN, null, false, List.of())));
        when(commerceInventoryService.isInStock(anyList()))
                .thenReturn(InventoryCheckResponse.builder().isInStock(true).build());
        when(orderRepository.save(testOrder)).thenReturn(testOrder);
        when(orderMapper.orderToOrderDto(testOrder)).thenReturn(testOrderDto);

        OrderDto result = orderService.createOrder(request);

        assertThat(result.getOrderStatus()).isEqualTo(OrderStatus.PENDING);
        assertThat(testOrder.getItems().get(0).getPrice()).isEqualByComparingTo("10.00");

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<DeductStockRequest>> deductCaptor = ArgumentCaptor.forClass(List.class);
        verify(commerceInventoryService).deductStock(anyString(), deductCaptor.capture());
        assertThat(deductCaptor.getValue()).hasSize(1);
        assertThat(deductCaptor.getValue().get(0).getProductId()).isEqualTo(productId);
        assertThat(deductCaptor.getValue().get(0).getQuantity()).isEqualTo(2);
    }

    @Test
    void createOrder_shouldThrowException_whenStockUnavailable() {
        CreateOrderRequest request = new CreateOrderRequest();

        when(orderMapper.orderRequestToOrder(request)).thenReturn(testOrder);
        when(productCatalogClient.findByIds(productId.toString())).thenReturn(List.of(
                new ProductSummaryDto(productId, "Test product", BigDecimal.TEN, null, false, List.of())));
        when(commerceInventoryService.isInStock(anyList()))
                .thenReturn(InventoryCheckResponse.builder()
                        .isInStock(false)
                        .isNotInStockProductIds(List.of(productId))
                        .build());

        assertThatThrownBy(() -> orderService.createOrder(request))
                .isInstanceOf(ProductNotInStockException.class);

        verify(commerceInventoryService, never()).deductStock(anyString(), any());
        verify(orderRepository, never()).save(any());
    }

    @Test
    void orderAppliesLoyaltyBeforeTaxAndGiftCardAfterTax() {
        CreateOrderRequest request = mock(CreateOrderRequest.class);
        when(request.getLoyaltyPoints()).thenReturn(100);
        when(request.getGiftCardCode()).thenReturn("GC-1234");
        when(orderMapper.orderRequestToOrder(request)).thenReturn(testOrder);
        when(productCatalogClient.findByIds(productId.toString())).thenReturn(List.of(
                new ProductSummaryDto(productId, "Test product", BigDecimal.TEN, null, false, List.of())));
        when(commerceInventoryService.isInStock(anyList()))
                .thenReturn(InventoryCheckResponse.builder().isInStock(true).build());
        when(loyaltyPointService.redeemForOrder(any(), anyInt(), any(), anyString()))
                .thenReturn(new BigDecimal("10.00"));
        when(giftCardService.applyToOrder(anyString(), any()))
                .thenReturn(new GiftCardService.GiftCardApplication(UUID.randomUUID(), "1234", new BigDecimal("20.00")));
        when(orderRepository.save(testOrder)).thenReturn(testOrder);
        when(orderMapper.orderToOrderDto(testOrder)).thenReturn(testOrderDto);

        orderService.createOrder(request);

        ArgumentCaptor<BigDecimal> loyaltyCap = ArgumentCaptor.forClass(BigDecimal.class);
        verify(loyaltyPointService).redeemForOrder(eq(testOrder.getCustomerId()), eq(100), loyaltyCap.capture(), anyString());
        ArgumentCaptor<BigDecimal> preTenderTotal = ArgumentCaptor.forClass(BigDecimal.class);
        verify(giftCardService).applyToOrder(eq("GC-1234"), preTenderTotal.capture());
        assertThat(loyaltyCap.getValue()).isEqualByComparingTo("20.00");
        assertThat(preTenderTotal.getValue()).isEqualByComparingTo("70.80");
        assertThat(testOrder.getTaxAmount()).isEqualByComparingTo("10.80");
        assertThat(testOrder.getTotalAmount()).isEqualByComparingTo("50.80");
    }

    @Test
    void failedPaymentRestoresReservedCreditsExactlyOnce() {
        UUID customerId = UUID.randomUUID();
        UUID cardId = UUID.randomUUID();
        Order order = Order.builder().id(orderId).customerId(customerId)
                .orderStatus(OrderStatus.PENDING).giftCardId(cardId)
                .giftCardAmount(new BigDecimal("25.00")).loyaltyPointsRedeemed(100)
                .creditsRestored(false).build();
        when(orderRepository.findLockedById(orderId)).thenReturn(order);

        orderService.applyPaymentStatus(orderId, "FAILED");
        orderService.applyPaymentStatus(orderId, "FAILED");

        verify(giftCardService, times(1)).restoreOrderCredit(cardId, new BigDecimal("25.00"));
        verify(loyaltyPointService, times(1)).restoreOrderPoints(eq(customerId), eq(100), anyString());
        assertThat(order.getCreditsRestored()).isTrue();
    }

    @Test
    void failedPaymentRestoresInventoryExactlyOnce() {
        OrderItem item = OrderItem.builder().productId(productId).quantity(2).build();
        Order order = Order.builder().id(orderId).orderStatus(OrderStatus.PENDING)
                .items(List.of(item)).inventoryOperationId("stock-op")
                .inventoryRestored(false).creditsRestored(true).build();
        when(orderRepository.findLockedById(orderId)).thenReturn(order);

        orderService.applyPaymentStatus(orderId, "FAILED");
        orderService.applyPaymentStatus(orderId, "FAILED");

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<DeductStockRequest>> restored = ArgumentCaptor.forClass(List.class);
        verify(commerceInventoryService, times(1))
                .restoreStock(eq("order-payment-failed-stock-op"), restored.capture());
        assertThat(restored.getValue()).hasSize(1);
        assertThat(restored.getValue().get(0).getQuantity()).isEqualTo(2);
        assertThat(order.getInventoryRestored()).isTrue();
    }

    @Test
    void lateFailedEventCannotCancelPaidOrder() {
        Order order = Order.builder().id(orderId).orderStatus(OrderStatus.PAID)
                .items(List.of(OrderItem.builder().productId(productId).quantity(1).build()))
                .build();
        when(orderRepository.findLockedById(orderId)).thenReturn(order);

        orderService.applyPaymentStatus(orderId, "FAILED");

        assertThat(order.getOrderStatus()).isEqualTo(OrderStatus.PAID);
        verify(commerceInventoryService, never()).restoreStock(anyString(), any());
        verify(giftCardService, never()).restoreOrderCredit(any(), any());
        verify(orderRepository, never()).save(order);
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

        when(orderRepository.findLockedById(orderId)).thenReturn(order);

        orderService.applyPaymentStatus(orderId, "SUCCESS");

        assertThat(order.getOrderStatus()).isEqualTo(OrderStatus.PAID);
    }

    @Test
    void applyPaymentStatus_shouldUpdateToCancelled() {
        Order order = Order.builder()
                .orderStatus(OrderStatus.PENDING)
                .build();

        when(orderRepository.findLockedById(orderId)).thenReturn(order);

        orderService.applyPaymentStatus(orderId, "FAILED");

        assertThat(order.getOrderStatus()).isEqualTo(OrderStatus.CANCELLED);
    }
}
