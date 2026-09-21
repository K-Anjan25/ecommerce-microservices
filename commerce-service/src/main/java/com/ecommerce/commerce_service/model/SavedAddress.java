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

    /**
     * ISO-3166 alpha-2 destination country. Defaults to India; addresses
     * outside IN are stored for future international delivery but checkout
     * currently restricts shipping to India.
     */
    @Column(name = "country", length = 2, nullable = false)
    private String country = "IN";

    /** Postal code — 6-digit PIN for India, free-form for other countries. */
    @Column(length = 20)
    private String pincode;

    /** Recipient contact number (10-digit mobile for India). */
    @Column(name = "phone_number", length = 20)
    private String phoneNumber;

    private boolean defaultAddress;
}
