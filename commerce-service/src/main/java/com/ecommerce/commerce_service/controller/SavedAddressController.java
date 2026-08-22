package com.ecommerce.commerce_service.controller;

import com.ecommerce.commerce_service.dto.savedAddress.CreateSavedAddressRequest;
import com.ecommerce.commerce_service.dto.savedAddress.SavedAddressDto;
import com.ecommerce.commerce_service.service.SavedAddressService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@Slf4j
@RequestMapping("/v1/addresses")
public class SavedAddressController {
    private final SavedAddressService savedAddressService;

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_USER', 'ROLE_ADMIN')")
    public ResponseEntity<SavedAddressDto> createAddress(@Valid @RequestBody CreateSavedAddressRequest createSavedAddressRequest){
        return new ResponseEntity<>(savedAddressService.createAddress(createSavedAddressRequest), HttpStatus.CREATED);
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_USER', 'ROLE_ADMIN')")
    public ResponseEntity<List<SavedAddressDto>> getAllAddresses(){
        return ResponseEntity.ok(savedAddressService.getAllAddresses());
    }

    @GetMapping("/default")
    @PreAuthorize("hasAnyAuthority('ROLE_USER', 'ROLE_ADMIN')")
    public ResponseEntity<SavedAddressDto> getDefaultAddress(){
        return ResponseEntity.ok(savedAddressService.getDefaultAddress());
    }

    @DeleteMapping("/{addressId}")
    @PreAuthorize("hasAnyAuthority('ROLE_USER', 'ROLE_ADMIN')")
    public ResponseEntity<Void> deleteAddress(@PathVariable UUID addressId){
        savedAddressService.deleteAddress(addressId);
        return ResponseEntity.noContent().build();
    }
}
