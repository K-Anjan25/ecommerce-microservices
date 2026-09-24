package com.ecommerce.commerce_service.service;

import com.ecommerce.commerce_service.client.ProductCatalogClient;
import com.ecommerce.commerce_service.dto.catalog.ProductSummaryDto;
import com.ecommerce.commerce_service.dto.order.CreateOrderRequest;
import com.ecommerce.commerce_service.dto.orderItem.CreateOrderItemRequest;
import com.ecommerce.commerce_service.dto.orderAddress.CreateOrderAddressRequest;
import com.ecommerce.commerce_service.dto.subscription.CreateSubscriptionRequest;
import com.ecommerce.commerce_service.dto.subscription.SubscriptionDto;
import com.ecommerce.commerce_service.dto.subscription.UpdateSubscriptionRequest;
import com.ecommerce.event_bus.dto.EmailRequest;
import com.ecommerce.commerce_service.model.Order;
import com.ecommerce.commerce_service.model.OrderStatus;
import com.ecommerce.commerce_service.model.Subscription;
import com.ecommerce.commerce_service.repository.OrderRepository;
import com.ecommerce.commerce_service.repository.SubscriptionRepository;
import com.ecommerce.event_bus.RabbitMQMessageProducer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final OrderRepository orderRepository;
    private final OrderService orderService;
    private final ProductCatalogClient productCatalogClient;
    private final RabbitMQMessageProducer messageProducer;

    @Value("${rabbitmq.exchanges.notification}")
    private String notificationExchange;

    @Value("${rabbitmq.routing-keys.send-email:send-email}")
    private String sendEmailRoutingKey;

    // ── Customer API ────────────────────────────────────────────────────────

    public List<SubscriptionDto> getMySubscriptions() {
        UUID customerId = currentCustomerId();
        return subscriptionRepository.findByCustomerIdOrderByCreatedDateDesc(customerId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public SubscriptionDto createSubscription(CreateSubscriptionRequest request) {
        UUID customerId = currentCustomerId();
        String email = currentUserEmail();

        ProductSummaryDto product = lookupProduct(request.getProductId());
        if (product == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Product could not be found");
        }

        Subscription subscription = Subscription.builder()
                .customerId(customerId)
                .productId(product.getId())
                .productName(product.getName())
                .unitPrice(effectivePrice(product))
                .quantity(request.getQuantity())
                .intervalDays(request.getIntervalDays())
                .nextRunAt(LocalDateTime.now().plusDays(request.getIntervalDays()))
                .active(true)
                .build();
        Subscription saved = subscriptionRepository.save(subscription);

        sendEmail(email, "Your Cartly subscription is active",
                "Your " + saved.getIntervalDays() + "-day subscription for " + saved.getProductName()
                        + " is active. We'll prepare your first auto-reorder around "
                        + saved.getNextRunAt().toLocalDate() + ". You can pause or cancel it anytime"
                        + " from your Orders page.");
        return toDto(saved);
    }

    /** Owner (or staff) updates: pause/resume, cadence, quantity. */
    @Transactional
    public SubscriptionDto updateSubscription(UUID id, UpdateSubscriptionRequest request) {
        Subscription subscription = getOwned(id);
        if (request.getActive() != null) {
            subscription.setActive(request.getActive());
            if (request.getActive()) {
                // Resuming restarts the clock from now.
                subscription.setNextRunAt(LocalDateTime.now().plusDays(subscription.getIntervalDays()));
            }
        }
        if (request.getIntervalDays() != null) {
            subscription.setIntervalDays(request.getIntervalDays());
            subscription.setNextRunAt(LocalDateTime.now().plusDays(request.getIntervalDays()));
        }
        if (request.getQuantity() != null) {
            subscription.setQuantity(request.getQuantity());
        }
        return toDto(subscriptionRepository.save(subscription));
    }

    /** Owner (or staff) cancels. Deleting keeps history out of the list. */
    @Transactional
    public void cancelSubscription(UUID id) {
        Subscription subscription = getOwned(id);
        subscriptionRepository.delete(subscription);
    }

    // ── Scheduler ───────────────────────────────────────────────────────────

    /**
     * Places due auto-reorders as PENDING orders (customer pays from the
     * Orders page). Runs every 15 minutes; each due subscription fires once
     * because nextRunAt advances immediately.
     */
    @org.springframework.scheduling.annotation.Scheduled(
            fixedDelayString = "${subscription.scan-delay-ms:900000}", initialDelayString = "60000")
    @Transactional
    public void processDueSubscriptions() {
        List<Subscription> due = subscriptionRepository
                .findByActiveTrueAndNextRunAtBefore(LocalDateTime.now());
        for (Subscription subscription : due) {
            try {
                placeAutoReorder(subscription);
            } catch (Exception e) {
                // A failed run must not block the other subscriptions; the
                // next cycle retries because nextRunAt is still in the past.
                log.error("Auto-reorder failed for subscription {}: {}",
                        subscription.getId(), e.getMessage());
                notifyFailure(subscription);
            }
        }
    }

    private void placeAutoReorder(Subscription subscription) {
        Order latest = orderRepository
                .findByCustomerIdOrderByCreatedDateDesc(subscription.getCustomerId())
                .stream()
                .filter(o -> o.getAddress() != null)
                .findFirst()
                .orElse(null);
        if (latest == null) {
            notifyFailure(subscription);
            subscription.setNextRunAt(LocalDateTime.now().plusDays(1));
            subscriptionRepository.save(subscription);
            return;
        }

        // Refresh price/product name from the catalog (best-effort).
        ProductSummaryDto product = lookupProduct(subscription.getProductId());
        if (product != null) {
            subscription.setProductName(product.getName());
            subscription.setUnitPrice(effectivePrice(product));
        }

        CreateOrderAddressRequest address = new CreateOrderAddressRequest(
                latest.getAddress().getState(),
                latest.getAddress().getDistrict(),
                latest.getAddress().getAddressDetail(),
                latest.getAddress().getCountry() == null ? "IN" : latest.getAddress().getCountry());

        CreateOrderItemRequest item = new CreateOrderItemRequest(
                subscription.getProductId(), null, subscription.getQuantity());

        CreateOrderRequest request = new CreateOrderRequest();
        try {
            java.lang.reflect.Field addressField = CreateOrderRequest.class.getDeclaredField("address");
            addressField.setAccessible(true);
            addressField.set(request, address);
            java.lang.reflect.Field itemsField = CreateOrderRequest.class.getDeclaredField("items");
            itemsField.setAccessible(true);
            itemsField.set(request, Collections.singletonList(item));
            java.lang.reflect.Field emailField = CreateOrderRequest.class.getDeclaredField("customerEmail");
            emailField.setAccessible(true);
            emailField.set(request, latest.getCustomerEmail());
            java.lang.reflect.Field shippingField = CreateOrderRequest.class.getDeclaredField("shippingMethod");
            shippingField.setAccessible(true);
            shippingField.set(request, com.ecommerce.commerce_service.model.ShippingMethod.STANDARD);
            java.lang.reflect.Field pincodeField = CreateOrderRequest.class.getDeclaredField("pincode");
            pincodeField.setAccessible(true);
            pincodeField.set(request, null);
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException("Could not assemble auto-reorder request", e);
        }

        // createOrder reads the customer id from the security context — run
        // the placement as the subscription's owner, system-side.
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        Authentication systemAsCustomer = new UsernamePasswordAuthenticationToken(
                subscription.getCustomerId().toString(), null,
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_SUBSCRIPTION_SYSTEM")));
        context.setAuthentication(systemAsCustomer);
        SecurityContextHolder.setContext(context);
        try {
            var orderDto = orderService.createOrder(request);
            subscription.setLastOrderId(orderDto.getId());
        } finally {
            SecurityContextHolder.clearContext();
        }

        subscription.setNextRunAt(LocalDateTime.now().plusDays(subscription.getIntervalDays()));
        subscriptionRepository.save(subscription);

        sendEmail(latest.getCustomerEmail(), "Cartly auto-reorder placed",
                "Your subscription reorder for " + subscription.getProductName() + " × "
                        + subscription.getQuantity() + " was placed and is waiting for payment."
                        + " Pay anytime from your Orders page — it ships as soon as it's paid.");
        log.info("Auto-reorder placed for subscription {}", subscription.getId());
    }

    private void notifyFailure(Subscription subscription) {
        try {
            Order latest = orderRepository
                    .findByCustomerIdOrderByCreatedDateDesc(subscription.getCustomerId())
                    .stream().findFirst().orElse(null);
            String email = latest != null ? latest.getCustomerEmail() : null;
            if (email != null) {
                sendEmail(email, "Your Cartly auto-reorder needs attention",
                        "We couldn't place your subscription reorder for " + subscription.getProductName()
                                + ". Please order it manually from your Orders page — your subscription"
                                + " stays active and we'll retry.");
            }
        } catch (Exception e) {
            log.error("Failure notice could not be queued for subscription {}", subscription.getId(), e);
        }
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    private Subscription getOwned(UUID id) {
        Subscription subscription = subscriptionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Subscription with id " + id + " could not be found!"));
        UUID customerId = currentCustomerId();
        boolean staff = isStaff();
        if (!staff && (customerId == null || !customerId.equals(subscription.getCustomerId()))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You can only manage your own subscriptions");
        }
        return subscription;
    }

    private ProductSummaryDto lookupProduct(UUID productId) {
        try {
            List<ProductSummaryDto> products =
                    productCatalogClient.findByIds(productId.toString());
            return products == null ? null : products.stream()
                    .filter(p -> productId.equals(p.getId()))
                    .findFirst().orElse(null);
        } catch (Exception e) {
            log.error("Catalog lookup failed for product {}: {}", productId, e.getMessage());
            return null;
        }
    }

    private BigDecimal effectivePrice(ProductSummaryDto product) {
        if (Boolean.TRUE.equals(product.getFlashSaleActive()) && product.getFlashPrice() != null) {
            return product.getFlashPrice();
        }
        return product.getUnitPrice();
    }

    private SubscriptionDto toDto(Subscription subscription) {
        return SubscriptionDto.builder()
                .id(subscription.getId())
                .productId(subscription.getProductId())
                .productName(subscription.getProductName())
                .unitPrice(subscription.getUnitPrice())
                .quantity(subscription.getQuantity())
                .intervalDays(subscription.getIntervalDays())
                .nextRunAt(subscription.getNextRunAt())
                .active(subscription.isActive())
                .lastOrderId(subscription.getLastOrderId())
                .createdAt(subscription.getCreatedDate())
                .build();
    }

    private void sendEmail(String to, String subject, String text) {
        if (to == null || to.isBlank()) return;
        try {
            messageProducer.publish(new EmailRequest(text, to, subject),
                    notificationExchange, sendEmailRoutingKey);
        } catch (Exception e) {
            log.error("Subscription email could not be queued ({}): {}", subject, e.getMessage());
        }
    }

    private UUID currentCustomerId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) return null;
        try {
            return UUID.fromString(String.valueOf(authentication.getPrincipal()));
        } catch (IllegalArgumentException ignored) {
            return null;
        }
    }

    private String currentUserEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) return null;
        Object credentials = authentication.getCredentials();
        if (credentials instanceof com.ecommerce.common.model.UserCredential) {
            return ((com.ecommerce.common.model.UserCredential) credentials).getUsername();
        }
        return null;
    }

    private boolean isStaff() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) return false;
        return authentication.getAuthorities().stream().anyMatch(a ->
                a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_MANAGER"));
    }
}
