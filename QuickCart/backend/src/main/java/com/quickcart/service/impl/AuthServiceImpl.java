package com.quickcart.service.impl;

import com.quickcart.entity.User;
import com.quickcart.exception.AppException;
import com.quickcart.payload.LoginRequest;
import com.quickcart.payload.SignUpRequest;
import com.quickcart.payload.JwtAuthenticationResponse;
import com.quickcart.repository.UserRepository;
import com.quickcart.security.JwtTokenProvider;
import com.quickcart.security.UserPrincipal;
import com.quickcart.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.userdetails.UserDetails;
// ... other imports ...
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.beans.factory.annotation.Qualifier;

@Service
public class AuthServiceImpl implements AuthService {
    private static final Logger logger = LoggerFactory.getLogger(AuthServiceImpl.class);

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    @Qualifier("customUserDetailsService")
    private UserDetailsService userDetailsService;

    @Override
    public User registerUser(SignUpRequest signUpRequest) {
        if (userRepository.existsByUsername(signUpRequest.getUsername())) {
            throw new AppException("Username is already taken!");
        }

        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            throw new AppException("Email Address already in use!");
        }

        User user = new User();
        user.setUsername(signUpRequest.getUsername());
        user.setEmail(signUpRequest.getEmail());
        user.setPassword(passwordEncoder.encode(signUpRequest.getPassword()));
        user.setRole(signUpRequest.getRole() != null ? signUpRequest.getRole() : User.Role.USER);

        return userRepository.save(user);
    }

    @Override
    public JwtAuthenticationResponse authenticateUser(LoginRequest loginRequest) {
        try {
            // Create authentication token
            UsernamePasswordAuthenticationToken authenticationToken = 
                new UsernamePasswordAuthenticationToken(
                    loginRequest.getUsernameOrEmail(),
                    loginRequest.getPassword()
                );

            // Authenticate
            Authentication authentication = authenticationManager.authenticate(authenticationToken);
            SecurityContextHolder.getContext().setAuthentication(authentication);

            // Generate JWT and refresh token
            String accessToken = tokenProvider.generateToken(authentication);
            String refreshToken = tokenProvider.generateRefreshToken(authentication);

            // Get user details
            User user = userRepository.findByUsernameOrEmail(authentication.getName())
                .orElseThrow(() -> new AppException("User not found after authentication"));

            return new JwtAuthenticationResponse(
                accessToken,
                refreshToken,
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole().name()
            );
        } catch (BadCredentialsException e) {
            throw new AppException("Invalid username/email or password");
        } catch (Exception e) {
            throw new AppException("Authentication failed: " + e.getMessage());
        }
    }

    @Override
    public JwtAuthenticationResponse refreshToken(String refreshToken) {
        try {
            // Validate the refresh token
            if (!tokenProvider.validateRefreshToken(refreshToken)) {
                logger.error("Invalid or expired refresh token");
                throw new BadCredentialsException("Invalid or expired refresh token");
            }

            // Get user details from refresh token
            String username = tokenProvider.getUsernameFromJWT(refreshToken);
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
        
            // Get user for response
            User user = userRepository.findByUsernameOrEmail(username)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found"));

            // Create authentication
            Authentication authentication = new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities());
            
            // Generate new tokens
            String newAccessToken = tokenProvider.generateToken(authentication);
            String newRefreshToken = tokenProvider.generateRefreshToken(authentication);

            logger.debug("Generated new tokens for user: {}", username);

            return new JwtAuthenticationResponse(
                newAccessToken,
                newRefreshToken,
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole().name()
            );
        } catch (BadCredentialsException e) {
            logger.error("Failed to refresh token: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("Failed to refresh token: {}", e.getMessage());
            throw new BadCredentialsException("Failed to refresh token: " + e.getMessage());
        }
    }
}