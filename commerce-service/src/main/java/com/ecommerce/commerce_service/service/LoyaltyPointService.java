package com.ecommerce.commerce_service.service;

import com.ecommerce.commerce_service.dto.loyaltyPoint.LoyaltyPointDto;
import com.ecommerce.commerce_service.dto.loyaltyPoint.LoyaltyPointMapper;
import com.ecommerce.commerce_service.model.LoyaltyPoint;
import com.ecommerce.commerce_service.model.LoyaltyPointType;
import com.ecommerce.commerce_service.repository.LoyaltyPointRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class LoyaltyPointService {
    private final LoyaltyPointRepository loyaltyPointRepository;
    private final LoyaltyPointMapper loyaltyPointMapper;

    public LoyaltyPointDto earnPoints(UUID customerId, BigDecimal orderAmount, String description) {
        int points = orderAmount.divide(BigDecimal.TEN).intValue();
        LoyaltyPoint loyaltyPoint = LoyaltyPoint.builder()
                .customerId(customerId)
                .points(points)
                .description(description)
                .type(LoyaltyPointType.EARNED)
                .amount(orderAmount)
                .build();
        LoyaltyPoint saved = loyaltyPointRepository.save(loyaltyPoint);
        return loyaltyPointMapper.loyaltyPointToLoyaltyPointDto(saved);
    }

    @Transactional
    public LoyaltyPointDto redeemPoints(UUID customerId, int points, String description) {
        if (points <= 0) throw new IllegalArgumentException("Points must be positive");
        // Lock an existing ledger row first, then calculate in a fresh query.
        // This serializes concurrent redemptions and includes entries committed
        // by the transaction that held the lock before us.
        loyaltyPointRepository.findLockedByCustomerId(customerId);
        Integer summed = loyaltyPointRepository.sumPointsByCustomerId(customerId);
        int currentBalance = summed == null ? 0 : summed;
        if (currentBalance < points) {
            throw new IllegalArgumentException("Insufficient loyalty points");
        }
        LoyaltyPoint loyaltyPoint = LoyaltyPoint.builder()
                .customerId(customerId)
                .points(-points)
                .description(description)
                .type(LoyaltyPointType.REDEEMED)
                .amount(BigDecimal.ZERO)
                .build();
        LoyaltyPoint saved = loyaltyPointRepository.save(loyaltyPoint);
        return loyaltyPointMapper.loyaltyPointToLoyaltyPointDto(saved);
    }

    /** Ten points equal one rupee; loyalty is capped to the eligible pre-tax merchandise amount. */
    @Transactional
    public BigDecimal redeemForOrder(UUID customerId, int points, BigDecimal maxDiscount, String description) {
        if (customerId == null) throw new SecurityException("Sign in to redeem loyalty points");
        if (maxDiscount == null || maxDiscount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("This order has no loyalty-eligible amount");
        }
        BigDecimal discount = BigDecimal.valueOf(points)
                .divide(BigDecimal.TEN, 2, java.math.RoundingMode.HALF_UP);
        if (discount.compareTo(maxDiscount) > 0) {
            throw new IllegalArgumentException("Loyalty discount exceeds the eligible order amount");
        }
        redeemPoints(customerId, points, description);
        return discount;
    }

    @Transactional
    public void restoreOrderPoints(UUID customerId, int points, String description) {
        if (customerId == null || points <= 0) return;
        LoyaltyPoint restored = LoyaltyPoint.builder()
                .customerId(customerId)
                .points(points)
                .description(description)
                .type(LoyaltyPointType.RESTORED)
                .amount(BigDecimal.ZERO)
                .build();
        loyaltyPointRepository.save(restored);
    }

    public Integer getPointsBalance(UUID customerId) {
        Integer balance = loyaltyPointRepository.sumPointsByCustomerId(customerId);
        return balance != null ? balance : 0;
    }

    public List<LoyaltyPointDto> getPointsHistory(UUID customerId) {
        return loyaltyPointRepository.findByCustomerIdOrderByCreatedDateDesc(customerId)
                .stream()
                .map(loyaltyPointMapper::loyaltyPointToLoyaltyPointDto)
                .collect(Collectors.toList());
    }
}
