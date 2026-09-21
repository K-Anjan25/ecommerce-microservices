package com.ecommerce.commerce_service.dto.shippingRate;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class InternationalQuoteRequest {

    @NotBlank
    private String country;

    @NotNull
    @PositiveOrZero
    private BigDecimal subtotal;
}
