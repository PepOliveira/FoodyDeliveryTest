package com.foody.tracker.order.dto;

import com.foody.tracker.order.Order;
import com.foody.tracker.order.OrderItem;
import com.foody.tracker.order.OrderStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Set;

public record OrderResponse(
        Long id,
        String customerName,
        String deliveryAddress,
        List<ItemResponse> items,
        OrderStatus status,
        Set<OrderStatus> allowedNextStatuses,
        BigDecimal total,
        Instant createdAt,
        Instant updatedAt
) {

    public static OrderResponse from(Order order) {
        return new OrderResponse(
                order.getId(),
                order.getCustomerName(),
                order.getDeliveryAddress(),
                order.getItems().stream().map(ItemResponse::from).toList(),
                order.getStatus(),
                order.getStatus().allowedTransitions(),
                order.total(),
                order.getCreatedAt(),
                order.getUpdatedAt());
    }

    public record ItemResponse(String name, int quantity, BigDecimal unitPrice, BigDecimal subtotal) {
        static ItemResponse from(OrderItem item) {
            return new ItemResponse(item.getName(), item.getQuantity(), item.getUnitPrice(), item.subtotal());
        }
    }
}
