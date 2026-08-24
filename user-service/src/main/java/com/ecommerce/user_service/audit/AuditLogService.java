package com.ecommerce.user_service.audit;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLogService {
    private final AuditLogRepository repository;

    public void record(String action, String targetType, String targetId, String details) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String actor = authentication == null ? "system" : String.valueOf(authentication.getPrincipal());
        try {
            repository.save(AuditLog.builder().actorId(actor).action(action).targetType(targetType)
                    .targetId(targetId).details(details).createdAt(LocalDateTime.now()).build());
        } catch (RuntimeException exception) {
            // Auditing must never roll back the business mutation it describes.
            log.error("Could not persist audit event {} for {} {}", action, targetType, targetId, exception);
        }
    }

    public List<AuditLog> latest() { return repository.findTop100ByOrderByCreatedAtDesc(); }
}
