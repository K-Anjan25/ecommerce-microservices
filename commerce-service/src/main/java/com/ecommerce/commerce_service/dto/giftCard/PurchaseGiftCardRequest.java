package com.ecommerce.commerce_service.dto.giftCard;

import lombok.Getter;

import javax.validation.constraints.Email;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
public class PurchaseGiftCardRequest {
    @NotNull
    @Min(1)
    private BigDecimal amount;

    @Email
    private String recipientEmail;

    @NotNull
    private LocalDate expiryDate;
}
