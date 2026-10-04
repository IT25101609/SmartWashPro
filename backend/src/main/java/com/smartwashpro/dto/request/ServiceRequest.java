package com.smartwashpro.dto.request;

import com.smartwashpro.model.enums.PricingType;
import java.math.BigDecimal;

public class ServiceRequest {
    private String serviceName;
    private String category;
    private String description;
    private BigDecimal price;
    private PricingType pricingType;
    private Boolean available;

    public ServiceRequest() {}

    public String getServiceName() { return serviceName; }
    public void setServiceName(String serviceName) { this.serviceName = serviceName; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public PricingType getPricingType() { return pricingType; }
    public void setPricingType(PricingType pricingType) { this.pricingType = pricingType; }
    public Boolean getAvailable() { return available; }
    public void setAvailable(Boolean available) { this.available = available; }
}
