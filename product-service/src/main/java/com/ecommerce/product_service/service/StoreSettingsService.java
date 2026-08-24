package com.ecommerce.product_service.service;

import com.ecommerce.product_service.dto.store.StoreSettingsDto;
import com.ecommerce.product_service.model.StoreSettings;
import com.ecommerce.product_service.repository.StoreSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class StoreSettingsService {
    private static final long SINGLETON_ID = 1L;
    private final StoreSettingsRepository repository;

    @Transactional(readOnly = true)
    public StoreSettingsDto get() {
        return toDto(repository.findById(SINGLETON_ID).orElseGet(this::defaults));
    }

    @Transactional
    public StoreSettingsDto update(StoreSettingsDto request) {
        StoreSettings settings = repository.findById(SINGLETON_ID).orElseGet(this::defaults);
        settings.setAnnouncementEnabled(request.isAnnouncementEnabled());
        settings.setAnnouncementText(clean(request.getAnnouncementText()));
        settings.setAnnouncementTextHi(clean(request.getAnnouncementTextHi()));
        settings.setAnnouncementLinkText(clean(request.getAnnouncementLinkText()));
        settings.setAnnouncementLinkTextHi(clean(request.getAnnouncementLinkTextHi()));
        settings.setAnnouncementLinkUrl(clean(request.getAnnouncementLinkUrl()));
        settings.setHeroEyebrow(request.getHeroEyebrow().trim());
        settings.setHeroEyebrowHi(clean(request.getHeroEyebrowHi()));
        settings.setHeroTitle(request.getHeroTitle().trim());
        settings.setHeroTitleHi(clean(request.getHeroTitleHi()));
        settings.setHeroEmphasis(request.getHeroEmphasis().trim());
        settings.setHeroEmphasisHi(clean(request.getHeroEmphasisHi()));
        settings.setHeroDescription(request.getHeroDescription().trim());
        settings.setHeroDescriptionHi(clean(request.getHeroDescriptionHi()));
        settings.setPrimaryCtaLabel(request.getPrimaryCtaLabel().trim());
        settings.setPrimaryCtaLabelHi(clean(request.getPrimaryCtaLabelHi()));
        settings.setSecondaryCtaLabel(request.getSecondaryCtaLabel().trim());
        settings.setSecondaryCtaLabelHi(clean(request.getSecondaryCtaLabelHi()));
        settings.setFreeShippingThreshold(request.getFreeShippingThreshold() == null
                ? BigDecimal.valueOf(999) : request.getFreeShippingThreshold());
        return toDto(repository.save(settings));
    }

    private StoreSettings defaults() {
        return StoreSettings.builder()
                .id(SINGLETON_ID)
                .announcementEnabled(true)
                .announcementText("Free shipping over ₹999")
                .announcementTextHi("₹999 से ऊपर मुफ़्त डिलीवरी")
                .announcementLinkText("Flash sale live")
                .announcementLinkTextHi("फ्लैश सेल देखें")
                .announcementLinkUrl("/flash-sales")
                .heroEyebrow("The seasonal edit")
                .heroEyebrowHi("इस मौसम का चयन")
                .heroTitle("Curated finds")
                .heroTitleHi("चुनी हुई चीज़ें")
                .heroEmphasis("for home & life.")
                .heroEmphasisHi("घर और जीवन के लिए।")
                .heroDescription("Thoughtful objects, honest materials and everyday essentials selected to last.")
                .heroDescriptionHi("सोच-समझकर चुनी गई सुंदर और रोज़मर्रा की चीज़ें।")
                .primaryCtaLabel("Shop the collection")
                .primaryCtaLabelHi("कलेक्शन देखें")
                .secondaryCtaLabel("Explore the edit")
                .secondaryCtaLabelHi("एडिट देखें")
                .freeShippingThreshold(BigDecimal.valueOf(999))
                .build();
    }

    private StoreSettingsDto toDto(StoreSettings settings) {
        return StoreSettingsDto.builder()
                .announcementEnabled(settings.isAnnouncementEnabled())
                .announcementText(settings.getAnnouncementText())
                .announcementTextHi(settings.getAnnouncementTextHi())
                .announcementLinkText(settings.getAnnouncementLinkText())
                .announcementLinkTextHi(settings.getAnnouncementLinkTextHi())
                .announcementLinkUrl(settings.getAnnouncementLinkUrl())
                .heroEyebrow(settings.getHeroEyebrow())
                .heroEyebrowHi(settings.getHeroEyebrowHi())
                .heroTitle(settings.getHeroTitle())
                .heroTitleHi(settings.getHeroTitleHi())
                .heroEmphasis(settings.getHeroEmphasis())
                .heroEmphasisHi(settings.getHeroEmphasisHi())
                .heroDescription(settings.getHeroDescription())
                .heroDescriptionHi(settings.getHeroDescriptionHi())
                .primaryCtaLabel(settings.getPrimaryCtaLabel())
                .primaryCtaLabelHi(settings.getPrimaryCtaLabelHi())
                .secondaryCtaLabel(settings.getSecondaryCtaLabel())
                .secondaryCtaLabelHi(settings.getSecondaryCtaLabelHi())
                .freeShippingThreshold(settings.getFreeShippingThreshold())
                .build();
    }

    private String clean(String value) {
        return value == null ? "" : value.trim();
    }
}
