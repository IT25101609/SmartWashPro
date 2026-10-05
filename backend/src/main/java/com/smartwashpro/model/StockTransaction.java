package com.smartwashpro.model;

import com.smartwashpro.model.enums.StockTransactionType;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "stock_transactions")
public class StockTransaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inventory_id", nullable = false)
    private Inventory inventory;

    @Enumerated(EnumType.STRING)
    private StockTransactionType transactionType;

    private Double quantity;
    private Double previousQuantity;
    private Double newQuantity;

    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id")
    private User createdBy;

    private LocalDateTime createdAt;

    public StockTransaction() {}

    public StockTransaction(Long id, Inventory inventory, StockTransactionType transactionType, Double quantity, Double previousQuantity, Double newQuantity, String notes, User createdBy, LocalDateTime createdAt) {
        this.id = id;
        this.inventory = inventory;
        this.transactionType = transactionType;
        this.quantity = quantity;
        this.previousQuantity = previousQuantity;
        this.newQuantity = newQuantity;
        this.notes = notes;
        this.createdBy = createdBy;
        this.createdAt = createdAt;
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Inventory getInventory() { return inventory; }
    public void setInventory(Inventory inventory) { this.inventory = inventory; }
    public StockTransactionType getTransactionType() { return transactionType; }
    public void setTransactionType(StockTransactionType transactionType) { this.transactionType = transactionType; }
    public Double getQuantity() { return quantity; }
    public void setQuantity(Double quantity) { this.quantity = quantity; }
    public Double getPreviousQuantity() { return previousQuantity; }
    public void setPreviousQuantity(Double previousQuantity) { this.previousQuantity = previousQuantity; }
    public Double getNewQuantity() { return newQuantity; }
    public void setNewQuantity(Double newQuantity) { this.newQuantity = newQuantity; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public static Builder builder() { return new Builder(); }
    public static class Builder {
        private Long id;
        private Inventory inventory;
        private StockTransactionType transactionType;
        private Double quantity;
        private Double previousQuantity;
        private Double newQuantity;
        private String notes;
        private User createdBy;
        private LocalDateTime createdAt;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder inventory(Inventory inventory) { this.inventory = inventory; return this; }
        public Builder transactionType(StockTransactionType transactionType) { this.transactionType = transactionType; return this; }
        public Builder quantity(Double quantity) { this.quantity = quantity; return this; }
        public Builder previousQuantity(Double previousQuantity) { this.previousQuantity = previousQuantity; return this; }
        public Builder newQuantity(Double newQuantity) { this.newQuantity = newQuantity; return this; }
        public Builder notes(String notes) { this.notes = notes; return this; }
        public Builder createdBy(User createdBy) { this.createdBy = createdBy; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public StockTransaction build() {
            return new StockTransaction(id, inventory, transactionType, quantity, previousQuantity, newQuantity, notes, createdBy, createdAt);
        }
    }
}
