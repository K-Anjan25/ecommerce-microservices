package com.ecommerce.commerce_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsSummaryDto {

    private int days;
    private Funnel funnel;
    private List<DailyPoint> daily;
    private List<TopProduct> topProducts;

    @Builder
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Funnel {
        private long viewedProducts;
        private long addToCart;
        private long checkoutStarted;
        private long orders;
        /** Real order count from the orders table (events can't inflate it). */
        private long realOrders;
        private BigDecimal viewToCartPercent;
        private BigDecimal cartToOrderPercent;
    }

    @Builder
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyPoint {
        private String date;
        private long views;
        private long addToCarts;
        private long checkouts;
        private long orders;
    }

    @Builder
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TopProduct {
        private String productId;
        private long views;
    }
}
