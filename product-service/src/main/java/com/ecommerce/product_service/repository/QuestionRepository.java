package com.ecommerce.product_service.repository;

import com.ecommerce.product_service.model.Question;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface QuestionRepository extends JpaRepository<Question, UUID> {

    Page<Question> findByProductIdOrderByCreatedDateDesc(UUID productId, Pageable pageable);

    Page<Question> findAllByOrderByCreatedDateDesc(Pageable pageable);

    long countByAnswerIsNull();
}
