package com.ecommerce.commerce_service.controller;

import com.ecommerce.commerce_service.dto.coupon.CouponDto;
import com.ecommerce.commerce_service.dto.coupon.CouponValidationRequest;
import com.ecommerce.commerce_service.dto.coupon.CouponValidationResponse;
import com.ecommerce.commerce_service.dto.coupon.CreateCouponRequest;
import com.ecommerce.commerce_service.service.CouponService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.UUID;

@RestController
@RequestMapping("/v1/coupons")
@RequiredArgsConstructor
@Slf4j
public class CouponController {

    private final CouponService couponService;

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN')")
    public ResponseEntity<CouponDto> createCoupon(@Valid @RequestBody CreateCouponRequest request) {
        return new ResponseEntity<>(couponService.createCoupon(request), HttpStatus.CREATED);
    }

    @PostMapping("/validate")
    public ResponseEntity<CouponValidationResponse> validateCoupon(@Valid @RequestBody CouponValidationRequest request,
                                                                   @RequestHeader("userId") String userId) {
        log.info("Coupon validation requested for code {} by user {}", request.getCode(), userId);
        return ResponseEntity.ok(couponService.validateCoupon(request, UUID.fromString(userId)));
    }
}