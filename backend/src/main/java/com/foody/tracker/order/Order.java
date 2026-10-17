package com.foody.tracker.order;

import com.foody.tracker.user.User;
import jakarta.persistence.*;
import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
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
    @JdbcTypeCode(SqlTypes.INTEGER)
    private Long id;

    @Column(nullable = false)
    private String customerName;

    @Column(length = 30)
    private String customerPhone;

    @Column(nullable = false)
    private String deliveryAddress;

    @Column(length = 200)
    private String deliveryComplement;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "order_items", joinColumns = @JoinColumn(name = "order_id"))
    @BatchSize(size = 50)
    private List<OrderItem> items = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status = OrderStatus.RECEBIDO;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "order_status_history", joinColumns = @JoinColumn(name = "order_id"))
    @OrderBy("changedAt ASC")
    @BatchSize(size = 50)
    private List<StatusChange> history = new ArrayList<>();

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
        this.history.add(new StatusChange(this.status, this.createdAt));
    }

    public BigDecimal total() {
        return items.stream().map(OrderItem::subtotal).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public void changeStatus(OrderStatus next) {
        if (!status.canTransitionTo(next)) {
            throw new InvalidStatusTransitionException(status, next);
        }
        Instant now = Instant.now();
        this.status = next;
        this.updatedAt = now;
        this.history.add(new StatusChange(next, now));
    }
}
