package com.quickcart.controller;

import com.quickcart.entity.Order;
import com.quickcart.entity.User;
import com.quickcart.payload.OrderDto;
import com.quickcart.payload.OrderRequest;
import com.quickcart.payload.OrderMapper;
import com.quickcart.service.OrderService;
import com.quickcart.security.UserPrincipal;
import com.quickcart.exception.UnauthorizedOperationException;
import com.quickcart.service.UserService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private static final Logger logger = LoggerFactory.getLogger(OrderController.class);
    private static final int MAX_ORDERS_PER_MINUTE = 5;
    private final ConcurrentHashMap<String, AtomicInteger> orderAttempts = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, LocalDateTime> lastOrderTime = new ConcurrentHashMap<>();

    @Autowired
    private OrderService orderService;

    @Autowired
    private UserService userService;

    @PostMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> createOrder(@Valid @RequestBody OrderRequest orderRequest) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            UserPrincipal userPrincipal = (UserPrincipal) auth.getPrincipal();
            String username = userPrincipal.getUsername();

            // Rate limiting check
            if (!checkRateLimit(username)) {
                logger.warn("Rate limit exceeded for user: {}", username);
                return ResponseEntity
                        .status(HttpStatus.TOO_MANY_REQUESTS)
                        .body(new ErrorResponse("Too many order attempts. Please try again later."));
            }

            // Validate user's role
            if (userPrincipal.getRole() != User.Role.USER) {
                logger.error("Unauthorized order attempt by non-user role: {}", userPrincipal.getRole());
                throw new UnauthorizedOperationException("Only users can place orders");
            }

            logger.info("Processing order request for user: {}", username);
            Order order = orderService.createOrder(orderRequest);

            if (order == null) {
                logger.error("Failed to create order - order is null");
                return ResponseEntity
                        .status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(new ErrorResponse("Failed to create order"));
            }

            logger.info("Order created successfully with ID: {}", order.getId());
            OrderDto orderDto = OrderMapper.toDto(order);
            return ResponseEntity.ok(orderDto);
        } catch (UnauthorizedOperationException e) {
            logger.error("Unauthorized operation: {}", e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body(new ErrorResponse(e.getMessage()));
        } catch (RuntimeException e) {
            logger.error("Error creating order: {}", e.getMessage(), e);
            if (e.getMessage().contains("Insufficient stock")) {
                logger.warn("Insufficient stock detected: {}", e.getMessage());
                return ResponseEntity
                        .status(HttpStatus.CONFLICT)
                        .body(new ErrorResponse(e.getMessage()));
            }
            throw e;
        }
    }

    private boolean checkRateLimit(String username) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime lastOrder = lastOrderTime.get(username);

        if (lastOrder != null && now.minusMinutes(1).isBefore(lastOrder)) {
            AtomicInteger attempts = orderAttempts.get(username);
            if (attempts != null && attempts.incrementAndGet() > MAX_ORDERS_PER_MINUTE) {
                return false;
            }
        } else {
            orderAttempts.put(username, new AtomicInteger(1));
            lastOrderTime.put(username, now);
        }
        return true;
    }

    @GetMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Page<OrderDto>> getUserOrders(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            Pageable pageable) {

        String username = userPrincipal.getUsername();
        User user = userService.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        Page<Order> orders = orderService.getOrdersByUser(user, pageable);
        Page<OrderDto> dtoPage = orders.map(OrderMapper::toDto);
        return ResponseEntity.ok(dtoPage);
    }

    @GetMapping("/{orderId}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<OrderDto> getOrderById(
            @PathVariable Long orderId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            String username = userPrincipal.getUsername();
            User user = userService.findByUsername(username)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

            logger.info("Fetching order with ID: {} for user: {}", orderId, username);
            Order order = orderService.getOrderById(orderId, user);

            if (order == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found");
            }

            OrderDto orderDto = OrderMapper.toDto(order);
            return ResponseEntity.ok(orderDto);
        } catch (Exception e) {
            logger.error("Error fetching order: ", e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "An error occurred while fetching the order");
        }
    }

    @GetMapping("/seller")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<Page<OrderDto>> getSellerOrders(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            Pageable pageable) {

        String username = userPrincipal.getUsername();
        User seller = userService.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Seller not found"));

        Page<Order> orders = orderService.getOrdersBySeller(seller, pageable);
        Page<OrderDto> dtoPage = orders.map(OrderMapper::toDto);
        return ResponseEntity.ok(dtoPage);
    }

    @GetMapping("/seller/{orderId}")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<OrderDto> getSellerOrderById(
            @PathVariable Long orderId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        String username = userPrincipal.getUsername();
        User seller = userService.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Seller not found"));

        Order order = orderService.getOrderByIdForSeller(orderId, seller);
        OrderDto orderDto = OrderMapper.toDto(order);
        return ResponseEntity.ok(orderDto);
    }

    @PutMapping("/{orderId}/status")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<OrderDto> updateOrderStatus(
            @PathVariable Long orderId,
            @RequestParam Order.OrderStatus status,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        String username = userPrincipal.getUsername();
        User seller = userService.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Seller not found"));

        Order updatedOrder = orderService.updateOrderStatus(orderId, status, seller);
        OrderDto orderDto = OrderMapper.toDto(updatedOrder);
        return ResponseEntity.ok(orderDto);
    }

    private static class ErrorResponse {
        private final String message;

        public ErrorResponse(String message) {
            this.message = message;
        }

        public String getMessage() {
            return message;
        }
    }
}
