package com.ecommerce.commerce_service.controller;

import com.ecommerce.commerce_service.dto.giftCard.GiftCardDto;
import com.ecommerce.commerce_service.dto.giftCard.PurchaseGiftCardRequest;
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

    @PostMapping("/purchase")
    @PreAuthorize("hasAnyAuthority('ROLE_USER', 'ROLE_ADMIN')")
    public ResponseEntity<GiftCardDto> purchaseGiftCard(@Valid @RequestBody PurchaseGiftCardRequest purchaseGiftCardRequest){
        UUID purchasedBy = UUID.fromString((String) org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getPrincipal());
        return new ResponseEntity<>(giftCardService.purchaseGiftCard(purchaseGiftCardRequest, purchasedBy), HttpStatus.CREATED);
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_USER', 'ROLE_ADMIN')")
    public ResponseEntity<List<GiftCardDto>> getUserGiftCards(){
        UUID userId = UUID.fromString((String) org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getPrincipal());
        return ResponseEntity.ok(giftCardService.getGiftCardsByUser(userId));
    }

}
