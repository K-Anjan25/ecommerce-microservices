package com.ecommerce.product_service.repository;

import com.ecommerce.product_service.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;
import java.util.List;

public interface ProductRepository extends JpaRepository<Product, UUID> {
    List<Product> findByIdIn(List<UUID> ids);

    @Query("SELECT p FROM products p JOIN p.category c WHERE "
            + "( :searchTerm = '' "
            + "   OR FUNCTION('similarity', p.name, :searchTerm) > 0.2 "
            + "   OR FUNCTION('similarity', c.name, :searchTerm) > 0.2 "
            + "   OR FUNCTION('similarity', p.description, :searchTerm) > 0.2 "
            + "   OR LOWER(p.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) "
            + "   OR LOWER(c.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) "
            + "   OR LOWER(p.description) LIKE LOWER(CONCAT('%', :searchTerm, '%')) ) "
            + "AND ( :filter = '' OR c.name = :filter ) "
            + "AND ( :brand = '' OR p.brand = :brand ) "
            + "AND ( :minPrice = 0.0 OR p.unitPrice >= :minPrice ) "
            + "AND ( :maxPrice = 0.0 OR p.unitPrice <= :maxPrice ) "
            + "AND ( :minRating = 0.0 OR (SELECT AVG(cm.rating) FROM comments cm WHERE cm.product = p AND cm.rating IS NOT NULL) >= :minRating )")
    Page<Product> searchProducts(@Param("searchTerm") String searchTerm, @Param("filter") String filter,
                                 @Param("brand") String brand, @Param("minPrice") double minPrice,
                                 @Param("maxPrice") double maxPrice, @Param("minRating") double minRating,
                                 Pageable pageable);

    @Query("SELECT DISTINCT p.brand FROM products p WHERE p.brand IS NOT NULL AND p.brand <> '' ORDER BY p.brand")
    List<String> findAllBrands();

    @Query("SELECT new com.ecommerce.product_service.dto.product.ProductSearchSuggestion("
            + "p.id, p.name, p.brand, c.name, p.unitPrice, p.imageUrl) "
            + "FROM products p JOIN p.category c WHERE "
            + "LOWER(p.name) LIKE LOWER(CONCAT('%', :term, '%')) "
            + "OR LOWER(COALESCE(p.brand, '')) LIKE LOWER(CONCAT('%', :term, '%')) "
            + "OR LOWER(c.name) LIKE LOWER(CONCAT('%', :term, '%')) "
            + "OR FUNCTION('similarity', p.name, :term) > 0.2 "
            + "ORDER BY CASE WHEN LOWER(p.name) LIKE LOWER(CONCAT(:term, '%')) THEN 0 ELSE 1 END, "
            + "FUNCTION('similarity', p.name, :term) DESC, p.name ASC")
    List<com.ecommerce.product_service.dto.product.ProductSearchSuggestion> suggestProducts(
            @Param("term") String term, Pageable pageable);

    @Query("SELECT p FROM products p WHERE p.category.id = :categoryId AND p.id != :productId ORDER BY p.createdDate DESC")
    List<Product> findByCategoryIdAndIdNot(@Param("categoryId") Long categoryId, @Param("productId") UUID productId, org.springframework.data.domain.Pageable pageable);
}