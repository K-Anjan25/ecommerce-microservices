package com.ecommerce.product_service.dto.category;

import lombok.Getter;
import lombok.Setter;

/**
 * Drag-and-drop move request: re-parent a category (null parentId = top
 * level) and place it at {@code position} among its new siblings
 * (0-based; clamped to the end).
 */
@Getter
@Setter
public class MoveCategoryRequest {
    private Long parentId;
    private Integer position;
}
