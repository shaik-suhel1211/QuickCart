package com.quickcart.controller;

import com.quickcart.entity.User;
import com.quickcart.payload.ApiResponse;
import com.quickcart.payload.UserRegistrationDTO;
import com.quickcart.payload.UserResponseDTO;
import com.quickcart.security.UserPrincipal;
import com.quickcart.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserResponseDTO> getCurrentUser(@AuthenticationPrincipal UserPrincipal currentUser) {
        User user = userService.findByUsername(currentUser.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(userService.getCurrentUser(user));
    }

    @PutMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserResponseDTO> updateCurrentUser(
            @Valid @RequestBody UserRegistrationDTO userDTO,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        User user = userService.findByUsername(currentUser.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        UserResponseDTO updatedUser = userService.updateUser(user.getId(), userDTO, user);
        return ResponseEntity.ok(updatedUser);
    }

    @DeleteMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse> deleteCurrentUser(@AuthenticationPrincipal UserPrincipal currentUser) {
        User user = userService.findByUsername(currentUser.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        userService.deleteUser(user.getId(), user);
        return ResponseEntity.ok(new ApiResponse(true, "User account deleted successfully"));
    }
} 