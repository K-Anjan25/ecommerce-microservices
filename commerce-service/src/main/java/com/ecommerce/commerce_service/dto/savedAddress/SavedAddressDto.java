package com.ecommerce.commerce_service.dto.savedAddress;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class SavedAddressDto {
    private UUID id;
    private String state;
    private String district;
    private String addressDetail;

    /** ISO-3166 alpha-2 destination country; India when absent on legacy rows. */
    @Builder.Default
    private String country = "IN";

    private String pincode;
    private String phoneNumber;
    private boolean defaultAddress;
}
