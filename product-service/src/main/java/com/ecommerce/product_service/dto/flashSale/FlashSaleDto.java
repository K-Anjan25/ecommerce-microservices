package com.ecommerce.product_service.dto.flashSale;

import com.ecommerce.product_service.model.Product;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class FlashSaleDto {
    private Long id;
    private UUID productId;
    private String productName;
    private BigDecimal flashPrice;
    private BigDecimal originalPrice;
    private LocalDateTime startsAt;
    private LocalDateTime endsAt;
    private boolean active;
}
