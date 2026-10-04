package com.smartwashpro.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class BreakdownResponse {
    private Long id;
    private Long equipmentId;
    private String equipmentName;
    private String equipmentModel;
    private String equipmentSerialNumber;
    private String equipmentType;
    private String equipmentStatus;
    private Long branchId;
    private String branchName;

    private String description;
    private String problem;
    private String severity;
    private String priority;
    private Long assignedEmployeeId;
    private String assignedEmployeeName;
    private String technician;
    private String repairNotes;
    private String repairDetails;
    private String status;
    private LocalDate reportedDate;
    private LocalDate repairedDate;
    private BigDecimal repairCost;
    private LocalDateTime createdAt;

    public BreakdownResponse() {}

    public BreakdownResponse(Long id, Long equipmentId, String equipmentName, String equipmentModel,
                             String equipmentSerialNumber, String equipmentType, String equipmentStatus,
                             Long branchId, String branchName, String description, String problem,
                             String severity, String priority, Long assignedEmployeeId,
                             String assignedEmployeeName, String technician, String repairNotes,
                             String repairDetails, String status, LocalDate reportedDate,
                             LocalDate repairedDate, BigDecimal repairCost, LocalDateTime createdAt) {
        this.id = id;
        this.equipmentId = equipmentId;
        this.equipmentName = equipmentName;
        this.equipmentModel = equipmentModel;
        this.equipmentSerialNumber = equipmentSerialNumber;
        this.equipmentType = equipmentType;
        this.equipmentStatus = equipmentStatus;
        this.branchId = branchId;
        this.branchName = branchName;
        this.description = description;
        this.problem = problem;
        this.severity = severity;
        this.priority = priority;
        this.assignedEmployeeId = assignedEmployeeId;
        this.assignedEmployeeName = assignedEmployeeName;
        this.technician = technician;
        this.repairNotes = repairNotes;
        this.repairDetails = repairDetails;
        this.status = status;
        this.reportedDate = reportedDate;
        this.repairedDate = repairedDate;
        this.repairCost = repairCost;
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

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getProblem() { return problem; }
    public void setProblem(String problem) { this.problem = problem; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public Long getAssignedEmployeeId() { return assignedEmployeeId; }
    public void setAssignedEmployeeId(Long assignedEmployeeId) { this.assignedEmployeeId = assignedEmployeeId; }

    public String getAssignedEmployeeName() { return assignedEmployeeName; }
    public void setAssignedEmployeeName(String assignedEmployeeName) { this.assignedEmployeeName = assignedEmployeeName; }

    public String getTechnician() { return technician; }
    public void setTechnician(String technician) { this.technician = technician; }

    public String getRepairNotes() { return repairNotes; }
    public void setRepairNotes(String repairNotes) { this.repairNotes = repairNotes; }

    public String getRepairDetails() { return repairDetails; }
    public void setRepairDetails(String repairDetails) { this.repairDetails = repairDetails; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDate getReportedDate() { return reportedDate; }
    public void setReportedDate(LocalDate reportedDate) { this.reportedDate = reportedDate; }

    public LocalDate getRepairedDate() { return repairedDate; }
    public void setRepairedDate(LocalDate repairedDate) { this.repairedDate = repairedDate; }

    public BigDecimal getRepairCost() { return repairCost; }
    public void setRepairCost(BigDecimal repairCost) { this.repairCost = repairCost; }

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
        private String description;
        private String problem;
        private String severity;
        private String priority;
        private Long assignedEmployeeId;
        private String assignedEmployeeName;
        private String technician;
        private String repairNotes;
        private String repairDetails;
        private String status;
        private LocalDate reportedDate;
        private LocalDate repairedDate;
        private BigDecimal repairCost;
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
        public Builder description(String description) { this.description = description; return this; }
        public Builder problem(String problem) { this.problem = problem; return this; }
        public Builder severity(String severity) { this.severity = severity; return this; }
        public Builder priority(String priority) { this.priority = priority; return this; }
        public Builder assignedEmployeeId(Long assignedEmployeeId) { this.assignedEmployeeId = assignedEmployeeId; return this; }
        public Builder assignedEmployeeName(String assignedEmployeeName) { this.assignedEmployeeName = assignedEmployeeName; return this; }
        public Builder technician(String technician) { this.technician = technician; return this; }
        public Builder repairNotes(String repairNotes) { this.repairNotes = repairNotes; return this; }
        public Builder repairDetails(String repairDetails) { this.repairDetails = repairDetails; return this; }
        public Builder status(String status) { this.status = status; return this; }
        public Builder reportedDate(LocalDate reportedDate) { this.reportedDate = reportedDate; return this; }
        public Builder repairedDate(LocalDate repairedDate) { this.repairedDate = repairedDate; return this; }
        public Builder repairCost(BigDecimal repairCost) { this.repairCost = repairCost; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public BreakdownResponse build() {
            return new BreakdownResponse(id, equipmentId, equipmentName, equipmentModel, equipmentSerialNumber,
                    equipmentType, equipmentStatus, branchId, branchName, description, problem, severity,
                    priority, assignedEmployeeId, assignedEmployeeName, technician, repairNotes, repairDetails,
                    status, reportedDate, repairedDate, repairCost, createdAt);
        }
    }
}
