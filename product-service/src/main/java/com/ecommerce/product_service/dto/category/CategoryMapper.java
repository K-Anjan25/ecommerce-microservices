package com.ecommerce.product_service.dto.category;

import com.ecommerce.product_service.model.Category;
import org.springframework.stereotype.Component;


@Component
public class CategoryMapper {
    public CategoryDto categoryToCategoryDto(Category category){
        return CategoryDto.builder()
                .id(category.getId())
                .name(category.getName())
                .build();
    }

}