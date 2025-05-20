package com.quickcart.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.SignatureException;

public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();

    private JwtTokenProvider tokenProvider;
    private CustomUserDetailsService customUserDetailsService;

    public void setTokenProvider(JwtTokenProvider tokenProvider) {
        this.tokenProvider = tokenProvider;
    }

    public void setCustomUserDetailsService(CustomUserDetailsService customUserDetailsService) {
        this.customUserDetailsService = customUserDetailsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            String requestPath = request.getRequestURI();
            
            // Skip JWT processing for public endpoints
            if (isPublicEndpoint(requestPath)) {
                filterChain.doFilter(request, response);
                return;
            }

            String jwt = getJwtFromRequest(request);
            logger.debug("Processing request: {} with JWT: {}", requestPath, jwt != null ? "present" : "absent");

            if (StringUtils.hasText(jwt)) {
                try {
                    if (tokenProvider.validateToken(jwt)) {
                        String username = tokenProvider.getUsernameFromJWT(jwt);
                        UserDetails userDetails = customUserDetailsService.loadUserByUsername(username);
                        
                        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());
                        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                        SecurityContextHolder.getContext().setAuthentication(authentication);
                        logger.debug("Set authentication in security context for user: {}", username);
                    } else {
                        logger.debug("Invalid JWT token");
                        if (!requestPath.equals("/api/auth/refresh-token")) {
                            sendErrorResponse(response, HttpServletResponse.SC_UNAUTHORIZED, 
                                "Invalid token", "The provided token is invalid");
                            return;
                        }
                    }
                } catch (ExpiredJwtException ex) {
                    logger.debug("Expired JWT token");
                    if (!requestPath.equals("/api/auth/refresh-token")) {
                        sendErrorResponse(response, HttpServletResponse.SC_UNAUTHORIZED, 
                            "Token expired", "Your session has expired. Please log in again.");
                        return;
                    }
                } catch (MalformedJwtException | UnsupportedJwtException | SignatureException ex) {
                    logger.error("Invalid JWT token: {}", ex.getMessage());
                    if (!requestPath.equals("/api/auth/refresh-token")) {
                        sendErrorResponse(response, HttpServletResponse.SC_UNAUTHORIZED, 
                            "Invalid token", "The provided token is invalid");
                        return;
                    }
                } catch (Exception e) {
                    logger.error("Could not set user authentication in security context", e);
                    if (!requestPath.equals("/api/auth/refresh-token")) {
                        sendErrorResponse(response, HttpServletResponse.SC_UNAUTHORIZED, 
                            "Authentication failed", "An error occurred while processing the token");
                        return;
                    }
                }
            } else {
                logger.debug("No JWT token found in request");

            }
        } catch (Exception e) {
            logger.error("Cannot set user authentication: {}", e);
        }

        filterChain.doFilter(request, response);
    }

    private boolean isPublicEndpoint(String path) {
        return path.startsWith("/api/auth/") ||
               path.startsWith("/api/products/public") ||
               path.startsWith("/api/categories") ||
               path.startsWith("/api/product-images") ||
               path.equals("/error");
    }

    private void sendErrorResponse(HttpServletResponse response, int status, String error, String message) 
            throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        
        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("error", error);
        errorResponse.put("message", message);
        
        response.getWriter().write(objectMapper.writeValueAsString(errorResponse));
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
} 