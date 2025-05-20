package com.quickcart.payload;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.HashSet;
import java.math.BigDecimal;

@Data
public class CartResponseDTO {
    private Long id;
    private Set<CartItemDTO> cartItems = new HashSet<>();
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    public static class CartItemDTO {
        private Long id;
        private ProductDTO product;
        private Integer quantity;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

    @Data
    public static class ProductDTO {
        private Long id;
        private String name;
        private String description;
        private String imageUrl;
        private String category;
        private String brand;
        private String color;
        private String size;
        private Integer stock;
        private boolean available;
        private BigDecimal price;
        private BigDecimal discountPercentage;

        public BigDecimal getPrice() {
            return price != null ? price : BigDecimal.ZERO;
        }

        public BigDecimal getDiscountPercentage() {
            return discountPercentage != null ? discountPercentage : BigDecimal.ZERO;
        }

        public void setPrice(BigDecimal price) {
            this.price = price != null ? price : BigDecimal.ZERO;
        }

        public void setDiscountPercentage(BigDecimal discountPercentage) {
            this.discountPercentage = discountPercentage != null ? discountPercentage : BigDecimal.ZERO;
        }
    }
} 