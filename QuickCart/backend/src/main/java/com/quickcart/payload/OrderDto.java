package com.quickcart.payload;

import com.quickcart.entity.Order.OrderStatus;
import com.quickcart.entity.Order.PaymentMethod;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Set;

@Data
public class OrderDto {
    private Long id;
    private Long userId;
    private Set<OrderItemDto> items;
    private BigDecimal totalAmount;
    private OrderStatus status;
    private String shippingAddress;
    private PaymentMethod paymentMethod;
    private LocalDateTime orderDate;
    private String username;
    // getters and setters
}