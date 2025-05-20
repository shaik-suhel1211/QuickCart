package com.quickcart.repository;

import com.quickcart.entity.Cart;
import com.quickcart.entity.CartItem;
import com.quickcart.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    CartItem findByCartAndProduct(Cart cart, Product product);
    void deleteAllByCart(Cart cart);
} 