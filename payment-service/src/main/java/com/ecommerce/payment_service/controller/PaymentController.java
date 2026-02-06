package com.ecommerce.payment_service.controller;

import com.ecommerce.payment_service.entity.Payment;
import com.ecommerce.payment_service.dto.PaymentRequest;
import com.ecommerce.payment_service.repository.PaymentRepository;
import org.springframework.web.bind.annotation.*;
import java.util.List; 

@RestController
@RequestMapping("/api/v1/payments")
public class PaymentController {

    private final PaymentRepository paymentRepository;

    public PaymentController(PaymentRepository paymentRepository) {
        this.paymentRepository = paymentRepository;
    }

    @PostMapping
    public Payment makePayment(@RequestBody PaymentRequest request) {
        Payment payment = new Payment();
        payment.setOrderId(request.getOrderId());
        payment.setAmount(request.getAmount());
        payment.setStatus("SUCCESS");
        return paymentRepository.save(payment);
    }

    @GetMapping
    public List<Payment> getAllPayments() {
        return paymentRepository.findAll();
    }


    @GetMapping("/test")
    public String test() {
        return "Payment Service is running";
    }
}
