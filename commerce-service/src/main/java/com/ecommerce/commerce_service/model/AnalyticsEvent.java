package com.ecommerce.commerce_service.model;

import com.ecommerce.common.model.BaseModel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Table;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Storefront funnel event (view / add-to-cart / checkout / order). Written
 * fire-and-forget from the client; aggregated into the admin analytics
 * dashboard. Kept minimal on purpose — this is a funnel, not a data lake.
 */
@Entity(name = "analytics_events")
@Table
@NoArgsConstructor
@AllArgsConstructor
@Data
@EqualsAndHashCode(callSuper = false)
@SuperBuilder
public class AnalyticsEvent extends BaseModel {

    /** VIEW_PRODUCT | ADD_TO_CART | CHECKOUT_STARTED | ORDER_COMPLETED */
    @Column(name = "event_type", nullable = false, length = 40)
    private String type;

    /** Anonymous session id from the browser (funnels are session-scoped). */
    @Column(name = "session_id", length = 64)
    private String sessionId;

    @Column(name = "product_id")
    private UUID productId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
