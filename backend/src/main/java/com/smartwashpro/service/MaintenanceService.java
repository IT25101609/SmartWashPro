package com.smartwashpro.service;

import com.smartwashpro.dto.request.MaintenanceRequest;
import com.smartwashpro.dto.response.MaintenanceResponse;
import com.smartwashpro.exception.BusinessRuleException;
import com.smartwashpro.exception.ResourceNotFoundException;
import com.smartwashpro.model.Branch;
import com.smartwashpro.model.Employee;
import com.smartwashpro.model.Equipment;
import com.smartwashpro.model.Maintenance;
import com.smartwashpro.model.enums.EmploymentStatus;
import com.smartwashpro.model.enums.EquipmentStatus;
import com.smartwashpro.model.enums.MaintenanceStatus;
import com.smartwashpro.repository.BranchRepository;
import com.smartwashpro.repository.EmployeeRepository;
import com.smartwashpro.repository.EquipmentRepository;
import com.smartwashpro.repository.MaintenanceRepository;
import com.smartwashpro.security.SecurityUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class MaintenanceService {
    private final MaintenanceRepository maintenanceRepository;
    private final EquipmentRepository equipmentRepository;
    private final EmployeeRepository employeeRepository;
    private final BranchRepository branchRepository;
    private final SecurityUtils securityUtils;

    public MaintenanceService(MaintenanceRepository maintenanceRepository,
                              EquipmentRepository equipmentRepository,
                              EmployeeRepository employeeRepository,
                              BranchRepository branchRepository,
                              SecurityUtils securityUtils) {
        this.maintenanceRepository = maintenanceRepository;
        this.equipmentRepository = equipmentRepository;
        this.employeeRepository = employeeRepository;
        this.branchRepository = branchRepository;
        this.securityUtils = securityUtils;
    }

    public Page<MaintenanceResponse> getMaintenance(Long branchId, MaintenanceStatus status, Long equipmentId,
                                                    String search, Pageable pageable) {
        Long effectiveBranchId = branchId;
        if (securityUtils.isBranchManager()) {
            effectiveBranchId = securityUtils.getCurrentUserBranchId();
        }

        return maintenanceRepository.filterMaintenance(effectiveBranchId, status, equipmentId, search, pageable)
                .map(this::mapToResponse);
    }

    public List<MaintenanceResponse> getUpcomingMaintenance(Long branchId) {
        Long effectiveBranchId = branchId;
        if (securityUtils.isBranchManager()) {
            effectiveBranchId = securityUtils.getCurrentUserBranchId();
        }

        return maintenanceRepository.findUpcomingMaintenance(effectiveBranchId)
                .stream().map(this::mapToResponse).toList();
    }

    public List<MaintenanceResponse> getMaintenanceHistory(Long branchId) {
        Long effectiveBranchId = branchId;
        if (securityUtils.isBranchManager()) {
            effectiveBranchId = securityUtils.getCurrentUserBranchId();
        }

        return maintenanceRepository.findMaintenanceHistory(effectiveBranchId)
                .stream().map(this::mapToResponse).toList();
    }

    public List<MaintenanceResponse> getMaintenanceByEquipment(Long equipmentId) {
        Equipment equipment = equipmentRepository.findById(equipmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Equipment", equipmentId));
        if (securityUtils.isBranchManager()) {
            securityUtils.validateBranchAccess(equipment.getBranchId());
        }

        return maintenanceRepository.findByEquipmentIdOrderByScheduledDateDesc(equipmentId)
                .stream().map(this::mapToResponse).toList();
    }

    public MaintenanceResponse getMaintenanceById(Long id) {
        Maintenance m = maintenanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Maintenance", id));
        if (securityUtils.isBranchManager()) {
            securityUtils.validateBranchAccess(m.getEquipment().getBranchId());
        }
        return mapToResponse(m);
    }

    @Transactional
    public MaintenanceResponse createMaintenance(MaintenanceRequest request) {
        if (request.getEquipmentId() == null) {
            throw new IllegalArgumentException("Equipment ID is required");
        }

        Equipment equipment = equipmentRepository.findById(request.getEquipmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Equipment", request.getEquipmentId()));

        if (securityUtils.isBranchManager()) {
            securityUtils.validateBranchAccess(equipment.getBranchId());
        }

        String performedBy = request.getPerformedBy();
        Long assignedEmployeeId = request.getAssignedEmployeeId();

        if (assignedEmployeeId != null) {
            Employee employee = employeeRepository.findById(assignedEmployeeId)
                    .orElseThrow(() -> new ResourceNotFoundException("Employee", assignedEmployeeId));

            if (employee.getEmploymentStatus() != EmploymentStatus.ACTIVE) {
                throw new BusinessRuleException("Cannot assign maintenance to inactive employee");
            }

            if (performedBy == null || performedBy.trim().isEmpty()) {
                if (employee.getUser() != null && employee.getUser().getFullName() != null) {
                    performedBy = employee.getUser().getFullName();
                }
            }
        }

        LocalDate scheduledDate = request.getScheduledDate() != null ? request.getScheduledDate() : LocalDate.now();
        MaintenanceStatus status = request.getStatus() != null ? request.getStatus() : MaintenanceStatus.SCHEDULED;

        String description = request.getDescription();
        String problem = request.getProblem();
        if (problem != null && (description == null || description.trim().isEmpty())) {
            description = problem;
        } else if (description != null && (problem == null || problem.trim().isEmpty())) {
            problem = description;
        }

        Maintenance maintenance = Maintenance.builder()
                .equipment(equipment)
                .scheduledDate(scheduledDate)
                .completedDate(request.getCompletedDate())
                .maintenanceType(request.getMaintenanceType() != null ? request.getMaintenanceType().trim() : "Routine Service")
                .description(description)
                .problem(problem)
                .repairDetails(request.getRepairDetails())
                .assignedEmployeeId(assignedEmployeeId)
                .performedBy(performedBy)
                .cost(request.getCost())
                .status(status)
                .build();

        maintenance = maintenanceRepository.save(maintenance);

        // When equipment is under maintenance, update its status appropriately
        if (status == MaintenanceStatus.SCHEDULED || status == MaintenanceStatus.IN_PROGRESS) {
            equipment.setStatus(EquipmentStatus.MAINTENANCE);
            equipmentRepository.save(equipment);
        }

        return mapToResponse(maintenance);
    }

    @Transactional
    public MaintenanceResponse updateMaintenance(Long id, MaintenanceRequest request) {
        Maintenance m = maintenanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Maintenance", id));

        if (securityUtils.isBranchManager()) {
            securityUtils.validateBranchAccess(m.getEquipment().getBranchId());
        }

        if (request.getScheduledDate() != null) m.setScheduledDate(request.getScheduledDate());
        if (request.getCompletedDate() != null) m.setCompletedDate(request.getCompletedDate());
        if (request.getMaintenanceType() != null) m.setMaintenanceType(request.getMaintenanceType().trim());
        if (request.getDescription() != null) m.setDescription(request.getDescription());
        if (request.getProblem() != null) m.setProblem(request.getProblem());
        if (request.getRepairDetails() != null) m.setRepairDetails(request.getRepairDetails());
        if (request.getCost() != null) m.setCost(request.getCost());

        if (request.getAssignedEmployeeId() != null) {
            Employee employee = employeeRepository.findById(request.getAssignedEmployeeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Employee", request.getAssignedEmployeeId()));
            if (employee.getEmploymentStatus() != EmploymentStatus.ACTIVE) {
                throw new BusinessRuleException("Cannot assign maintenance to inactive employee");
            }
            m.setAssignedEmployeeId(request.getAssignedEmployeeId());
            if (request.getPerformedBy() == null && employee.getUser() != null) {
                m.setPerformedBy(employee.getUser().getFullName());
            }
        }
        if (request.getPerformedBy() != null) m.setPerformedBy(request.getPerformedBy());

        if (request.getStatus() != null && request.getStatus() != m.getStatus()) {
            updateEquipmentStatusForTransition(m, request.getStatus(), request.getCompletedDate());
            m.setStatus(request.getStatus());
        }

        return mapToResponse(maintenanceRepository.save(m));
    }

    @Transactional
    public MaintenanceResponse updateStatus(Long id, MaintenanceStatus newStatus, String repairDetails,
                                            BigDecimal cost, LocalDate completedDate, String performedBy) {
        Maintenance m = maintenanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Maintenance", id));

        if (securityUtils.isBranchManager()) {
            securityUtils.validateBranchAccess(m.getEquipment().getBranchId());
        }

        if (repairDetails != null && !repairDetails.trim().isEmpty()) {
            m.setRepairDetails(repairDetails.trim());
        }
        if (cost != null) {
            m.setCost(cost);
        }
        if (performedBy != null && !performedBy.trim().isEmpty()) {
            m.setPerformedBy(performedBy.trim());
        }

        updateEquipmentStatusForTransition(m, newStatus, completedDate);
        m.setStatus(newStatus);

        return mapToResponse(maintenanceRepository.save(m));
    }

    private void updateEquipmentStatusForTransition(Maintenance m, MaintenanceStatus newStatus, LocalDate customCompletedDate) {
        Equipment eq = m.getEquipment();

        if (newStatus == MaintenanceStatus.IN_PROGRESS || newStatus == MaintenanceStatus.SCHEDULED) {
            eq.setStatus(EquipmentStatus.MAINTENANCE);
            equipmentRepository.save(eq);
        } else if (newStatus == MaintenanceStatus.COMPLETED) {
            LocalDate compDate = customCompletedDate != null ? customCompletedDate :
                    (m.getCompletedDate() != null ? m.getCompletedDate() : LocalDate.now());
            m.setCompletedDate(compDate);

            // After maintenance is completed, allow the equipment to return to ACTIVE
            eq.setStatus(EquipmentStatus.ACTIVE);
            eq.setLastMaintenanceDate(compDate);
            equipmentRepository.save(eq);
        } else if (newStatus == MaintenanceStatus.CANCELLED) {
            if (eq.getStatus() == EquipmentStatus.MAINTENANCE || eq.getStatus() == EquipmentStatus.UNDER_MAINTENANCE) {
                eq.setStatus(EquipmentStatus.ACTIVE);
                equipmentRepository.save(eq);
            }
        }
    }

    @Transactional
    public void deleteMaintenance(Long id) {
        Maintenance m = maintenanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Maintenance", id));

        if (securityUtils.isBranchManager()) {
            securityUtils.validateBranchAccess(m.getEquipment().getBranchId());
        }

        Equipment eq = m.getEquipment();
        if (m.getStatus() == MaintenanceStatus.SCHEDULED || m.getStatus() == MaintenanceStatus.IN_PROGRESS) {
            if (eq.getStatus() == EquipmentStatus.MAINTENANCE || eq.getStatus() == EquipmentStatus.UNDER_MAINTENANCE) {
                eq.setStatus(EquipmentStatus.ACTIVE);
                equipmentRepository.save(eq);
            }
        }

        maintenanceRepository.delete(m);
    }

    public MaintenanceResponse mapToResponse(Maintenance m) {
        Equipment eq = m.getEquipment();
        String branchName = null;
        if (eq != null && eq.getBranchId() != null) {
            branchName = branchRepository.findById(eq.getBranchId())
                    .map(Branch::getBranchName).orElse(null);
        }

        String assignedEmployeeName = null;
        if (m.getAssignedEmployeeId() != null) {
            assignedEmployeeName = employeeRepository.findById(m.getAssignedEmployeeId())
                    .map(e -> e.getUser() != null ? e.getUser().getFullName() : null).orElse(null);
        }

        return MaintenanceResponse.builder()
                .id(m.getId())
                .equipmentId(eq != null ? eq.getId() : null)
                .equipmentName(eq != null ? eq.getEquipmentName() : null)
                .equipmentModel(eq != null ? eq.getModel() : null)
                .equipmentSerialNumber(eq != null ? eq.getSerialNumber() : null)
                .equipmentType(eq != null ? eq.getEquipmentType() : null)
                .equipmentStatus(eq != null && eq.getStatus() != null ? eq.getStatus().name() : null)
                .branchId(eq != null ? eq.getBranchId() : null)
                .branchName(branchName)
                .maintenanceType(m.getMaintenanceType())
                .description(m.getDescription())
                .problem(m.getProblem())
                .repairDetails(m.getRepairDetails())
                .assignedEmployeeId(m.getAssignedEmployeeId())
                .assignedEmployeeName(assignedEmployeeName)
                .performedBy(m.getPerformedBy())
                .cost(m.getCost())
                .status(m.getStatus() != null ? m.getStatus().name() : "SCHEDULED")
                .scheduledDate(m.getScheduledDate())
                .completedDate(m.getCompletedDate())
                .createdAt(m.getCreatedAt())
                .build();
    }
}
