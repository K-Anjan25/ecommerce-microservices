package com.ecommerce.commerce_service.support;

import com.ecommerce.commerce_service.dto.support.CreateSupportTicketRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.Map;

/**
 * Customer support tickets. Creation is public (guests can raise tickets);
 * reading and working the queue is staff-only.
 */
@RestController
@RequestMapping("/v1/support")
@RequiredArgsConstructor
public class SupportTicketController {

    private final SupportTicketService service;

    /** Public: the storefront contact form (guests included). */
    @PostMapping("/tickets")
    public ResponseEntity<SupportTicket> create(
            @Valid @RequestBody CreateSupportTicketRequest request,
            @RequestHeader(value = "userId", required = false) String customerId) {
        SupportTicket ticket = service.create(request, customerId);
        return new ResponseEntity<>(ticket, HttpStatus.CREATED);
    }

    /** Staff queue, newest first. */
    @GetMapping("/tickets")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<SupportTicket>> queue(
            @RequestParam(name = "status", required = false) String status) {
        return ResponseEntity.ok(service.latest(status));
    }

    /** Staff: single ticket by its customer-facing reference. */
    @GetMapping("/tickets/{ticketRef}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<SupportTicket> byRef(@PathVariable String ticketRef) {
        return ResponseEntity.ok(service.byRef(ticketRef));
    }

    /** Staff: move a ticket OPEN → IN_PROGRESS → RESOLVED. */
    @PostMapping("/tickets/{ticketRef}/status")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<SupportTicket> updateStatus(
            @PathVariable String ticketRef,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(service.updateStatus(ticketRef, body.get("status")));
    }
}
