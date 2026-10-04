package com.smartwashpro.model;

import com.smartwashpro.model.enums.InventoryCategory;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "inventory")
public class Inventory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String itemName;

    @Enumerated(EnumType.STRING)
    private InventoryCategory category;

    private Double quantity = 0.0;
    private String unit;
    private Double minimumStockLevel = 0.0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id")
    private Supplier supplier;

    private BigDecimal unitCost;

    @Column(name = "branch_id")
    private Long branchId;

    @Column(name = "is_active")
    private Boolean isActive = true;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Inventory() {}

    public Inventory(Long id, String itemName, InventoryCategory category, Double quantity, String unit, Double minimumStockLevel, Supplier supplier, BigDecimal unitCost, Long branchId, Boolean isActive, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.itemName = itemName;
        this.category = category;
        this.quantity = quantity != null ? quantity : 0.0;
        this.unit = unit;
        this.minimumStockLevel = minimumStockLevel != null ? minimumStockLevel : 0.0;
        this.supplier = supplier;
        this.unitCost = unitCost;
        this.branchId = branchId;
        this.isActive = isActive != null ? isActive : true;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); updatedAt = LocalDateTime.now(); }
    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getItemName() { return itemName; }
    public void setItemName(String itemName) { this.itemName = itemName; }
    public InventoryCategory getCategory() { return category; }
    public void setCategory(InventoryCategory category) { this.category = category; }
    public Double getQuantity() { return quantity; }
    public void setQuantity(Double quantity) { this.quantity = quantity; }
    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }
    public Double getMinimumStockLevel() { return minimumStockLevel; }
    public void setMinimumStockLevel(Double minimumStockLevel) { this.minimumStockLevel = minimumStockLevel; }
    public Supplier getSupplier() { return supplier; }
    public void setSupplier(Supplier supplier) { this.supplier = supplier; }
    public BigDecimal getUnitCost() { return unitCost; }
    public void setUnitCost(BigDecimal unitCost) { this.unitCost = unitCost; }
    public Long getBranchId() { return branchId; }
    public void setBranchId(Long branchId) { this.branchId = branchId; }
    public Boolean getIsActive() { return isActive != null ? isActive : true; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public boolean isActive() { return isActive != null && isActive; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public static Builder builder() { return new Builder(); }
    public static class Builder {
        private Long id;
        private String itemName;
        private InventoryCategory category;
        private Double quantity = 0.0;
        private String unit;
        private Double minimumStockLevel = 0.0;
        private Supplier supplier;
        private BigDecimal unitCost;
        private Long branchId;
        private Boolean isActive = true;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder itemName(String itemName) { this.itemName = itemName; return this; }
        public Builder category(InventoryCategory category) { this.category = category; return this; }
        public Builder quantity(Double quantity) { this.quantity = quantity; return this; }
        public Builder unit(String unit) { this.unit = unit; return this; }
        public Builder minimumStockLevel(Double minimumStockLevel) { this.minimumStockLevel = minimumStockLevel; return this; }
        public Builder supplier(Supplier supplier) { this.supplier = supplier; return this; }
        public Builder unitCost(BigDecimal unitCost) { this.unitCost = unitCost; return this; }
        public Builder branchId(Long branchId) { this.branchId = branchId; return this; }
        public Builder isActive(Boolean isActive) { this.isActive = isActive; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public Builder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public Inventory build() {
            return new Inventory(id, itemName, category, quantity, unit, minimumStockLevel, supplier, unitCost, branchId, isActive, createdAt, updatedAt);
        }
    }
}
