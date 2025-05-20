package com.quickcart.payload;

import com.quickcart.entity.Order;
import com.quickcart.entity.OrderItem;

import java.util.Set;
import java.util.stream.Collectors;

public class OrderMapper {

    public static OrderDto toDto(Order order) {
        if (order == null) return null;

        OrderDto dto = new OrderDto();
        dto.setId(order.getId());
        dto.setUserId(order.getUser().getId());
        dto.setTotalAmount(order.getTotalAmount());
        dto.setStatus(order.getStatus());
        dto.setShippingAddress(order.getShippingAddress());
        dto.setPaymentMethod(order.getPaymentMethod());
        dto.setOrderDate(order.getOrderDate());
        dto.setUsername(order.getUser().getUsername());

        Set<OrderItemDto> itemDtos = order.getItems().stream()
                .map(OrderMapper::toItemDto)
                .collect(Collectors.toSet());

        dto.setItems(itemDtos);

        return dto;
    }

    public static OrderItemDto toItemDto(OrderItem item) {
        if (item == null) return null;

        OrderItemDto dto = new OrderItemDto();
        dto.setId(item.getId());
        dto.setProductId(item.getProduct().getId());
        dto.setProductName(item.getProduct().getName());
        dto.setPriceAtPurchase(item.getPriceAtPurchase());
        dto.setQuantity(item.getQuantity());

        return dto;
    }
}
