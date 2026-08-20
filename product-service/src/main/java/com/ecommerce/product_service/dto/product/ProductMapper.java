package com.ecommerce.product_service.dto.product;


import com.ecommerce.product_service.dto.category.CategoryMapper;
import com.ecommerce.product_service.dto.comment.CommentMapper;
import com.ecommerce.product_service.model.Comment;
import com.ecommerce.product_service.model.Product;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;
import java.util.List;

@Component
@RequiredArgsConstructor
public class ProductMapper {
    private final CategoryMapper categoryMapper;
    private final CommentMapper commentMapper;
    public ProductDto productToProductDto(Product product){
        return ProductDto.builder()
                .name(product.getName())
                .id(product.getId())
                .unitPrice(product.getUnitPrice())
                .description(product.getDescription())
                .category(categoryMapper.categoryToCategoryDto(product.getCategory()))
                .createdDate(product.getCreatedDate())
                .imageUrl(product.getImageUrl())
                .comments(product.getComments() == null ? List.of() : product.getComments().stream().map(commentMapper::commentToCommentDto).collect(Collectors.toList()))
                .build();
    }

                    // .comments(product.getComments().stream().map(commentMapper::commentToCommentDto).collect(Collectors.toList()))


    public ProductSearchDto productToProductSearchDto(Product product){
        return ProductSearchDto.builder()
                .name(product.getName())
                .id(product.getId())
                .unitPrice(product.getUnitPrice())
                .description(product.getDescription())
                .categoryName(product.getCategory() == null ? null : product.getCategory().getName())
                .createdDate(product.getCreatedDate() == null ? null : product.getCreatedDate().toLocalDate())
                .imageUrl(product.getImageUrl())
                .build();
    }

}