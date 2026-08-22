package com.ecommerce.product_service.model;

import com.ecommerce.common.model.BaseModel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.JoinColumn;
import javax.persistence.OneToOne;
import javax.persistence.Table;
import java.time.LocalDateTime;

@Entity(name = "flash_sales")
@Table
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class FlashSale extends BaseModel {

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false, unique = true)
    private Product product;

    @Column(precision = 19, scale = 2)
    private java.math.BigDecimal flashPrice;

    private LocalDateTime startsAt;

    private LocalDateTime endsAt;

    private boolean active;
}
