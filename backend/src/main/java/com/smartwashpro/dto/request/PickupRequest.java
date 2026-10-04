package com.smartwashpro.dto.request;

import java.time.LocalDate;

public class PickupRequest {
    private Long orderId;
    private Long customerId;
    private Long driverId;
    private String pickupAddress;
    private String pickupTimeSlot;
    private String specialInstruction;
    private LocalDate pickupDate;

    public PickupRequest() {}

    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }
    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }
    public Long getDriverId() { return driverId; }
    public void setDriverId(Long driverId) { this.driverId = driverId; }
    public String getPickupAddress() { return pickupAddress; }
    public void setPickupAddress(String pickupAddress) { this.pickupAddress = pickupAddress; }
    public String getPickupTimeSlot() { return pickupTimeSlot; }
    public void setPickupTimeSlot(String pickupTimeSlot) { this.pickupTimeSlot = pickupTimeSlot; }
    public String getSpecialInstruction() { return specialInstruction; }
    public void setSpecialInstruction(String specialInstruction) { this.specialInstruction = specialInstruction; }
    public LocalDate getPickupDate() { return pickupDate; }
    public void setPickupDate(LocalDate pickupDate) { this.pickupDate = pickupDate; }
}
