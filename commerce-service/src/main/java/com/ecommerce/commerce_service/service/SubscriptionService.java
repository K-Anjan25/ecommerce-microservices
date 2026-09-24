package com.ecommerce.commerce_service.service;

import com.ecommerce.commerce_service.client.ProductCatalogClient;
import com.ecommerce.commerce_service.dto.catalog.ProductSummaryDto;
import com.ecommerce.commerce_service.dto.order.CreateOrderAddressRequest;
import com.ecommerce.commerce_service.dto.order.CreateOrderRequest;
import com.ecommerce.commerce_service.dto.orderItem.CreateOrderItemRequest;
import com.ecommerce.commerce_service.dto.payment.PaymentRequest;
import com.ecommerce.commerce_service.dto.subscription.CreateSubscriptionRequest;
import com.ecommerce.commerce_service.dto.subscription.SubscriptionDto;
import com.ecommerce.commerce_service.dto.subscription.UpdateSubscriptionRequest;
import com.ecommerce.commerce_service.model.Order;
import com.ecommerce.commerce_service.model.SavedPaymentMethod;
import com.ecommerce.commerce_service.model.ShippingMethod;
import com.ecommerce.commerce_service.model.Subscription;
import com.ecommerce.commerce_service.model.SubscriptionOosPolicy;
import com.ecommerce.commerce_service.model.SubscriptionStatus;
import com.ecommerce.commerce_service.repository.OrderRepository;
import com.ecommerce.commerce_service.repository.SavedPaymentMethodRepository;
import com.ecommerce.commerce_service.repository.SubscriptionRepository;
import com.ecommerce.event_bus.RabbitMQMessageProducer;
import com.ecommerce.event_bus.dto.EmailRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Subscribe &amp; Save (Amazon-style auto-reorder):
 *
 * <ul>
 *   <li>Variant-level subscriptions with a 5% base discount; 15% when 5+
 *       deliveries batch in one calendar month ("Subscribe more, save more").</li>
 *   <li>Ship-day pricing: the catalog price on the run day minus the discount;
 *       the pre-delivery reminder shows the exact price.</li>
 *   <li>Lifecycle: skip next, reschedule, pause-until, cadence/qty edits, soft
 *       cancel (history kept).</li>
 *   <li>Hybrid payment: a saved payment method is charged automatically;
 *       without one the auto-order waits for manual payment.</li>
 *   <li>OOS policy per subscription: SKIP / WAIT / CANCEL.</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SubscriptionService {

    /** Amazon-style tiers. */
    public static final BigDecimal BASE_DISCOUNT_PERCENT = new BigDecimal("5");
    public static final BigDecimal TIER_DISCOUNT_PERCENT = new BigDecimal("15");
    public static final int TIER_MIN_DELIVERIES = 5;

    private final SubscriptionRepository subscriptionRepository;
    private final OrderRepository orderRepository;
    private final OrderService orderService;
    private final PaymentService paymentService;
    private final ProductCatalogClient productCatalogClient;
    private final SavedPaymentMethodRepository savedPaymentMethodRepository;
    private final RabbitMQMessageProducer messageProducer;

    @Value("${rabbitmq.exchanges.notification}")
    private String notificationExchange;

    @Value("${rabbitmq.routing-keys.send-email:send-email}")
    private String sendEmailRoutingKey;

    @Value("${app.frontend-url:${APP_FRONTEND_URL:http://localhost:3000}}")
    private String frontendUrl;

    /** Pre-delivery reminder lead time (days). */
    @Value("${subscription.reminder-days:3}")
    private int reminderDays;

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
        if (product.getSubscribeEligible() != null && !product.getSubscribeEligible()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "This product is not eligible for Subscribe & Save");
        }

        String variantName = null;
        BigDecimal unitPrice = effectiveOneTimePrice(product);
        if (request.getVariantId() != null) {
            ProductSummaryDto.VariantSummaryDto variant = (product.getVariants() == null
                    ? java.util.Collections.<ProductSummaryDto.VariantSummaryDto>emptyList()
                    : product.getVariants()).stream()
                    .filter(v -> request.getVariantId().equals(v.getId()))
                    .findFirst()
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Variant could not be found on this product"));
            variantName = variant.getName();
            if (variant.getPrice() != null) {
                unitPrice = variant.getPrice();
            }
        }

        Subscription subscription = Subscription.builder()
                .customerId(customerId)
                .productId(product.getId())
                .productName(product.getName())
                .variantId(request.getVariantId())
                .variantName(variantName)
                .unitPrice(unitPrice)
                .quantity(request.getQuantity())
                .intervalDays(request.getIntervalDays())
                .nextRunAt(LocalDateTime.now().plusDays(request.getIntervalDays()))
                .active(true)
                .status(SubscriptionStatus.ACTIVE)
                .discountPercent(BASE_DISCOUNT_PERCENT)
                .skipNext(false)
                .oosPolicy(SubscriptionOosPolicy.SKIP)
                .build();
        Subscription saved = subscriptionRepository.save(subscription);

        sendEmail(email, "Your Cartly Subscribe & Save is active",
                "Your " + saved.getIntervalDays() + "-day subscription for " + describe(saved)
                        + " is active at " + percent(saved.getDiscountPercent())
                        + " off each delivery's price. Your first auto-reorder is due around "
                        + date(saved.getNextRunAt()) + ". We'll email you " + reminderDays
                        + " days before each delivery with the exact price — skip, reschedule or cancel"
                        + " anytime from Your Subscriptions (" + frontendUrl + "/subscriptions).");
        return toDto(saved);
    }

    /** Owner (or staff): pause/resume, cadence, quantity, pause window, OOS policy. */
    @Transactional
    public SubscriptionDto updateSubscription(UUID id, UpdateSubscriptionRequest request) {
        Subscription subscription = getOwned(id);
        if (request.getQuantity() != null) {
            subscription.setQuantity(request.getQuantity());
        }
        if (request.getIntervalDays() != null) {
            subscription.setIntervalDays(request.getIntervalDays());
            subscription.setNextRunAt(LocalDateTime.now().plusDays(request.getIntervalDays()));
            subscription.setReminderSentAt(null);
        }
        if (request.getPauseUntil() != null) {
            subscription.setPausedUntil(request.getPauseUntil());
            setStatus(subscription, SubscriptionStatus.PAUSED);
        }
        if (request.getOosPolicy() != null) {
            subscription.setOosPolicy(parseOosPolicy(request.getOosPolicy()));
        }
        if (request.getActive() != null) {
            if (request.getActive()) {
                subscription.setPausedUntil(null);
                setStatus(subscription, SubscriptionStatus.ACTIVE);
                // Resuming restarts the delivery clock from now.
                subscription.setNextRunAt(LocalDateTime.now().plusDays(subscription.getIntervalDays()));
                subscription.setReminderSentAt(null);
            } else if (subscription.getStatus() != SubscriptionStatus.CANCELED) {
                setStatus(subscription, SubscriptionStatus.PAUSED);
            }
        }
        return toDto(subscriptionRepository.save(subscription));
    }

    /** Skip just the upcoming delivery; the schedule resumes afterwards. */
    @Transactional
    public SubscriptionDto skipNext(UUID id) {
        Subscription subscription = getOwned(id);
        subscription.setSkipNext(true);
        subscription.setReminderSentAt(null);
        Subscription saved = subscriptionRepository.save(subscription);
        sendEmail(currentUserEmailOrOrderEmail(saved), "Delivery skipped",
                "We'll skip the upcoming " + describe(saved) + " delivery. Your subscription resumes with the"
                        + " next scheduled delivery around " + date(saved.getNextRunAt().plusDays(saved.getIntervalDays()))
                        + ".");
        return toDto(saved);
    }

    /** Move the next delivery to a new date. */
    @Transactional
    public SubscriptionDto reschedule(UUID id, LocalDateTime nextDeliveryDate) {
        Subscription subscription = getOwned(id);
        if (nextDeliveryDate.isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "The next delivery date must be in the future");
        }
        subscription.setNextRunAt(nextDeliveryDate);
        subscription.setReminderSentAt(null);
        subscription.setSkipNext(false);
        return toDto(subscriptionRepository.save(subscription));
    }

    /** Soft cancel — history is kept (Amazon keeps cancelled subscriptions visible). */
    @Transactional
    public SubscriptionDto cancelSubscription(UUID id) {
        Subscription subscription = getOwned(id);
        setStatus(subscription, SubscriptionStatus.CANCELED);
        subscriptionRepository.save(subscription);
        sendEmail(currentUserEmailOrOrderEmail(subscription), "Subscription canceled",
                "Your subscription for " + describe(subscription) + " is canceled. No further auto-orders"
                        + " will be placed. You can start a new one anytime from the product page.");
        return toDto(subscription);
    }

    // ── Schedulers ──────────────────────────────────────────────────────────

    /**
     * Places due auto-deliveries. Runs every 15 minutes; each due subscription
     * advances nextRunAt immediately so a cycle fires once. Failures retry on
     * the next cycle (nextRunAt stays in the past).
     */
    @org.springframework.scheduling.annotation.Scheduled(
            fixedDelayString = "${subscription.scan-delay-ms:900000}", initialDelayString = "60000")
    @Transactional
    public void processDueSubscriptions() {
        LocalDateTime now = LocalDateTime.now();
        List<Subscription> due = subscriptionRepository
                .findByStatusAndNextRunAtBefore(SubscriptionStatus.ACTIVE, now);
        for (Subscription subscription : due) {
            try {
                if (isPausedInFuture(subscription)) {
                    continue; // pausedUntil still ahead — wait
                }
                if (subscription.isSkipNext()) {
                    subscription.setSkipNext(false);
                    subscription.setNextRunAt(now.plusDays(subscription.getIntervalDays()));
                    subscription.setReminderSentAt(null);
                    subscriptionRepository.save(subscription);
                    continue;
                }
                placeAutoReorder(subscription, now);
            } catch (Exception e) {
                // A failed run must not block the others; the next cycle retries
                // because nextRunAt is still in the past.
                log.error("Auto-reorder failed for subscription {}: {}", subscription.getId(), e.getMessage());
                notifyFailure(subscription);
            }
        }
    }

    /**
     * Pre-delivery reminder (Amazon: "In advance of each delivery, we will send
     * you a reminder email showing the items, price and any applicable
     * discount"). Fires once per cycle, {@code reminderDays} before the run.
     */
    @org.springframework.scheduling.annotation.Scheduled(
            fixedDelayString = "${subscription.reminder-scan-delay-ms:3600000}", initialDelayString = "90000")
    @Transactional
    public void sendUpcomingReminders() {
        LocalDateTime deadline = LocalDateTime.now().plusDays(reminderDays);
        List<Subscription> upcoming = subscriptionRepository
                .findByStatusAndReminderSentAtIsNullAndNextRunAtBefore(SubscriptionStatus.ACTIVE, deadline);
        for (Subscription subscription : upcoming) {
            try {
                ProductSummaryDto product = lookupProduct(subscription.getProductId());
                if (product == null) {
                    continue;
                }
                BigDecimal listPrice = subscriptionPrice(product, subscription.getVariantId());
                BigDecimal discount = discountForRun(subscription);
                BigDecimal pay = applyDiscount(listPrice, discount);
                String email = currentUserEmailOrOrderEmail(subscription);
                sendEmail(email, "Reminder: your Cartly delivery of " + subscription.getProductName()
                                + " is coming up",
                        "Your " + describe(subscription) + " auto-delivery is scheduled for "
                                + date(subscription.getNextRunAt()) + ".\n\n"
                                + "  Price that day: INR " + listPrice + "\n"
                                + "  Subscribe & Save discount: " + percent(discount) + "\n"
                                + "  You pay: INR " + pay + " x " + subscription.getQuantity() + "\n\n"
                                + (listPrice.compareTo(subscription.getUnitPrice()) != 0
                                    ? "Note: the item price has changed since your last delivery (was INR "
                                        + subscription.getUnitPrice() + ").\n\n" : "")
                                + "Want to change anything? Skip, reschedule or cancel before the delivery"
                                + " date at " + frontendUrl + "/subscriptions — no fees, ever.");
                subscription.setReminderSentAt(LocalDateTime.now());
                subscriptionRepository.save(subscription);
            } catch (Exception e) {
                log.error("Reminder failed for subscription {}: {}", subscription.getId(), e.getMessage());
            }
        }
    }

    private void placeAutoReorder(Subscription subscription, LocalDateTime now) {
        ProductSummaryDto product = lookupProduct(subscription.getProductId());
        if (product == null) {
            // Catalog vanished — apply OOS-ish policy.
            applyOosPolicy(subscription, now, "it is no longer in the catalog");
            return;
        }

        BigDecimal listPrice = subscriptionPrice(product, subscription.getVariantId());
        BigDecimal discount = discountForRun(subscription);
        subscription.setDiscountPercent(discount);
        subscription.setProductName(product.getName());
        subscription.setUnitPrice(listPrice);

        Order latest = orderRepository
                .findByCustomerIdOrderByCreatedDateDesc(subscription.getCustomerId())
                .stream()
                .filter(o -> o.getAddress() != null)
                .findFirst()
                .orElse(null);
        if (latest == null) {
            notifyFailure(subscription);
            subscription.setNextRunAt(now.plusDays(1));
            subscriptionRepository.save(subscription);
            return;
        }

        CreateOrderRequest request = new CreateOrderRequest();
        CreateOrderAddressRequest address = new CreateOrderAddressRequest(
                latest.getAddress().getState(),
                latest.getAddress().getDistrict(),
                latest.getAddress().getAddressDetail(),
                latest.getAddress().getCountry() == null ? "IN" : latest.getAddress().getCountry());
        request.setAddress(address);
        request.setItems(Collections.singletonList(new CreateOrderItemRequest(
                subscription.getProductId(), subscription.getVariantId(), subscription.getQuantity())));
        request.setShippingMethod(ShippingMethod.STANDARD);
        request.setPincode(null);

        com.ecommerce.commerce_service.dto.order.OrderDto orderDto;
        try {
            orderDto = orderService.placeSubscriptionOrder(request,
                    subscription.getCustomerId(), latest.getCustomerEmail());
        } catch (com.ecommerce.commerce_service.exception.ProductNotInStockException oos) {
            applyOosPolicy(subscription, now, "it is out of stock");
            return;
        }

        subscription.setLastOrderId(orderDto.getId());
        subscription.setNextRunAt(now.plusDays(subscription.getIntervalDays()));
        subscription.setReminderSentAt(null);
        subscriptionRepository.save(subscription);

        // Hybrid payment: charge the saved method automatically if the customer
        // has one (provider vault token); otherwise the order waits for manual
        // payment from the Orders page.
        SavedPaymentMethod method = savedPaymentMethodRepository
                .findDefaultByUserId(subscription.getCustomerId()).orElse(null);
        String email = latest.getCustomerEmail();
        if (method != null) {
            boolean charged = tryAutoCharge(orderDto.getId(), method, subscription.getCustomerId());
            if (charged) {
                sendEmail(email, "Cartly auto-reorder placed and charged",
                        "Your Subscribe & Save order for " + describe(subscription) + " x "
                                + subscription.getQuantity() + " (INR " + applyDiscount(listPrice, discount)
                                + " each after " + percent(discount) + " off) was placed and charged to your "
                                + describeMethod(method) + ". Next delivery around "
                                + date(subscription.getNextRunAt()) + ".");
                return;
            }
            sendEmail(email, "Cartly auto-reorder placed — payment needs attention",
                    "Your Subscribe & Save order for " + describe(subscription) + " x "
                            + subscription.getQuantity() + " was placed at " + percent(discount)
                            + " off, but charging your " + describeMethod(method)
                            + " failed. Pay from your Orders page — it ships as soon as it's paid.");
            return;
        }
        sendEmail(email, "Cartly auto-reorder placed",
                "Your Subscribe & Save order for " + describe(subscription) + " x "
                        + subscription.getQuantity() + " (" + percent(discount)
                        + " off, INR " + applyDiscount(listPrice, discount) + " each) is waiting for payment."
                        + " Pay anytime from your Orders page — it ships as soon as it's paid.");
        log.info("Auto-reorder placed for subscription {}", subscription.getId());
    }

    private boolean tryAutoCharge(UUID orderId, SavedPaymentMethod method, UUID customerId) {
        try {
            PaymentRequest paymentRequest = new PaymentRequest();
            paymentRequest.setOrderId(orderId);
            paymentRequest.setProvider(method.getProvider());
            paymentService.processPayment(paymentRequest, customerId);
            return true;
        } catch (Exception e) {
            log.warn("Saved-method auto-charge failed for order {}: {}", orderId, e.getMessage());
            return false;
        }
    }

    private void applyOosPolicy(Subscription subscription, LocalDateTime now, String reason) {
        SubscriptionOosPolicy policy = subscription.getOosPolicy() == null
                ? SubscriptionOosPolicy.SKIP : subscription.getOosPolicy();
        String email = currentUserEmailOrOrderEmail(subscription);
        switch (policy) {
            case WAIT:
                subscription.setNextRunAt(now.plusDays(1));
                sendEmail(email, "Delivery delayed — waiting for stock",
                        "Your " + describe(subscription) + " delivery was postponed because " + reason
                                + ". We'll retry daily and charge only when the order is placed.");
                break;
            case CANCEL:
                setStatus(subscription, SubscriptionStatus.CANCELED);
                sendEmail(email, "Subscription canceled — item unavailable",
                        "Your subscription for " + describe(subscription) + " was canceled because "
                                + reason + ". Start a new subscription whenever it's back.");
                break;
            case SKIP:
            default:
                subscription.setNextRunAt(now.plusDays(subscription.getIntervalDays()));
                subscription.setReminderSentAt(null);
                sendEmail(email, "Delivery skipped — out of stock",
                        "We skipped your " + describe(subscription) + " delivery this cycle because "
                                + reason + ". Your subscription continues — next delivery around "
                                + date(subscription.getNextRunAt()) + ".");
                break;
        }
        subscriptionRepository.save(subscription);
    }

    // ── Admin ───────────────────────────────────────────────────────────────

    /** Staff: every subscription (subscription ops + demand planning). */
    public List<SubscriptionDto> adminList(LocalDateTime from, LocalDateTime to) {
        requireStaff();
        LocalDateTime start = from != null ? from : LocalDateTime.now().minusMonths(3);
        LocalDateTime end = to != null ? to : LocalDateTime.now().plusMonths(6);
        return subscriptionRepository
                .findByStatusAndNextRunAtBetweenOrderByNextRunAtAsc(SubscriptionStatus.ACTIVE, start, end)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    /** Staff: upcoming auto-reorder demand grouped by ISO week for forecasting. */
    public List<java.util.Map<String, Object>> adminForecast(int weeks) {
        requireStaff();
        LocalDateTime start = LocalDateTime.now();
        LocalDateTime end = start.plusWeeks(Math.max(1, Math.min(weeks, 26)));
        List<Subscription> upcoming = subscriptionRepository
                .findByStatusAndNextRunAtBetweenOrderByNextRunAtAsc(SubscriptionStatus.ACTIVE, start, end);
        java.util.Map<java.time.LocalDate, java.util.List<Subscription>> byWeek = upcoming.stream()
                .collect(Collectors.groupingBy(s -> s.getNextRunAt().toLocalDate()
                        .with(java.time.DayOfWeek.MONDAY)));
        return byWeek.entrySet().stream()
                .sorted(java.util.Map.Entry.comparingByKey())
                .map(e -> {
                    java.util.Map<String, Object> row = new java.util.LinkedHashMap<>();
                    row.put("weekStart", e.getKey().toString());
                    row.put("deliveries", e.getValue().size());
                    row.put("units", e.getValue().stream().mapToInt(Subscription::getQuantity).sum());
                    row.put("estValue", e.getValue().stream()
                            .map(s -> s.getUnitPrice().multiply(BigDecimal.valueOf(s.getQuantity())))
                            .reduce(BigDecimal.ZERO, BigDecimal::add));
                    return row;
                })
                .collect(Collectors.toList());
    }

    // ── Pricing ─────────────────────────────────────────────────────────────

    /** 5% base; 15% when 5+ deliveries batch in the same calendar month. */
    private BigDecimal discountForRun(Subscription subscription) {
        LocalDateTime monthStart = subscription.getNextRunAt().withDayOfMonth(1).toLocalDate().atStartOfDay();
        LocalDateTime monthEnd = monthStart.plusMonths(1);
        long batched = subscriptionRepository.countByStatusAndNextRunAtBetween(
                SubscriptionStatus.ACTIVE, monthStart, monthEnd);
        return batched >= TIER_MIN_DELIVERIES ? TIER_DISCOUNT_PERCENT : BASE_DISCOUNT_PERCENT;
    }

    private BigDecimal applyDiscount(BigDecimal listPrice, BigDecimal discountPercent) {
        if (listPrice == null) return BigDecimal.ZERO;
        BigDecimal factor = BigDecimal.ONE
                .subtract(discountPercent.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));
        return listPrice.multiply(factor).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal effectiveOneTimePrice(ProductSummaryDto product) {
        if (Boolean.TRUE.equals(product.getFlashSaleActive()) && product.getFlashPrice() != null) {
            return product.getFlashPrice();
        }
        return product.getUnitPrice();
    }

    /** Ship-day list price for the subscribed variant (flash-aware). */
    private BigDecimal subscriptionPrice(ProductSummaryDto product, UUID variantId) {
        if (variantId != null && product.getVariants() != null) {
            BigDecimal variantPrice = product.getVariants().stream()
                    .filter(v -> variantId.equals(v.getId()) && v.getPrice() != null)
                    .map(ProductSummaryDto.VariantSummaryDto::getPrice)
                    .findFirst().orElse(null);
            if (variantPrice != null) {
                return variantPrice;
            }
        }
        return effectiveOneTimePrice(product);
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

    private void requireStaff() {
        if (!isStaff()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Staff only");
        }
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

    private void setStatus(Subscription subscription, SubscriptionStatus status) {
        subscription.setStatus(status);
        subscription.setActive(status == SubscriptionStatus.ACTIVE);
    }

    private SubscriptionOosPolicy parseOosPolicy(String raw) {
        try {
            return SubscriptionOosPolicy.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "OOS policy must be SKIP, WAIT or CANCEL");
        }
    }

    private boolean isPausedInFuture(Subscription subscription) {
        return subscription.getPausedUntil() != null
                && subscription.getPausedUntil().isAfter(LocalDateTime.now());
    }

    private SubscriptionDto toDto(Subscription subscription) {
        return SubscriptionDto.builder()
                .id(subscription.getId())
                .productId(subscription.getProductId())
                .productName(subscription.getProductName())
                .variantId(subscription.getVariantId())
                .variantName(subscription.getVariantName())
                .unitPrice(subscription.getUnitPrice())
                .quantity(subscription.getQuantity())
                .intervalDays(subscription.getIntervalDays())
                .nextRunAt(subscription.getNextRunAt())
                .active(subscription.isActive())
                .status(subscription.getStatus() == null
                        ? (subscription.isActive() ? "ACTIVE" : "PAUSED")
                        : subscription.getStatus().name())
                .discountPercent(subscription.getDiscountPercent() == null
                        ? BASE_DISCOUNT_PERCENT : subscription.getDiscountPercent())
                .pausedUntil(subscription.getPausedUntil())
                .skipNext(subscription.isSkipNext())
                .oosPolicy(subscription.getOosPolicy() == null
                        ? SubscriptionOosPolicy.SKIP.name() : subscription.getOosPolicy().name())
                .lastOrderId(subscription.getLastOrderId())
                .createdAt(subscription.getCreatedDate())
                .build();
    }

    private String describe(Subscription s) {
        return s.getProductName() + (s.getVariantName() == null ? "" : " (" + s.getVariantName() + ")");
    }

    private String describeMethod(SavedPaymentMethod method) {
        return (method.getBrand() == null ? method.getProvider().name() : method.getBrand())
                + " ending " + (method.getLast4() == null ? "****" : method.getLast4());
    }

    private String percent(BigDecimal p) {
        return p.stripTrailingZeros().toPlainString() + "%";
    }

    private String date(LocalDateTime t) {
        return t == null ? "soon" : t.toLocalDate().toString();
    }

    private void notifyFailure(Subscription subscription) {
        try {
            String email = currentUserEmailOrOrderEmail(subscription);
            if (email != null) {
                sendEmail(email, "Your Cartly auto-reorder needs attention",
                        "We couldn't place your subscription reorder for " + describe(subscription)
                                + ". Please order it manually from your Orders page — your subscription"
                                + " stays active and we'll retry.");
            }
        } catch (Exception e) {
            log.error("Failure notice could not be queued for subscription {}", subscription.getId(), e);
        }
    }

    private String currentUserEmailOrOrderEmail(Subscription subscription) {
        String email = currentUserEmail();
        if (email != null) return email;
        return orderRepository.findByCustomerIdOrderByCreatedDateDesc(subscription.getCustomerId())
                .stream().map(Order::getCustomerEmail).filter(e -> e != null && !e.isBlank())
                .findFirst().orElse(null);
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
                a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_MANAGER")
                        || a.getAuthority().equals("ROLE_SUPER_ADMIN"));
    }
}
