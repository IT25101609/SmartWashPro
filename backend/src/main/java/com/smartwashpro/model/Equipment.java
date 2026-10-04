package com.smartwashpro.model;

import com.smartwashpro.model.enums.EquipmentStatus;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "equipment")
public class Equipment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String equipmentName;

    private String equipmentType;
    private String model;

    @Column(unique = true)
    private String serialNumber;

    private LocalDate purchaseDate;

    @Enumerated(EnumType.STRING)
    private EquipmentStatus status = EquipmentStatus.ACTIVE;

    @Column(name = "branch_id")
    private Long branchId;

    private LocalDate lastMaintenanceDate;
    private LocalDate nextMaintenanceDate;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Equipment() {}

    public Equipment(Long id, String equipmentName, String equipmentType, String model, String serialNumber, LocalDate purchaseDate, EquipmentStatus status, Long branchId, LocalDate lastMaintenanceDate, LocalDate nextMaintenanceDate, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.equipmentName = equipmentName;
        this.equipmentType = equipmentType;
        this.model = model;
        this.serialNumber = serialNumber;
        this.purchaseDate = purchaseDate;
        this.status = status != null ? status : EquipmentStatus.ACTIVE;
        this.branchId = branchId;
        this.lastMaintenanceDate = lastMaintenanceDate;
        this.nextMaintenanceDate = nextMaintenanceDate;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); updatedAt = LocalDateTime.now(); }
    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getEquipmentName() { return equipmentName; }
    public void setEquipmentName(String equipmentName) { this.equipmentName = equipmentName; }
    public String getEquipmentType() { return equipmentType; }
    public void setEquipmentType(String equipmentType) { this.equipmentType = equipmentType; }
    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }
    public String getSerialNumber() { return serialNumber; }
    public void setSerialNumber(String serialNumber) { this.serialNumber = serialNumber; }
    public LocalDate getPurchaseDate() { return purchaseDate; }
    public void setPurchaseDate(LocalDate purchaseDate) { this.purchaseDate = purchaseDate; }
    public EquipmentStatus getStatus() { return status; }
    public void setStatus(EquipmentStatus status) { this.status = status; }
    public Long getBranchId() { return branchId; }
    public void setBranchId(Long branchId) { this.branchId = branchId; }
    public LocalDate getLastMaintenanceDate() { return lastMaintenanceDate; }
    public void setLastMaintenanceDate(LocalDate lastMaintenanceDate) { this.lastMaintenanceDate = lastMaintenanceDate; }
    public LocalDate getNextMaintenanceDate() { return nextMaintenanceDate; }
    public void setNextMaintenanceDate(LocalDate nextMaintenanceDate) { this.nextMaintenanceDate = nextMaintenanceDate; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public static Builder builder() { return new Builder(); }
    public static class Builder {
        private Long id;
        private String equipmentName;
        private String equipmentType;
        private String model;
        private String serialNumber;
        private LocalDate purchaseDate;
        private EquipmentStatus status = EquipmentStatus.ACTIVE;
        private Long branchId;
        private LocalDate lastMaintenanceDate;
        private LocalDate nextMaintenanceDate;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder equipmentName(String equipmentName) { this.equipmentName = equipmentName; return this; }
        public Builder equipmentType(String equipmentType) { this.equipmentType = equipmentType; return this; }
        public Builder model(String model) { this.model = model; return this; }
        public Builder serialNumber(String serialNumber) { this.serialNumber = serialNumber; return this; }
        public Builder purchaseDate(LocalDate purchaseDate) { this.purchaseDate = purchaseDate; return this; }
        public Builder status(EquipmentStatus status) { this.status = status; return this; }
        public Builder branchId(Long branchId) { this.branchId = branchId; return this; }
        public Builder lastMaintenanceDate(LocalDate lastMaintenanceDate) { this.lastMaintenanceDate = lastMaintenanceDate; return this; }
        public Builder nextMaintenanceDate(LocalDate nextMaintenanceDate) { this.nextMaintenanceDate = nextMaintenanceDate; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public Builder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public Equipment build() {
            return new Equipment(id, equipmentName, equipmentType, model, serialNumber, purchaseDate, status, branchId, lastMaintenanceDate, nextMaintenanceDate, createdAt, updatedAt);
        }
    }
}
