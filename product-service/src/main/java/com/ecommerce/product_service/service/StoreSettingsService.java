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
        settings.setAnnouncementLinkText(clean(request.getAnnouncementLinkText()));
        settings.setAnnouncementLinkUrl(clean(request.getAnnouncementLinkUrl()));
        settings.setHeroEyebrow(request.getHeroEyebrow().trim());
        settings.setHeroTitle(request.getHeroTitle().trim());
        settings.setHeroEmphasis(request.getHeroEmphasis().trim());
        settings.setHeroDescription(request.getHeroDescription().trim());
        settings.setPrimaryCtaLabel(request.getPrimaryCtaLabel().trim());
        settings.setSecondaryCtaLabel(request.getSecondaryCtaLabel().trim());
        settings.setFreeShippingThreshold(request.getFreeShippingThreshold() == null
                ? BigDecimal.valueOf(999) : request.getFreeShippingThreshold());
        return toDto(repository.save(settings));
    }

    private StoreSettings defaults() {
        return StoreSettings.builder()
                .id(SINGLETON_ID)
                .announcementEnabled(true)
                .announcementText("Free shipping over ₹999")
                .announcementLinkText("Flash sale live")
                .announcementLinkUrl("/flash-sales")
                .heroEyebrow("The seasonal edit")
                .heroTitle("Curated finds")
                .heroEmphasis("for home & life.")
                .heroDescription("Thoughtful objects, honest materials and everyday essentials selected to last.")
                .primaryCtaLabel("Shop the collection")
                .secondaryCtaLabel("Explore the edit")
                .freeShippingThreshold(BigDecimal.valueOf(999))
                .build();
    }

    private StoreSettingsDto toDto(StoreSettings settings) {
        return StoreSettingsDto.builder()
                .announcementEnabled(settings.isAnnouncementEnabled())
                .announcementText(settings.getAnnouncementText())
                .announcementLinkText(settings.getAnnouncementLinkText())
                .announcementLinkUrl(settings.getAnnouncementLinkUrl())
                .heroEyebrow(settings.getHeroEyebrow())
                .heroTitle(settings.getHeroTitle())
                .heroEmphasis(settings.getHeroEmphasis())
                .heroDescription(settings.getHeroDescription())
                .primaryCtaLabel(settings.getPrimaryCtaLabel())
                .secondaryCtaLabel(settings.getSecondaryCtaLabel())
                .freeShippingThreshold(settings.getFreeShippingThreshold())
                .build();
    }

    private String clean(String value) {
        return value == null ? "" : value.trim();
    }
}
