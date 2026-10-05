package com.smartwashpro.dto.request;

import com.smartwashpro.model.enums.EquipmentStatus;
import java.time.LocalDate;

public class EquipmentRequest {
    private String equipmentName;
    private String equipmentType;
    private String model;
    private String serialNumber;
    private LocalDate purchaseDate;
    private LocalDate nextMaintenanceDate;
    private EquipmentStatus status;
    private Long branchId;

    public EquipmentRequest() {}

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
    public LocalDate getNextMaintenanceDate() { return nextMaintenanceDate; }
    public void setNextMaintenanceDate(LocalDate nextMaintenanceDate) { this.nextMaintenanceDate = nextMaintenanceDate; }
    public EquipmentStatus getStatus() { return status; }
    public void setStatus(EquipmentStatus status) { this.status = status; }
    public Long getBranchId() { return branchId; }
    public void setBranchId(Long branchId) { this.branchId = branchId; }
}
