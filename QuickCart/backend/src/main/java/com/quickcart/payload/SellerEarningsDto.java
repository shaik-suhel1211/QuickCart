package com.quickcart.payload;

import lombok.Data;

@Data
public class SellerEarningsDto {
    private double daily;
    private double weekly;
    private double monthly;
    private double yearly;
}
