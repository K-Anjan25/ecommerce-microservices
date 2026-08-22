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
    private boolean defaultAddress;
}
