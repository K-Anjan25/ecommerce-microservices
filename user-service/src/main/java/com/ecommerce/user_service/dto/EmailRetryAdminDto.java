package com.ecommerce.user_service.dto;

import com.ecommerce.user_service.model.EmailRetryEvent;
import com.ecommerce.user_service.model.EmailRetryStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

/** Safe operations projection; encrypted email payloads are never exposed. */
@Getter
@Builder
public class EmailRetryAdminDto {
    private UUID id;
    private EmailRetryStatus status;
    private Integer attempts;
    private LocalDateTime createdAt;
    private LocalDateTime lastAttemptAt;
    private LocalDateTime nextAttemptAt;

    public static EmailRetryAdminDto from(EmailRetryEvent event) {
        return EmailRetryAdminDto.builder()
                .id(event.getId())
                .status(event.getStatus() == null ? EmailRetryStatus.PENDING : event.getStatus())
                .attempts(event.getAttempts())
                .createdAt(event.getCreatedAt())
                .lastAttemptAt(event.getLastAttemptAt())
                .nextAttemptAt(event.getNextAttemptAt())
                .build();
    }
}
