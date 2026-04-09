package com.ecommerce.payment_service.dto;

import com.ecommerce.payment_service.model.PaymentProvider;
import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.DecimalMin;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
public class PaymentRequest {

    @NotNull
    private UUID orderId;

    @NotNull
    @DecimalMin(value = "0.1")
    private BigDecimal amount;

    @NotBlank
    private String currency;

    @NotNull
    private PaymentProvider provider;
}
