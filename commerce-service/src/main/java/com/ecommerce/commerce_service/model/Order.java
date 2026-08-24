package com.ecommerce.commerce_service.model;

import com.ecommerce.common.model.AdvanceBaseModal;
import lombok.*;
import lombok.experimental.SuperBuilder;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity(name = "orders")
@Table
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Order extends AdvanceBaseModal {

    private UUID customerId;
    @Enumerated(EnumType.STRING)
    private OrderStatus orderStatus;

    @OneToOne(mappedBy = "order", cascade = CascadeType.ALL)
    private OrderAddress address;

    @OneToMany(mappedBy = "order",cascade = CascadeType.ALL,fetch = FetchType.EAGER)
    private List<OrderItem> items;

    @Column(precision = 19, scale = 2)
    private BigDecimal totalAmount;

    @Column(precision = 19, scale = 2)
    private BigDecimal discountAmount;

    @Column(precision = 19, scale = 2)
    private BigDecimal shippingAmount;

    @Column(precision = 19, scale = 2)
    private BigDecimal taxAmount;

    private String couponCode;

    private String customerEmail;

    @Enumerated(EnumType.STRING)
    private ShippingMethod shippingMethod;

    private Boolean giftWrap;

    @Column(precision = 19, scale = 2)
    private BigDecimal giftWrapFee;

    /** Coupon and loyalty are pre-tax discounts; gift cards are payment tender after tax. */
    private Integer loyaltyPointsRedeemed;

    @Column(precision = 19, scale = 2)
    private BigDecimal loyaltyDiscountAmount;

    private UUID giftCardId;

    @Column(length = 4)
    private String giftCardCodeLast4;

    @Column(precision = 19, scale = 2)
    private BigDecimal giftCardAmount;

    @Column(precision = 19, scale = 2)
    private BigDecimal giftCardRefundedAmount;

    @Column(precision = 19, scale = 2)
    private BigDecimal providerRefundedAmount;

    @Column(length = 64)
    private String inventoryOperationId;

    private Boolean inventoryRestored;
    private Boolean creditsRestored;

    /** SHA-256 guest capability; raw value is returned/emailed once and never persisted. */
    @Column(length = 64)
    private String checkoutTokenHash;

    private LocalDateTime checkoutTokenExpiresAt;
}
