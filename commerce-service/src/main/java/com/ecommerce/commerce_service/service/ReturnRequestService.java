package com.ecommerce.commerce_service.service;

import com.ecommerce.commerce_service.dto.returnRequest.CreateReturnRequest;
import com.ecommerce.commerce_service.dto.returnRequest.ReturnRequestDto;
import com.ecommerce.commerce_service.dto.returnRequest.ReturnRequestMapper;
import com.ecommerce.commerce_service.dto.inventory.DeductStockRequest;
import com.ecommerce.commerce_service.model.Order;
import com.ecommerce.commerce_service.model.ReturnRequest;
import com.ecommerce.commerce_service.model.ReturnStatus;
import com.ecommerce.commerce_service.repository.OrderRepository;
import com.ecommerce.commerce_service.repository.ReturnRequestRepository;
import com.ecommerce.commerce_service.client.CommerceInventoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReturnRequestService {
    private final ReturnRequestRepository returnRequestRepository;
    private final ReturnRequestMapper returnRequestMapper;
    private final OrderRepository orderRepository;
    private final CommerceInventoryService commerceInventoryService;

    public ReturnRequestDto createReturnRequest(CreateReturnRequest createReturnRequest) {
        ReturnRequest returnRequest = returnRequestMapper.returnRequestDtoToReturnRequest(createReturnRequest);
        ReturnRequest saved = returnRequestRepository.save(returnRequest);
        return returnRequestMapper.returnRequestToReturnRequestDto(saved);
    }

    public List<ReturnRequestDto> getReturnRequestsByOrder(UUID orderId) {
        return returnRequestRepository.findByOrderId(orderId)
                .stream()
                .map(returnRequestMapper::returnRequestToReturnRequestDto)
                .collect(Collectors.toList());
    }

    public List<ReturnRequestDto> getReturnRequestsByCustomer(UUID customerId) {
        return returnRequestRepository.findByCustomerId(customerId)
                .stream()
                .map(returnRequestMapper::returnRequestToReturnRequestDto)
                .collect(Collectors.toList());
    }

    public ReturnRequestDto approveReturnRequest(UUID returnRequestId) {
        ReturnRequest returnRequest = returnRequestRepository.findById(returnRequestId)
                .orElseThrow(() -> new RuntimeException("Return request not found"));
        returnRequest.setStatus(ReturnStatus.APPROVED);
        ReturnRequest saved = returnRequestRepository.save(returnRequest);

        try {
            UUID variantUuid = returnRequest.getVariantId() != null ? UUID.fromString(returnRequest.getVariantId()) : null;
            commerceInventoryService.restoreStock(List.of(
                    new DeductStockRequest(returnRequest.getProductId(), returnRequest.getQuantity(), variantUuid)
            ));
        } catch (Exception e) {
            log.error("Failed to restore stock for return request {}", returnRequestId, e);
        }

        return returnRequestMapper.returnRequestToReturnRequestDto(saved);
    }

    public ReturnRequestDto rejectReturnRequest(UUID returnRequestId, String reason) {
        ReturnRequest returnRequest = returnRequestRepository.findById(returnRequestId)
                .orElseThrow(() -> new RuntimeException("Return request not found"));
        returnRequest.setStatus(ReturnStatus.REJECTED);
        returnRequest.setRejectionReason(reason);
        ReturnRequest saved = returnRequestRepository.save(returnRequest);
        return returnRequestMapper.returnRequestToReturnRequestDto(saved);
    }

    public ReturnRequestDto refundReturnRequest(UUID returnRequestId) {
        ReturnRequest returnRequest = returnRequestRepository.findById(returnRequestId)
                .orElseThrow(() -> new RuntimeException("Return request not found"));
        returnRequest.setStatus(ReturnStatus.REFUNDED);

        Order order = orderRepository.findById(returnRequest.getOrderId())
                .orElseThrow(() -> new RuntimeException("Order not found"));

        BigDecimal unitPrice = order.getItems().stream()
                .filter(item -> item.getProductId().equals(returnRequest.getProductId()))
                .findFirst()
                .map(item -> item.getPrice() == null ? BigDecimal.ZERO : item.getPrice())
                .orElse(BigDecimal.ZERO);

        returnRequest.setRefundAmount(unitPrice.multiply(BigDecimal.valueOf(returnRequest.getQuantity())));
        ReturnRequest saved = returnRequestRepository.save(returnRequest);
        return returnRequestMapper.returnRequestToReturnRequestDto(saved);
    }
}
