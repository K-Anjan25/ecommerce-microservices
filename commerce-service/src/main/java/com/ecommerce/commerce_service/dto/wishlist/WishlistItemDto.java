package com.ecommerce.commerce_service.dto.wishlist;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WishlistItemDto {
    private UUID id;
    private UUID productId;
    private String productName;
    private BigDecimal unitPrice;
    private String imageUrl;
    private LocalDateTime createdAt;
}