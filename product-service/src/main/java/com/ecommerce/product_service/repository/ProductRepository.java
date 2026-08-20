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
            + "AND ( :filter = '' OR c.name = :filter )")
    Page<Product> searchProducts(@Param("searchTerm") String searchTerm, @Param("filter") String filter, Pageable pageable);
}