package com.ecommerce.commerce_service.dto.payment;

import com.ecommerce.commerce_service.model.PaymentProvider;
import lombok.Getter;
import lombok.Setter;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import java.util.UUID;

@Getter
@Setter
public class PaymentRequest {
    @NotNull
    private UUID orderId;
    @NotNull
    private PaymentProvider provider;
    /** Required only for guest-created orders. */
    @Size(max = 100)
    private String checkoutToken;
}
