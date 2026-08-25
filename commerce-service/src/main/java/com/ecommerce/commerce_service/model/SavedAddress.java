package com.ecommerce.commerce_service.model;

import com.ecommerce.common.model.AdvanceBaseModal;
import lombok.*;
import lombok.experimental.SuperBuilder;

import javax.persistence.*;
import java.util.UUID;

@Entity(name = "savedAddresses")
@Table
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class SavedAddress extends AdvanceBaseModal {

    private UUID customerId;

    private String state;
    private String district;
    private String addressDetail;

    private boolean defaultAddress;
}
