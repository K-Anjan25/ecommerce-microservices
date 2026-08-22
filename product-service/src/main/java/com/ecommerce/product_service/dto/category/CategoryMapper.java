package com.ecommerce.product_service.dto.category;

import com.ecommerce.product_service.model.Category;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class CategoryMapper {
    public CategoryDto categoryToCategoryDto(Category category){
        return CategoryDto.builder()
                .id(category.getId())
                .name(category.getName())
                .slug(category.getSlug())
                .parentId(category.getParentId())
                .sortOrder(category.getSortOrder())
                .build();
    }

    public List<CategoryDto> toTree(List<Category> categories) {
        Map<Long, List<CategoryDto>> byParent = categories.stream()
                .map(this::categoryToCategoryDto)
                .sorted(Comparator.comparingInt(d -> d.getSortOrder() == null ? Integer.MAX_VALUE : d.getSortOrder()))
                .collect(Collectors.groupingBy(d -> d.getParentId() == null ? -1L : d.getParentId()));

        List<CategoryDto> roots = byParent.getOrDefault(-1L, new ArrayList<>());
        roots.forEach(root -> root.setChildren(buildChildren(root.getId(), byParent)));
        return roots;
    }

    private List<CategoryDto> buildChildren(Long parentId, Map<Long, List<CategoryDto>> byParent) {
        List<CategoryDto> children = byParent.getOrDefault(parentId, new ArrayList<>());
        children.forEach(child -> child.setChildren(buildChildren(child.getId(), byParent)));
        return children;
    }
}