package com.foody.tracker.order;

import java.util.EnumSet;
import java.util.Set;

public enum OrderStatus {
    RECEBIDO,
    EM_PREPARO,
    SAIU_PARA_ENTREGA,
    ENTREGUE,
    CANCELADO;

    public Set<OrderStatus> allowedTransitions() {
        return switch (this) {
            case RECEBIDO -> EnumSet.of(EM_PREPARO, CANCELADO);
            case EM_PREPARO -> EnumSet.of(SAIU_PARA_ENTREGA, CANCELADO);
            case SAIU_PARA_ENTREGA -> EnumSet.of(ENTREGUE, CANCELADO);
            case ENTREGUE -> EnumSet.noneOf(OrderStatus.class);
            case CANCELADO -> EnumSet.of(RECEBIDO);
        };
    }

    public boolean canTransitionTo(OrderStatus next) {
        return allowedTransitions().contains(next);
    }
}
