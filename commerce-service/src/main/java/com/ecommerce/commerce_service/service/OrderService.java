package com.ecommerce.commerce_service.service;

import com.ecommerce.commerce_service.client.CommerceInventoryService;
import com.ecommerce.commerce_service.dto.Pagination;
import com.ecommerce.commerce_service.dto.inventory.DeductStockRequest;
import com.ecommerce.commerce_service.dto.inventory.InventoryCheckRequest;
import com.ecommerce.commerce_service.dto.inventory.InventoryCheckResponse;
import com.ecommerce.commerce_service.dto.order.CreateOrderRequest;
import com.ecommerce.commerce_service.dto.order.OrderDto;
import com.ecommerce.commerce_service.dto.order.OrderMapper;
import com.ecommerce.commerce_service.dto.coupon.CouponValidationRequest;
import com.ecommerce.commerce_service.dto.tracking.OrderStatusHistoryDto;
import com.ecommerce.commerce_service.exception.OrderNotFoundException;
import com.ecommerce.commerce_service.exception.ProductNotInStockException;
import com.ecommerce.commerce_service.model.Order;
import com.ecommerce.commerce_service.model.OrderStatus;
import com.ecommerce.commerce_service.model.OrderStatusHistory;
import com.ecommerce.commerce_service.repository.OrderRepository;
import com.ecommerce.commerce_service.repository.OrderStatusHistoryRepository;
import com.ecommerce.event_bus.RabbitMQMessageProducer;
import com.ecommerce.event_bus.dto.EmailRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {
    private final OrderRepository orderRepository;
    private final OrderMapper orderMapper;
    private final CommerceInventoryService commerceInventoryService;
    private final CouponService couponService;
    private final OrderStatusHistoryRepository orderStatusHistoryRepository;
    private final RabbitMQMessageProducer rabbitMQMessageProducer;

    @Value("${rabbitmq.exchanges.notification}")
    private String notificationExchange;

    @Value("${rabbitmq.routing-keys.send-email}")
    private String sendEmailRoutingKey;

    public OrderDto createOrder(CreateOrderRequest createOrderRequest){

        Order order = orderMapper.orderRequestToOrder(createOrderRequest);
        order.getAddress().setOrder(order);
        order.getItems().forEach(item -> item.setOrder(order));

        List<InventoryCheckRequest> inventoryCheckRequests = order.getItems().stream()
                .map(item -> new InventoryCheckRequest(item.getProductId(),item.getQuantity()))
                .collect(Collectors.toList());

        InventoryCheckResponse inventoryCheckResponse = commerceInventoryService.isInStock(inventoryCheckRequests);

        if(!inventoryCheckResponse.getIsInStock()){
          throw new ProductNotInStockException(inventoryCheckResponse.getIsNotInStockProductIds().toString());
        }

        List<DeductStockRequest> deductStockRequests = order.getItems().stream()
                .map(item -> new DeductStockRequest(item.getProductId(), item.getQuantity()))
                .collect(Collectors.toList());
        commerceInventoryService.deductStock(deductStockRequests);

        BigDecimal orderAmount = order.getItems().stream()
                .map(item -> item.getPrice() == null ? BigDecimal.ZERO : item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        order.setTotalAmount(orderAmount);

        if (createOrderRequest.getCouponCode() != null && !createOrderRequest.getCouponCode().isBlank()) {
            couponService.validateCoupon(
                    CouponValidationRequest.builder().code(createOrderRequest.getCouponCode()).orderAmount(orderAmount).build(),
                    order.getCustomerId());
            BigDecimal discount = couponService.computeDiscount(couponService.findCoupon(createOrderRequest.getCouponCode()), orderAmount);
            order.setDiscountAmount(discount);
        }

        Order savedOrder = orderRepository.save(order);

        recordStatus(savedOrder.getId(), OrderStatus.PENDING, "Order placed");

        if (savedOrder.getCouponCode() != null && !savedOrder.getCouponCode().isBlank()) {
            couponService.markUsed(savedOrder.getCouponCode(), savedOrder.getCustomerId(), savedOrder.getId());
        }

        sendOrderPlacedEmail(savedOrder);

        return orderMapper.orderToOrderDto(savedOrder);
    }

    public Pagination<OrderDto> getAllOrders(int pageNo, int pageSize){
        Pageable paging = PageRequest.of(pageNo, pageSize);
        Page<Order> orders = orderRepository.findAll(paging);
        return new Pagination<>(orders.stream().map(orderMapper::orderToOrderDto).collect(Collectors.toList()),
                orders.getTotalElements());
    }

    public OrderDto getOrderById(UUID orderId) {
        return orderRepository.findById(orderId)
                .map(orderMapper::orderToOrderDto)
                .orElseThrow(() -> new OrderNotFoundException("Order not found: " + orderId));
    }

    public List<OrderStatusHistoryDto> getOrderTracking(UUID orderId) {
        return orderStatusHistoryRepository.findByOrderIdOrderByChangedAtAsc(orderId).stream()
                .map(history -> OrderStatusHistoryDto.builder()
                        .id(history.getId())
                        .orderId(history.getOrderId())
                        .status(history.getStatus())
                        .note(history.getNote())
                        .changedAt(history.getChangedAt())
                        .build())
                .collect(Collectors.toList());
    }

    public void applyPaymentStatus(UUID orderId, String paymentStatus) {
        orderRepository.findById(orderId).ifPresent(order -> {
            if ("SUCCESS".equalsIgnoreCase(paymentStatus)) {
                order.setOrderStatus(OrderStatus.PAID);
                recordStatus(orderId, OrderStatus.PAID, "Payment successful");
            } else if ("FAILED".equalsIgnoreCase(paymentStatus)) {
                order.setOrderStatus(OrderStatus.CANCELLED);
                recordStatus(orderId, OrderStatus.CANCELLED, "Payment failed");
            } else if ("PENDING".equalsIgnoreCase(paymentStatus)) {
                recordStatus(orderId, OrderStatus.PENDING, "Cash on delivery selected");
            }
            orderRepository.save(order);
            log.info("Order {} updated to {} after payment status {}", orderId, order.getOrderStatus(), paymentStatus);
        });
    }

    private void recordStatus(UUID orderId, OrderStatus status, String note) {
        orderStatusHistoryRepository.save(OrderStatusHistory.builder()
                .orderId(orderId)
                .status(status)
                .note(note)
                .changedAt(LocalDateTime.now())
                .build());
    }

    private void sendOrderPlacedEmail(Order order) {
        if (order.getCustomerEmail() == null || order.getCustomerEmail().isBlank()) {
            return;
        }
        rabbitMQMessageProducer.publish(
                new EmailRequest(
                        buildOrderPlacedText(order),
                        order.getCustomerEmail(),
                        "CARTLY - Order placed #" + order.getId()),
                notificationExchange,
                sendEmailRoutingKey);
    }

    private String buildOrderPlacedText(Order order) {
        StringBuilder sb = new StringBuilder("Thank you for your order!\n\nOrder id: ")
                .append(order.getId())
                .append("\n");
        order.getItems().forEach(item ->
                sb.append("- ").append(item.getProductId())
                        .append(" x").append(item.getQuantity())
                        .append(" @ ").append(item.getPrice())
                        .append("\n"));
        sb.append("\nSubtotal: ").append(order.getTotalAmount());
        if (order.getDiscountAmount() != null && order.getDiscountAmount().compareTo(BigDecimal.ZERO) > 0) {
            sb.append("\nDiscount: ").append(order.getDiscountAmount());
        }
        return sb.toString();
    }
}