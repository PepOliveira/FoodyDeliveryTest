package com.foody.tracker.order;

import com.foody.tracker.user.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String customerName;

    /** Nullable at database level so orders created before this field existed stay valid. */
    @Column(length = 30)
    private String customerPhone;

    @Column(nullable = false)
    private String deliveryAddress;

    @Column(length = 200)
    private String deliveryComplement;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "order_items", joinColumns = @JoinColumn(name = "order_id"))
    private List<OrderItem> items = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status = OrderStatus.RECEBIDO;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(nullable = false)
    private Instant updatedAt = Instant.now();

    public Order(String customerName, String customerPhone, String deliveryAddress, String deliveryComplement,
                 List<OrderItem> items, User createdBy) {
        this.customerName = customerName;
        this.customerPhone = customerPhone;
        this.deliveryAddress = deliveryAddress;
        this.deliveryComplement = deliveryComplement;
        this.items = new ArrayList<>(items);
        this.createdBy = createdBy;
    }

    public BigDecimal total() {
        return items.stream().map(OrderItem::subtotal).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public void changeStatus(OrderStatus next) {
        this.status = next;
        this.updatedAt = Instant.now();
    }
}
