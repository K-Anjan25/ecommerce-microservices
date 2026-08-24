package com.ecommerce.user_service.repository;

import com.ecommerce.user_service.model.EmailRetryEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Pageable;

import javax.persistence.LockModeType;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface EmailRetryEventRepository extends JpaRepository<EmailRetryEvent, UUID> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT e FROM email_retry_events e WHERE e.nextAttemptAt <= :now ORDER BY e.createdAt ASC")
    List<EmailRetryEvent> findDue(@Param("now") LocalDateTime now, Pageable pageable);
}
