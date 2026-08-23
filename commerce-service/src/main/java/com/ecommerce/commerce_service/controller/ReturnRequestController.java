package com.ecommerce.commerce_service.controller;

import com.ecommerce.commerce_service.audit.AuditLogService;
import com.ecommerce.commerce_service.dto.returnRequest.CreateReturnRequest;
import com.ecommerce.commerce_service.dto.returnRequest.ReturnRequestDto;
import com.ecommerce.commerce_service.service.ReturnRequestService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@Slf4j
@RequestMapping("/v1/returns")
public class ReturnRequestController {
    private final ReturnRequestService returnRequestService;
    private final AuditLogService auditLogService;

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_USER', 'ROLE_ADMIN')")
    public ResponseEntity<ReturnRequestDto> createReturnRequest(@Valid @RequestBody CreateReturnRequest createReturnRequest){
        return new ResponseEntity<>(returnRequestService.createReturnRequest(createReturnRequest), HttpStatus.CREATED);
    }

    @GetMapping("/order/{orderId}")
    @PreAuthorize("hasAnyAuthority('ROLE_USER', 'ROLE_ADMIN')")
    public ResponseEntity<List<ReturnRequestDto>> getReturnRequestsByOrder(@PathVariable UUID orderId){
        List<ReturnRequestDto> requests = returnRequestService.getReturnRequestsByOrder(orderId);
        if (!isStaff() && requests.stream().anyMatch(request ->
                request.getCustomerId() == null || !request.getCustomerId().toString().equals(currentPrincipal()))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(requests);
    }

    @GetMapping("/my")
    @PreAuthorize("hasAnyAuthority('ROLE_USER', 'ROLE_ADMIN')")
    public ResponseEntity<List<ReturnRequestDto>> getMyReturnRequests(){
        String customerId = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return ResponseEntity.ok(returnRequestService.getReturnRequestsByCustomer(UUID.fromString(customerId)));
    }

    /** Admin refund/returns queue: every return request, newest first. */
    @GetMapping("/all")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MANAGER')")
    public ResponseEntity<List<ReturnRequestDto>> getAllReturnRequests(){
        return ResponseEntity.ok(returnRequestService.getAllReturnRequests());
    }

    @PostMapping("/{returnRequestId}/approve")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MANAGER')")
    public ResponseEntity<ReturnRequestDto> approveReturnRequest(@PathVariable UUID returnRequestId){
        ReturnRequestDto result = returnRequestService.approveReturnRequest(returnRequestId);
        auditLogService.record("RETURN_APPROVED", "RETURN", returnRequestId.toString(), null);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{returnRequestId}/reject")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MANAGER')")
    public ResponseEntity<ReturnRequestDto> rejectReturnRequest(@PathVariable UUID returnRequestId, @RequestParam String reason){
        ReturnRequestDto result = returnRequestService.rejectReturnRequest(returnRequestId, reason);
        auditLogService.record("RETURN_REJECTED", "RETURN", returnRequestId.toString(), reason);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{returnRequestId}/refund")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MANAGER')")
    public ResponseEntity<ReturnRequestDto> refundReturnRequest(@PathVariable UUID returnRequestId){
        ReturnRequestDto result = returnRequestService.refundReturnRequest(returnRequestId);
        auditLogService.record("RETURN_REFUNDED", "RETURN", returnRequestId.toString(),
                result.getRefundAmount() == null ? null : result.getRefundAmount().toPlainString());
        return ResponseEntity.ok(result);
    }

    private String currentPrincipal() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication == null ? "" : String.valueOf(authentication.getPrincipal());
    }

    private boolean isStaff() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && authentication.getAuthorities().stream()
                .map(authority -> authority.getAuthority())
                .anyMatch(role -> role.equals("ROLE_ADMIN") || role.equals("ROLE_MANAGER")
                        || role.equals("ROLE_SUPER_ADMIN"));
    }
}
