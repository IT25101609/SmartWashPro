package com.smartwashpro.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class MaintenanceResponse {
    private Long id;
    private Long equipmentId;
    private String equipmentName;
    private String equipmentModel;
    private String equipmentSerialNumber;
    private String equipmentType;
    private String equipmentStatus;
    private Long branchId;
    private String branchName;

    private String maintenanceType;
    private String description;
    private String problem;
    private String repairDetails;
    private Long assignedEmployeeId;
    private String assignedEmployeeName;
    private String performedBy;
    private String status;
    private LocalDate scheduledDate;
    private LocalDate completedDate;
    private BigDecimal cost;
    private LocalDateTime createdAt;

    public MaintenanceResponse() {}

    public MaintenanceResponse(Long id, Long equipmentId, String equipmentName, String equipmentModel,
                               String equipmentSerialNumber, String equipmentType, String equipmentStatus,
                               Long branchId, String branchName, String maintenanceType, String description,
                               String problem, String repairDetails, Long assignedEmployeeId,
                               String assignedEmployeeName, String performedBy, String status,
                               LocalDate scheduledDate, LocalDate completedDate, BigDecimal cost,
                               LocalDateTime createdAt) {
        this.id = id;
        this.equipmentId = equipmentId;
        this.equipmentName = equipmentName;
        this.equipmentModel = equipmentModel;
        this.equipmentSerialNumber = equipmentSerialNumber;
        this.equipmentType = equipmentType;
        this.equipmentStatus = equipmentStatus;
        this.branchId = branchId;
        this.branchName = branchName;
        this.maintenanceType = maintenanceType;
        this.description = description;
        this.problem = problem;
        this.repairDetails = repairDetails;
        this.assignedEmployeeId = assignedEmployeeId;
        this.assignedEmployeeName = assignedEmployeeName;
        this.performedBy = performedBy;
        this.status = status;
        this.scheduledDate = scheduledDate;
        this.completedDate = completedDate;
        this.cost = cost;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getEquipmentId() { return equipmentId; }
    public void setEquipmentId(Long equipmentId) { this.equipmentId = equipmentId; }

    public String getEquipmentName() { return equipmentName; }
    public void setEquipmentName(String equipmentName) { this.equipmentName = equipmentName; }

    public String getEquipmentModel() { return equipmentModel; }
    public void setEquipmentModel(String equipmentModel) { this.equipmentModel = equipmentModel; }

    public String getEquipmentSerialNumber() { return equipmentSerialNumber; }
    public void setEquipmentSerialNumber(String equipmentSerialNumber) { this.equipmentSerialNumber = equipmentSerialNumber; }

    public String getEquipmentType() { return equipmentType; }
    public void setEquipmentType(String equipmentType) { this.equipmentType = equipmentType; }

    public String getEquipmentStatus() { return equipmentStatus; }
    public void setEquipmentStatus(String equipmentStatus) { this.equipmentStatus = equipmentStatus; }

    public Long getBranchId() { return branchId; }
    public void setBranchId(Long branchId) { this.branchId = branchId; }

    public String getBranchName() { return branchName; }
    public void setBranchName(String branchName) { this.branchName = branchName; }

    public String getMaintenanceType() { return maintenanceType; }
    public void setMaintenanceType(String maintenanceType) { this.maintenanceType = maintenanceType; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getProblem() { return problem; }
    public void setProblem(String problem) { this.problem = problem; }

    public String getRepairDetails() { return repairDetails; }
    public void setRepairDetails(String repairDetails) { this.repairDetails = repairDetails; }

    public Long getAssignedEmployeeId() { return assignedEmployeeId; }
    public void setAssignedEmployeeId(Long assignedEmployeeId) { this.assignedEmployeeId = assignedEmployeeId; }

    public String getAssignedEmployeeName() { return assignedEmployeeName; }
    public void setAssignedEmployeeName(String assignedEmployeeName) { this.assignedEmployeeName = assignedEmployeeName; }

    public String getPerformedBy() { return performedBy; }
    public void setPerformedBy(String performedBy) { this.performedBy = performedBy; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDate getScheduledDate() { return scheduledDate; }
    public void setScheduledDate(LocalDate scheduledDate) { this.scheduledDate = scheduledDate; }

    public LocalDate getCompletedDate() { return completedDate; }
    public void setCompletedDate(LocalDate completedDate) { this.completedDate = completedDate; }

    public BigDecimal getCost() { return cost; }
    public void setCost(BigDecimal cost) { this.cost = cost; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private Long equipmentId;
        private String equipmentName;
        private String equipmentModel;
        private String equipmentSerialNumber;
        private String equipmentType;
        private String equipmentStatus;
        private Long branchId;
        private String branchName;
        private String maintenanceType;
        private String description;
        private String problem;
        private String repairDetails;
        private Long assignedEmployeeId;
        private String assignedEmployeeName;
        private String performedBy;
        private String status;
        private LocalDate scheduledDate;
        private LocalDate completedDate;
        private BigDecimal cost;
        private LocalDateTime createdAt;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder equipmentId(Long equipmentId) { this.equipmentId = equipmentId; return this; }
        public Builder equipmentName(String equipmentName) { this.equipmentName = equipmentName; return this; }
        public Builder equipmentModel(String equipmentModel) { this.equipmentModel = equipmentModel; return this; }
        public Builder equipmentSerialNumber(String equipmentSerialNumber) { this.equipmentSerialNumber = equipmentSerialNumber; return this; }
        public Builder equipmentType(String equipmentType) { this.equipmentType = equipmentType; return this; }
        public Builder equipmentStatus(String equipmentStatus) { this.equipmentStatus = equipmentStatus; return this; }
        public Builder branchId(Long branchId) { this.branchId = branchId; return this; }
        public Builder branchName(String branchName) { this.branchName = branchName; return this; }
        public Builder maintenanceType(String maintenanceType) { this.maintenanceType = maintenanceType; return this; }
        public Builder description(String description) { this.description = description; return this; }
        public Builder problem(String problem) { this.problem = problem; return this; }
        public Builder repairDetails(String repairDetails) { this.repairDetails = repairDetails; return this; }
        public Builder assignedEmployeeId(Long assignedEmployeeId) { this.assignedEmployeeId = assignedEmployeeId; return this; }
        public Builder assignedEmployeeName(String assignedEmployeeName) { this.assignedEmployeeName = assignedEmployeeName; return this; }
        public Builder performedBy(String performedBy) { this.performedBy = performedBy; return this; }
        public Builder status(String status) { this.status = status; return this; }
        public Builder scheduledDate(LocalDate scheduledDate) { this.scheduledDate = scheduledDate; return this; }
        public Builder completedDate(LocalDate completedDate) { this.completedDate = completedDate; return this; }
        public Builder cost(BigDecimal cost) { this.cost = cost; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public MaintenanceResponse build() {
            return new MaintenanceResponse(id, equipmentId, equipmentName, equipmentModel, equipmentSerialNumber,
                    equipmentType, equipmentStatus, branchId, branchName, maintenanceType, description, problem,
                    repairDetails, assignedEmployeeId, assignedEmployeeName, performedBy, status, scheduledDate,
                    completedDate, cost, createdAt);
        }
    }
}
