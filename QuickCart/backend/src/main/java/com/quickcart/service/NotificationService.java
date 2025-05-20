package com.quickcart.service;

import com.quickcart.entity.Order;
import com.quickcart.entity.Product;
import com.quickcart.payload.ProductResponseDTO;


public interface NotificationService {
    /**
     * Sends a notification about a product update (added, updated, deleted).
     * @param productDto The product data transfer object.
     * @param eventType A string indicating the type of event (e.g., "PRODUCT_ADDED", "PRODUCT_UPDATED", "PRODUCT_DELETED").
     */
    void sendProductUpdateNotification(ProductResponseDTO productDto, String eventType);

    /**
     * Sends a notification about an order update to the relevant seller.
     * @param order The order entity.
     * @param eventType A string indicating the type of event (e.g., "ORDER_PLACED", "ORDER_STATUS_UPDATED").
     * @param sellerId The ID of the seller to notify.
     */
    void sendOrderUpdateNotification(Order order, String eventType, Long sellerId);

    void sendOrderConfirmationNotification(Order order);
    void sendOrderCancellationNotification(Order order);

    // Add more notification types as needed (e.g., low stock for seller)
} 