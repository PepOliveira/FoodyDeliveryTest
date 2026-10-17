package com.foody.tracker.order;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

import static com.foody.tracker.order.OrderStatus.*;
import static org.assertj.core.api.Assertions.assertThat;

class OrderStatusTest {

    @Test
    void followsTheDeliveryFlow() {
        assertThat(RECEBIDO.canTransitionTo(EM_PREPARO)).isTrue();
        assertThat(EM_PREPARO.canTransitionTo(SAIU_PARA_ENTREGA)).isTrue();
        assertThat(SAIU_PARA_ENTREGA.canTransitionTo(ENTREGUE)).isTrue();
    }

    @Test
    void cannotSkipOrGoBackwards() {
        assertThat(RECEBIDO.canTransitionTo(ENTREGUE)).isFalse();
        assertThat(RECEBIDO.canTransitionTo(SAIU_PARA_ENTREGA)).isFalse();
        assertThat(SAIU_PARA_ENTREGA.canTransitionTo(EM_PREPARO)).isFalse();
    }

    @ParameterizedTest
    @EnumSource(value = OrderStatus.class, names = {"RECEBIDO", "EM_PREPARO", "SAIU_PARA_ENTREGA"})
    void canCancelWhileInProgress(OrderStatus status) {
        assertThat(status.canTransitionTo(CANCELADO)).isTrue();
    }

    @Test
    void deliveredIsTerminal() {
        assertThat(ENTREGUE.allowedTransitions()).isEmpty();
    }

    @Test
    void cancelledOrdersCanOnlyBeRestoredToReceived() {
        assertThat(CANCELADO.allowedTransitions()).containsExactly(RECEBIDO);
        assertThat(CANCELADO.canTransitionTo(EM_PREPARO)).isFalse();
    }
}
