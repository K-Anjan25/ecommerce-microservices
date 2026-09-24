package com.ecommerce.user_service.repository;

import com.ecommerce.user_service.model.PhoneOtp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PhoneOtpRepository extends JpaRepository<PhoneOtp, UUID> {

    Optional<PhoneOtp> findByPhoneNumber(String phoneNumber);
}
