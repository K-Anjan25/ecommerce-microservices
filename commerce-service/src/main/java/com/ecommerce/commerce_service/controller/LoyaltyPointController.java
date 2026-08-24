package com.ecommerce.commerce_service.controller;

import com.ecommerce.commerce_service.dto.loyaltyPoint.LoyaltyPointDto;
import com.ecommerce.commerce_service.service.LoyaltyPointService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@Slf4j
@RequestMapping("/v1/loyalty")
public class LoyaltyPointController {
    private final LoyaltyPointService loyaltyPointService;

    @GetMapping("/balance")
    @PreAuthorize("hasAnyAuthority('ROLE_USER', 'ROLE_ADMIN')")
    public ResponseEntity<Integer> getBalance(){
        UUID customerId = UUID.fromString((String) org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getPrincipal());
        return ResponseEntity.ok(loyaltyPointService.getPointsBalance(customerId));
    }

    @GetMapping("/history")
    @PreAuthorize("hasAnyAuthority('ROLE_USER', 'ROLE_ADMIN')")
    public ResponseEntity<List<LoyaltyPointDto>> getHistory(){
        UUID customerId = UUID.fromString((String) org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getPrincipal());
        return ResponseEntity.ok(loyaltyPointService.getPointsHistory(customerId));
    }

}
