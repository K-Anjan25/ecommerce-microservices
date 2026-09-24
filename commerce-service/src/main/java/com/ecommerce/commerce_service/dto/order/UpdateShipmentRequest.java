package com.ecommerce.commerce_service.dto.order;

import lombok.Getter;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

/** Staff-submitted carrier shipment details for an order. */
@Getter
public class UpdateShipmentRequest {

    /** Carrier waybill / tracking number. */
    @NotBlank(message = "AWB / tracking number is required")
    @Size(max = 40, message = "AWB must be 40 characters or fewer")
    private String awb;

    /** Courier name, e.g. DHL Express. */
    @Size(max = 60, message = "Carrier name must be 60 characters or fewer")
    private String carrierName;
}
