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
        int currentBalance = loyaltyPointRepository.findLockedByCustomerId(customerId).stream()
                .mapToInt(LoyaltyPoint::getPoints).sum();
        if (currentBalance < points) {
            throw new RuntimeException("Insufficient loyalty points");
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
