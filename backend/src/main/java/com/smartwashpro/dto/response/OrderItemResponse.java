package com.smartwashpro.dto.response;
public class OrderItemResponse {
    private Long id;
    private Long serviceId;
    private String serviceName;
    private Double quantity;
    private Double unitPrice;
    private Double subtotal;
    private String specialInstruction;
    public OrderItemResponse() {}

    public OrderItemResponse(Long id, Long serviceId, String serviceName, Double quantity, Double unitPrice, Double subtotal, String specialInstruction) {
        this.id = id;
        this.serviceId = serviceId;
        this.serviceName = serviceName;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.subtotal = subtotal;
        this.specialInstruction = specialInstruction;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getServiceId() { return serviceId; }
    public void setServiceId(Long serviceId) { this.serviceId = serviceId; }

    public String getServiceName() { return serviceName; }
    public void setServiceName(String serviceName) { this.serviceName = serviceName; }

    public Double getQuantity() { return quantity; }
    public void setQuantity(Double quantity) { this.quantity = quantity; }

    public Double getUnitPrice() { return unitPrice; }
    public void setUnitPrice(Double unitPrice) { this.unitPrice = unitPrice; }

    public Double getSubtotal() { return subtotal; }
    public void setSubtotal(Double subtotal) { this.subtotal = subtotal; }

    public String getSpecialInstruction() { return specialInstruction; }
    public void setSpecialInstruction(String specialInstruction) { this.specialInstruction = specialInstruction; }


    public static Builder builder() { return new Builder(); }
    public static class Builder {
        private Long id;
        private Long serviceId;
        private String serviceName;
        private Double quantity;
        private Double unitPrice;
        private Double subtotal;
        private String specialInstruction;
        public Builder id(Long id) { this.id = id; return this; }
        public Builder serviceId(Long serviceId) { this.serviceId = serviceId; return this; }
        public Builder serviceName(String serviceName) { this.serviceName = serviceName; return this; }
        public Builder quantity(Double quantity) { this.quantity = quantity; return this; }
        public Builder unitPrice(Double unitPrice) { this.unitPrice = unitPrice; return this; }
        public Builder subtotal(Double subtotal) { this.subtotal = subtotal; return this; }
        public Builder specialInstruction(String specialInstruction) { this.specialInstruction = specialInstruction; return this; }
        public OrderItemResponse build() {
            OrderItemResponse instance = new OrderItemResponse();
            instance.id = this.id;
            instance.serviceId = this.serviceId;
            instance.serviceName = this.serviceName;
            instance.quantity = this.quantity;
            instance.unitPrice = this.unitPrice;
            instance.subtotal = this.subtotal;
            instance.specialInstruction = this.specialInstruction;
            return instance;
        }
    }

}
