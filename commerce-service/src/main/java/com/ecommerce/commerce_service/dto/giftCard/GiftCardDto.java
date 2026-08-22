package com.ecommerce.commerce_service.dto.giftCard;

import com.ecommerce.commerce_service.model.GiftCardStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class GiftCardDto {
    private UUID id;
    private String code;
    private BigDecimal balance;
    private BigDecimal initialBalance;
    private LocalDate expiryDate;
    private GiftCardStatus status;
    private String recipientEmail;
}
