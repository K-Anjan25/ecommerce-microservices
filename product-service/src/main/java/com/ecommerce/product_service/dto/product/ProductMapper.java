package com.ecommerce.product_service.dto.product;

import com.ecommerce.product_service.dto.category.CategoryMapper;
import com.ecommerce.product_service.dto.comment.CommentMapper;
import com.ecommerce.product_service.dto.product.variant.ProductVariantDto;
import com.ecommerce.product_service.inventory.repository.InventoryRepository;
import com.ecommerce.product_service.model.Comment;
import com.ecommerce.product_service.model.FlashSale;
import com.ecommerce.product_service.model.Product;
import com.ecommerce.product_service.repository.FlashSaleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class ProductMapper {
    private final CategoryMapper categoryMapper;
    private final CommentMapper commentMapper;
    private final InventoryRepository inventoryRepository;
    private final FlashSaleRepository flashSaleRepository;

    private Integer stockOf(Product product) {
        if (product.getVariants() != null && !product.getVariants().isEmpty()) {
            return product.getVariants().stream()
                    .mapToInt(v -> v.getQuantityInStock() == null ? 0 : v.getQuantityInStock())
                    .sum();
        }
        var inventory = inventoryRepository.getByProductId(product.getId());
        return inventory == null ? null : inventory.getQuantity();
    }

    private List<String> imageUrls(Product product) {
        if (product.getImages() == null || product.getImages().isEmpty()) {
            return product.getImageUrl() == null ? List.of()
                    : java.util.Collections.singletonList(product.getImageUrl());
        }
        return product.getImages().stream()
                .sorted(Comparator.comparing(img -> img.getSortOrder() == null ? 0 : img.getSortOrder()))
                .map(img -> img.getUrl())
                .collect(Collectors.toList());
    }

    private List<ProductVariantDto> variantDtos(Product product) {
        if (product.getVariants() == null) {
            return List.of();
        }
        return product.getVariants().stream()
                .map(v -> {
                    var dto = new ProductVariantDto();
                    dto.setId(v.getId());
                    dto.setName(v.getName());
                    dto.setSku(v.getSku());
                    dto.setPrice(v.getPrice());
                    dto.setQuantityInStock(v.getQuantityInStock());
                    dto.setAttributes(v.getAttributes());
                    return dto;
                })
                .collect(Collectors.toList());
    }

    private double avgRating(Product product) {
        if (product.getComments() == null || product.getComments().isEmpty()) {
            return 0.0;
        }
        return product.getComments().stream()
                .filter(c -> c.getRating() != null)
                .mapToInt(Comment::getRating)
                .average()
                .orElse(0.0);
    }

    private long ratingCount(Product product) {
        if (product.getComments() == null) {
            return 0L;
        }
        return product.getComments().stream().filter(c -> c.getRating() != null).count();
    }

    public ProductDto productToProductDto(Product product){
        ProductDto dto = new ProductDto();
        dto.setName(product.getName());
        dto.setId(product.getId());
        dto.setUnitPrice(product.getUnitPrice());
        dto.setOriginalPrice(product.getOriginalPrice());
        dto.setBrand(product.getBrand());
        dto.setBadge(product.getBadge() == null ? "NONE" : product.getBadge());
        dto.setFeatured(product.isFeatured());
        dto.setDescription(product.getDescription());
        dto.setCategory(categoryMapper.categoryToCategoryDto(product.getCategory()));
        dto.setCreatedDate(product.getCreatedDate());
        dto.setImageUrl(product.getImageUrl());
        dto.setImages(imageUrls(product));
        dto.setVariants(variantDtos(product));
        dto.setQuantityInStock(stockOf(product));
        dto.setAvgRating(avgRating(product));
        dto.setRatingCount(ratingCount(product));
        dto.setComments(product.getComments() == null ? List.of() : product.getComments().stream().map(commentMapper::commentToCommentDto).collect(Collectors.toList()));
        
        var flashSale = flashSaleRepository.findByProductId(product.getId()).orElse(null);
        if (flashSale != null && flashSale.isActive() && flashSale.getEndsAt().isAfter(LocalDateTime.now())) {
            dto.setFlashPrice(flashSale.getFlashPrice());
            dto.setFlashSaleEndsAt(flashSale.getEndsAt());
            dto.setFlashSaleActive(true);
        }
        
        return dto;
    }

    public ProductSearchDto productToProductSearchDto(Product product){
        var builder = ProductSearchDto.builder()
                .name(product.getName())
                .id(product.getId())
                .unitPrice(product.getUnitPrice())
                .originalPrice(product.getOriginalPrice())
                .brand(product.getBrand())
                .badge(product.getBadge() == null ? "NONE" : product.getBadge())
                .featured(product.isFeatured())
                .description(product.getDescription())
                .categoryName(product.getCategory() == null ? null : product.getCategory().getName())
                .createdDate(product.getCreatedDate() == null ? null : product.getCreatedDate().toLocalDate())
                .imageUrl(product.getImageUrl())
                .images(imageUrls(product))
                .quantityInStock(stockOf(product))
                .avgRating(avgRating(product))
                .ratingCount(ratingCount(product));
        
        var flashSale = flashSaleRepository.findByProductId(product.getId()).orElse(null);
        if (flashSale != null && flashSale.isActive() && flashSale.getEndsAt().isAfter(LocalDateTime.now())) {
            builder.flashPrice(flashSale.getFlashPrice());
            builder.flashSaleEndsAt(flashSale.getEndsAt());
            builder.flashSaleActive(true);
        }
        
        return builder.build();
    }

}