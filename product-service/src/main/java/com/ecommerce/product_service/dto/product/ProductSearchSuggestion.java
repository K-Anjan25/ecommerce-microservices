package com.ecommerce.product_service.dto.product;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

/** Lightweight visual-autocomplete result; deliberately excludes product description and inventory. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductSearchSuggestion {
    private UUID id;
    private String name;
    private String brand;
    private String category;
    private BigDecimal unitPrice;
    private String imageUrl;
}
