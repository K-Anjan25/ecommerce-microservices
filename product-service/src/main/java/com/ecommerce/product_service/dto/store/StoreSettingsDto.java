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

    @Size(max = 40)
    private String announcementLinkText;

    @Size(max = 500)
    private String announcementLinkUrl;

    @NotBlank
    @Size(max = 60)
    private String heroEyebrow;

    @NotBlank
    @Size(max = 90)
    private String heroTitle;

    @NotBlank
    @Size(max = 90)
    private String heroEmphasis;

    @NotBlank
    @Size(max = 320)
    private String heroDescription;

    @NotBlank
    @Size(max = 40)
    private String primaryCtaLabel;

    @NotBlank
    @Size(max = 40)
    private String secondaryCtaLabel;

    @DecimalMin("0.00")
    private BigDecimal freeShippingThreshold;
}
