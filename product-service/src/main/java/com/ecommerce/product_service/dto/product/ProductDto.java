package com.ecommerce.product_service.dto.product;

import com.ecommerce.product_service.dto.category.CategoryDto;
import com.ecommerce.product_service.dto.comment.CommentDto;
import com.ecommerce.product_service.dto.product.variant.ProductVariantDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProductDto {
    private UUID id;
    private String name;
    private BigDecimal unitPrice;
    private BigDecimal originalPrice;
    private String brand;
    private String badge;
    private boolean featured;
    private CategoryDto category;
    private String description;
    private LocalDateTime createdDate;
    private String imageUrl;
    private List<String> images;
    private List<ProductVariantDto> variants;
    private List<CommentDto> comments;
    private Integer quantityInStock;
    private Double avgRating;
    private Long ratingCount;
    private BigDecimal flashPrice;
    private LocalDateTime flashSaleEndsAt;
    private boolean flashSaleActive;
}