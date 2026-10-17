package com.foody.tracker.order;

import com.foody.tracker.common.PageResponse;
import com.foody.tracker.common.ResourceNotFoundException;
import com.foody.tracker.order.dto.CreateOrderRequest;
import com.foody.tracker.order.dto.OrderResponse;
import com.foody.tracker.user.User;
import com.foody.tracker.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class OrderService {

    static final int MAX_PAGE_SIZE = 100;

    private static final Sort NEWEST_FIRST = Sort.by(Sort.Direction.DESC, "createdAt", "id");

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    @Transactional
    public OrderResponse create(CreateOrderRequest request, String userEmail) {
        User creator = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        List<OrderItem> items = request.items().stream()
                .map(i -> new OrderItem(i.name().trim(), i.quantity(), i.unitPrice()))
                .toList();
        Order order = new Order(
                request.customerName().trim(),
                request.customerPhone().trim(),
                request.deliveryAddress().trim(),
                blankToNull(request.deliveryComplement()),
                items,
                creator);
        return OrderResponse.from(orderRepository.save(order));
    }

    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> search(List<OrderStatus> statuses, String query, int page, int size) {
        PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), MAX_PAGE_SIZE), NEWEST_FIRST);
        Specification<Order> filter = OrderSpecifications.withStatuses(statuses)
                .and(OrderSpecifications.matching(query));
        return PageResponse.from(orderRepository.findAll(filter, pageable), OrderResponse::from);
    }

    @Transactional(readOnly = true)
    public Map<OrderStatus, Long> countByStatus(String query) {
        Map<OrderStatus, Long> counts = new EnumMap<>(OrderStatus.class);
        for (OrderStatus status : OrderStatus.values()) {
            counts.put(status, orderRepository.count(
                    OrderSpecifications.withStatuses(List.of(status)).and(OrderSpecifications.matching(query))));
        }
        return counts;
    }

    @Transactional(readOnly = true)
    public OrderResponse findById(Long id) {
        return OrderResponse.from(getOrThrow(id));
    }

    @Transactional
    public OrderResponse updateStatus(Long id, OrderStatus next) {
        Order order = getOrThrow(id);
        order.changeStatus(next);
        return OrderResponse.from(order);
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private Order getOrThrow(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order %d not found".formatted(id)));
    }
}
