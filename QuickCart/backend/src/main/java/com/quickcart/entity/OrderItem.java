package com.quickcart.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.util.Objects;

@Entity
@Table(name = "order_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    @JsonBackReference
    private Order order;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;  // maps to 'price' column

    @Column(name = "price_at_purchase", nullable = false, precision = 10, scale = 2)
    private BigDecimal priceAtPurchase; // maps to 'price_at_purchase' column


    @Column(nullable = false)
    private Integer quantity;

    // No need for seller_id here as it's derivable from product.seller_id
    // This allows an order to contain items from different sellers.

    public void setOrder(Order order) {
        if (this.order != null) {
            this.order.getItems().remove(this);
        }
        this.order = order;
        if (order != null) {
            order.getItems().add(this);
        }
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, quantity, priceAtPurchase);
    }

    public OrderItem(Product product, Integer quantity, Order order) {
        this.product = product;
        this.quantity = quantity;
        this.order = order;
        this.priceAtPurchase = product.getPrice(); // price when bought
        this.price = product.getPrice(); // current price or whatever price you want here
    }

}