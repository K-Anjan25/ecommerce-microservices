package com.ecommerce.commerce_service.dto.returnRequest;

import com.ecommerce.commerce_service.model.ReturnRequest;
import com.ecommerce.commerce_service.model.ReturnStatus;
import org.springframework.stereotype.Component;

import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class ReturnRequestMapper {

    public ReturnRequestDto returnRequestToReturnRequestDto(ReturnRequest returnRequest) {
        return ReturnRequestDto.builder()
                .id(returnRequest.getId())
                .orderId(returnRequest.getOrderId())
                .createdDate(returnRequest.getCreatedDate())
                .customerId(returnRequest.getCustomerId())
                .productId(returnRequest.getProductId())
                .variantId(returnRequest.getVariantId())
                .quantity(returnRequest.getQuantity())
                .status(returnRequest.getStatus())
                .refundAmount(returnRequest.getRefundAmount())
                .refundTransactionId(returnRequest.getRefundTransactionId())
                .reason(returnRequest.getReason())
                .rejectionReason(returnRequest.getRejectionReason())
                .build();
    }

    public ReturnRequest returnRequestDtoToReturnRequest(CreateReturnRequest createReturnRequest) {
        return ReturnRequest.builder()
                .orderId(createReturnRequest.getOrderId())
                .productId(createReturnRequest.getProductId())
                .variantId(createReturnRequest.getVariantId())
                .quantity(createReturnRequest.getQuantity())
                .status(ReturnStatus.REQUESTED)
                .reason(createReturnRequest.getReason())
                .build();
    }
}
