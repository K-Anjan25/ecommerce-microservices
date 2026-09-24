package com.ecommerce.user_service.repository;

import com.ecommerce.user_service.model.EmailMfaCode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface EmailMfaRepository extends JpaRepository<EmailMfaCode, UUID> {

    Optional<EmailMfaCode> findByEmail(String email);
}
