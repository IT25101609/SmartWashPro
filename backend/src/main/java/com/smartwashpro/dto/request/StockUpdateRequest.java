package com.smartwashpro.dto.request;

public class StockUpdateRequest {
    private double quantity;
    private String notes;
    public StockUpdateRequest() {}

    public StockUpdateRequest(double quantity, String notes) {
        this.quantity = quantity;
        this.notes = notes;
    }

    public double getQuantity() { return quantity; }
    public void setQuantity(double quantity) { this.quantity = quantity; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

}
