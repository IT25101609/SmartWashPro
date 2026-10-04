package com.smartwashpro.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class InventoryResponse {
    private Long id;
    private Long supplierId;
    private String itemName;
    private String category;
    private String unit;
    private String supplierName;
    private Double quantity;
    private Double minimumStockLevel;
    private BigDecimal unitCost;
    private boolean lowStock;
    private boolean outOfStock;
    private String stockStatus; // "IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"
    private boolean isActive;
    private Long branchId;
    private LocalDateTime updatedAt;

    public InventoryResponse() {}

    public InventoryResponse(Long id, Long supplierId, String itemName, String category, String unit, String supplierName,
                             Double quantity, Double minimumStockLevel, BigDecimal unitCost, boolean lowStock,
                             boolean outOfStock, String stockStatus, boolean isActive, Long branchId, LocalDateTime updatedAt) {
        this.id = id;
        this.supplierId = supplierId;
        this.itemName = itemName;
        this.category = category;
        this.unit = unit;
        this.supplierName = supplierName;
        this.quantity = quantity;
        this.minimumStockLevel = minimumStockLevel;
        this.unitCost = unitCost;
        this.lowStock = lowStock;
        this.outOfStock = outOfStock;
        this.stockStatus = stockStatus;
        this.isActive = isActive;
        this.branchId = branchId;
        this.updatedAt = updatedAt;
    }

    public static String calculateStockStatus(Double quantity, Double minStock) {
        if (quantity == null || quantity <= 0.0) {
            return "OUT_OF_STOCK";
        }
        if (minStock != null && quantity < minStock) {
            return "LOW_STOCK";
        }
        return "IN_STOCK";
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getSupplierId() { return supplierId; }
    public void setSupplierId(Long supplierId) { this.supplierId = supplierId; }
    public String getItemName() { return itemName; }
    public void setItemName(String itemName) { this.itemName = itemName; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }
    public String getSupplierName() { return supplierName; }
    public void setSupplierName(String supplierName) { this.supplierName = supplierName; }
    public Double getQuantity() { return quantity; }
    public void setQuantity(Double quantity) { this.quantity = quantity; }
    public Double getMinimumStockLevel() { return minimumStockLevel; }
    public void setMinimumStockLevel(Double minimumStockLevel) { this.minimumStockLevel = minimumStockLevel; }
    public BigDecimal getUnitCost() { return unitCost; }
    public void setUnitCost(BigDecimal unitCost) { this.unitCost = unitCost; }
    public boolean isLowStock() { return lowStock; }
    public void setLowStock(boolean lowStock) { this.lowStock = lowStock; }
    public boolean isOutOfStock() { return outOfStock; }
    public void setOutOfStock(boolean outOfStock) { this.outOfStock = outOfStock; }
    public String getStockStatus() { return stockStatus; }
    public void setStockStatus(String stockStatus) { this.stockStatus = stockStatus; }
    public boolean isActive() { return isActive; }
    public boolean getIsActive() { return isActive; }
    public void setIsActive(boolean active) { isActive = active; }
    public Long getBranchId() { return branchId; }
    public void setBranchId(Long branchId) { this.branchId = branchId; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public static Builder builder() { return new Builder(); }
    public static class Builder {
        private Long id;
        private Long supplierId;
        private String itemName;
        private String category;
        private String unit;
        private String supplierName;
        private Double quantity = 0.0;
        private Double minimumStockLevel = 0.0;
        private BigDecimal unitCost;
        private Boolean lowStock;
        private Boolean outOfStock;
        private String stockStatus;
        private boolean isActive = true;
        private Long branchId;
        private LocalDateTime updatedAt;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder supplierId(Long supplierId) { this.supplierId = supplierId; return this; }
        public Builder itemName(String itemName) { this.itemName = itemName; return this; }
        public Builder category(String category) { this.category = category; return this; }
        public Builder unit(String unit) { this.unit = unit; return this; }
        public Builder supplierName(String supplierName) { this.supplierName = supplierName; return this; }
        public Builder quantity(Double quantity) { this.quantity = quantity; return this; }
        public Builder minimumStockLevel(Double minimumStockLevel) { this.minimumStockLevel = minimumStockLevel; return this; }
        public Builder unitCost(BigDecimal unitCost) { this.unitCost = unitCost; return this; }
        public Builder lowStock(boolean lowStock) { this.lowStock = lowStock; return this; }
        public Builder outOfStock(boolean outOfStock) { this.outOfStock = outOfStock; return this; }
        public Builder stockStatus(String stockStatus) { this.stockStatus = stockStatus; return this; }
        public Builder isActive(boolean isActive) { this.isActive = isActive; return this; }
        public Builder branchId(Long branchId) { this.branchId = branchId; return this; }
        public Builder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public InventoryResponse build() {
            double q = quantity != null ? quantity : 0.0;
            double min = minimumStockLevel != null ? minimumStockLevel : 0.0;
            boolean out = q <= 0.0;
            boolean low = !out && q < min;
            String status = stockStatus != null ? stockStatus : (out ? "OUT_OF_STOCK" : (low ? "LOW_STOCK" : "IN_STOCK"));
            boolean isLow = lowStock != null ? lowStock : low;
            boolean isOut = outOfStock != null ? outOfStock : out;
            return new InventoryResponse(id, supplierId, itemName, category, unit, supplierName, quantity, minimumStockLevel,
                    unitCost, isLow, isOut, status, isActive, branchId, updatedAt);
        }
    }
}
