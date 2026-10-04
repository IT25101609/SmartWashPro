package com.smartwashpro.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class ServiceResponse {
    private Long id;
    private String serviceName;
    private String category;
    private String description;
    private String pricingType;
    private BigDecimal price;
    private Boolean available;
    private LocalDateTime createdAt;

    public ServiceResponse() {}

    public ServiceResponse(Long id, String serviceName, String category, String description, String pricingType, BigDecimal price, Boolean available, LocalDateTime createdAt) {
        this.id = id;
        this.serviceName = serviceName;
        this.category = category;
        this.description = description;
        this.pricingType = pricingType;
        this.price = price;
        this.available = available;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getServiceName() { return serviceName; }
    public void setServiceName(String serviceName) { this.serviceName = serviceName; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getPricingType() { return pricingType; }
    public void setPricingType(String pricingType) { this.pricingType = pricingType; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public Boolean getAvailable() { return available; }
    public void setAvailable(Boolean available) { this.available = available; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public static Builder builder() { return new Builder(); }
    public static class Builder {
        private Long id;
        private String serviceName;
        private String category;
        private String description;
        private String pricingType;
        private BigDecimal price;
        private Boolean available;
        private LocalDateTime createdAt;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder serviceName(String serviceName) { this.serviceName = serviceName; return this; }
        public Builder category(String category) { this.category = category; return this; }
        public Builder description(String description) { this.description = description; return this; }
        public Builder pricingType(String pricingType) { this.pricingType = pricingType; return this; }
        public Builder price(BigDecimal price) { this.price = price; return this; }
        public Builder available(Boolean available) { this.available = available; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public ServiceResponse build() {
            return new ServiceResponse(id, serviceName, category, description, pricingType, price, available, createdAt);
        }
    }
}
