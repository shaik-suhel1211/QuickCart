package com.quickcart.service;

import com.quickcart.entity.User;
import com.quickcart.payload.UserRegistrationDTO;
import com.quickcart.payload.UserResponseDTO;
import org.springframework.security.core.userdetails.UserDetailsService;

import java.util.Optional;

public interface UserService extends UserDetailsService {
    UserResponseDTO registerUser(UserRegistrationDTO registrationDTO);
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    UserResponseDTO getCurrentUser(User user);
    UserResponseDTO updateUser(Long userId, UserRegistrationDTO userDTO, User currentUser);
    void deleteUser(Long userId, User currentUser);
} 