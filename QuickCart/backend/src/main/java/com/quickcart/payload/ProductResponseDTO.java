package com.quickcart.payload;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponseDTO {
    private Long id;
    private String name;
    private String description;
    private BigDecimal price;
    private String category;
    private String brand;
    private String color;
    private String size;
    private Integer stock;
    private String imageUrl;
    private BigDecimal discountPercentage;
    private boolean available;
    private Long sellerId; // Just seller ID to avoid deep serialization of User
    private String sellerUsername; // Or username if needed
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
} 