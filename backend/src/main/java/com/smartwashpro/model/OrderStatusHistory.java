package com.smartwashpro.model;

import com.smartwashpro.model.enums.OrderStatus;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "order_status_history")
public class OrderStatusHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Enumerated(EnumType.STRING)
    private OrderStatus oldStatus;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus newStatus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "changed_by_user_id")
    private User changedBy;

    private String remarks;
    private LocalDateTime changedAt;

    public OrderStatusHistory() {}

    public OrderStatusHistory(Long id, Order order, OrderStatus oldStatus, OrderStatus newStatus, User changedBy, String remarks, LocalDateTime changedAt) {
        this.id = id;
        this.order = order;
        this.oldStatus = oldStatus;
        this.newStatus = newStatus;
        this.changedBy = changedBy;
        this.remarks = remarks;
        this.changedAt = changedAt;
    }

    @PrePersist
    protected void onCreate() { if (changedAt == null) changedAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Order getOrder() { return order; }
    public void setOrder(Order order) { this.order = order; }
    public OrderStatus getOldStatus() { return oldStatus; }
    public void setOldStatus(OrderStatus oldStatus) { this.oldStatus = oldStatus; }
    public OrderStatus getNewStatus() { return newStatus; }
    public void setNewStatus(OrderStatus newStatus) { this.newStatus = newStatus; }
    public User getChangedBy() { return changedBy; }
    public void setChangedBy(User changedBy) { this.changedBy = changedBy; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public LocalDateTime getChangedAt() { return changedAt; }
    public void setChangedAt(LocalDateTime changedAt) { this.changedAt = changedAt; }

    public static Builder builder() { return new Builder(); }
    public static class Builder {
        private Long id;
        private Order order;
        private OrderStatus oldStatus;
        private OrderStatus newStatus;
        private User changedBy;
        private String remarks;
        private LocalDateTime changedAt;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder order(Order order) { this.order = order; return this; }
        public Builder oldStatus(OrderStatus oldStatus) { this.oldStatus = oldStatus; return this; }
        public Builder newStatus(OrderStatus newStatus) { this.newStatus = newStatus; return this; }
        public Builder changedBy(User changedBy) { this.changedBy = changedBy; return this; }
        public Builder remarks(String remarks) { this.remarks = remarks; return this; }
        public Builder changedAt(LocalDateTime changedAt) { this.changedAt = changedAt; return this; }

        public OrderStatusHistory build() {
            return new OrderStatusHistory(id, order, oldStatus, newStatus, changedBy, remarks, changedAt);
        }
    }
}
