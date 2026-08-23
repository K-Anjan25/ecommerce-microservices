package com.ecommerce.commerce_service.controller;

import com.ecommerce.commerce_service.dto.returnRequest.CreateReturnRequest;
import com.ecommerce.commerce_service.dto.returnRequest.ReturnRequestDto;
import com.ecommerce.commerce_service.service.ReturnRequestService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_USER', 'ROLE_ADMIN')")
    public ResponseEntity<ReturnRequestDto> createReturnRequest(@Valid @RequestBody CreateReturnRequest createReturnRequest){
        return new ResponseEntity<>(returnRequestService.createReturnRequest(createReturnRequest), HttpStatus.CREATED);
    }

    @GetMapping("/order/{orderId}")
    @PreAuthorize("hasAnyAuthority('ROLE_USER', 'ROLE_ADMIN')")
    public ResponseEntity<List<ReturnRequestDto>> getReturnRequestsByOrder(@PathVariable UUID orderId){
        return ResponseEntity.ok(returnRequestService.getReturnRequestsByOrder(orderId));
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
        return ResponseEntity.ok(returnRequestService.approveReturnRequest(returnRequestId));
    }

    @PostMapping("/{returnRequestId}/reject")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MANAGER')")
    public ResponseEntity<ReturnRequestDto> rejectReturnRequest(@PathVariable UUID returnRequestId, @RequestParam String reason){
        return ResponseEntity.ok(returnRequestService.rejectReturnRequest(returnRequestId, reason));
    }

    @PostMapping("/{returnRequestId}/refund")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MANAGER')")
    public ResponseEntity<ReturnRequestDto> refundReturnRequest(@PathVariable UUID returnRequestId){
        return ResponseEntity.ok(returnRequestService.refundReturnRequest(returnRequestId));
    }
}
