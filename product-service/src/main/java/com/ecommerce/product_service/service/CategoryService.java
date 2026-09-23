package com.ecommerce.product_service.service;

import com.ecommerce.product_service.dto.category.CategoryDto;
import com.ecommerce.product_service.dto.category.CategoryMapper;
import com.ecommerce.product_service.dto.category.CreateCategoryRequest;
import com.ecommerce.product_service.dto.category.UpdateCategoryRequest;
import com.ecommerce.product_service.exception.CategoryInUseException;
import com.ecommerce.product_service.exception.CategoryNotFoundException;
import com.ecommerce.product_service.model.Category;
import com.ecommerce.product_service.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

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
                    throw new CategoryNotFoundException("Category with id " + id + " could not be found!");
                });
    }

    @Transactional
    public CategoryDto createCategory(CreateCategoryRequest createCategoryRequest) {
        String name = createCategoryRequest.getName().trim();
        String slug = createCategoryRequest.getSlug();
        if (slug == null || slug.isBlank()) {
            slug = slugify(name);
        } else {
            slug = slugify(slug);
        }
        Category category = Category.builder()
                .name(name)
                .slug(slug)
                .parentId(createCategoryRequest.getParentId())
                .sortOrder(createCategoryRequest.getSortOrder())
                .build();

        return categoryMapper.categoryToCategoryDto(categoryRepository.save(category));
    }

    /**
     * Rename / re-parent / re-order a category. Name changes regenerate the
     * slug unless an explicit slug is supplied.
     */
    @Transactional
    public CategoryDto updateCategory(Long id, UpdateCategoryRequest request) {
        Category category = getCategoryById(id);
        String newName = request.getName().trim();
        boolean nameChanged = !newName.equalsIgnoreCase(category.getName());
        category.setName(newName);
        if (request.getSlug() != null && !request.getSlug().isBlank()) {
            category.setSlug(slugify(request.getSlug()));
        } else if (nameChanged || category.getSlug() == null || category.getSlug().isBlank()) {
            category.setSlug(slugify(newName));
        }
        if (request.getParentId() != null) {
            if (request.getParentId().equals(id)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "A category cannot be its own parent");
            }
            category.setParentId(request.getParentId());
        }
        if (request.getSortOrder() != null) {
            category.setSortOrder(request.getSortOrder());
        }
        return categoryMapper.categoryToCategoryDto(categoryRepository.save(category));
    }

    /**
     * Delete an empty category. Categories with assigned products are refused
     * (409) so the catalog never loses product associations by accident.
     */
    @Transactional
    public void deleteCategory(Long id) {
        Category category = getCategoryById(id);
        long inUse = categoryRepository.countProductsInCategory(id);
        if (inUse > 0) {
            throw new CategoryInUseException(
                    "Category still has " + inUse + " product(s) assigned. Move or remove them first.");
        }
        categoryRepository.delete(category);
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
