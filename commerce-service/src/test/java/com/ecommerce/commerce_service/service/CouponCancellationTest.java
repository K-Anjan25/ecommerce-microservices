package com.ecommerce.commerce_service.service;

import com.ecommerce.commerce_service.model.Coupon;
import com.ecommerce.commerce_service.model.CouponUsage;
import com.ecommerce.commerce_service.repository.CouponRepository;
import com.ecommerce.commerce_service.repository.CouponUsageRepository;
import org.junit.jupiter.api.Test;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class CouponCancellationTest {
    @Test
    void cancellationReleasesUsageAndDecrementsCountOnce() {
        CouponRepository coupons = mock(CouponRepository.class);
        CouponUsageRepository usages = mock(CouponUsageRepository.class);
        CouponService service = new CouponService(coupons, usages);
        UUID orderId = UUID.randomUUID();
        Coupon coupon = Coupon.builder().id(UUID.randomUUID()).code("WELCOME").usedCount(1).build();
        CouponUsage usage = CouponUsage.builder().id(UUID.randomUUID()).orderId(orderId).coupon(coupon).build();
        when(usages.findByOrderId(orderId)).thenReturn(Optional.of(usage), Optional.empty());
        when(coupons.findLockedById(coupon.getId())).thenReturn(Optional.of(coupon));

        service.releaseOrderUsage(orderId);
        service.releaseOrderUsage(orderId);

        assertThat(coupon.getUsedCount()).isZero();
        verify(usages, times(1)).delete(usage);
        verify(coupons, times(1)).save(coupon);
    }
}
