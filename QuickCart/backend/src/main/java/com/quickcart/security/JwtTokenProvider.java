package com.quickcart.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.security.Key;
import java.util.Date;
import java.util.UUID;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

@Component
public class JwtTokenProvider {
    private static final Logger logger = LoggerFactory.getLogger(JwtTokenProvider.class);

    @Value("${app.jwtSecret}")
    private String jwtSecret;

    @Value("${app.jwtExpirationInMs}")
    private long jwtExpirationInMs;

    @Value("${app.jwtRefreshExpirationInMs:604800000}") // 7 days default
    private long jwtRefreshExpirationInMs;

    private Key signingKey;

    private Key getSigningKey() {
        if (signingKey == null) {
            try {

                MessageDigest digest = MessageDigest.getInstance("SHA-512");
                byte[] hash = digest.digest(jwtSecret.getBytes(StandardCharsets.UTF_8));
                signingKey = Keys.hmacShaKeyFor(hash);
                logger.debug("Generated new signing key");
            } catch (NoSuchAlgorithmException e) {
                logger.error("Error creating signing key", e);

                signingKey = Keys.secretKeyFor(SignatureAlgorithm.HS512);
            }
        }
        return signingKey;
    }

    public String generateToken(Authentication authentication) {
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationInMs);

        logger.debug("Generating JWT token for user: {}", userPrincipal.getUsername());

        return Jwts.builder()
                .setSubject(userPrincipal.getUsername())
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .claim("userId", userPrincipal.getId())
                .claim("role", userPrincipal.getRole().name())
                .claim("type", "access")
                .signWith(getSigningKey(), SignatureAlgorithm.HS512)
                .compact();
    }

    public String generateRefreshToken(Authentication authentication) {
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtRefreshExpirationInMs);

        logger.debug("Generating refresh token for user: {}", userPrincipal.getUsername());

        return Jwts.builder()
                .setSubject(userPrincipal.getUsername())
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .claim("userId", userPrincipal.getId())
                .claim("role", userPrincipal.getRole().name())
                .claim("type", "refresh")
                .signWith(getSigningKey(), SignatureAlgorithm.HS512)
                .compact();
    }

    public String getUsernameFromJWT(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();

        return claims.getSubject();
    }

    public String getRoleFromJWT(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();

        return claims.get("role", String.class);
    }

    public Long getUserIdFromJWT(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();

        return claims.get("userId", Long.class);
    }

    public boolean validateToken(String token) {
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            String tokenType = claims.get("type", String.class);
            if (tokenType == null) {
                logger.error("JWT token is missing type claim");
                return false;
            }


            if ("refresh".equals(tokenType)) {
                return !claims.getExpiration().before(new Date());
            }


            if (claims.get("userId") == null || claims.get("role") == null) {
                logger.error("JWT token is missing required claims");
                return false;
            }


            if (claims.getExpiration().before(new Date())) {
                logger.error("JWT token is expired");
                return false;
            }

            return true;
        } catch (SignatureException ex) {
            logger.error("Invalid JWT signature");
        } catch (MalformedJwtException ex) {
            logger.error("Invalid JWT token");
        } catch (ExpiredJwtException ex) {
            logger.error("Expired JWT token");
        } catch (UnsupportedJwtException ex) {
            logger.error("Unsupported JWT token");
        } catch (IllegalArgumentException ex) {
            logger.error("JWT claims string is empty");
        }
        return false;
    }

    public boolean validateRefreshToken(String refreshToken) {
        try {
            Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(refreshToken)
                .getBody();
            
            String tokenType = claims.get("type", String.class);
            if (!"refresh".equals(tokenType)) {
                logger.error("Invalid token type for refresh token");
                return false;
            }

            // Check if token is expired
            if (claims.getExpiration().before(new Date())) {
                logger.error("Refresh token is expired");
                return false;
            }
            
            logger.debug("Refresh token is valid");
            return true;
        } catch (Exception ex) {
            logger.error("Invalid refresh token: {}", ex.getMessage());
            return false;
        }
    }
} 