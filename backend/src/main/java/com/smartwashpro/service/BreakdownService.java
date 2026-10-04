package com.smartwashpro.service;

import com.smartwashpro.dto.request.BreakdownRequest;
import com.smartwashpro.dto.response.BreakdownResponse;
import com.smartwashpro.exception.BusinessRuleException;
import com.smartwashpro.exception.ResourceNotFoundException;
import com.smartwashpro.model.Branch;
import com.smartwashpro.model.Breakdown;
import com.smartwashpro.model.Employee;
import com.smartwashpro.model.Equipment;
import com.smartwashpro.model.enums.BreakdownSeverity;
import com.smartwashpro.model.enums.BreakdownStatus;
import com.smartwashpro.model.enums.EmploymentStatus;
import com.smartwashpro.model.enums.EquipmentStatus;
import com.smartwashpro.repository.BranchRepository;
import com.smartwashpro.repository.BreakdownRepository;
import com.smartwashpro.repository.EmployeeRepository;
import com.smartwashpro.repository.EquipmentRepository;
import com.smartwashpro.security.SecurityUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class BreakdownService {
    private final BreakdownRepository breakdownRepository;
    private final EquipmentRepository equipmentRepository;
    private final EmployeeRepository employeeRepository;
    private final BranchRepository branchRepository;
    private final SecurityUtils securityUtils;

    public BreakdownService(BreakdownRepository breakdownRepository,
                            EquipmentRepository equipmentRepository,
                            EmployeeRepository employeeRepository,
                            BranchRepository branchRepository,
                            SecurityUtils securityUtils) {
        this.breakdownRepository = breakdownRepository;
        this.equipmentRepository = equipmentRepository;
        this.employeeRepository = employeeRepository;
        this.branchRepository = branchRepository;
        this.securityUtils = securityUtils;
    }

    public Page<BreakdownResponse> getBreakdowns(Long branchId, BreakdownStatus status, Long equipmentId,
                                                String search, Pageable pageable) {
        Long effectiveBranchId = branchId;
        if (securityUtils.isBranchManager()) {
            effectiveBranchId = securityUtils.getCurrentUserBranchId();
        }

        return breakdownRepository.filterBreakdowns(effectiveBranchId, status, equipmentId, search, pageable)
                .map(this::mapToResponse);
    }

    public List<BreakdownResponse> getActiveBreakdowns(Long branchId) {
        Long effectiveBranchId = branchId;
        if (securityUtils.isBranchManager()) {
            effectiveBranchId = securityUtils.getCurrentUserBranchId();
        }
        return breakdownRepository.findActiveBreakdowns(effectiveBranchId)
                .stream().map(this::mapToResponse).toList();
    }

    public List<BreakdownResponse> getResolvedBreakdowns(Long branchId) {
        Long effectiveBranchId = branchId;
        if (securityUtils.isBranchManager()) {
            effectiveBranchId = securityUtils.getCurrentUserBranchId();
        }
        return breakdownRepository.findResolvedBreakdowns(effectiveBranchId)
                .stream().map(this::mapToResponse).toList();
    }

    public List<BreakdownResponse> getBreakdownsByEquipment(Long equipmentId) {
        Equipment equipment = equipmentRepository.findById(equipmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Equipment", equipmentId));
        if (securityUtils.isBranchManager()) {
            securityUtils.validateBranchAccess(equipment.getBranchId());
        }
        return breakdownRepository.findByEquipmentIdOrderByReportedDateDesc(equipmentId)
                .stream().map(this::mapToResponse).toList();
    }

    public BreakdownResponse getBreakdownById(Long id) {
        Breakdown b = breakdownRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Breakdown", id));
        if (securityUtils.isBranchManager()) {
            securityUtils.validateBranchAccess(b.getEquipment().getBranchId());
        }
        return mapToResponse(b);
    }

    @Transactional
    public BreakdownResponse reportBreakdown(BreakdownRequest request) {
        if (request.getEquipmentId() == null) {
            throw new IllegalArgumentException("Equipment ID is required");
        }

        Equipment equipment = equipmentRepository.findById(request.getEquipmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Equipment", request.getEquipmentId()));

        if (securityUtils.isBranchManager()) {
            securityUtils.validateBranchAccess(equipment.getBranchId());
        }

        String technician = request.getTechnician();
        Long assignedEmployeeId = request.getAssignedEmployeeId();

        if (assignedEmployeeId != null) {
            Employee employee = employeeRepository.findById(assignedEmployeeId)
                    .orElseThrow(() -> new ResourceNotFoundException("Employee", assignedEmployeeId));

            if (employee.getEmploymentStatus() != EmploymentStatus.ACTIVE) {
                throw new BusinessRuleException("Cannot assign breakdown to inactive employee");
            }

            if (technician == null || technician.trim().isEmpty()) {
                if (employee.getUser() != null && employee.getUser().getFullName() != null) {
                    technician = employee.getUser().getFullName();
                }
            }
        }

        LocalDate reportedDate = request.getReportedDate() != null ? request.getReportedDate() : LocalDate.now();
        BreakdownSeverity severity = request.getSeverity() != null ? request.getSeverity() : BreakdownSeverity.MEDIUM;
        BreakdownStatus status = request.getStatus() != null ? request.getStatus() : BreakdownStatus.REPORTED;

        String description = request.getDescription();
        if (description == null || description.trim().isEmpty()) {
            description = request.getProblem();
        }
        if (description == null || description.trim().isEmpty()) {
            description = "Unspecified machine failure";
        }

        Breakdown breakdown = Breakdown.builder()
                .equipment(equipment)
                .reportedDate(reportedDate)
                .description(description.trim())
                .severity(severity)
                .assignedEmployeeId(assignedEmployeeId)
                .technician(technician)
                .repairNotes(request.getRepairNotes())
                .repairCost(request.getRepairCost())
                .repairedDate(request.getRepairedDate())
                .status(status)
                .build();

        breakdown = breakdownRepository.save(breakdown);

        // Rule: When a breakdown is reported, update the equipment status to BROKEN where appropriate
        if (status == BreakdownStatus.REPORTED || status == BreakdownStatus.IN_PROGRESS || status == BreakdownStatus.IN_REPAIR) {
            equipment.setStatus(EquipmentStatus.BROKEN);
            equipmentRepository.save(equipment);
        }

        return mapToResponse(breakdown);
    }

    @Transactional
    public BreakdownResponse updateBreakdown(Long id, BreakdownRequest request) {
        Breakdown b = breakdownRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Breakdown", id));

        if (securityUtils.isBranchManager()) {
            securityUtils.validateBranchAccess(b.getEquipment().getBranchId());
        }

        if (request.getReportedDate() != null) b.setReportedDate(request.getReportedDate());
        if (request.getDescription() != null) b.setDescription(request.getDescription().trim());
        if (request.getSeverity() != null) b.setSeverity(request.getSeverity());
        if (request.getRepairNotes() != null) b.setRepairNotes(request.getRepairNotes().trim());
        if (request.getRepairCost() != null) b.setRepairCost(request.getRepairCost());
        if (request.getRepairedDate() != null) b.setRepairedDate(request.getRepairedDate());

        if (request.getAssignedEmployeeId() != null) {
            Employee employee = employeeRepository.findById(request.getAssignedEmployeeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Employee", request.getAssignedEmployeeId()));
            if (employee.getEmploymentStatus() != EmploymentStatus.ACTIVE) {
                throw new BusinessRuleException("Cannot assign breakdown to inactive employee");
            }
            b.setAssignedEmployeeId(request.getAssignedEmployeeId());
            if (request.getTechnician() == null && employee.getUser() != null) {
                b.setTechnician(employee.getUser().getFullName());
            }
        }
        if (request.getTechnician() != null) b.setTechnician(request.getTechnician().trim());

        if (request.getStatus() != null && request.getStatus() != b.getStatus()) {
            updateEquipmentStatusForTransition(b, request.getStatus(), request.getRepairedDate());
            b.setStatus(request.getStatus());
        }

        return mapToResponse(breakdownRepository.save(b));
    }

    @Transactional
    public BreakdownResponse updateStatus(Long id, BreakdownStatus newStatus, String repairNotes,
                                          BigDecimal repairCost, LocalDate repairedDate, String technician) {
        Breakdown b = breakdownRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Breakdown", id));

        if (securityUtils.isBranchManager()) {
            securityUtils.validateBranchAccess(b.getEquipment().getBranchId());
        }

        if (repairNotes != null && !repairNotes.trim().isEmpty()) {
            b.setRepairNotes(repairNotes.trim());
        }
        if (repairCost != null) {
            b.setRepairCost(repairCost);
        }
        if (technician != null && !technician.trim().isEmpty()) {
            b.setTechnician(technician.trim());
        }

        updateEquipmentStatusForTransition(b, newStatus, repairedDate);
        b.setStatus(newStatus);

        return mapToResponse(breakdownRepository.save(b));
    }

    private void updateEquipmentStatusForTransition(Breakdown b, BreakdownStatus newStatus, LocalDate customRepairedDate) {
        Equipment eq = b.getEquipment();

        if (newStatus == BreakdownStatus.REPORTED || newStatus == BreakdownStatus.IN_PROGRESS || newStatus == BreakdownStatus.IN_REPAIR) {
            // Equipment is broken
            eq.setStatus(EquipmentStatus.BROKEN);
            equipmentRepository.save(eq);
        } else if (newStatus == BreakdownStatus.REPAIRED || newStatus == BreakdownStatus.CLOSED) {
            LocalDate repDate = customRepairedDate != null ? customRepairedDate :
                    (b.getRepairedDate() != null ? b.getRepairedDate() : LocalDate.now());
            b.setRepairedDate(repDate);

            // When repaired, allow equipment to become ACTIVE again
            eq.setStatus(EquipmentStatus.ACTIVE);
            equipmentRepository.save(eq);
        } else if (newStatus == BreakdownStatus.SCRAPPED) {
            eq.setStatus(EquipmentStatus.INACTIVE);
            equipmentRepository.save(eq);
        }
    }

    @Transactional
    public void deleteBreakdown(Long id) {
        Breakdown b = breakdownRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Breakdown", id));

        if (securityUtils.isBranchManager()) {
            securityUtils.validateBranchAccess(b.getEquipment().getBranchId());
        }

        Equipment eq = b.getEquipment();
        if (b.getStatus() == BreakdownStatus.REPORTED || b.getStatus() == BreakdownStatus.IN_PROGRESS || b.getStatus() == BreakdownStatus.IN_REPAIR) {
            if (eq.getStatus() == EquipmentStatus.BROKEN) {
                eq.setStatus(EquipmentStatus.ACTIVE);
                equipmentRepository.save(eq);
            }
        }

        breakdownRepository.delete(b);
    }

    public BreakdownResponse mapToResponse(Breakdown b) {
        Equipment eq = b.getEquipment();
        String branchName = null;
        if (eq != null && eq.getBranchId() != null) {
            branchName = branchRepository.findById(eq.getBranchId())
                    .map(Branch::getBranchName).orElse(null);
        }

        String assignedEmployeeName = null;
        if (b.getAssignedEmployeeId() != null) {
            assignedEmployeeName = employeeRepository.findById(b.getAssignedEmployeeId())
                    .map(e -> e.getUser() != null ? e.getUser().getFullName() : null).orElse(null);
        }

        String sevName = b.getSeverity() != null ? b.getSeverity().name() : "MEDIUM";
        String statusName = b.getStatus() != null ? b.getStatus().name() : "REPORTED";
        if ("IN_REPAIR".equals(statusName)) {
            statusName = "IN_PROGRESS";
        }

        return BreakdownResponse.builder()
                .id(b.getId())
                .equipmentId(eq != null ? eq.getId() : null)
                .equipmentName(eq != null ? eq.getEquipmentName() : null)
                .equipmentModel(eq != null ? eq.getModel() : null)
                .equipmentSerialNumber(eq != null ? eq.getSerialNumber() : null)
                .equipmentType(eq != null ? eq.getEquipmentType() : null)
                .equipmentStatus(eq != null && eq.getStatus() != null ? eq.getStatus().name() : null)
                .branchId(eq != null ? eq.getBranchId() : null)
                .branchName(branchName)
                .description(b.getDescription())
                .problem(b.getDescription())
                .severity(sevName)
                .priority(sevName)
                .assignedEmployeeId(b.getAssignedEmployeeId())
                .assignedEmployeeName(assignedEmployeeName)
                .technician(b.getTechnician())
                .repairNotes(b.getRepairNotes())
                .repairDetails(b.getRepairNotes())
                .repairCost(b.getRepairCost())
                .status(statusName)
                .reportedDate(b.getReportedDate())
                .repairedDate(b.getRepairedDate())
                .createdAt(b.getCreatedAt())
                .build();
    }
}
