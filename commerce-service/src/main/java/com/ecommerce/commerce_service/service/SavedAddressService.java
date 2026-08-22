package com.ecommerce.commerce_service.service;

import com.ecommerce.commerce_service.dto.savedAddress.CreateSavedAddressRequest;
import com.ecommerce.commerce_service.dto.savedAddress.SavedAddressDto;
import com.ecommerce.commerce_service.dto.savedAddress.SavedAddressMapper;
import com.ecommerce.commerce_service.model.SavedAddress;
import com.ecommerce.commerce_service.repository.SavedAddressRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SavedAddressService {
    private final SavedAddressRepository savedAddressRepository;
    private final SavedAddressMapper savedAddressMapper;

    public SavedAddressDto createAddress(CreateSavedAddressRequest createSavedAddressRequest) {
        SavedAddress savedAddress = savedAddressMapper.savedAddressRequestToSavedAddress(createSavedAddressRequest);
        if (savedAddress.isDefaultAddress()) {
            clearDefaultAddress(savedAddress.getCustomerId());
        }
        SavedAddress saved = savedAddressRepository.save(savedAddress);
        return savedAddressMapper.savedAddressToSavedAddressDto(saved);
    }

    public List<SavedAddressDto> getAllAddresses() {
        UUID customerId = UUID.fromString((String) org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getPrincipal());
        return savedAddressRepository.findByCustomerIdOrderByDefaultAddressDescCreatedDateDesc(customerId)
                .stream()
                .map(savedAddressMapper::savedAddressToSavedAddressDto)
                .collect(Collectors.toList());
    }

    public SavedAddressDto getDefaultAddress() {
        UUID customerId = UUID.fromString((String) org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getPrincipal());
        return savedAddressRepository.findByCustomerIdOrderByDefaultAddressDescCreatedDateDesc(customerId)
                .stream()
                .filter(SavedAddress::isDefaultAddress)
                .findFirst()
                .map(savedAddressMapper::savedAddressToSavedAddressDto)
                .orElse(null);
    }

    public void deleteAddress(UUID addressId) {
        savedAddressRepository.deleteById(addressId);
    }

    private void clearDefaultAddress(UUID customerId) {
        savedAddressRepository.findByCustomerIdOrderByDefaultAddressDescCreatedDateDesc(customerId)
                .forEach(address -> {
                    address.setDefaultAddress(false);
                    savedAddressRepository.save(address);
                });
    }
}
