package com.foody.tracker.order.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

public record CreateOrderRequest(
        @NotBlank(message = "Customer name is required") @Size(max = 150) String customerName,
        @NotBlank(message = "Delivery address is required") @Size(max = 300) String deliveryAddress,
        @NotEmpty(message = "At least one item is required") List<@Valid @NotNull ItemRequest> items
) {

    public record ItemRequest(
            @NotBlank(message = "Item name is required") @Size(max = 150) String name,
            @Min(value = 1, message = "Quantity must be at least 1") int quantity,
            @NotNull(message = "Unit price is required")
            @DecimalMin(value = "0.01", message = "Unit price must be greater than zero") BigDecimal unitPrice
    ) {
    }
}
