package com.ecommerce.product_service.service;

import com.ecommerce.product_service.dto.category.CategoryDto;
import com.ecommerce.product_service.dto.category.CategoryMapper;
import com.ecommerce.product_service.dto.category.CreateCategoryRequest;
import com.ecommerce.product_service.audit.AuditLogService;
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

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CategoryService {
    private final CategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;
    private final AuditLogService auditLogService;

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
                .description(createCategoryRequest.getDescription())
                .imageUrl(createCategoryRequest.getImageUrl())
                .translations(createCategoryRequest.getTranslations())
                .parentId(createCategoryRequest.getParentId())
                .sortOrder(createCategoryRequest.getSortOrder())
                .build();

        CategoryDto saved = categoryMapper.categoryToCategoryDto(categoryRepository.save(category));
        auditLogService.record("CATEGORY_CREATED", "CATEGORY", saved.getId().toString(), saved.getName());
        return saved;
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
        if (request.getDescription() != null) {
            category.setDescription(request.getDescription().isBlank() ? null : request.getDescription().trim());
        }
        if (request.getImageUrl() != null) {
            category.setImageUrl(request.getImageUrl().isBlank() ? null : request.getImageUrl().trim());
        }
        if (request.getTranslations() != null) {
            category.setTranslations(request.getTranslations().isBlank() ? null : request.getTranslations().trim());
        }
        CategoryDto saved = categoryMapper.categoryToCategoryDto(categoryRepository.save(category));
        auditLogService.record("CATEGORY_UPDATED", "CATEGORY", saved.getId().toString(), saved.getName());
        return saved;
    }

    /**
     * Move a category under another parent (null = top level) and place it at
     * {@code position} among its new siblings. Rejects moves into the
     * category's own subtree, so the tree can never cycle.
     */
    @Transactional
    public CategoryDto moveCategory(Long id, Long newParentId, Integer position_) {
        Category category = getCategoryById(id);
        if (newParentId != null) {
            if (newParentId.equals(id)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "A category cannot be moved under itself");
            }
            Category cursor = getCategoryById(newParentId);
            while (cursor.getParentId() != null) {
                if (cursor.getParentId().equals(id)) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Cannot move a category under one of its own subcategories");
                }
                cursor = getCategoryById(cursor.getParentId());
            }
        }
        category.setParentId(newParentId);
        categoryMapper.categoryToCategoryDto(categoryRepository.save(category));
        int position = position_ == null ? Integer.MAX_VALUE : position_;
        reorder(id, newParentId, position);
        auditLogService.record("CATEGORY_MOVED", "CATEGORY", id.toString(),
                (newParentId == null ? "top level" : "parent " + newParentId) + ", position " + position);
        return categoryMapper.categoryToCategoryDto(getCategoryById(id));
    }

    /** Re-orders {@code id} within its sibling group, reindexing sort orders. */
    private void reorder(Long id, Long parentId, int position) {
        List<Category> siblings = categoryRepository.findAll().stream()
                .filter(c -> (c.getParentId() == null ? Long.valueOf(-1L) : c.getParentId())
                        .equals(parentId == null ? Long.valueOf(-1L) : parentId))
                .sorted(Comparator
                        .comparingInt((Category c) -> c.getSortOrder() == null ? Integer.MAX_VALUE : c.getSortOrder())
                        .thenComparing(Category::getName, Comparator.nullsLast(String::compareTo)))
                .collect(Collectors.toList());
        siblings.removeIf(c -> c.getId().equals(id));
        int index = Math.max(0, Math.min(position, siblings.size()));
        siblings.add(index, categoryRepository.findById(id).orElseThrow());
        for (int i = 0; i < siblings.size(); i++) {
            Category sibling = siblings.get(i);
            sibling.setSortOrder(i * 10);
            categoryRepository.save(sibling);
        }
    }

    /**
     * Delete an empty category. Categories with assigned products are refused
     * (409) so the catalog never loses product associations by accident.
     */
    @Transactional
    public void deleteCategory(Long id) {
        Category category = getCategoryById(id);
        if (categoryRepository.existsByParentId(id)) {
            throw new CategoryInUseException(
                    "Category still has subcategories. Move or delete them first.");
        }
        long inUse = categoryRepository.countProductsInCategory(id);
        if (inUse > 0) {
            throw new CategoryInUseException(
                    "Category still has " + inUse + " product(s) assigned. Move or remove them first.");
        }
        auditLogService.record("CATEGORY_DELETED", "CATEGORY", id.toString(), category.getName());
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
