package com.ecommerce.product_service.service;

import com.ecommerce.product_service.dto.store.StoreSettingsDto;
import com.ecommerce.product_service.model.StoreSettings;
import com.ecommerce.product_service.repository.StoreSettingsRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StoreSettingsServiceTest {
    @Mock
    private StoreSettingsRepository repository;

    @Test
    void get_shouldReturnSafeDefaultsBeforeFirstAdminSave() {
        when(repository.findById(1L)).thenReturn(Optional.empty());

        StoreSettingsDto result = new StoreSettingsService(repository).get();

        assertThat(result.getHeroTitle()).isEqualTo("Curated finds");
        assertThat(result.getFreeShippingThreshold()).isEqualByComparingTo("999");
        assertThat(result.isAnnouncementEnabled()).isTrue();
    }

    @Test
    void update_shouldTrimContentAndPersistSingleton() {
        when(repository.findById(1L)).thenReturn(Optional.empty());
        when(repository.save(org.mockito.ArgumentMatchers.any(StoreSettings.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        StoreSettingsDto request = StoreSettingsDto.builder()
                .announcementEnabled(false)
                .announcementText("  Weekend offer  ")
                .heroEyebrow("  Just landed  ")
                .heroTitle("  Better essentials  ")
                .heroEmphasis("  picked for you.  ")
                .heroDescription("  Useful products without the clutter.  ")
                .primaryCtaLabel("  Shop now  ")
                .secondaryCtaLabel("  See deals  ")
                .freeShippingThreshold(BigDecimal.valueOf(1499))
                .build();

        StoreSettingsDto result = new StoreSettingsService(repository).update(request);

        ArgumentCaptor<StoreSettings> saved = ArgumentCaptor.forClass(StoreSettings.class);
        verify(repository).save(saved.capture());
        assertThat(saved.getValue().getId()).isEqualTo(1L);
        assertThat(result.getHeroEyebrow()).isEqualTo("Just landed");
        assertThat(result.getFreeShippingThreshold()).isEqualByComparingTo("1499");
    }
}
