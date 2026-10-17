package com.foody.tracker.order;

import com.foody.tracker.common.ConflictException;
import com.foody.tracker.common.ResourceNotFoundException;
import com.foody.tracker.order.dto.CreateOrderRequest;
import com.foody.tracker.order.dto.OrderResponse;
import com.foody.tracker.user.User;
import com.foody.tracker.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    @Transactional
    public OrderResponse create(CreateOrderRequest request, String userEmail) {
        User creator = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        List<OrderItem> items = request.items().stream()
                .map(i -> new OrderItem(i.name().trim(), i.quantity(), i.unitPrice()))
                .toList();
        Order order = new Order(request.customerName().trim(), request.deliveryAddress().trim(), items, creator);
        return OrderResponse.from(orderRepository.save(order));
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> findAll() {
        return orderRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt", "id"))
                .stream().map(OrderResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public OrderResponse findById(Long id) {
        return OrderResponse.from(getOrThrow(id));
    }

    @Transactional
    public OrderResponse updateStatus(Long id, OrderStatus next) {
        Order order = getOrThrow(id);
        if (!order.getStatus().canTransitionTo(next)) {
            throw new ConflictException("Cannot change order status from %s to %s"
                    .formatted(order.getStatus(), next));
        }
        order.changeStatus(next);
        return OrderResponse.from(order);
    }

    private Order getOrThrow(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order %d not found".formatted(id)));
    }
}
