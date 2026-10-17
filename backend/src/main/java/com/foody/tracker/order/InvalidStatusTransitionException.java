package com.foody.tracker.order;

import com.foody.tracker.common.ConflictException;

public class InvalidStatusTransitionException extends ConflictException {

    public InvalidStatusTransitionException(OrderStatus from, OrderStatus to) {
        super("Cannot change order status from %s to %s".formatted(from, to));
    }
}
