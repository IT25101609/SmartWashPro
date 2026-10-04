package com.smartwashpro.model;

import com.smartwashpro.model.enums.PricingType;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "laundry_services")
public class LaundryService {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String serviceName;
    private String category;
    private String description;

    @Column(nullable = false)
    private Double price;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PricingType pricingType;

    private Boolean available = true;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public LaundryService() {}

    public LaundryService(Long id, String serviceName, String category, String description, Double price, PricingType pricingType, Boolean available, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.serviceName = serviceName;
        this.category = category;
        this.description = description;
        this.price = price;
        this.pricingType = pricingType;
        this.available = available != null ? available : true;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); updatedAt = LocalDateTime.now(); }
    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getServiceName() { return serviceName; }
    public void setServiceName(String serviceName) { this.serviceName = serviceName; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }
    public PricingType getPricingType() { return pricingType; }
    public void setPricingType(PricingType pricingType) { this.pricingType = pricingType; }
    public Boolean getAvailable() { return available; }
    public void setAvailable(Boolean available) { this.available = available; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public static Builder builder() { return new Builder(); }
    public static class Builder {
        private Long id;
        private String serviceName;
        private String category;
        private String description;
        private Double price;
        private PricingType pricingType;
        private Boolean available = true;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder serviceName(String serviceName) { this.serviceName = serviceName; return this; }
        public Builder category(String category) { this.category = category; return this; }
        public Builder description(String description) { this.description = description; return this; }
        public Builder price(Double price) { this.price = price; return this; }
        public Builder pricingType(PricingType pricingType) { this.pricingType = pricingType; return this; }
        public Builder available(Boolean available) { this.available = available; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public Builder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public LaundryService build() {
            return new LaundryService(id, serviceName, category, description, price, pricingType, available, createdAt, updatedAt);
        }
    }
}
