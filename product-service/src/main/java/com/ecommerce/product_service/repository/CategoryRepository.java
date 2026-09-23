package com.ecommerce.product_service.repository;

import com.ecommerce.product_service.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CategoryRepository extends JpaRepository<Category,Long> {

    /** Products currently assigned to a category — blocks unsafe deletes. */
    @Query("SELECT COUNT(p) FROM products p WHERE p.category.id = :categoryId")
    long countProductsInCategory(@Param("categoryId") Long categoryId);
}
