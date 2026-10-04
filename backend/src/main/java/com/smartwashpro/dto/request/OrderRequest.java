package com.smartwashpro.dto.request;

import com.smartwashpro.model.enums.PaymentMethod;
import java.time.LocalDate;
import java.util.List;

public class OrderRequest {
    private Long customerId;
    private List<OrderItemRequest> items;
    private PaymentMethod paymentMethod;
    private String specialInstructions;
    private Boolean requestPickup;
    private String pickupAddress;
    private LocalDate pickupDate;
    private String pickupTimeSlot;
    private Long branchId;
    private Double discount;

    public OrderRequest() {}

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }
    public List<OrderItemRequest> getItems() { return items; }
    public void setItems(List<OrderItemRequest> items) { this.items = items; }
    public PaymentMethod getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(PaymentMethod paymentMethod) { this.paymentMethod = paymentMethod; }
    public String getSpecialInstructions() { return specialInstructions; }
    public void setSpecialInstructions(String specialInstructions) { this.specialInstructions = specialInstructions; }
    public Boolean getRequestPickup() { return requestPickup; }
    public void setRequestPickup(Boolean requestPickup) { this.requestPickup = requestPickup; }
    public String getPickupAddress() { return pickupAddress; }
    public void setPickupAddress(String pickupAddress) { this.pickupAddress = pickupAddress; }
    public LocalDate getPickupDate() { return pickupDate; }
    public void setPickupDate(LocalDate pickupDate) { this.pickupDate = pickupDate; }
    public String getPickupTimeSlot() { return pickupTimeSlot; }
    public void setPickupTimeSlot(String pickupTimeSlot) { this.pickupTimeSlot = pickupTimeSlot; }
    public Long getBranchId() { return branchId; }
    public void setBranchId(Long branchId) { this.branchId = branchId; }
    public Double getDiscount() { return discount; }
    public void setDiscount(Double discount) { this.discount = discount; }
}
