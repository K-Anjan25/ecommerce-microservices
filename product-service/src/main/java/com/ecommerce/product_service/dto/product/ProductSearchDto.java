package com.ecommerce.product_service.dto.product;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Builder
@Getter
@Setter
public class ProductSearchDto{
    private UUID id;
    private String name;
    private BigDecimal unitPrice;
    private BigDecimal originalPrice;
    private String brand;
    private String badge;
    private boolean featured;
    private String categoryName;
    private String description;
    private LocalDate createdDate;
    private String imageUrl;
    private List<String> images;
    private Integer quantityInStock;
    private Double avgRating;
    private Long ratingCount;
    private BigDecimal flashPrice;
    private LocalDateTime flashSaleEndsAt;
    private boolean flashSaleActive;
}