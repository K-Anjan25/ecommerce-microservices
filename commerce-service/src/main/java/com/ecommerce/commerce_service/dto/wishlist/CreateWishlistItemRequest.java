package com.ecommerce.commerce_service.dto.wishlist;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateWishlistItemRequest {

    @NotNull
    private UUID productId;

    private String productName;

    private BigDecimal unitPrice;

    private String imageUrl;
}