package com.ecommerce.commerce_service.dto.stats;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDto {
    private BigDecimal revenueToday;
    private BigDecimal revenueLast7Days;
    private BigDecimal avgOrderValue;
    private Long totalOrders;
    private Long ordersToday;
    private Map<String, Long> ordersByStatus;
    private List<DailyRevenueDto> dailyRevenue;
    private List<TopProductDto> topProducts;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyRevenueDto {
        private String date;
        private BigDecimal revenue;
        private Long orders;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TopProductDto {
        private UUID productId;
        private Long unitsSold;
        private BigDecimal revenue;
    }
}
