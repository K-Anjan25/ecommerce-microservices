package com.ecommerce.commerce_service.service;

import com.ecommerce.commerce_service.dto.wishlist.CreateWishlistItemRequest;
import com.ecommerce.commerce_service.dto.wishlist.WishlistItemDto;
import com.ecommerce.commerce_service.model.WishlistItem;
import com.ecommerce.commerce_service.repository.WishlistRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class WishlistService {

    private final WishlistRepository wishlistRepository;

    public List<WishlistItemDto> getWishlist(java.util.UUID userId) {
        return wishlistRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public WishlistItemDto addItem(java.util.UUID userId, CreateWishlistItemRequest request) {
        if (wishlistRepository.findByUserIdAndProductId(userId, request.getProductId()).isPresent()) {
            return toDto(wishlistRepository.findByUserIdAndProductId(userId, request.getProductId()).get());
        }
        WishlistItem item = WishlistItem.builder()
                .userId(userId)
                .productId(request.getProductId())
                .productName(request.getProductName())
                .unitPrice(request.getUnitPrice())
                .imageUrl(request.getImageUrl())
                .createdAt(LocalDateTime.now())
                .build();
        return toDto(wishlistRepository.save(item));
    }

    @Transactional
    public void removeItem(java.util.UUID userId, java.util.UUID productId) {
        wishlistRepository.deleteByUserIdAndProductId(userId, productId);
        log.info("Product {} removed from wishlist of user {}", productId, userId);
    }

    @Transactional
    public void clear(java.util.UUID userId) {
        wishlistRepository.deleteByUserId(userId);
    }

    private WishlistItemDto toDto(WishlistItem item) {
        return WishlistItemDto.builder()
                .id(item.getId())
                .productId(item.getProductId())
                .productName(item.getProductName())
                .unitPrice(item.getUnitPrice())
                .imageUrl(item.getImageUrl())
                .createdAt(item.getCreatedAt())
                .build();
    }
}