package com.quickcart.service;

import com.quickcart.entity.Order;
import com.quickcart.entity.User;
import com.quickcart.payload.OrderRequest;
import com.quickcart.payload.SellerEarningsDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;

public interface OrderService {
    Order createOrder(OrderRequest orderRequest);
    Page<Order> getOrdersByUser(User user, Pageable pageable);
    Page<Order> getOrdersBySeller(User seller, Pageable pageable);
    Page<Order> getOrdersBySellerAndStatus(User seller, Order.OrderStatus status, Pageable pageable);
    Order getOrderById(Long orderId, User user);
    Order getOrderByIdForSeller(Long orderId, User seller);
    Order updateOrderStatus(Long orderId, Order.OrderStatus newStatus, User seller);
    Double getSellerEarningsBetween(User seller, LocalDateTime from, LocalDateTime to);
} 