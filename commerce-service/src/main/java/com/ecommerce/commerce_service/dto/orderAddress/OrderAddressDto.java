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

    /** ISO-3166 alpha-2 destination country; India when absent on legacy rows. */
    @Builder.Default
    private String country = "IN";
}
