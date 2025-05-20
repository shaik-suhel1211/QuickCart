package com.quickcart.service.impl;

import com.quickcart.entity.*;
import com.quickcart.entity.Order.OrderStatus;
import com.quickcart.exception.ResourceNotFoundException;
import com.quickcart.exception.UnauthorizedOperationException;
import com.quickcart.exception.InsufficientStockException;
import com.quickcart.payload.OrderRequest;
import com.quickcart.repository.*;
import com.quickcart.service.CartService;
import com.quickcart.service.OrderService;
import com.quickcart.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class OrderServiceImpl implements OrderService {

    private static final Logger logger = LoggerFactory.getLogger(OrderServiceImpl.class);

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private CartService cartService;

    @Override
    @Transactional
    public Order createOrder(OrderRequest orderRequest) {
        User user = userRepository.findByUsername(SecurityContextHolder.getContext().getAuthentication().getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        logger.info("Creating order for user: {}", user.getUsername());

        // Create a new order
        Order order = new Order();
        order.setUser(user);
        order.setStatus(OrderStatus.PENDING);
        order.setShippingAddress(orderRequest.getShippingAddress());
        order.setPaymentMethod(orderRequest.getPaymentMethod());
        LocalDateTime now = LocalDateTime.now();
        order.setOrderDate(now);
        order.setCreatedAt(now);

        // Process order items and update product stock
        List<OrderItem> orderItems = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (OrderRequest.OrderItemRequest itemRequest : orderRequest.getItems()) {
            Product product = productRepository.findById(itemRequest.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product", "id", itemRequest.getProductId()));

            // Validate product stock
            if (product.getStock() < 0) {
                logger.error("Invalid stock value for product: {} (ID: {}). Stock: {}",
                    product.getName(), product.getId(), product.getStock());
                throw new RuntimeException("Invalid stock value for product: " + product.getName());
            }

            // Check if requested quantity is valid
            if (itemRequest.getQuantity() <= 0) {
                logger.error("Invalid quantity requested for product: {} (ID: {}). Quantity: {}",
                    product.getName(), product.getId(), itemRequest.getQuantity());
                throw new RuntimeException("Invalid quantity requested for product: " + product.getName());
            }

            // Check if enough stock is available
            logger.info("Checking stock for product: {} (ID: {}), Requested quantity: {}, Available stock: {}",
                product.getName(), product.getId(), itemRequest.getQuantity(), product.getStock());

            if (product.getStock() < itemRequest.getQuantity()) {
                logger.warn("Insufficient stock for product: {} (ID: {}). Requested: {}, Available: {}, Comparison: {} < {}",
                    product.getName(), product.getId(), itemRequest.getQuantity(),
                    product.getStock(),
                    product.getStock(),
                    itemRequest.getQuantity());
                throw new InsufficientStockException("Insufficient stock for product: " + product.getName());
            }

            // Create order item
            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProduct(product);
            orderItem.setQuantity(itemRequest.getQuantity());
            orderItem.setPriceAtPurchase(product.getPrice());
            orderItem.setPrice(product.getPrice());
            orderItems.add(orderItem);

            // Calculate total amount
            totalAmount = totalAmount.add(product.getPrice().multiply(BigDecimal.valueOf(itemRequest.getQuantity())));

            // Update product stock
            int newStock = product.getStock() - itemRequest.getQuantity();
            logger.info("Updating stock for product: {} (ID: {}). Old stock: {}, New stock: {}",
                product.getName(), product.getId(), product.getStock(), newStock);
            product.setStock(newStock);
            productRepository.save(product);
        }

        // Set order total and items
        order.setTotalAmount(totalAmount);
        order.setItems(new HashSet<>(orderItems));
        order = orderRepository.save(order);

        logger.info("Order created successfully with ID: {} for user: {}", order.getId(), user.getUsername());

        // Clear user's cart after successful order creation
        clearUserCart(user);

        // Send order confirmation notification
        notificationService.sendOrderConfirmationNotification(order);

        return order;
    }

    @Transactional
    private void clearUserCart(User user) {
        Cart userCart = cartRepository.findByUser(user)
                .orElseThrow(() -> new ResourceNotFoundException("Cart", "user", user.getId()));
        
        // Create a new list to avoid concurrent modification
        List<CartItem> itemsToRemove = new ArrayList<>(userCart.getCartItems());
        
        // Remove all items
        cartItemRepository.deleteAll(itemsToRemove);
        userCart.getCartItems().clear();
        cartRepository.save(userCart);
    }

    @Override
    public Page<Order> getOrdersByUser(User user, Pageable pageable) {
        return orderRepository.findByUserOrderByOrderDateDesc(user, pageable);
    }

    @Override
    public Page<Order> getOrdersBySeller(User seller, Pageable pageable) {
        if (seller.getRole() != User.Role.SELLER) {
            throw new UnauthorizedOperationException("User is not a seller.");
        }
        return orderRepository.findOrdersBySeller(seller, pageable);
    }
    
    @Override
    public Page<Order> getOrdersBySellerAndStatus(User seller, OrderStatus status, Pageable pageable) {
        if (seller.getRole() != User.Role.SELLER) {
            throw new UnauthorizedOperationException("User is not a seller.");
        }
        return orderRepository.findOrdersBySellerAndStatus(seller, status, pageable);
    }

    @Override
    public Order getOrderById(Long orderId, User user) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
        if (!order.getUser().getId().equals(user.getId())) {
            throw new UnauthorizedOperationException("User not authorized to view this order.");
        }
        return order;
    }

    @Override
    public Order getOrderByIdForSeller(Long orderId, User seller) {
        if (seller.getRole() != User.Role.SELLER) {
            throw new UnauthorizedOperationException("User is not a seller.");
        }
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        // Check if any item in the order belongs to this seller
        boolean sellerHasItemInOrder = order.getItems().stream()
            .anyMatch(item -> item.getProduct().getSeller().getId().equals(seller.getId()));

        if (!sellerHasItemInOrder) {
            throw new UnauthorizedOperationException("Seller not authorized to view this order as it contains no items from them.");
        }
        return order;
    }

    @Override
    @Transactional
    public Order updateOrderStatus(Long orderId, OrderStatus newStatus, User seller) {
        if (seller.getRole() != User.Role.SELLER) {
            throw new UnauthorizedOperationException("User not authorized to update order status (not a seller).");
        }

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        // Check if the seller is actually involved in this order
        boolean isSellerInvolved = order.getItems().stream()
                                     .anyMatch(item -> item.getProduct().getSeller().getId().equals(seller.getId()));

        if (!isSellerInvolved) {
            throw new UnauthorizedOperationException("Seller not authorized to update status for this order (no items from this seller).");
        }

        order.setStatus(newStatus);
        Order updatedOrder = orderRepository.save(order);

        // Send notifications to relevant sellers
        Set<Long> sellerIdsInOrder = updatedOrder.getItems().stream()
                                           .map(item -> item.getProduct().getSeller().getId())
                                           .collect(Collectors.toSet());

        for (Long sellerId : sellerIdsInOrder) {
            try {
                notificationService.sendOrderUpdateNotification(updatedOrder, "ORDER_STATUS_UPDATED", sellerId);
            } catch (Exception e) {
                System.err.println("Failed to send ORDER_STATUS_UPDATED notification to seller " + sellerId + ": " + e.getMessage());
            }
        }

        return updatedOrder;
    }

    public Double getSellerEarningsBetween(User seller, LocalDateTime from, LocalDateTime to) {
        List<Order.OrderStatus> validStatuses = Arrays.asList( OrderStatus.DELIVERED);

        Double earnings = orderRepository.sumSellerEarningsByDateRange(seller, validStatuses, from, to);
        return earnings != null ? earnings : 0.0;
    }
}