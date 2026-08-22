package com.ecommerce.commerce_service.controller;

import com.ecommerce.commerce_service.dto.payment.PaymentRequest;
import com.ecommerce.commerce_service.dto.payment.PaymentResponse;
import com.ecommerce.commerce_service.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.UUID;

@RestController
@RequestMapping("/v1/payments")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping
    public ResponseEntity<PaymentResponse> makePayment(@Valid @RequestBody PaymentRequest request,
                                                       // Optional so guest checkout (no AuthFilter → no header) works;
                                                       // logged-in requests are forwarded by the gateway with userId set.
                                                       @RequestHeader(value = "userId", required = false) String userId) {
        log.info("payment request received for order {} from user {}", request.getOrderId(), userId);
        UUID customerUuid = (userId == null || userId.isBlank()) ? null : UUID.fromString(userId);
        return new ResponseEntity<>(paymentService.processPayment(request, customerUuid), HttpStatus.CREATED);
    }

    @GetMapping("/test")
    public String test() {
        return "Payment Service is running";
    }
}
