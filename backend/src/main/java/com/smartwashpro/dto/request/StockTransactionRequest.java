package com.smartwashpro.dto.request;

import com.smartwashpro.model.enums.StockTransactionType;
import java.time.LocalDateTime;

public class StockTransactionRequest {
    private Long inventoryId;
    private StockTransactionType transactionType;
    private Double quantity;
    private String notes;
    private Long employeeId; // Optional: specific employee
    private LocalDateTime transactionDate; // Optional: custom transaction date
    private String adjustmentMode; // "SET" (default, target quantity) or "DELTA"

    public StockTransactionRequest() {}

    public StockTransactionRequest(Long inventoryId, StockTransactionType transactionType, Double quantity, String notes, Long employeeId, LocalDateTime transactionDate, String adjustmentMode) {
        this.inventoryId = inventoryId;
        this.transactionType = transactionType;
        this.quantity = quantity;
        this.notes = notes;
        this.employeeId = employeeId;
        this.transactionDate = transactionDate;
        this.adjustmentMode = adjustmentMode;
    }

    public Long getInventoryId() { return inventoryId; }
    public void setInventoryId(Long inventoryId) { this.inventoryId = inventoryId; }

    public StockTransactionType getTransactionType() { return transactionType; }
    public void setTransactionType(StockTransactionType transactionType) { this.transactionType = transactionType; }

    public Double getQuantity() { return quantity; }
    public void setQuantity(Double quantity) { this.quantity = quantity; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }

    public LocalDateTime getTransactionDate() { return transactionDate; }
    public void setTransactionDate(LocalDateTime transactionDate) { this.transactionDate = transactionDate; }

    public String getAdjustmentMode() { return adjustmentMode; }
    public void setAdjustmentMode(String adjustmentMode) { this.adjustmentMode = adjustmentMode; }
}
