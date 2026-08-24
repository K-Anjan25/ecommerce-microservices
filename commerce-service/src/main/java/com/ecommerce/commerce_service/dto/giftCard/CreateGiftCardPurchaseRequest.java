package com.ecommerce.commerce_service.dto.giftCard;

import com.ecommerce.commerce_service.model.PaymentProvider;
import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.DecimalMax;
import javax.validation.constraints.DecimalMin;
import javax.validation.constraints.Email;
import javax.validation.constraints.Future;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class CreateGiftCardPurchaseRequest {
    @NotNull
    @DecimalMin("1.00")
    @DecimalMax("100000.00")
    private BigDecimal amount;

    /** Email that receives the purchase receipt and can be the gift recipient. */
    @NotBlank
    @Email
    private String contactEmail;

    @Email
    private String recipientEmail;

    @NotNull
    @Future
    private LocalDate expiryDate;

    @NotNull
    private PaymentProvider provider;
}
