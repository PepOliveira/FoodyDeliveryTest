package com.foody.tracker.order.dto;

import com.foody.tracker.order.OrderStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateStatusRequest(@NotNull(message = "Status is required") OrderStatus status) {
}
