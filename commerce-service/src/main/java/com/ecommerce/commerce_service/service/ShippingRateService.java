package com.ecommerce.commerce_service.service;

import com.ecommerce.commerce_service.dto.shippingRate.ShippingCalculationRequest;
import com.ecommerce.commerce_service.dto.shippingRate.ShippingCalculationResponse;
import com.ecommerce.commerce_service.dto.shippingRate.ShippingRateDto;
import com.ecommerce.commerce_service.dto.shippingRate.ShippingRateMapper;
import com.ecommerce.commerce_service.model.ShippingRate;
import com.ecommerce.commerce_service.repository.ShippingRateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ShippingRateService {

    private final ShippingRateRepository shippingRateRepository;
    private final ShippingRateMapper shippingRateMapper;

    public ShippingRateDto calculateShipping(ShippingCalculationRequest request) {
        Optional<ShippingRate> rateOpt = shippingRateRepository.findByPincodeAndActiveTrue(request.getPincode());
        if (rateOpt.isEmpty()) {
            return ShippingRateDto.builder()
                    .pincode(request.getPincode())
                    .cost(BigDecimal.ZERO)
                    .freeAbove(BigDecimal.ZERO)
                    .estimatedDaysMin(0)
                    .estimatedDaysMax(0)
                    .carrier("N/A")
                    .active(false)
                    .build();
        }
        ShippingRate rate = rateOpt.get();
        BigDecimal cost = rate.getCost();
        if (rate.getFreeAbove() != null && request.getSubtotal().compareTo(rate.getFreeAbove()) >= 0) {
            cost = BigDecimal.ZERO;
        }
        return shippingRateMapper.toDto(rate).toBuilder()
                .cost(cost)
                .build();
    }

    public List<ShippingRateDto> getAllRates() {
        return shippingRateRepository.findAll()
                .stream()
                .map(shippingRateMapper::toDto)
                .toList();
    }

    public ShippingRateDto createRate(ShippingRateDto dto) {
        ShippingRate rate = ShippingRate.builder()
                .pincode(dto.getPincode())
                .cost(dto.getCost())
                .freeAbove(dto.getFreeAbove())
                .estimatedDaysMin(dto.getEstimatedDaysMin())
                .estimatedDaysMax(dto.getEstimatedDaysMax())
                .carrier(dto.getCarrier())
                .active(dto.isActive())
                .build();
        ShippingRate saved = shippingRateRepository.save(rate);
        return shippingRateMapper.toDto(saved);
    }

    public ShippingRateDto updateRate(UUID id, ShippingRateDto dto) {
        ShippingRate rate = shippingRateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Shipping rate not found"));
        rate.setPincode(dto.getPincode());
        rate.setCost(dto.getCost());
        rate.setFreeAbove(dto.getFreeAbove());
        rate.setEstimatedDaysMin(dto.getEstimatedDaysMin());
        rate.setEstimatedDaysMax(dto.getEstimatedDaysMax());
        rate.setCarrier(dto.getCarrier());
        rate.setActive(dto.isActive());
        ShippingRate saved = shippingRateRepository.save(rate);
        return shippingRateMapper.toDto(saved);
    }

    public void deleteRate(UUID id) {
        shippingRateRepository.deleteById(id);
    }
}
