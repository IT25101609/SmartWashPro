package com.smartwashpro.dto.request;

public class OrderItemRequest {
    private Long serviceId;
    private Double quantity;
    private String specialInstruction;

    public OrderItemRequest() {}

    public Long getServiceId() { return serviceId; }
    public void setServiceId(Long serviceId) { this.serviceId = serviceId; }
    public Double getQuantity() { return quantity; }
    public void setQuantity(Double quantity) { this.quantity = quantity; }
    public String getSpecialInstruction() { return specialInstruction; }
    public void setSpecialInstruction(String specialInstruction) { this.specialInstruction = specialInstruction; }
}
