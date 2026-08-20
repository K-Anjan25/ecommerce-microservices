package com.ecommerce.commerce_service.dto.orderAddress;

import com.ecommerce.commerce_service.model.OrderAddress;
import org.springframework.stereotype.Component;

@Component
public class OrderAddressMapper {

    public OrderAddressDto orderAddressToOrderAddressDto(OrderAddress orderAddress){
        return OrderAddressDto.builder()
                .state(orderAddress.getState())
                .addressDetail(orderAddress.getAddressDetail())
                .district(orderAddress.getDistrict())
                .build();
    }

    public OrderAddress orderAddressRequestToOrderAddress(CreateOrderAddressRequest createOrderAddressRequest){
        return OrderAddress.builder()
                .state(createOrderAddressRequest.getState())
                .addressDetail(createOrderAddressRequest.getAddressDetail())
                .district(createOrderAddressRequest.getDistrict())
                .build();
    }
}
