package com.ecommerce.commerce_service.controller;

import com.ecommerce.commerce_service.dto.payment.PaymentReconciliationCaseDto;
import com.ecommerce.commerce_service.model.PaymentReconciliationCase;
import com.ecommerce.commerce_service.service.PaymentReconciliationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

/** Read-only operations queue; resolution remains provider-webhook-driven. */
@RestController
@RequestMapping("/v1/payments/reconciliation")
@RequiredArgsConstructor
public class PaymentReconciliationController {
    private final PaymentReconciliationService reconciliationService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public List<PaymentReconciliationCaseDto> list(
            @RequestParam(defaultValue = PaymentReconciliationCase.OPEN) String status) {
        return reconciliationService.findByStatus(status).stream()
                .map(PaymentReconciliationCaseDto::from)
                .collect(Collectors.toList());
    }
}
