package com.ecommerce.product_service.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;
import java.math.BigDecimal;

/** Singleton storefront content/configuration edited by administrators. */
@Entity(name = "store_settings")
@Table
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoreSettings {
    @Id
    private Long id;

    private boolean announcementEnabled;
    private String announcementText;
    private String announcementLinkText;
    private String announcementLinkUrl;
    private String heroEyebrow;
    private String heroTitle;
    private String heroEmphasis;

    @javax.persistence.Column(columnDefinition = "TEXT")
    private String heroDescription;

    private String primaryCtaLabel;
    private String secondaryCtaLabel;
    private BigDecimal freeShippingThreshold;
}
