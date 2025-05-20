package com.quickcart.controller;

import com.quickcart.entity.Order;
import com.quickcart.entity.User;
import com.quickcart.entity.Order.OrderStatus;
import com.quickcart.exception.ResourceNotFoundException;
import com.quickcart.payload.OrderDto;
import com.quickcart.payload.OrderMapper;
import com.quickcart.repository.UserRepository;
import com.quickcart.security.UserPrincipal;
import com.quickcart.service.OrderService;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.time.DayOfWeek;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/seller")
@PreAuthorize("hasRole('SELLER')")
public class SellerController {

    @Autowired
    private OrderService orderService;

    @Autowired
    private UserRepository userRepository;

    private User getAuthenticatedSeller(UserPrincipal currentUserPrincipal) {
        if (currentUserPrincipal == null) {
            throw new ResourceNotFoundException("User", "principal", "null");
        }

        User seller = userRepository.findById(currentUserPrincipal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Seller", "id", currentUserPrincipal.getId()));

        if (seller.getRole() != User.Role.SELLER) {
            throw new ResourceNotFoundException("User is not a seller.");
        }

        return seller;
    }

    @GetMapping("/orders")
    public Page<OrderDto> getSellerOrders(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PageableDefault(size = 10, sort = "orderDate", direction = Sort.Direction.DESC) Pageable pageable) {

        User seller = getAuthenticatedSeller(currentUser);
        Page<Order> orders = orderService.getOrdersBySeller(seller, pageable);
        return orders.map(OrderMapper::toDto);
    }

    @GetMapping("/orders/status/{status}")
    public Page<OrderDto> getSellerOrdersByStatus(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable OrderStatus status,
            @PageableDefault(size = 10, sort = "orderDate", direction = Sort.Direction.DESC) Pageable pageable) {

        User seller = getAuthenticatedSeller(currentUser);
        Page<Order> orders = orderService.getOrdersBySellerAndStatus(seller, status, pageable);
        return orders.map(OrderMapper::toDto);
    }

    @GetMapping("/orders/{orderId}")
    public ResponseEntity<OrderDto> getSellerOrderById(@PathVariable Long orderId,
                                                       @AuthenticationPrincipal UserPrincipal currentUserPrincipal) {

        User seller = getAuthenticatedSeller(currentUserPrincipal);
        Order order = orderService.getOrderByIdForSeller(orderId, seller);
        return ResponseEntity.ok(OrderMapper.toDto(order));
    }

    @GetMapping("/earnings")
    public ResponseEntity<Map<String, Double>> getSellerEarnings(@AuthenticationPrincipal UserPrincipal currentUserPrincipal) {
        User seller = getAuthenticatedSeller(currentUserPrincipal);

        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.atTime(LocalTime.MAX);

        // Start of week (Sunday)
        LocalDate startOfWeekDate = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.SUNDAY));
        LocalDateTime startOfWeek = startOfWeekDate.atStartOfDay();
        LocalDateTime endOfWeek = startOfDay.plusDays(6).with(LocalTime.MAX);

        // Start of month
        LocalDate startOfMonthDate = today.with(TemporalAdjusters.firstDayOfMonth());
        LocalDateTime startOfMonth = startOfMonthDate.atStartOfDay();
        LocalDateTime endOfMonth = today.with(TemporalAdjusters.lastDayOfMonth()).atTime(LocalTime.MAX);

        // Start of year
        LocalDate startOfYearDate = today.with(TemporalAdjusters.firstDayOfYear());
        LocalDateTime startOfYear = startOfYearDate.atStartOfDay();
        LocalDateTime endOfYear = today.with(TemporalAdjusters.lastDayOfYear()).atTime(LocalTime.MAX);

        Map<String, Double> earnings = Map.of(
                "daily", orderService.getSellerEarningsBetween(seller, startOfDay, endOfDay),
                "weekly", orderService.getSellerEarningsBetween(seller, startOfWeek, endOfWeek),
                "monthly", orderService.getSellerEarningsBetween(seller, startOfMonth, endOfMonth),
                "yearly", orderService.getSellerEarningsBetween(seller, startOfYear, endOfYear)
        );

        return ResponseEntity.ok(earnings);
    }



    // The main endpoint to accept or reject orders by updating order status
    @PutMapping("/orders/{orderId}/status")
    public ResponseEntity<OrderDto> updateOrderStatus(@PathVariable Long orderId,
                                                      @RequestParam String newStatus,
                                                      @AuthenticationPrincipal UserPrincipal currentUserPrincipal) {
        User seller = getAuthenticatedSeller(currentUserPrincipal);

        String statusInput = newStatus.toUpperCase();

        OrderStatus dbStatus;
        switch (statusInput) {
            case "ACCEPTED":
                dbStatus = OrderStatus.DELIVERED;
                break;
            case "REJECTED":
                dbStatus = OrderStatus.CANCELLED;
                break;
            default:
                throw new IllegalArgumentException("Invalid status. Must be ACCEPTED or REJECTED.");
        }

        Order updatedOrder = orderService.updateOrderStatus(orderId, dbStatus, seller);
        return ResponseEntity.ok(OrderMapper.toDto(updatedOrder));
    }
}