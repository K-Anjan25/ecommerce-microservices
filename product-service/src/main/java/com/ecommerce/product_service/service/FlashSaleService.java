package com.ecommerce.product_service.service;

import com.ecommerce.product_service.dto.flashSale.FlashSaleDto;
import com.ecommerce.product_service.model.FlashSale;
import com.ecommerce.product_service.model.Product;
import com.ecommerce.product_service.repository.FlashSaleRepository;
import com.ecommerce.product_service.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FlashSaleService {
    private final FlashSaleRepository flashSaleRepository;
    private final ProductRepository productRepository;

    public FlashSaleDto createFlashSale(FlashSaleDto flashSaleDto) {
        Product product = productRepository.findById(flashSaleDto.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found"));
        if (flashSaleDto.getStartsAt() == null || flashSaleDto.getEndsAt() == null
                || !flashSaleDto.getEndsAt().isAfter(flashSaleDto.getStartsAt())) {
            throw new IllegalArgumentException("Flash sale must end after it starts");
        }
        flashSaleRepository.findByProductId(flashSaleDto.getProductId()).ifPresent(existing -> {
            throw new IllegalArgumentException(
                    "Product already has a flash sale; delete it before creating a new one");
        });
        FlashSale flashSale = FlashSale.builder()
                .product(product)
                .flashPrice(flashSaleDto.getFlashPrice())
                .startsAt(flashSaleDto.getStartsAt())
                .endsAt(flashSaleDto.getEndsAt())
                .active(flashSaleDto.isActive())
                .build();
        FlashSale saved = flashSaleRepository.save(flashSale);
        return toDto(saved);
    }

    /** Admin console: every flash sale regardless of window or status. */
    public List<FlashSaleDto> getAllFlashSales() {
        return flashSaleRepository.findAllByOrderByStartsAtDesc()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @org.springframework.transaction.annotation.Transactional
    public void deleteFlashSale(Long id) {
        if (!flashSaleRepository.existsById(id)) {
            throw new IllegalArgumentException("Flash sale not found: " + id);
        }
        flashSaleRepository.deleteById(id);
    }

    public List<FlashSaleDto> getActiveFlashSales() {
        LocalDateTime now = LocalDateTime.now();
        return flashSaleRepository.findByActiveTrueAndStartsAtBeforeAndEndsAtAfterOrderByStartsAtDesc(now, now)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public FlashSaleDto getFlashSaleByProductId(UUID productId) {
        FlashSale flashSale = flashSaleRepository.findByProductId(productId).orElse(null);
        return flashSale != null ? toDto(flashSale) : null;
    }

    private FlashSaleDto toDto(FlashSale flashSale) {
        return FlashSaleDto.builder()
                .id(flashSale.getId())
                .productId(flashSale.getProduct().getId())
                .productName(flashSale.getProduct().getName())
                .flashPrice(flashSale.getFlashPrice())
                .originalPrice(flashSale.getProduct().getUnitPrice())
                .startsAt(flashSale.getStartsAt())
                .endsAt(flashSale.getEndsAt())
                .active(flashSale.isActive())
                .build();
    }
}
