package com.ecommerce.commerce_service.repository;

import com.ecommerce.commerce_service.model.SavedPaymentMethod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Explicit JPQL on purpose: the {@code isDefault} field trips Spring Data's
 * derived-query property naming (JavaBeans turns it into "default").
 */
public interface SavedPaymentMethodRepository extends JpaRepository<SavedPaymentMethod, UUID> {

    @Query("select m from saved_payment_methods m where m.userId = :userId"
            + " order by m.isDefault desc, m.createdDate desc")
    List<SavedPaymentMethod> findByUserIdOrderByDefaultFirst(@Param("userId") UUID userId);

    @Query("select m from saved_payment_methods m where m.userId = :userId and m.isDefault = true")
    Optional<SavedPaymentMethod> findDefaultByUserId(@Param("userId") UUID userId);
}
