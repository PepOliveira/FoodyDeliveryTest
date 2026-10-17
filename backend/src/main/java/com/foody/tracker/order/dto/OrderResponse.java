package com.foody.tracker.order.dto;

import com.foody.tracker.order.Order;
import com.foody.tracker.order.OrderItem;
import com.foody.tracker.order.OrderStatus;
import com.foody.tracker.order.StatusChange;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Set;

public record OrderResponse(
        Long id,
        String customerName,
        String customerPhone,
        String deliveryAddress,
        String deliveryComplement,
        List<ItemResponse> items,
        OrderStatus status,
        Set<OrderStatus> allowedNextStatuses,
        BigDecimal total,
        List<StatusChangeResponse> history,
        Instant createdAt,
        Instant updatedAt
) {

    public static OrderResponse from(Order order) {
        return new OrderResponse(
                order.getId(),
                order.getCustomerName(),
                order.getCustomerPhone(),
                order.getDeliveryAddress(),
                order.getDeliveryComplement(),
                order.getItems().stream().map(ItemResponse::from).toList(),
                order.getStatus(),
                order.getStatus().allowedTransitions(),
                order.total(),
                order.getHistory().stream().map(StatusChangeResponse::from).toList(),
                order.getCreatedAt(),
                order.getUpdatedAt());
    }

    public record StatusChangeResponse(OrderStatus status, Instant changedAt) {
        static StatusChangeResponse from(StatusChange change) {
            return new StatusChangeResponse(change.getStatus(), change.getChangedAt());
        }
    }

    public record ItemResponse(String name, int quantity, BigDecimal unitPrice, BigDecimal subtotal) {
        static ItemResponse from(OrderItem item) {
            return new ItemResponse(item.getName(), item.getQuantity(), item.getUnitPrice(), item.subtotal());
        }
    }
}
