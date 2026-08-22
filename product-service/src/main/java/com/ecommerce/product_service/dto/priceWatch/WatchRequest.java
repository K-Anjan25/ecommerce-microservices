package com.ecommerce.product_service.dto.priceWatch;

import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.NotBlank;

@Getter
@Setter
public class WatchRequest {
    @NotBlank
    private String email;
}
