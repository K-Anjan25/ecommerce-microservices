package com.ecommerce.commerce_service.support;

import com.ecommerce.commerce_service.dto.support.CreateSupportTicketRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SupportTicketService {

    private static final String REF_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    private final SupportTicketRepository repository;
    private final com.ecommerce.commerce_service.membership.MembershipService membershipService;
    private final SecureRandom random = new SecureRandom();

    @Transactional
    public SupportTicket create(CreateSupportTicketRequest request, String customerId) {
        // Cartly Plus priority support lane: members' tickets are raised HIGH
        // so the support queue surfaces them first.
        boolean plus = false;
        if (customerId != null && !customerId.isBlank()) {
            try {
                plus = membershipService.isPlusActive(UUID.fromString(customerId.trim()));
            } catch (IllegalArgumentException ignored) {
                plus = false;
            }
        }
        SupportTicket ticket = SupportTicket.builder()
                .ticketRef(nextTicketRef())
                .name(request.getName().trim())
                .email(request.getEmail().trim().toLowerCase())
                .topic(request.getTopic().trim())
                .orderNumber(request.getOrderNumber() == null ? null : request.getOrderNumber().trim())
                .message(request.getMessage().trim())
                .status(SupportTicket.STATUS_OPEN)
                .customerId(customerId)
                .priority(plus ? "HIGH" : "NORMAL")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        SupportTicket saved = repository.save(ticket);
        log.info("Support ticket {} created (topic={}, orderNumber={})",
                saved.getTicketRef(), saved.getTopic(), saved.getOrderNumber());
        return saved;
    }

    @Transactional(readOnly = true)
    public List<SupportTicket> latest(String status) {
        if (status == null || status.isBlank() || "ALL".equalsIgnoreCase(status)) {
            return repository.findTop200ByOrderByCreatedAtDesc();
        }
        return repository.findTop200ByStatusOrderByCreatedAtDesc(status.toUpperCase());
    }

    @Transactional(readOnly = true)
    public SupportTicket byRef(String ticketRef) {
        return repository.findByTicketRef(normalizeRef(ticketRef))
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found: " + ticketRef));
    }

    @Transactional
    public SupportTicket updateStatus(String ticketRef, String status) {
        String normalized = status == null ? "" : status.trim().toUpperCase();
        if (!SupportTicket.STATUS_OPEN.equals(normalized)
                && !SupportTicket.STATUS_IN_PROGRESS.equals(normalized)
                && !SupportTicket.STATUS_RESOLVED.equals(normalized)) {
            throw new IllegalArgumentException("Invalid status: " + status);
        }
        SupportTicket ticket = byRef(ticketRef);
        ticket.setStatus(normalized);
        ticket.setUpdatedAt(LocalDateTime.now());
        return repository.save(ticket);
    }

    /** Human-readable, collision-checked reference: SUP-<6 chars>. */
    private String nextTicketRef() {
        for (int attempt = 0; attempt < 8; attempt++) {
            StringBuilder sb = new StringBuilder("SUP-");
            for (int i = 0; i < 6; i++) {
                sb.append(REF_ALPHABET.charAt(random.nextInt(REF_ALPHABET.length())));
            }
            String candidate = sb.toString();
            if (!repository.existsByTicketRef(candidate)) {
                return candidate;
            }
        }
        // Practically unreachable; fall back to a time-suffixed ref.
        return "SUP-" + Long.toHexString(System.currentTimeMillis()).toUpperCase();
    }

    private String normalizeRef(String ticketRef) {
        return ticketRef == null ? "" : ticketRef.trim().toUpperCase();
    }
}
