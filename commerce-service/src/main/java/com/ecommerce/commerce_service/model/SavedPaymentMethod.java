package com.ecommerce.commerce_service.model;

import com.ecommerce.common.model.AdvanceBaseModal;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.Table;
import java.util.UUID;

/**
 * Vaulted payment method reference saved at checkout ("remember for my
 * subscriptions"). The {@code token} is the provider-side reusable method
 * reference (Razorpay token / Stripe customer+payment-method id); card data
 * never touches Cartly.
 */
@Entity(name = "saved_payment_methods")
@Table
@NoArgsConstructor
@AllArgsConstructor
@Data
@EqualsAndHashCode(callSuper = false)
@SuperBuilder
public class SavedPaymentMethod extends AdvanceBaseModal {

    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private PaymentProvider provider;

    /** Provider-side reusable charge token (opaque). */
    @Column(length = 255)
    private String token;

    private String brand;

    private String last4;

    /** Explicit name: the boolean field would otherwise serialize as "default". */
    @JsonProperty("isDefault")
    private boolean isDefault;
}
