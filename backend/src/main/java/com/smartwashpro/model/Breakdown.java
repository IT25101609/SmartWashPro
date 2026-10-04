package com.smartwashpro.model;

import com.smartwashpro.model.enums.BreakdownSeverity;
import com.smartwashpro.model.enums.BreakdownStatus;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "breakdowns")
public class Breakdown {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "equipment_id", nullable = false)
    private Equipment equipment;

    private LocalDate reportedDate;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    private BreakdownSeverity severity;

    @Column(name = "assigned_employee_id")
    private Long assignedEmployeeId;

    private String technician;

    private LocalDate repairedDate;
    private BigDecimal repairCost;

    @Column(columnDefinition = "TEXT")
    private String repairNotes;

    @Enumerated(EnumType.STRING)
    private BreakdownStatus status = BreakdownStatus.REPORTED;

    private LocalDateTime createdAt;

    public Breakdown() {}

    public Breakdown(Long id, Equipment equipment, LocalDate reportedDate, String description,
                     BreakdownSeverity severity, Long assignedEmployeeId, String technician,
                     LocalDate repairedDate, BigDecimal repairCost, String repairNotes,
                     BreakdownStatus status, LocalDateTime createdAt) {
        this.id = id;
        this.equipment = equipment;
        this.reportedDate = reportedDate;
        this.description = description;
        this.severity = severity;
        this.assignedEmployeeId = assignedEmployeeId;
        this.technician = technician;
        this.repairedDate = repairedDate;
        this.repairCost = repairCost;
        this.repairNotes = repairNotes;
        this.status = status != null ? status : BreakdownStatus.REPORTED;
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

    public Equipment getEquipment() { return equipment; }
    public void setEquipment(Equipment equipment) { this.equipment = equipment; }

    public LocalDate getReportedDate() { return reportedDate; }
    public void setReportedDate(LocalDate reportedDate) { this.reportedDate = reportedDate; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public BreakdownSeverity getSeverity() { return severity; }
    public void setSeverity(BreakdownSeverity severity) { this.severity = severity; }

    public Long getAssignedEmployeeId() { return assignedEmployeeId; }
    public void setAssignedEmployeeId(Long assignedEmployeeId) { this.assignedEmployeeId = assignedEmployeeId; }

    public String getTechnician() { return technician; }
    public void setTechnician(String technician) { this.technician = technician; }

    public LocalDate getRepairedDate() { return repairedDate; }
    public void setRepairedDate(LocalDate repairedDate) { this.repairedDate = repairedDate; }

    public BigDecimal getRepairCost() { return repairCost; }
    public void setRepairCost(BigDecimal repairCost) { this.repairCost = repairCost; }

    public String getRepairNotes() { return repairNotes; }
    public void setRepairNotes(String repairNotes) { this.repairNotes = repairNotes; }

    public BreakdownStatus getStatus() { return status; }
    public void setStatus(BreakdownStatus status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private Equipment equipment;
        private LocalDate reportedDate;
        private String description;
        private BreakdownSeverity severity;
        private Long assignedEmployeeId;
        private String technician;
        private LocalDate repairedDate;
        private BigDecimal repairCost;
        private String repairNotes;
        private BreakdownStatus status = BreakdownStatus.REPORTED;
        private LocalDateTime createdAt;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder equipment(Equipment equipment) { this.equipment = equipment; return this; }
        public Builder reportedDate(LocalDate reportedDate) { this.reportedDate = reportedDate; return this; }
        public Builder description(String description) { this.description = description; return this; }
        public Builder severity(BreakdownSeverity severity) { this.severity = severity; return this; }
        public Builder assignedEmployeeId(Long assignedEmployeeId) { this.assignedEmployeeId = assignedEmployeeId; return this; }
        public Builder technician(String technician) { this.technician = technician; return this; }
        public Builder repairedDate(LocalDate repairedDate) { this.repairedDate = repairedDate; return this; }
        public Builder repairCost(BigDecimal repairCost) { this.repairCost = repairCost; return this; }
        public Builder repairNotes(String repairNotes) { this.repairNotes = repairNotes; return this; }
        public Builder status(BreakdownStatus status) { this.status = status; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public Breakdown build() {
            return new Breakdown(id, equipment, reportedDate, description, severity, assignedEmployeeId,
                    technician, repairedDate, repairCost, repairNotes, status, createdAt);
        }
    }
}
