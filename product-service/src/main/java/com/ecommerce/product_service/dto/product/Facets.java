package com.ecommerce.product_service.dto.product;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Facets {
    private List<FacetCount> brands;
    private List<FacetCount> categories;
    private BigDecimal priceMin;
    private BigDecimal priceMax;
}
