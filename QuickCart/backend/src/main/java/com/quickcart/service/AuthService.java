package com.quickcart.service;

import com.quickcart.payload.LoginRequest;
import com.quickcart.payload.SignUpRequest;
import com.quickcart.payload.JwtAuthenticationResponse;
import com.quickcart.entity.User;

public interface AuthService {
    User registerUser(SignUpRequest signUpRequest);
    JwtAuthenticationResponse authenticateUser(LoginRequest loginRequest);
    JwtAuthenticationResponse refreshToken(String refreshToken);
}