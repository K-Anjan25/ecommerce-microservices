package com.ecommerce.commerce_service.repository;

import com.ecommerce.commerce_service.model.AnalyticsEvent;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface AnalyticsEventRepository extends JpaRepository<AnalyticsEvent, Long> {

    /** Distinct sessions that reached a funnel stage — the funnel metric. */
    @Query("SELECT COUNT(DISTINCT e.sessionId) FROM analytics_events e " +
           "WHERE e.type = :type AND e.createdAt >= :since")
    long countDistinctSessionsByTypeSince(@Param("type") String type, @Param("since") LocalDateTime since);

    /** Daily counts per type, assembled into the traffic chart. */
    @Query(value = "SELECT CAST(created_at AS DATE) AS d, event_type, COUNT(*) " +
                   "FROM analytics_events WHERE created_at >= :since " +
                   "GROUP BY CAST(created_at AS DATE), event_type ORDER BY d", nativeQuery = true)
    List<Object[]> countDailyByTypeSince(@Param("since") LocalDateTime since);

    /** Most-viewed products in the window (conversion context). */
    @Query("SELECT e.productId, COUNT(e) FROM analytics_events e " +
           "WHERE e.type = 'VIEW_PRODUCT' AND e.productId IS NOT NULL AND e.createdAt >= :since " +
           "GROUP BY e.productId ORDER BY COUNT(e) DESC")
    List<Object[]> topViewedProductsSince(@Param("since") LocalDateTime since, Pageable pageable);
}
