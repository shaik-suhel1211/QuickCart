
package com.quickcart.service;

import com.quickcart.entity.Cart;
import com.quickcart.payload.CartItemRequest;

public interface CartService {
    Cart getCartByUserId(Long userId);
    Cart getOrCreateCartByUserId(Long userId);  // <-- new method
    Cart addItemToCart(Long userId, CartItemRequest request);
    Cart updateItemQuantity(Long userId, Long itemId, int quantity);
    Cart removeItemFromCart(Long userId, Long itemId);
    void clearCart(Long userId);
}

