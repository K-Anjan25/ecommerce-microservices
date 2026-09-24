package com.ecommerce.commerce_service.service;

import com.ecommerce.commerce_service.dto.shippingRate.InternationalQuoteRequest;
import com.ecommerce.commerce_service.dto.shippingRate.InternationalQuoteResponse;
import com.ecommerce.commerce_service.dto.shippingRate.ShippingZoneDto;
import com.ecommerce.commerce_service.model.ShippingZone;
import com.ecommerce.commerce_service.repository.ShippingZoneRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/**
 * Zone-based international delivery. Zones carry the flat shipping cost and
 * the import duty/VAT rate; quotes are computed in INR like the rest of the
 * catalog.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ShippingZoneService {

    private final ShippingZoneRepository repository;

    /** True when the country is covered by an active zone. */
    @Transactional(readOnly = true)
    public boolean isServiceable(String country) {
        return findZoneFor(country) != null;
    }

    /** The active zone covering the country, or null when unserviceable. */
    @Transactional(readOnly = true)
    public ShippingZone findZoneFor(String country) {
        String code = normalize(country);
        if (code.isEmpty()) {
            return null;
        }
        for (ShippingZone zone : repository.findByActiveTrue()) {
            if (zoneCountries(zone).contains(code)) {
                return zone;
            }
        }
        return null;
    }

    /** Quote for the storefront and checkout summaries. */
    @Transactional(readOnly = true)
    public InternationalQuoteResponse quote(InternationalQuoteRequest request) {
        String country = normalize(request.getCountry());
        ShippingZone zone = findZoneFor(country);
        if (zone == null) {
            return InternationalQuoteResponse.builder()
                    .country(country)
                    .available(false)
                    .cost(BigDecimal.ZERO)
                    .dutyEstimate(BigDecimal.ZERO)
                    .build();
        }
        BigDecimal cost = zone.getCost();
        if (zone.getFreeAbove() != null
                && request.getSubtotal().compareTo(zone.getFreeAbove()) >= 0) {
            cost = BigDecimal.ZERO;
        }
        BigDecimal duty = request.getSubtotal().multiply(zone.getDutyRate())
                .setScale(2, RoundingMode.HALF_UP);
        return InternationalQuoteResponse.builder()
                .country(country)
                .available(true)
                .zoneName(zone.getName())
                .cost(cost)
                .freeAbove(zone.getFreeAbove())
                .estimatedDaysMin(zone.getEstimatedDaysMin())
                .estimatedDaysMax(zone.getEstimatedDaysMax())
                .carrier(zone.getCarrier())
                .dutyEstimate(duty)
                .dutyName(zone.getDutyName())
                .dutyRate(zone.getDutyRate())
                .build();
    }

    /** Zone lookup for order pricing; throws when the destination is unserviceable. */
    @Transactional(readOnly = true)
    public ShippingZone requireZone(String country) {
        ShippingZone zone = findZoneFor(country);
        if (zone == null) {
            throw new IllegalArgumentException(
                    "We don't ship to " + country.toUpperCase() + " yet. Choose another delivery country.");
        }
        return zone;
    }

    @Transactional(readOnly = true)
    public List<ShippingZoneDto> getAllZones() {
        return repository.findAll().stream().map(this::toDto).collect(java.util.stream.Collectors.toList());
    }

    @Transactional
    public ShippingZoneDto createZone(ShippingZoneDto dto) {
        ShippingZone saved = repository.save(ShippingZone.builder()
                .name(dto.getName())
                .countries(normalizeCountryList(dto.getCountries()))
                .cost(dto.getCost())
                .freeAbove(dto.getFreeAbove())
                .estimatedDaysMin(dto.getEstimatedDaysMin())
                .estimatedDaysMax(dto.getEstimatedDaysMax())
                .carrier(dto.getCarrier())
                .dutyRate(dto.getDutyRate())
                .dutyName(dto.getDutyName() == null || dto.getDutyName().isBlank()
                        ? "Import duty & VAT" : dto.getDutyName())
                .active(dto.isActive())
                .build());
        return toDto(saved);
    }

    @Transactional
    public ShippingZoneDto updateZone(UUID id, ShippingZoneDto dto) {
        ShippingZone zone = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Shipping zone not found"));
        zone.setName(dto.getName());
        zone.setCountries(normalizeCountryList(dto.getCountries()));
        zone.setCost(dto.getCost());
        zone.setFreeAbove(dto.getFreeAbove());
        zone.setEstimatedDaysMin(dto.getEstimatedDaysMin());
        zone.setEstimatedDaysMax(dto.getEstimatedDaysMax());
        zone.setCarrier(dto.getCarrier());
        zone.setDutyRate(dto.getDutyRate());
        if (dto.getDutyName() != null && !dto.getDutyName().isBlank()) {
            zone.setDutyName(dto.getDutyName());
        }
        zone.setActive(dto.isActive());
        return toDto(repository.save(zone));
    }

    @Transactional
    public void deleteZone(UUID id) {
        repository.deleteById(id);
    }

    private List<String> zoneCountries(ShippingZone zone) {
        return Arrays.stream(zone.getCountries().split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(java.util.stream.Collectors.toList());
    }

    private String normalize(String country) {
        return country == null ? "" : country.trim().toUpperCase();
    }

    private String normalizeCountryList(String countries) {
        return Arrays.stream((countries == null ? "" : countries).split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(String::toUpperCase)
                .distinct()
                .collect(java.util.stream.Collectors.joining(","));
    }

    private ShippingZoneDto toDto(ShippingZone zone) {
        return ShippingZoneDto.builder()
                .id(zone.getId())
                .name(zone.getName())
                .countries(zone.getCountries())
                .cost(zone.getCost())
                .freeAbove(zone.getFreeAbove())
                .estimatedDaysMin(zone.getEstimatedDaysMin())
                .estimatedDaysMax(zone.getEstimatedDaysMax())
                .carrier(zone.getCarrier())
                .dutyRate(zone.getDutyRate())
                .dutyName(zone.getDutyName())
                .active(zone.isActive())
                .build();
    }
}
