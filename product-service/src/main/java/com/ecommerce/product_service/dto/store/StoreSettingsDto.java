package com.ecommerce.product_service.dto.store;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.DecimalMin;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoreSettingsDto {
    private boolean announcementEnabled;

    @Size(max = 160)
    private String announcementText;

    @Size(max = 160)
    private String announcementTextHi;

    @Size(max = 40)
    private String announcementLinkText;

    @Size(max = 40)
    private String announcementLinkTextHi;

    @Size(max = 500)
    private String announcementLinkUrl;

    @NotBlank
    @Size(max = 60)
    private String heroEyebrow;

    @Size(max = 60)
    private String heroEyebrowHi;

    @NotBlank
    @Size(max = 90)
    private String heroTitle;

    @Size(max = 90)
    private String heroTitleHi;

    @NotBlank
    @Size(max = 90)
    private String heroEmphasis;

    @Size(max = 90)
    private String heroEmphasisHi;

    @NotBlank
    @Size(max = 320)
    private String heroDescription;

    @Size(max = 320)
    private String heroDescriptionHi;

    @NotBlank
    @Size(max = 40)
    private String primaryCtaLabel;

    @Size(max = 40)
    private String primaryCtaLabelHi;

    @NotBlank
    @Size(max = 40)
    private String secondaryCtaLabel;

    @Size(max = 40)
    private String secondaryCtaLabelHi;

    @Size(max = 60)
    private String storeName;

    @Size(max = 160)
    private String storeTagline;

    @Size(max = 120)
    @javax.validation.constraints.Email
    private String supportEmail;

    @Size(max = 240)
    private String invoiceFooterNote;

    @DecimalMin("0.00")
    private BigDecimal freeShippingThreshold;
}
