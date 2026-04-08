package com.ecommerce.product_service.dto.product;


import com.ecommerce.product_service.dto.category.CategoryMapper;
import com.ecommerce.product_service.dto.comment.CommentMapper;
import com.ecommerce.product_service.model.Comment;
import com.ecommerce.product_service.model.Product;
import com.ecommerce.product_service.model.ProductModel;
import lombok.RequiredArgsConstructor;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
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


    public ProductSearchDto productSearchDtoMapper(SearchHit<ProductModel> productModel){
        return ProductSearchDto.builder()
                .name(productModel.getContent().getName())
                .id(productModel.getContent().getId())
                .unitPrice(productModel.getContent().getUnitPrice())
                .description(productModel.getContent().getDescription())
                .categoryName(productModel.getContent().getCategoryName())
                .createdDate(productModel.getContent().getCreatedDate())
                .imageUrl(productModel.getContent().getImageUrl())
                .build();
    }

}