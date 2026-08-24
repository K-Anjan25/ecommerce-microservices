package com.ecommerce.commerce_service.dto.giftCard;

import lombok.Getter;

import javax.validation.constraints.DecimalMax;
import javax.validation.constraints.DecimalMin;
import javax.validation.constraints.Email;
import javax.validation.constraints.Future;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
public class PurchaseGiftCardRequest {
    @NotNull
    @DecimalMin("1.00")
    @DecimalMax("100000.00")
    private BigDecimal amount;

    @Email
    private String recipientEmail;

    @NotNull @Future
    private LocalDate expiryDate;
}
