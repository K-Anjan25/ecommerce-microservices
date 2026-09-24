package com.ecommerce.commerce_service.service;

import com.ecommerce.commerce_service.dto.AnalyticsSummaryDto;
import com.ecommerce.commerce_service.model.AnalyticsEvent;
import com.ecommerce.commerce_service.repository.AnalyticsEventRepository;
import com.ecommerce.commerce_service.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Funnel analytics: sessions flow view → cart → checkout → order. The order
 * stage uses REAL orders from the orders table (client events can never
 * inflate revenue truth), the earlier stages use distinct session counts.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsService {

    private static final List<String> FUNNEL_TYPES =
            List.of("VIEW_PRODUCT", "ADD_TO_CART", "CHECKOUT_STARTED", "ORDER_COMPLETED");

    private final AnalyticsEventRepository eventRepository;
    private final OrderRepository orderRepository;

    public void record(String type, String sessionId, UUID productId) {
        AnalyticsEvent event = AnalyticsEvent.builder()
                .type(type)
                .sessionId(sessionId == null ? "anonymous" : sessionId.substring(0, Math.min(sessionId.length(), 64)))
                .productId(productId)
                .createdAt(LocalDateTime.now())
                .build();
        eventRepository.save(event);
    }

    public AnalyticsSummaryDto summary(int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(Math.max(days, 1));

        long viewSessions = eventRepository.countDistinctSessionsByTypeSince("VIEW_PRODUCT", since);
        long cartSessions = eventRepository.countDistinctSessionsByTypeSince("ADD_TO_CART", since);
        long checkoutSessions = eventRepository.countDistinctSessionsByTypeSince("CHECKOUT_STARTED", since);
        long orderSessions = eventRepository.countDistinctSessionsByTypeSince("ORDER_COMPLETED", since);
        long realOrders = orderRepository.countByCreatedDateAfter(since);

        // Daily buckets: date → (type → count)
        Map<LocalDate, Map<String, Long>> daily = new TreeMap<>();
        for (Object[] row : eventRepository.countDailyByTypeSince(since)) {
            LocalDate date = LocalDate.parse(String.valueOf(row[0]));
            String type = String.valueOf(row[1]);
            long count = ((Number) row[2]).longValue();
            daily.computeIfAbsent(date, d -> new LinkedHashMap<>()).merge(type, count, Long::sum);
        }
        List<AnalyticsSummaryDto.DailyPoint> dailyPoints = new ArrayList<>();
        daily.forEach((date, byType) -> dailyPoints.add(AnalyticsSummaryDto.DailyPoint.builder()
                .date(date.toString())
                .views(byType.getOrDefault("VIEW_PRODUCT", 0L))
                .addToCarts(byType.getOrDefault("ADD_TO_CART", 0L))
                .checkouts(byType.getOrDefault("CHECKOUT_STARTED", 0L))
                .orders(byType.getOrDefault("ORDER_COMPLETED", 0L))
                .build()));

        List<AnalyticsSummaryDto.TopProduct> topProducts = new ArrayList<>();
        for (Object[] row : eventRepository.topViewedProductsSince(since, PageRequest.of(0, 5))) {
            topProducts.add(AnalyticsSummaryDto.TopProduct.builder()
                    .productId(String.valueOf(row[0]))
                    .views(((Number) row[1]).longValue())
                    .build());
        }

        BigDecimal viewToCart = viewSessions == 0 ? BigDecimal.ZERO
                : BigDecimal.valueOf(cartSessions * 100.0 / viewSessions).setScale(1, RoundingMode.HALF_UP);
        BigDecimal cartToOrder = cartSessions == 0 ? BigDecimal.ZERO
                : BigDecimal.valueOf(realOrders * 100.0 / cartSessions).setScale(1, RoundingMode.HALF_UP);

        return AnalyticsSummaryDto.builder()
                .days(days)
                .funnel(AnalyticsSummaryDto.Funnel.builder()
                        .viewedProducts(viewSessions)
                        .addToCart(cartSessions)
                        .checkoutStarted(checkoutSessions)
                        .orders(Math.max(orderSessions, 0))
                        .realOrders(realOrders)
                        .viewToCartPercent(viewToCart)
                        .cartToOrderPercent(cartToOrder)
                        .build())
                .daily(dailyPoints)
                .topProducts(topProducts)
                .build();
    }
}
