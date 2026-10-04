package com.smartwashpro.dto.response;

import java.time.LocalDateTime;

public class StockTransactionResponse {
    private Long id;
    private Long inventoryId;
    private String itemName;
    private String unit;
    private String transactionType;
    private String notes;
    private Long createdById;
    private String createdByName;
    private Double quantity;
    private Double previousQuantity;
    private Double newQuantity;
    private Long branchId;
    private LocalDateTime createdAt;

    public StockTransactionResponse() {}

    public StockTransactionResponse(Long id, Long inventoryId, String itemName, String transactionType, String notes, String createdByName, Double quantity, Double previousQuantity, Double newQuantity, LocalDateTime createdAt) {
        this.id = id;
        this.inventoryId = inventoryId;
        this.itemName = itemName;
        this.transactionType = transactionType;
        this.notes = notes;
        this.createdByName = createdByName;
        this.quantity = quantity;
        this.previousQuantity = previousQuantity;
        this.newQuantity = newQuantity;
        this.createdAt = createdAt;
    }

    public StockTransactionResponse(Long id, Long inventoryId, String itemName, String unit, String transactionType, String notes, Long createdById, String createdByName, Double quantity, Double previousQuantity, Double newQuantity, Long branchId, LocalDateTime createdAt) {
        this.id = id;
        this.inventoryId = inventoryId;
        this.itemName = itemName;
        this.unit = unit;
        this.transactionType = transactionType;
        this.notes = notes;
        this.createdById = createdById;
        this.createdByName = createdByName;
        this.quantity = quantity;
        this.previousQuantity = previousQuantity;
        this.newQuantity = newQuantity;
        this.branchId = branchId;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getInventoryId() { return inventoryId; }
    public void setInventoryId(Long inventoryId) { this.inventoryId = inventoryId; }
    public String getItemName() { return itemName; }
    public void setItemName(String itemName) { this.itemName = itemName; }
    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }
    public String getTransactionType() { return transactionType; }
    public void setTransactionType(String transactionType) { this.transactionType = transactionType; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public Long getCreatedById() { return createdById; }
    public void setCreatedById(Long createdById) { this.createdById = createdById; }
    public String getCreatedByName() { return createdByName; }
    public void setCreatedByName(String createdByName) { this.createdByName = createdByName; }
    public Double getQuantity() { return quantity; }
    public void setQuantity(Double quantity) { this.quantity = quantity; }
    public Double getPreviousQuantity() { return previousQuantity; }
    public void setPreviousQuantity(Double previousQuantity) { this.previousQuantity = previousQuantity; }
    public Double getNewQuantity() { return newQuantity; }
    public void setNewQuantity(Double newQuantity) { this.newQuantity = newQuantity; }
    public Long getBranchId() { return branchId; }
    public void setBranchId(Long branchId) { this.branchId = branchId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public static Builder builder() { return new Builder(); }
    public static class Builder {
        private Long id;
        private Long inventoryId;
        private String itemName;
        private String unit;
        private String transactionType;
        private String notes;
        private Long createdById;
        private String createdByName;
        private Double quantity;
        private Double previousQuantity;
        private Double newQuantity;
        private Long branchId;
        private LocalDateTime createdAt;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder inventoryId(Long inventoryId) { this.inventoryId = inventoryId; return this; }
        public Builder itemName(String itemName) { this.itemName = itemName; return this; }
        public Builder unit(String unit) { this.unit = unit; return this; }
        public Builder transactionType(String transactionType) { this.transactionType = transactionType; return this; }
        public Builder notes(String notes) { this.notes = notes; return this; }
        public Builder createdById(Long createdById) { this.createdById = createdById; return this; }
        public Builder createdByName(String createdByName) { this.createdByName = createdByName; return this; }
        public Builder quantity(Double quantity) { this.quantity = quantity; return this; }
        public Builder previousQuantity(Double previousQuantity) { this.previousQuantity = previousQuantity; return this; }
        public Builder newQuantity(Double newQuantity) { this.newQuantity = newQuantity; return this; }
        public Builder branchId(Long branchId) { this.branchId = branchId; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public StockTransactionResponse build() {
            return new StockTransactionResponse(id, inventoryId, itemName, unit, transactionType, notes, createdById, createdByName, quantity, previousQuantity, newQuantity, branchId, createdAt);
        }
    }
}
