package com.ecommerce.commerce_service.dto.orderAddress;

import com.ecommerce.commerce_service.model.OrderAddress;
import org.springframework.stereotype.Component;

@Component
public class OrderAddressMapper {

    private static String normalizeCountry(String country) {
        return (country == null || country.isBlank()) ? "IN" : country.trim().toUpperCase();
    }

    public OrderAddressDto orderAddressToOrderAddressDto(OrderAddress orderAddress){
        return OrderAddressDto.builder()
                .state(orderAddress.getState())
                .addressDetail(orderAddress.getAddressDetail())
                .district(orderAddress.getDistrict())
                .country(normalizeCountry(orderAddress.getCountry()))
                .build();
    }

    public OrderAddress orderAddressRequestToOrderAddress(CreateOrderAddressRequest createOrderAddressRequest){
        return OrderAddress.builder()
                .state(createOrderAddressRequest.getState())
                .addressDetail(createOrderAddressRequest.getAddressDetail())
                .district(createOrderAddressRequest.getDistrict())
                .country(normalizeCountry(createOrderAddressRequest.getCountry()))
                .build();
    }
}
