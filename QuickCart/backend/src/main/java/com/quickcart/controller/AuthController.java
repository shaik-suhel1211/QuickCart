package com.quickcart.controller;

import com.quickcart.entity.User;
import com.quickcart.payload.ApiResponse;
import com.quickcart.payload.JwtAuthenticationResponse;
import com.quickcart.payload.LoginRequest;
import com.quickcart.payload.SignUpRequest;
import com.quickcart.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.quickcart.payload.RefreshTokenRequest;


@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignUpRequest signUpRequest) {
        User registeredUser = authService.registerUser(signUpRequest);

        return ResponseEntity.status(HttpStatus.CREATED).body(new ApiResponse(true, "User registered successfully!"));
    }

    @PostMapping("/signin")
    public ResponseEntity<JwtAuthenticationResponse> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        JwtAuthenticationResponse jwtResponse = authService.authenticateUser(loginRequest);
        return ResponseEntity.ok(jwtResponse);
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<JwtAuthenticationResponse> refreshToken(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody(required = false) RefreshTokenRequest refreshRequest) {

        String refreshToken = null;

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            refreshToken = authHeader.substring(7);
        } else if (refreshRequest != null && refreshRequest.getRefreshToken() != null) {
            refreshToken = refreshRequest.getRefreshToken();
        }

        if (refreshToken == null) {
            return ResponseEntity.badRequest().build();
        }

        try {
            JwtAuthenticationResponse jwtResponse = authService.refreshToken(refreshToken);
            return ResponseEntity.ok(jwtResponse);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }
}