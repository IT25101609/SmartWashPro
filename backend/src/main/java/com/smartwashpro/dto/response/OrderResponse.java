package com.smartwashpro.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class OrderResponse {
    private Long id;
    private CustomerResponse customer;
    private String receptionistName;
    private Long branchId;
    private LocalDateTime orderDate;
    private LocalDate pickupDate;
    private LocalDate deliveryDate;
    private Double totalWeight;
    private Integer totalQuantity;
    private Double totalPrice;
    private String specialInstructions;
    private String orderStatus;
    private List<OrderItemResponse> items;
    private List<OrderStatusHistoryResponse> statusHistory;
    private PaymentResponse payment;
    private PickupResponse pickup;
    private LocalDateTime createdAt;

    public OrderResponse() {}

    public OrderResponse(Long id, CustomerResponse customer, String receptionistName, Long branchId, LocalDateTime orderDate, LocalDate pickupDate, LocalDate deliveryDate, Double totalWeight, Integer totalQuantity, Double totalPrice, String specialInstructions, String orderStatus, List<OrderItemResponse> items, List<OrderStatusHistoryResponse> statusHistory, PaymentResponse payment, PickupResponse pickup, LocalDateTime createdAt) {
        this.id = id;
        this.customer = customer;
        this.receptionistName = receptionistName;
        this.branchId = branchId;
        this.orderDate = orderDate;
        this.pickupDate = pickupDate;
        this.deliveryDate = deliveryDate;
        this.totalWeight = totalWeight;
        this.totalQuantity = totalQuantity;
        this.totalPrice = totalPrice;
        this.specialInstructions = specialInstructions;
        this.orderStatus = orderStatus;
        this.items = items;
        this.statusHistory = statusHistory;
        this.payment = payment;
        this.pickup = pickup;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public CustomerResponse getCustomer() { return customer; }
    public void setCustomer(CustomerResponse customer) { this.customer = customer; }
    public String getReceptionistName() { return receptionistName; }
    public void setReceptionistName(String receptionistName) { this.receptionistName = receptionistName; }
    public Long getBranchId() { return branchId; }
    public void setBranchId(Long branchId) { this.branchId = branchId; }
    public LocalDateTime getOrderDate() { return orderDate; }
    public void setOrderDate(LocalDateTime orderDate) { this.orderDate = orderDate; }
    public LocalDate getPickupDate() { return pickupDate; }
    public void setPickupDate(LocalDate pickupDate) { this.pickupDate = pickupDate; }
    public LocalDate getDeliveryDate() { return deliveryDate; }
    public void setDeliveryDate(LocalDate deliveryDate) { this.deliveryDate = deliveryDate; }
    public Double getTotalWeight() { return totalWeight; }
    public void setTotalWeight(Double totalWeight) { this.totalWeight = totalWeight; }
    public Integer getTotalQuantity() { return totalQuantity; }
    public void setTotalQuantity(Integer totalQuantity) { this.totalQuantity = totalQuantity; }
    public Double getTotalPrice() { return totalPrice; }
    public void setTotalPrice(Double totalPrice) { this.totalPrice = totalPrice; }
    public String getSpecialInstructions() { return specialInstructions; }
    public void setSpecialInstructions(String specialInstructions) { this.specialInstructions = specialInstructions; }
    public String getOrderStatus() { return orderStatus; }
    public void setOrderStatus(String orderStatus) { this.orderStatus = orderStatus; }
    public List<OrderItemResponse> getItems() { return items; }
    public void setItems(List<OrderItemResponse> items) { this.items = items; }
    public List<OrderStatusHistoryResponse> getStatusHistory() { return statusHistory; }
    public void setStatusHistory(List<OrderStatusHistoryResponse> statusHistory) { this.statusHistory = statusHistory; }
    public PaymentResponse getPayment() { return payment; }
    public void setPayment(PaymentResponse payment) { this.payment = payment; }
    public PickupResponse getPickup() { return pickup; }
    public void setPickup(PickupResponse pickup) { this.pickup = pickup; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public static Builder builder() { return new Builder(); }
    public static class Builder {
        private Long id;
        private CustomerResponse customer;
        private String receptionistName;
        private Long branchId;
        private LocalDateTime orderDate;
        private LocalDate pickupDate;
        private LocalDate deliveryDate;
        private Double totalWeight;
        private Integer totalQuantity;
        private Double totalPrice;
        private String specialInstructions;
        private String orderStatus;
        private List<OrderItemResponse> items;
        private List<OrderStatusHistoryResponse> statusHistory;
        private PaymentResponse payment;
        private PickupResponse pickup;
        private LocalDateTime createdAt;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder customer(CustomerResponse customer) { this.customer = customer; return this; }
        public Builder receptionistName(String receptionistName) { this.receptionistName = receptionistName; return this; }
        public Builder branchId(Long branchId) { this.branchId = branchId; return this; }
        public Builder orderDate(LocalDateTime orderDate) { this.orderDate = orderDate; return this; }
        public Builder pickupDate(LocalDate pickupDate) { this.pickupDate = pickupDate; return this; }
        public Builder deliveryDate(LocalDate deliveryDate) { this.deliveryDate = deliveryDate; return this; }
        public Builder totalWeight(Double totalWeight) { this.totalWeight = totalWeight; return this; }
        public Builder totalQuantity(Integer totalQuantity) { this.totalQuantity = totalQuantity; return this; }
        public Builder totalPrice(Double totalPrice) { this.totalPrice = totalPrice; return this; }
        public Builder specialInstructions(String specialInstructions) { this.specialInstructions = specialInstructions; return this; }
        public Builder orderStatus(String orderStatus) { this.orderStatus = orderStatus; return this; }
        public Builder items(List<OrderItemResponse> items) { this.items = items; return this; }
        public Builder statusHistory(List<OrderStatusHistoryResponse> statusHistory) { this.statusHistory = statusHistory; return this; }
        public Builder payment(PaymentResponse payment) { this.payment = payment; return this; }
        public Builder pickup(PickupResponse pickup) { this.pickup = pickup; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public OrderResponse build() {
            return new OrderResponse(id, customer, receptionistName, branchId, orderDate, pickupDate, deliveryDate, totalWeight, totalQuantity, totalPrice, specialInstructions, orderStatus, items, statusHistory, payment, pickup, createdAt);
        }
    }
}
