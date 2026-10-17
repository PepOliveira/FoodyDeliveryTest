package com.foody.tracker.order;

import com.foody.tracker.common.ResourceNotFoundException;
import com.foody.tracker.order.dto.CreateOrderRequest;
import com.foody.tracker.order.dto.OrderResponse;
import com.foody.tracker.user.User;
import com.foody.tracker.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private OrderService orderService;

    private final User creator = new User("Ana", "ana@test.com", "hash");

    private CreateOrderRequest request(String complement) {
        return new CreateOrderRequest(
                "  Joao  ",
                " (11) 99999-0000 ",
                "  Rua A, 10 ",
                complement,
                List.of(
                        new CreateOrderRequest.ItemRequest(" Pizza ", 2, new BigDecimal("39.90")),
                        new CreateOrderRequest.ItemRequest("Soda", 1, new BigDecimal("6.00"))));
    }

    private Order newOrder() {
        return new Order("Joao", "11999990000", "Rua A", null,
                List.of(new OrderItem("Pizza", 1, BigDecimal.TEN)), creator);
    }

    @Test
    void createsAnOrderComputingTheTotalOnTheServer() {
        when(userRepository.findByEmail("ana@test.com")).thenReturn(Optional.of(creator));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OrderResponse response = orderService.create(request("   "), "ana@test.com");

        ArgumentCaptor<Order> saved = ArgumentCaptor.forClass(Order.class);
        verify(orderRepository).save(saved.capture());
        assertThat(saved.getValue().getCustomerName()).isEqualTo("Joao");
        assertThat(saved.getValue().getCustomerPhone()).isEqualTo("(11) 99999-0000");
        assertThat(saved.getValue().getDeliveryAddress()).isEqualTo("Rua A, 10");
        assertThat(saved.getValue().getDeliveryComplement()).isNull();
        assertThat(saved.getValue().getCreatedBy()).isSameAs(creator);
        assertThat(response.status()).isEqualTo(OrderStatus.RECEBIDO);
        assertThat(response.total()).isEqualByComparingTo("85.80");
        assertThat(response.history()).hasSize(1);
    }

    @Test
    void keepsAProvidedComplement() {
        when(userRepository.findByEmail("ana@test.com")).thenReturn(Optional.of(creator));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OrderResponse response = orderService.create(request(" Apto 12 "), "ana@test.com");

        assertThat(response.deliveryComplement()).isEqualTo("Apto 12");
    }

    @Test
    void failsToCreateWhenTheAuthenticatedUserNoLongerExists() {
        when(userRepository.findByEmail("ghost@test.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> orderService.create(request(null), "ghost@test.com"))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(orderRepository, never()).save(any());
    }

    @Test
    void reportsAMissingOrderOnLookup() {
        when(orderRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> orderService.findById(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Order 99 not found");
    }

    @Test
    void movesAnOrderToTheNextStatus() {
        Order order = newOrder();
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

        OrderResponse response = orderService.updateStatus(1L, OrderStatus.EM_PREPARO);

        assertThat(response.status()).isEqualTo(OrderStatus.EM_PREPARO);
        assertThat(response.history()).extracting(OrderResponse.StatusChangeResponse::status)
                .containsExactly(OrderStatus.RECEBIDO, OrderStatus.EM_PREPARO);
    }

    @Test
    void rejectsATransitionTheDomainDoesNotAllow() {
        Order order = newOrder();
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.updateStatus(1L, OrderStatus.ENTREGUE))
                .isInstanceOf(InvalidStatusTransitionException.class)
                .hasMessage("Cannot change order status from RECEBIDO to ENTREGUE");
        assertThat(order.getStatus()).isEqualTo(OrderStatus.RECEBIDO);
    }

    @Test
    @SuppressWarnings("unchecked")
    void clampsThePageSizeAndSortsNewestFirst() {
        when(orderRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(Page.empty());

        orderService.search(List.of(), null, -3, 100_000);

        ArgumentCaptor<Pageable> pageable = ArgumentCaptor.forClass(Pageable.class);
        verify(orderRepository).findAll(any(Specification.class), pageable.capture());
        assertThat(pageable.getValue().getPageNumber()).isZero();
        assertThat(pageable.getValue().getPageSize()).isEqualTo(OrderService.MAX_PAGE_SIZE);
        assertThat(pageable.getValue().getSort().getOrderFor("createdAt").isDescending()).isTrue();
    }

    @Test
    @SuppressWarnings("unchecked")
    void mapsPagesIntoTheResponseEnvelope() {
        Page<Order> page = new PageImpl<>(List.of(newOrder()), Pageable.ofSize(20), 41);
        when(orderRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        var response = orderService.search(List.of(OrderStatus.RECEBIDO), "joao", 0, 20);

        assertThat(response.content()).hasSize(1);
        assertThat(response.totalElements()).isEqualTo(41);
        assertThat(response.totalPages()).isEqualTo(3);
        assertThat(response.last()).isFalse();
    }

    @Test
    @SuppressWarnings("unchecked")
    void countsEveryStatusEvenWhenThereAreNoOrders() {
        when(orderRepository.count(any(Specification.class))).thenReturn(0L, 2L, 0L, 0L, 1L);

        Map<OrderStatus, Long> counts = orderService.countByStatus(null);

        assertThat(counts).containsOnlyKeys(OrderStatus.values());
        assertThat(counts.values().stream().mapToLong(Long::longValue).sum()).isEqualTo(3);
    }
}
