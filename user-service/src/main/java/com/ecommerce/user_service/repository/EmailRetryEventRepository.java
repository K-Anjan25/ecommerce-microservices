package com.ecommerce.user_service.repository;

import com.ecommerce.user_service.model.EmailRetryEvent;
import com.ecommerce.user_service.model.EmailRetryStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import javax.persistence.LockModeType;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface EmailRetryEventRepository extends JpaRepository<EmailRetryEvent, UUID> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT e FROM email_retry_events e WHERE (e.status = :status OR e.status IS NULL) "
            + "AND e.nextAttemptAt <= :now ORDER BY e.createdAt ASC")
    List<EmailRetryEvent> findDue(@Param("status") EmailRetryStatus status,
                                  @Param("now") LocalDateTime now,
                                  Pageable pageable);

    List<EmailRetryEvent> findByStatusOrderByCreatedAtAsc(EmailRetryStatus status);

    long countByStatus(EmailRetryStatus status);

    @Modifying
    @Query("DELETE FROM email_retry_events e WHERE e.status = :status AND e.createdAt < :cutoff")
    int deleteDeadBefore(@Param("status") EmailRetryStatus status,
                         @Param("cutoff") LocalDateTime cutoff);
}
