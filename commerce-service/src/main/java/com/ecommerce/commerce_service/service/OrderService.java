package com.ecommerce.commerce_service.service;

import com.ecommerce.commerce_service.client.CommerceInventoryService;
import com.ecommerce.commerce_service.client.ProductCatalogClient;
import com.ecommerce.commerce_service.dto.catalog.ProductSummaryDto;
import com.ecommerce.commerce_service.dto.Pagination;
import com.ecommerce.commerce_service.dto.inventory.DeductStockRequest;
import com.ecommerce.commerce_service.dto.inventory.InventoryCheckRequest;
import com.ecommerce.commerce_service.dto.inventory.InventoryCheckResponse;
import com.ecommerce.commerce_service.dto.order.CreateOrderRequest;
import com.ecommerce.commerce_service.dto.order.OrderDto;
import com.ecommerce.commerce_service.dto.order.OrderMapper;
import com.ecommerce.commerce_service.dto.stats.DashboardStatsDto;
import com.ecommerce.commerce_service.dto.coupon.CouponValidationRequest;
import com.ecommerce.commerce_service.dto.tracking.OrderStatusHistoryDto;
import com.ecommerce.commerce_service.exception.OrderNotFoundException;
import com.ecommerce.commerce_service.exception.ProductNotInStockException;
import com.ecommerce.commerce_service.model.Order;
import com.ecommerce.commerce_service.model.OrderStatus;
import com.ecommerce.commerce_service.model.ShippingMethod;
import com.ecommerce.commerce_service.model.OrderStatusHistory;
import com.ecommerce.commerce_service.repository.OrderRepository;
import com.ecommerce.commerce_service.repository.OrderStatusHistoryRepository;
import com.ecommerce.commerce_service.repository.OrderItemRepository;
import com.ecommerce.commerce_service.dto.shippingRate.ShippingCalculationRequest;
import com.ecommerce.commerce_service.service.LoyaltyPointService;
import com.ecommerce.commerce_service.service.ShippingRateService;
import com.ecommerce.commerce_service.service.TaxRuleService;
import com.ecommerce.event_bus.RabbitMQMessageProducer;
import com.ecommerce.event_bus.dto.EmailRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
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
    private final OrderItemRepository orderItemRepository;
    private final ShippingRateService shippingRateService;
    private final TaxRuleService taxRuleService;
    private final CheckoutTokenService checkoutTokenService;
    private final ProductCatalogClient productCatalogClient;

    @Value("${rabbitmq.exchanges.notification}")
    private String notificationExchange;

    @Value("${rabbitmq.routing-keys.send-email}")
    private String sendEmailRoutingKey;

    @Transactional
    public OrderDto createOrder(CreateOrderRequest createOrderRequest){

        Order order = orderMapper.orderRequestToOrder(createOrderRequest);
        order.getAddress().setOrder(order);
        order.getItems().forEach(item -> item.setOrder(order));
        applyAuthoritativePrices(order);

        List<InventoryCheckRequest> inventoryCheckRequests = order.getItems().stream()
                .map(item -> new InventoryCheckRequest(item.getProductId(), item.getQuantity(), item.getVariantId()))
                .collect(Collectors.toList());

        InventoryCheckResponse inventoryCheckResponse = commerceInventoryService.isInStock(inventoryCheckRequests);

        if(!inventoryCheckResponse.getIsInStock()){
          throw new ProductNotInStockException(inventoryCheckResponse.getIsNotInStockProductIds().toString());
        }

        List<DeductStockRequest> deductStockRequests = order.getItems().stream()
                .map(item -> new DeductStockRequest(item.getProductId(), item.getQuantity(), item.getVariantId()))
                .collect(Collectors.toList());

        BigDecimal subtotal = order.getItems().stream()
                .map(item -> item.getPrice() == null ? BigDecimal.ZERO : item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal shipping = calculateShipping(subtotal, createOrderRequest.getShippingMethod(), createOrderRequest.getPincode());
        BigDecimal discount = BigDecimal.ZERO;

        if (createOrderRequest.getCouponCode() != null && !createOrderRequest.getCouponCode().isBlank()) {
            couponService.validateCoupon(
                    CouponValidationRequest.builder().code(createOrderRequest.getCouponCode()).orderAmount(subtotal).build(),
                    order.getCustomerId());
            discount = couponService.computeDiscount(couponService.findCoupon(createOrderRequest.getCouponCode()), subtotal);
        }

        BigDecimal taxableAmount = subtotal.add(shipping).subtract(discount);
        BigDecimal giftWrapFee = createOrderRequest.getGiftWrap() != null && createOrderRequest.getGiftWrap() ? new BigDecimal("50.00") : BigDecimal.ZERO;
        taxableAmount = taxableAmount.add(giftWrapFee);
        BigDecimal tax = calculateTax(taxableAmount, createOrderRequest.getState()).setScale(2, RoundingMode.HALF_UP);
        BigDecimal total = taxableAmount.add(tax);

        order.setTotalAmount(total);
        order.setShippingAmount(shipping);
        order.setTaxAmount(tax);
        order.setDiscountAmount(discount);
        order.setGiftWrap(createOrderRequest.getGiftWrap());
        order.setGiftWrapFee(giftWrapFee);

        String checkoutToken = null;
        if (order.getCustomerId() == null) {
            checkoutToken = checkoutTokenService.issue();
            order.setCheckoutTokenHash(checkoutTokenService.hash(checkoutToken));
        }

        // Deduct only after all pricing/tax/coupon validation succeeds. If the
        // local order transaction rolls back, compensate the remote inventory.
        commerceInventoryService.deductStock(deductStockRequests);
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCompletion(int status) {
                    if (status != TransactionSynchronization.STATUS_COMMITTED) {
                        commerceInventoryService.restoreStock(deductStockRequests);
                    }
                }
            });
        }

        Order savedOrder = orderRepository.save(order);

        recordStatus(savedOrder.getId(), OrderStatus.PENDING, "Order placed");

        if (savedOrder.getCouponCode() != null && !savedOrder.getCouponCode().isBlank()) {
            couponService.markUsed(savedOrder.getCouponCode(), savedOrder.getCustomerId(), savedOrder.getId());
        }

        try {
            sendOrderPlacedEmail(savedOrder);
        } catch (RuntimeException notificationFailure) {
            log.error("Order {} committed but confirmation email could not be queued", savedOrder.getId(), notificationFailure);
        }

        OrderDto response = orderMapper.orderToOrderDto(savedOrder);
        response.setCheckoutToken(checkoutToken);
        return response;
    }

    private void applyAuthoritativePrices(Order order) {
        String ids = order.getItems().stream().map(item -> item.getProductId().toString())
                .distinct().collect(Collectors.joining(","));
        Map<UUID, ProductSummaryDto> catalog = productCatalogClient.findByIds(ids).stream()
                .collect(Collectors.toMap(ProductSummaryDto::getId, item -> item));

        order.getItems().forEach(item -> {
            ProductSummaryDto product = catalog.get(item.getProductId());
            if (product == null) throw new ProductNotInStockException("Product is unavailable: " + item.getProductId());
            BigDecimal price;
            if (Boolean.TRUE.equals(product.getFlashSaleActive()) && product.getFlashPrice() != null
                    && product.getFlashPrice().compareTo(BigDecimal.ZERO) > 0) {
                price = product.getFlashPrice();
            } else if (item.getVariantId() != null) {
                price = (product.getVariants() == null ? List.<ProductSummaryDto.VariantSummaryDto>of() : product.getVariants())
                        .stream().filter(variant -> item.getVariantId().equals(variant.getId()))
                        .map(ProductSummaryDto.VariantSummaryDto::getPrice).findFirst()
                        .orElseThrow(() -> new ProductNotInStockException("Variant is unavailable: " + item.getVariantId()));
            } else {
                price = product.getUnitPrice();
            }
            if (price == null || price.compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Catalog price is invalid for product " + item.getProductId());
            }
            item.setPrice(price);
        });
    }

    private BigDecimal calculateShipping(BigDecimal subtotal, ShippingMethod method, String pincode) {
        if (pincode != null && !pincode.isBlank()) {
            var rate = shippingRateService.calculateShipping(
                    new com.ecommerce.commerce_service.dto.shippingRate.ShippingCalculationRequest(pincode, subtotal));
            // Only trust the lookup when an active rate exists for the pincode:
            // the service returns cost=0 / active=false when none is configured,
            // which must NOT be treated as free shipping.
            if (rate.isActive() && rate.getCost() != null) {
                return rate.getCost();
            }
        }
        if (subtotal.compareTo(new BigDecimal("500")) >= 0) {
            return BigDecimal.ZERO;
        }
        if (method == ShippingMethod.EXPRESS) {
            return new BigDecimal("100.00");
        }
        return new BigDecimal("50.00");
    }

    private BigDecimal calculateTax(BigDecimal taxableAmount, String state) {
        if (state != null && !state.isBlank()) {
            return taxRuleService.getTaxRuleForState(state)
                    .map(rule -> taxableAmount.multiply(rule.getRate()).setScale(2, RoundingMode.HALF_UP))
                    .orElse(taxableAmount.multiply(new BigDecimal("0.18")).setScale(2, RoundingMode.HALF_UP));
        }
        return taxableAmount.multiply(new BigDecimal("0.18")).setScale(2, RoundingMode.HALF_UP);
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

    /** Customer-scoped order history (the userId header is injected by the gateway). */
    public List<OrderDto> getOrdersByCustomer(UUID customerId) {
        return orderRepository.findByCustomerIdOrderByCreatedDateDesc(customerId).stream()
                .map(orderMapper::orderToOrderDto)
                .collect(Collectors.toList());
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
            } else if ("REFUNDED".equalsIgnoreCase(paymentStatus)) {
                order.setOrderStatus(OrderStatus.REFUNDED);
                recordStatus(orderId, OrderStatus.REFUNDED, "Refund processed");
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

    public Map<UUID, Long> getBestsellers() {
        return orderRepository.findAll().stream()
                .flatMap(order -> order.getItems().stream())
                .collect(Collectors.groupingBy(item -> item.getProductId(), Collectors.summingLong(item -> item.getQuantity())));
    }

    public List<UUID> getBoughtTogether(UUID productId) {
        return orderItemRepository.findBoughtTogether(productId);
    }

    /**
     * Phase 9 analytics: lightweight aggregates computed in-memory (dev-scale
     * data; swap for SQL aggregation if volume grows). Cancelled orders are
     * excluded from revenue; order lines drive the top-products ranking.
     */
    public DashboardStatsDto getDashboardStats() {
        List<Order> all = orderRepository.findAll();
        List<Order> revenueOrders = all.stream()
                .filter(order -> order.getOrderStatus() != OrderStatus.CANCELLED)
                .collect(Collectors.toList());

        LocalDate today = LocalDate.now();
        LocalDate windowStart = today.minusDays(6);

        BigDecimal totalRevenue = revenueOrders.stream()
                .map(o -> nvl(o.getTotalAmount()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal revenueToday = revenueOrders.stream()
                .filter(o -> o.getCreatedDate() != null && o.getCreatedDate().toLocalDate().equals(today))
                .map(o -> nvl(o.getTotalAmount()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal revenue7d = revenueOrders.stream()
                .filter(o -> o.getCreatedDate() != null
                        && !o.getCreatedDate().toLocalDate().isBefore(windowStart)
                        && !o.getCreatedDate().toLocalDate().isAfter(today))
                .map(o -> nvl(o.getTotalAmount()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long ordersToday = revenueOrders.stream()
                .filter(o -> o.getCreatedDate() != null && o.getCreatedDate().toLocalDate().equals(today))
                .count();

        Map<String, Long> byStatus = all.stream()
                .collect(Collectors.groupingBy(o -> o.getOrderStatus().name(), Collectors.counting()));

        List<DashboardStatsDto.DailyRevenueDto> daily = new ArrayList<>();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("EEE d");
        for (long i = 0; i < 7; i++) {
            LocalDate day = windowStart.plusDays(i);
            List<Order> dayOrders = revenueOrders.stream()
                    .filter(o -> o.getCreatedDate() != null && o.getCreatedDate().toLocalDate().equals(day))
                    .collect(Collectors.toList());
            daily.add(DashboardStatsDto.DailyRevenueDto.builder()
                    .date(day.format(fmt))
                    .revenue(dayOrders.stream().map(o -> nvl(o.getTotalAmount())).reduce(BigDecimal.ZERO, BigDecimal::add))
                    .orders((long) dayOrders.size())
                    .build());
        }

        Map<UUID, DashboardStatsDto.TopProductDto> top = new LinkedHashMap<>();
        revenueOrders.stream().flatMap(o -> o.getItems().stream()).forEach(item -> {
            BigDecimal lineRevenue = (item.getPrice() == null ? BigDecimal.ZERO : item.getPrice())
                    .multiply(BigDecimal.valueOf(item.getQuantity() == null ? 0 : item.getQuantity()));
            DashboardStatsDto.TopProductDto agg = top.get(item.getProductId());
            if (agg == null) {
                top.put(item.getProductId(), DashboardStatsDto.TopProductDto.builder()
                        .productId(item.getProductId())
                        .unitsSold((long) (item.getQuantity() == null ? 0 : item.getQuantity()))
                        .revenue(lineRevenue)
                        .build());
            } else {
                agg.setUnitsSold(agg.getUnitsSold() + (item.getQuantity() == null ? 0 : item.getQuantity()));
                agg.setRevenue(agg.getRevenue().add(lineRevenue));
            }
        });
        List<DashboardStatsDto.TopProductDto> topProducts = top.values().stream()
                .sorted(Comparator.comparing(DashboardStatsDto.TopProductDto::getRevenue).reversed())
                .limit(5)
                .collect(Collectors.toList());

        return DashboardStatsDto.builder()
                .revenueToday(revenueToday)
                .revenueLast7Days(revenue7d)
                .avgOrderValue(revenueOrders.isEmpty()
                        ? BigDecimal.ZERO
                        : totalRevenue.divide(BigDecimal.valueOf(revenueOrders.size()), 2, RoundingMode.HALF_UP))
                .totalOrders((long) all.size())
                .ordersToday(ordersToday)
                .ordersByStatus(byStatus)
                .dailyRevenue(daily)
                .topProducts(topProducts)
                .build();
    }

    private BigDecimal nvl(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}