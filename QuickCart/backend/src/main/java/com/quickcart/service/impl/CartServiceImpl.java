
package com.quickcart.service.impl;

import com.quickcart.entity.Cart;
import com.quickcart.entity.CartItem;
import com.quickcart.entity.Product;
import com.quickcart.entity.User;
import com.quickcart.exception.ResourceNotFoundException;
import com.quickcart.exception.UnauthorizedOperationException;
import com.quickcart.payload.CartItemRequest;
import com.quickcart.repository.CartItemRepository;
import com.quickcart.repository.CartRepository;
import com.quickcart.repository.ProductRepository;
import com.quickcart.repository.UserRepository;
import com.quickcart.service.CartService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;

@Service
public class CartServiceImpl implements CartService {

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public Cart getCartByUserId(Long userId) {
        return cartRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart not found for user: " + userId));
    }

    @Override
    @Transactional
    public Cart getOrCreateCartByUserId(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        return cartRepository.findByUserId(userId)
                .orElseGet(() -> {
                    Cart newCart = new Cart();
                    newCart.setUser(user);
                    return cartRepository.save(newCart);
                });
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRED)
    public Cart addItemToCart(Long userId, CartItemRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (user.getRole() != User.Role.USER) {
            throw new UnauthorizedOperationException("Only users can add items to cart");
        }

        Cart cart = cartRepository.findByUserId(userId)
                .orElseGet(() -> {
                    Cart newCart = new Cart();
                    newCart.setUser(user);
                    return cartRepository.save(newCart);
                });

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + request.getProductId()));

        if (!product.isAvailable() || product.getStock() < request.getQuantity()) {
            throw new UnauthorizedOperationException("Product is not available in the requested quantity");
        }

        // Find existing cart item
        CartItem existingItem = cartItemRepository.findByCartAndProduct(cart, product);

        if (existingItem != null) {
            // Update quantity of existing item
            int newQuantity = existingItem.getQuantity() + request.getQuantity();
            if (newQuantity > product.getStock()) {
                throw new UnauthorizedOperationException("Requested quantity exceeds available stock");
            }
            existingItem.setQuantity(newQuantity);
            cartItemRepository.save(existingItem);
        } else {
            // Create new cart item
            CartItem newItem = new CartItem();
            newItem.setCart(cart);
            newItem.setProduct(product);
            newItem.setQuantity(request.getQuantity());
            cartItemRepository.save(newItem);
        }

        // Refresh cart from database to get updated items
        return cartRepository.findById(cart.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Cart not found after update"));
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRED)
    public Cart updateItemQuantity(Long userId, Long itemId, int quantity) {
        Cart cart = getCartByUserId(userId);
        CartItem cartItem = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found with id: " + itemId));

        if (!cartItem.getCart().getId().equals(cart.getId())) {
            throw new UnauthorizedOperationException("Cart item does not belong to the user's cart");
        }

        if (quantity <= 0) {
            cartItemRepository.delete(cartItem);
        } else {
            if (quantity > cartItem.getProduct().getStock()) {
                throw new UnauthorizedOperationException("Requested quantity exceeds available stock");
            }
            cartItem.setQuantity(quantity);
            cartItemRepository.save(cartItem);
        }

        return cartRepository.findById(cart.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Cart not found after update"));
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRED)
    public Cart removeItemFromCart(Long userId, Long itemId) {
        Cart cart = getCartByUserId(userId);
        CartItem cartItem = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found with id: " + itemId));

        if (!cartItem.getCart().getId().equals(cart.getId())) {
            throw new UnauthorizedOperationException("Cart item does not belong to the user's cart");
        }

        cart.removeCartItem(cartItem);  // Use the Cart entity's method
        cartItemRepository.delete(cartItem);
        cartRepository.flush();  // Force a flush

        return cart;
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRED)
    public void clearCart(Long userId) {
        Cart cart = getCartByUserId(userId);
        cartItemRepository.deleteAllByCart(cart);
    }
}

