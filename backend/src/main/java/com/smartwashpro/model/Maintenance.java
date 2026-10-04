package com.smartwashpro.model;

import com.smartwashpro.model.enums.MaintenanceStatus;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "maintenance")
public class Maintenance {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "equipment_id", nullable = false)
    private Equipment equipment;

    private LocalDate scheduledDate;
    private LocalDate completedDate;
    private String maintenanceType;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String problem;

    @Column(columnDefinition = "TEXT")
    private String repairDetails;

    @Column(name = "assigned_employee_id")
    private Long assignedEmployeeId;

    private String performedBy;
    private BigDecimal cost;

    @Enumerated(EnumType.STRING)
    private MaintenanceStatus status = MaintenanceStatus.SCHEDULED;

    private LocalDateTime createdAt;

    public Maintenance() {}

    public Maintenance(Long id, Equipment equipment, LocalDate scheduledDate, LocalDate completedDate,
                       String maintenanceType, String description, String problem, String repairDetails,
                       Long assignedEmployeeId, String performedBy, BigDecimal cost,
                       MaintenanceStatus status, LocalDateTime createdAt) {
        this.id = id;
        this.equipment = equipment;
        this.scheduledDate = scheduledDate;
        this.completedDate = completedDate;
        this.maintenanceType = maintenanceType;
        this.description = description;
        this.problem = problem;
        this.repairDetails = repairDetails;
        this.assignedEmployeeId = assignedEmployeeId;
        this.performedBy = performedBy;
        this.cost = cost;
        this.status = status != null ? status : MaintenanceStatus.SCHEDULED;
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
    public LocalDate getScheduledDate() { return scheduledDate; }
    public void setScheduledDate(LocalDate scheduledDate) { this.scheduledDate = scheduledDate; }
    public LocalDate getCompletedDate() { return completedDate; }
    public void setCompletedDate(LocalDate completedDate) { this.completedDate = completedDate; }
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
    public String getPerformedBy() { return performedBy; }
    public void setPerformedBy(String performedBy) { this.performedBy = performedBy; }
    public BigDecimal getCost() { return cost; }
    public void setCost(BigDecimal cost) { this.cost = cost; }
    public MaintenanceStatus getStatus() { return status; }
    public void setStatus(MaintenanceStatus status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public static Builder builder() { return new Builder(); }
    public static class Builder {
        private Long id;
        private Equipment equipment;
        private LocalDate scheduledDate;
        private LocalDate completedDate;
        private String maintenanceType;
        private String description;
        private String problem;
        private String repairDetails;
        private Long assignedEmployeeId;
        private String performedBy;
        private BigDecimal cost;
        private MaintenanceStatus status = MaintenanceStatus.SCHEDULED;
        private LocalDateTime createdAt;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder equipment(Equipment equipment) { this.equipment = equipment; return this; }
        public Builder scheduledDate(LocalDate scheduledDate) { this.scheduledDate = scheduledDate; return this; }
        public Builder completedDate(LocalDate completedDate) { this.completedDate = completedDate; return this; }
        public Builder maintenanceType(String maintenanceType) { this.maintenanceType = maintenanceType; return this; }
        public Builder description(String description) { this.description = description; return this; }
        public Builder problem(String problem) { this.problem = problem; return this; }
        public Builder repairDetails(String repairDetails) { this.repairDetails = repairDetails; return this; }
        public Builder assignedEmployeeId(Long assignedEmployeeId) { this.assignedEmployeeId = assignedEmployeeId; return this; }
        public Builder performedBy(String performedBy) { this.performedBy = performedBy; return this; }
        public Builder cost(BigDecimal cost) { this.cost = cost; return this; }
        public Builder status(MaintenanceStatus status) { this.status = status; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public Maintenance build() {
            return new Maintenance(id, equipment, scheduledDate, completedDate, maintenanceType,
                    description, problem, repairDetails, assignedEmployeeId, performedBy, cost, status, createdAt);
        }
    }
}
