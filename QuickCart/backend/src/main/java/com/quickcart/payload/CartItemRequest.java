package com.quickcart.payload;

import lombok.Data;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

@Data
public class CartItemRequest {
    @NotNull
    private Long productId;

    @Min(1)
    private int quantity = 1;
} 