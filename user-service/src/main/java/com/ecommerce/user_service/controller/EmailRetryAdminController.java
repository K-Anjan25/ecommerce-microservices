package com.ecommerce.user_service.controller;

import com.ecommerce.user_service.dto.EmailRetryAdminDto;
import com.ecommerce.user_service.model.EmailRetryStatus;
import com.ecommerce.user_service.service.EmailRetryOutboxService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Read-only email delivery metadata; encrypted payloads are never exposed. */
@RestController
@RequestMapping("/user/email-retries")
@RequiredArgsConstructor
public class EmailRetryAdminController {
    private final EmailRetryOutboxService retryOutboxService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public List<EmailRetryAdminDto> list(
            @RequestParam(defaultValue = "DEAD") EmailRetryStatus status) {
        return retryOutboxService.findByStatus(status);
    }
}
