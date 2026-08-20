package com.ecommerce.commerce_service.dto.orderAddress;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class OrderAddressDto {
    private String state;
    private String district;
    private String addressDetail;
}
