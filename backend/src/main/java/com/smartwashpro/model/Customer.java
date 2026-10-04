package com.smartwashpro.model;

import com.smartwashpro.model.enums.PaymentMethod;
import jakarta.persistence.*;

@Entity
@Table(name = "customers")
public class Customer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private Integer loyaltyPoints = 0;
    private Integer totalOrders = 0;
    private Double totalSpent = 0.0;

    @Enumerated(EnumType.STRING)
    private PaymentMethod preferredPaymentMethod;

    public Customer() {}

    public Customer(Long id, User user, Integer loyaltyPoints, Integer totalOrders, Double totalSpent, PaymentMethod preferredPaymentMethod) {
        this.id = id;
        this.user = user;
        this.loyaltyPoints = loyaltyPoints != null ? loyaltyPoints : 0;
        this.totalOrders = totalOrders != null ? totalOrders : 0;
        this.totalSpent = totalSpent != null ? totalSpent : 0.0;
        this.preferredPaymentMethod = preferredPaymentMethod;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public Integer getLoyaltyPoints() { return loyaltyPoints; }
    public void setLoyaltyPoints(Integer loyaltyPoints) { this.loyaltyPoints = loyaltyPoints; }
    public Integer getTotalOrders() { return totalOrders; }
    public void setTotalOrders(Integer totalOrders) { this.totalOrders = totalOrders; }
    public Double getTotalSpent() { return totalSpent; }
    public void setTotalSpent(Double totalSpent) { this.totalSpent = totalSpent; }
    public PaymentMethod getPreferredPaymentMethod() { return preferredPaymentMethod; }
    public void setPreferredPaymentMethod(PaymentMethod preferredPaymentMethod) { this.preferredPaymentMethod = preferredPaymentMethod; }

    public static Builder builder() { return new Builder(); }
    public static class Builder {
        private Long id;
        private User user;
        private Integer loyaltyPoints = 0;
        private Integer totalOrders = 0;
        private Double totalSpent = 0.0;
        private PaymentMethod preferredPaymentMethod;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder user(User user) { this.user = user; return this; }
        public Builder loyaltyPoints(Integer loyaltyPoints) { this.loyaltyPoints = loyaltyPoints; return this; }
        public Builder totalOrders(Integer totalOrders) { this.totalOrders = totalOrders; return this; }
        public Builder totalSpent(Double totalSpent) { this.totalSpent = totalSpent; return this; }
        public Builder preferredPaymentMethod(PaymentMethod preferredPaymentMethod) { this.preferredPaymentMethod = preferredPaymentMethod; return this; }

        public Customer build() {
            return new Customer(id, user, loyaltyPoints, totalOrders, totalSpent, preferredPaymentMethod);
        }
    }
}
