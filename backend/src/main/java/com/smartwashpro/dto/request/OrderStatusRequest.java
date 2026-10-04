package com.smartwashpro.dto.request;

import com.smartwashpro.model.enums.OrderStatus;

public class OrderStatusRequest {
    private OrderStatus status;
    private String remarks;

    public OrderStatusRequest() {}

    public OrderStatus getStatus() { return status; }
    public void setStatus(OrderStatus status) { this.status = status; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
}
