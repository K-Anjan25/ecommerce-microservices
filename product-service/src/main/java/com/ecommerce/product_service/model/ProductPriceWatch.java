package com.ecommerce.product_service.model;

import com.ecommerce.common.model.AdvanceBaseModal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.GenericGenerator;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import java.util.UUID;

/**
 * A customer asking to be emailed when a product's price drops
 * (Phase 8 "price-drop alerts"). Keyed on (productId, email).
 */
@Entity(name = "product_price_watches")
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class ProductPriceWatch extends AdvanceBaseModal {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(
            name = "UUID",
            strategy = "org.hibernate.id.UUIDGenerator"
    )
    private UUID id;

    @Column(nullable = false)
    private UUID productId;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private boolean active = true;
}
