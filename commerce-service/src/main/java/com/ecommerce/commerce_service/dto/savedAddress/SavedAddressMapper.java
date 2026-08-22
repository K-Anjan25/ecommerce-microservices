package com.ecommerce.commerce_service.dto.savedAddress;

import com.ecommerce.commerce_service.model.SavedAddress;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class SavedAddressMapper {

    public SavedAddressDto savedAddressToSavedAddressDto(SavedAddress savedAddress) {
        return SavedAddressDto.builder()
                .id(savedAddress.getId())
                .state(savedAddress.getState())
                .district(savedAddress.getDistrict())
                .addressDetail(savedAddress.getAddressDetail())
                .defaultAddress(savedAddress.isDefaultAddress())
                .build();
    }

    public SavedAddress savedAddressRequestToSavedAddress(CreateSavedAddressRequest createSavedAddressRequest) {
        return SavedAddress.builder()
                .customerId(UUID.fromString((String) SecurityContextHolder.getContext().getAuthentication().getPrincipal()))
                .state(createSavedAddressRequest.getState())
                .district(createSavedAddressRequest.getDistrict())
                .addressDetail(createSavedAddressRequest.getAddressDetail())
                .defaultAddress(createSavedAddressRequest.isDefaultAddress())
                .build();
    }
}
