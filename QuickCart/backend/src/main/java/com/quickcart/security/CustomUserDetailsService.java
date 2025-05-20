package com.quickcart.security;

import com.quickcart.entity.User;
import com.quickcart.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private static final Logger logger = LoggerFactory.getLogger(CustomUserDetailsService.class);

    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String usernameOrEmail) throws UsernameNotFoundException {
        logger.debug("Loading user by username or email: {}", usernameOrEmail);
        
        if (usernameOrEmail == null || usernameOrEmail.trim().isEmpty()) {
            logger.error("Username or email is empty");
            throw new UsernameNotFoundException("Username or email cannot be empty");
        }
        
        try {
            User user = userRepository.findByUsernameOrEmail(usernameOrEmail)
                    .orElseThrow(() -> {
                        logger.error("User not found with username/email: {}", usernameOrEmail);
                        return new UsernameNotFoundException("User not found with username/email: " + usernameOrEmail);
                    });

            logger.debug("Found user: {}, role: {}", user.getUsername(), user.getRole());
            
            UserDetails userDetails = UserPrincipal.create(user);
            logger.debug("Created UserDetails with authorities: {}", userDetails.getAuthorities());
            return userDetails;
        } catch (UsernameNotFoundException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Failed to load user: {}", usernameOrEmail, e);
            throw new UsernameNotFoundException("Failed to load user: " + e.getMessage());
        }
    }

    // This method is used by JWTAuthenticationFilter
    public UserDetails loadUserById(Long id) {
        logger.debug("Loading user by id: {}", id);
        
        if (id == null) {
            throw new UsernameNotFoundException("User ID cannot be null");
        }
        
        User user = userRepository.findById(id).orElseThrow(
                () -> new UsernameNotFoundException("User not found with id : " + id)
        );
        
        logger.debug("Found user: {}, role: {}", user.getUsername(), user.getRole());
        
        try {
            return UserPrincipal.create(user);
        } catch (Exception e) {
            logger.error("Failed to create UserPrincipal for user ID: {}", id, e);
            throw new UsernameNotFoundException("Failed to create UserPrincipal: " + e.getMessage());
        }
    }
} 