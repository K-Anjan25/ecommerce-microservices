package com.ecommerce.product_service.enumeration;

import lombok.Getter;
import org.springframework.data.domain.Sort.Direction;

@Getter
public enum Sort {
    DATE_DESC("createdDate", Direction.DESC),
    DATE_ASC("createdDate", Direction.ASC),
    PRICE_DESC("unitPrice", Direction.DESC),
    PRICE_ASC("unitPrice", Direction.ASC);

    private final String field;
    private final Direction direction;
    Sort(String field, Direction direction){
        this.field = field;
        this.direction = direction;
    }

}