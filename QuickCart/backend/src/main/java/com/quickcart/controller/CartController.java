
package com.quickcart.controller;

import com.quickcart.entity.Cart;
import com.quickcart.entity.User;
import com.quickcart.exception.ResourceNotFoundException;
import com.quickcart.payload.ApiResponse;
import com.quickcart.payload.CartItemRequest;
import com.quickcart.payload.CartResponseDTO;
import com.quickcart.repository.UserRepository;
import com.quickcart.security.UserPrincipal;
import com.quickcart.service.CartService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.ArrayList;

@RestController
@RequestMapping("/api/cart")
@PreAuthorize("hasRole('USER')") // Only users can access cart functionality
public class CartController {

    @Autowired
    private CartService cartService;

    @Autowired
    private UserRepository userRepository;

    private User getAuthenticatedUser(UserPrincipal currentUserPrincipal) {
        return userRepository.findById(currentUserPrincipal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserPrincipal.getId()));
    }

    @GetMapping
    public ResponseEntity<CartResponseDTO> getCart(@AuthenticationPrincipal UserPrincipal currentUserPrincipal) {
        User user = getAuthenticatedUser(currentUserPrincipal);
        Cart cart = cartService.getCartByUserId(user.getId());

        CartResponseDTO responseDTO = new CartResponseDTO();

        responseDTO.setId(cart.getId());
        responseDTO.setCreatedAt(cart.getCreatedAt());
        responseDTO.setUpdatedAt(cart.getUpdatedAt());

        cart.getCartItems().forEach(item -> {
            CartResponseDTO.CartItemDTO itemDTO = new CartResponseDTO.CartItemDTO();
            itemDTO.setId(item.getId());
            itemDTO.setQuantity(item.getQuantity());
            itemDTO.setCreatedAt(item.getCreatedAt());
            itemDTO.setUpdatedAt(item.getUpdatedAt());

            CartResponseDTO.ProductDTO productDTO = new CartResponseDTO.ProductDTO();
            productDTO.setId(item.getProduct().getId());
            productDTO.setName(item.getProduct().getName());
            productDTO.setDescription(item.getProduct().getDescription());
            productDTO.setImageUrl(item.getProduct().getImageUrl());
            productDTO.setCategory(item.getProduct().getCategory());
            productDTO.setBrand(item.getProduct().getBrand());
            productDTO.setColor(item.getProduct().getColor());
            productDTO.setSize(item.getProduct().getSize());
            productDTO.setStock(item.getProduct().getStock());
            productDTO.setAvailable(item.getProduct().isAvailable());


            BigDecimal price = item.getProduct().getPrice();
            BigDecimal discountPercentage = item.getProduct().getDiscountPercentage();

            productDTO.setPrice(price != null ? price : BigDecimal.ZERO);
            productDTO.setDiscountPercentage(discountPercentage != null ? discountPercentage : BigDecimal.ZERO);

            itemDTO.setProduct(productDTO);
            responseDTO.getCartItems().add(itemDTO);
        });

        return ResponseEntity.ok(responseDTO);
    }


    @PostMapping("/items")
    public ResponseEntity<CartResponseDTO> addItemToCart(@Valid @RequestBody CartItemRequest itemRequest, 
                                              @AuthenticationPrincipal UserPrincipal currentUserPrincipal) {
        User user = getAuthenticatedUser(currentUserPrincipal);
        Cart cart = cartService.addItemToCart(user.getId(), itemRequest);
        return getCart(currentUserPrincipal);
    }

    @PutMapping("/items/{itemId}")
    public ResponseEntity<CartResponseDTO> updateCartItem(@PathVariable Long itemId, 
                                               @RequestParam int quantity, 
                                               @AuthenticationPrincipal UserPrincipal currentUserPrincipal) {
        User user = getAuthenticatedUser(currentUserPrincipal);
        Cart cart = cartService.updateItemQuantity(user.getId(), itemId, quantity);
        return getCart(currentUserPrincipal);
    }

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<CartResponseDTO> removeItemFromCart(@PathVariable Long itemId, 
                                               @AuthenticationPrincipal UserPrincipal currentUserPrincipal) {
        User user = getAuthenticatedUser(currentUserPrincipal);
        cartService.removeItemFromCart(user.getId(), itemId);
        // Fetch fresh data after the delete operation
        return getCart(currentUserPrincipal);
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse> clearCart(@AuthenticationPrincipal UserPrincipal currentUserPrincipal) {
        User user = getAuthenticatedUser(currentUserPrincipal);
        cartService.clearCart(user.getId());
        return ResponseEntity.ok(new ApiResponse(true, "Cart cleared successfully"));
    }
}
