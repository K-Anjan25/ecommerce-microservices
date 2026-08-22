package com.ecommerce.product_service.service;

import com.ecommerce.product_service.dto.category.CategoryDto;
import com.ecommerce.product_service.dto.category.CategoryMapper;
import com.ecommerce.product_service.dto.category.CreateCategoryRequest;
import com.ecommerce.product_service.exception.CategoryNotFoundException;
import com.ecommerce.product_service.model.Category;
import com.ecommerce.product_service.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CategoryService {
    private final CategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;
    public Category getCategoryById(Long id){
        return categoryRepository.findById(id)
                .orElseThrow(()->{
                    log.error("Category with id: {} could not be found!",id);
                    throw new CategoryNotFoundException("Category with id " + id + "could not be found!");
                });
    }

    public CategoryDto createCategory(CreateCategoryRequest createCategoryRequest) {
        String slug = createCategoryRequest.getSlug();
        if (slug == null || slug.isBlank()) {
            slug = slugify(createCategoryRequest.getName());
        }
        Category category = Category.builder()
                .name(createCategoryRequest.getName())
                .slug(slug)
                .parentId(createCategoryRequest.getParentId())
                .sortOrder(createCategoryRequest.getSortOrder())
                .build();

        return categoryMapper.categoryToCategoryDto(categoryRepository.save(category));
    }

    public List<CategoryDto> getAllCategories(){
        return categoryRepository.findAll().stream()
                .map(categoryMapper::categoryToCategoryDto)
                .collect(Collectors.toList());
    }

    public List<CategoryDto> getCategoryTree(){
        return categoryMapper.toTree(categoryRepository.findAll());
    }

    private String slugify(String name) {
        return name.toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-|-$", "");
    }
}