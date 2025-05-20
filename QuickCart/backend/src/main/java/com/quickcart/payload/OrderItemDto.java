package com.quickcart.payload;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class OrderItemDto {
    private Long id;
    private Long productId;
    private String productName;
    private BigDecimal priceAtPurchase;
    private Integer quantity;

}
