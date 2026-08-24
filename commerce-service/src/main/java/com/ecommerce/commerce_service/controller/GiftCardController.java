package com.ecommerce.commerce_service.controller;

import com.ecommerce.commerce_service.dto.giftCard.GiftCardDto;
import com.ecommerce.commerce_service.audit.AuditLogService;
import com.ecommerce.commerce_service.dto.giftCard.IssueGiftCardRequest;
import com.ecommerce.commerce_service.service.GiftCardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@Slf4j
@RequestMapping("/v1/gift-cards")
public class GiftCardController {
    private final GiftCardService giftCardService;
    private final AuditLogService auditLogService;

    /**
     * Administrative issuance only. Customer self-service issuance is disabled
     * until a provider capture/webhook can prove the stored value was paid for.
     */
    @PostMapping("/issue")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<GiftCardDto> issueGiftCard(@Valid @RequestBody IssueGiftCardRequest request){
        UUID issuedBy = UUID.fromString((String) org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication().getPrincipal());
        GiftCardDto issued = giftCardService.issueGiftCard(request, issuedBy);
        auditLogService.record("GIFT_CARD_ISSUED", "GIFT_CARD", issued.getId().toString(),
                "amount=" + issued.getInitialBalance() + ", expires=" + issued.getExpiryDate()
                        + ", reason=" + request.getReason());
        return new ResponseEntity<>(issued, HttpStatus.CREATED);
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_USER', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<GiftCardDto>> getUserGiftCards(){
        UUID userId = UUID.fromString((String) org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getPrincipal());
        return ResponseEntity.ok(giftCardService.getGiftCardsByUser(userId));
    }

}
