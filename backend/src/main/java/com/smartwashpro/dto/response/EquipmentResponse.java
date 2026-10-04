package com.smartwashpro.dto.response;

import java.time.LocalDate;

public class EquipmentResponse {
    private Long id;
    private String equipmentName;
    private String equipmentType;
    private String model;
    private String serialNumber;
    private String status;
    private Long branchId;
    private String branchName;
    private LocalDate purchaseDate;
    private LocalDate lastMaintenanceDate;
    private LocalDate nextMaintenanceDate;

    public EquipmentResponse() {}

    public EquipmentResponse(Long id, String equipmentName, String equipmentType, String model, String serialNumber,
                             String status, Long branchId, String branchName, LocalDate purchaseDate,
                             LocalDate lastMaintenanceDate, LocalDate nextMaintenanceDate) {
        this.id = id;
        this.equipmentName = equipmentName;
        this.equipmentType = equipmentType;
        this.model = model;
        this.serialNumber = serialNumber;
        this.status = status;
        this.branchId = branchId;
        this.branchName = branchName;
        this.purchaseDate = purchaseDate;
        this.lastMaintenanceDate = lastMaintenanceDate;
        this.nextMaintenanceDate = nextMaintenanceDate;
    }

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
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Long getBranchId() { return branchId; }
    public void setBranchId(Long branchId) { this.branchId = branchId; }
    public String getBranchName() { return branchName; }
    public void setBranchName(String branchName) { this.branchName = branchName; }
    public LocalDate getPurchaseDate() { return purchaseDate; }
    public void setPurchaseDate(LocalDate purchaseDate) { this.purchaseDate = purchaseDate; }
    public LocalDate getLastMaintenanceDate() { return lastMaintenanceDate; }
    public void setLastMaintenanceDate(LocalDate lastMaintenanceDate) { this.lastMaintenanceDate = lastMaintenanceDate; }
    public LocalDate getNextMaintenanceDate() { return nextMaintenanceDate; }
    public void setNextMaintenanceDate(LocalDate nextMaintenanceDate) { this.nextMaintenanceDate = nextMaintenanceDate; }

    public static Builder builder() { return new Builder(); }
    public static class Builder {
        private Long id;
        private String equipmentName;
        private String equipmentType;
        private String model;
        private String serialNumber;
        private String status;
        private Long branchId;
        private String branchName;
        private LocalDate purchaseDate;
        private LocalDate lastMaintenanceDate;
        private LocalDate nextMaintenanceDate;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder equipmentName(String equipmentName) { this.equipmentName = equipmentName; return this; }
        public Builder equipmentType(String equipmentType) { this.equipmentType = equipmentType; return this; }
        public Builder model(String model) { this.model = model; return this; }
        public Builder serialNumber(String serialNumber) { this.serialNumber = serialNumber; return this; }
        public Builder status(String status) { this.status = status; return this; }
        public Builder branchId(Long branchId) { this.branchId = branchId; return this; }
        public Builder branchName(String branchName) { this.branchName = branchName; return this; }
        public Builder purchaseDate(LocalDate purchaseDate) { this.purchaseDate = purchaseDate; return this; }
        public Builder lastMaintenanceDate(LocalDate lastMaintenanceDate) { this.lastMaintenanceDate = lastMaintenanceDate; return this; }
        public Builder nextMaintenanceDate(LocalDate nextMaintenanceDate) { this.nextMaintenanceDate = nextMaintenanceDate; return this; }

        public EquipmentResponse build() {
            return new EquipmentResponse(id, equipmentName, equipmentType, model, serialNumber, status, branchId, branchName, purchaseDate, lastMaintenanceDate, nextMaintenanceDate);
        }
    }
}
