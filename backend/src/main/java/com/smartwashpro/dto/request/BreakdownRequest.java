package com.smartwashpro.dto.request;

import com.smartwashpro.model.enums.BreakdownSeverity;
import com.smartwashpro.model.enums.BreakdownStatus;
import java.math.BigDecimal;
import java.time.LocalDate;

public class BreakdownRequest {
    private Long equipmentId;
    private LocalDate reportedDate;
    private String description;
    private String problem;
    private BreakdownSeverity severity;
    private Long assignedEmployeeId;
    private String technician;
    private String repairNotes;
    private String repairDetails;
    private BigDecimal repairCost;
    private LocalDate repairedDate;
    private BreakdownStatus status;

    public BreakdownRequest() {}

    public Long getEquipmentId() { return equipmentId; }
    public void setEquipmentId(Long equipmentId) { this.equipmentId = equipmentId; }

    public LocalDate getReportedDate() { return reportedDate; }
    public void setReportedDate(LocalDate reportedDate) { this.reportedDate = reportedDate; }

    public String getDescription() {
        if (description != null && !description.trim().isEmpty()) return description;
        return problem;
    }
    public void setDescription(String description) { this.description = description; }

    public String getProblem() {
        if (problem != null && !problem.trim().isEmpty()) return problem;
        return description;
    }
    public void setProblem(String problem) { this.problem = problem; }

    public BreakdownSeverity getSeverity() { return severity; }
    public void setSeverity(BreakdownSeverity severity) { this.severity = severity; }

    public void setPriority(String priority) {
        if (priority != null) {
            this.severity = BreakdownSeverity.fromString(priority);
        }
    }

    public Long getAssignedEmployeeId() { return assignedEmployeeId; }
    public void setAssignedEmployeeId(Long assignedEmployeeId) { this.assignedEmployeeId = assignedEmployeeId; }

    public String getTechnician() { return technician; }
    public void setTechnician(String technician) { this.technician = technician; }

    public String getRepairNotes() {
        if (repairNotes != null && !repairNotes.trim().isEmpty()) return repairNotes;
        return repairDetails;
    }
    public void setRepairNotes(String repairNotes) { this.repairNotes = repairNotes; }

    public String getRepairDetails() {
        if (repairDetails != null && !repairDetails.trim().isEmpty()) return repairDetails;
        return repairNotes;
    }
    public void setRepairDetails(String repairDetails) { this.repairDetails = repairDetails; }

    public BigDecimal getRepairCost() { return repairCost; }
    public void setRepairCost(BigDecimal repairCost) { this.repairCost = repairCost; }

    public LocalDate getRepairedDate() { return repairedDate; }
    public void setRepairedDate(LocalDate repairedDate) { this.repairedDate = repairedDate; }

    public BreakdownStatus getStatus() { return status; }
    public void setStatus(BreakdownStatus status) { this.status = status; }
}
