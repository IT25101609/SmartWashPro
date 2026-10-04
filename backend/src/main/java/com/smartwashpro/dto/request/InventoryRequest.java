package com.smartwashpro.dto.request;

import com.smartwashpro.model.enums.InventoryCategory;
import java.math.BigDecimal;

public class InventoryRequest {
    private String itemName;
    private String unit;
    private InventoryCategory category;
    private Double quantity;
    private Double minimumStockLevel;
    private Long supplierId;
    private BigDecimal unitCost;
    private Long branchId;
    private Boolean isActive;

    public InventoryRequest() {}

    public String getItemName() { return itemName; }
    public void setItemName(String itemName) { this.itemName = itemName; }
    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }
    public InventoryCategory getCategory() { return category; }
    public void setCategory(InventoryCategory category) { this.category = category; }
    public Double getQuantity() { return quantity; }
    public void setQuantity(Double quantity) { this.quantity = quantity; }
    public Double getMinimumStockLevel() { return minimumStockLevel; }
    public void setMinimumStockLevel(Double minimumStockLevel) { this.minimumStockLevel = minimumStockLevel; }
    public Long getSupplierId() { return supplierId; }
    public void setSupplierId(Long supplierId) { this.supplierId = supplierId; }
    public BigDecimal getUnitCost() { return unitCost; }
    public void setUnitCost(BigDecimal unitCost) { this.unitCost = unitCost; }
    public Long getBranchId() { return branchId; }
    public void setBranchId(Long branchId) { this.branchId = branchId; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
}
