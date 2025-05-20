package com.quickcart.service.impl;

import com.quickcart.entity.Notification;
import com.quickcart.entity.Order;
import com.quickcart.entity.User;
import com.quickcart.payload.ProductResponseDTO;
import com.quickcart.repository.NotificationRepository;
import com.quickcart.repository.UserRepository;
import com.quickcart.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class NotificationServiceImpl implements NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    @Override
    @Transactional
    public void sendProductUpdateNotification(ProductResponseDTO productDto, String eventType) {
        // Get the seller
        User seller = userRepository.findById(productDto.getSellerId())
                .orElseThrow(() -> new RuntimeException("Seller not found"));

        // Create notification for the seller
        Notification notification = new Notification();
        notification.setUser(seller);
        notification.setTitle("Product Update");
        notification.setMessage(String.format("Your product '%s' has been %s", 
            productDto.getName(), 
            eventType.toLowerCase().replace("_", " ")));
        notification.setType(eventType);
        notification.setRead(false);
        notification.setCreatedAt(LocalDateTime.now());
        notificationRepository.save(notification);
    }

    @Override
    @Transactional
    public void sendOrderUpdateNotification(Order order, String eventType, Long sellerId) {
        // Get the seller
        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new RuntimeException("Seller not found"));

        // Create notification for the seller
        Notification sellerNotification = new Notification();
        sellerNotification.setUser(seller);
        sellerNotification.setTitle("Order Update");
        sellerNotification.setMessage(String.format("Order #%d has been updated. Status: %s", 
            order.getId(), order.getStatus()));
        sellerNotification.setType("ORDER_UPDATE");
        sellerNotification.setRead(false);
        sellerNotification.setCreatedAt(LocalDateTime.now());
        notificationRepository.save(sellerNotification);

        // Create notification for the customer
        Notification customerNotification = new Notification();
        customerNotification.setUser(order.getUser());
        customerNotification.setTitle("Order Update");
        customerNotification.setMessage(String.format("Your order #%d has been updated. Status: %s", 
            order.getId(), order.getStatus()));
        customerNotification.setType("ORDER_UPDATE");
        customerNotification.setRead(false);
        customerNotification.setCreatedAt(LocalDateTime.now());
        notificationRepository.save(customerNotification);
    }

    @Override
    @Transactional
    public void sendOrderConfirmationNotification(Order order) {
        Notification notification = new Notification();
        notification.setUser(order.getUser());
        notification.setTitle("Order Confirmation");
        notification.setMessage(String.format("Your order #%d has been placed successfully on %s", 
            order.getId(), 
            order.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))));
        notification.setType("ORDER_CONFIRMATION");
        notification.setRead(false);
        notification.setCreatedAt(LocalDateTime.now());
        notificationRepository.save(notification);
    }

    @Override
    @Transactional
    public void sendOrderCancellationNotification(Order order) {
        Notification notification = new Notification();
        notification.setUser(order.getUser());
        notification.setTitle("Order Cancelled");
        notification.setMessage(String.format("Your order #%d has been cancelled", order.getId()));
        notification.setType("ORDER_CANCELLATION");
        notification.setRead(false);
        notification.setCreatedAt(LocalDateTime.now());
        notificationRepository.save(notification);
    }
} 