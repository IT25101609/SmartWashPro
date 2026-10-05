package com.smartwashpro.service;

import com.smartwashpro.dto.request.EquipmentRequest;
import com.smartwashpro.dto.response.EquipmentResponse;
import com.smartwashpro.exception.BusinessRuleException;
import com.smartwashpro.exception.ResourceNotFoundException;
import com.smartwashpro.model.Branch;
import com.smartwashpro.model.Equipment;
import com.smartwashpro.model.enums.EquipmentStatus;
import com.smartwashpro.repository.BranchRepository;
import com.smartwashpro.repository.EquipmentRepository;
import com.smartwashpro.security.SecurityUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EquipmentService {
    private final EquipmentRepository equipmentRepository;
    private final BranchRepository branchRepository;
    private final SecurityUtils securityUtils;

    public EquipmentService(EquipmentRepository equipmentRepository,
                            BranchRepository branchRepository,
                            SecurityUtils securityUtils) {
        this.equipmentRepository = equipmentRepository;
        this.branchRepository = branchRepository;
        this.securityUtils = securityUtils;
    }

    public Page<EquipmentResponse> getEquipment(Long branchId, EquipmentStatus status, String equipmentType, String search, Pageable pageable) {
        Long effectiveBranchId = branchId;
        if (securityUtils.isBranchManager()) {
            effectiveBranchId = securityUtils.getCurrentUserBranchId();
        }

        return equipmentRepository.filterEquipment(effectiveBranchId, status, equipmentType, search, pageable)
                .map(this::mapToResponse);
    }

    public Page<EquipmentResponse> getAllEquipment(Pageable pageable) {
        return getEquipment(null, null, null, null, pageable);
    }

    public EquipmentResponse getEquipmentById(Long id) {
        Equipment equipment = equipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Equipment", id));
        if (securityUtils.isBranchManager()) {
            securityUtils.validateBranchAccess(equipment.getBranchId());
        }
        return mapToResponse(equipment);
    }

    @Transactional
    public EquipmentResponse createEquipment(EquipmentRequest request) {
        if (request.getEquipmentName() == null || request.getEquipmentName().trim().isEmpty()) {
            throw new IllegalArgumentException("Equipment name is required");
        }

        if (request.getSerialNumber() != null && !request.getSerialNumber().trim().isEmpty()) {
            String serial = request.getSerialNumber().trim();
            if (equipmentRepository.existsBySerialNumber(serial)) {
                throw new BusinessRuleException("Equipment with serial number '" + serial + "' already exists.");
            }
        }

        Long targetBranchId;
        if (securityUtils.isAdmin()) {
            targetBranchId = request.getBranchId();
        } else {
            targetBranchId = securityUtils.getCurrentUserBranchId();
        }

        EquipmentStatus status = request.getStatus() != null ? request.getStatus() : EquipmentStatus.ACTIVE;

        Equipment equipment = Equipment.builder()
                .equipmentName(request.getEquipmentName().trim())
                .equipmentType(request.getEquipmentType())
                .model(request.getModel())
                .serialNumber(request.getSerialNumber() != null && !request.getSerialNumber().trim().isEmpty() ? request.getSerialNumber().trim() : null)
                .purchaseDate(request.getPurchaseDate())
                .status(status)
                .branchId(targetBranchId)
                .nextMaintenanceDate(request.getNextMaintenanceDate())
                .build();

        equipment = equipmentRepository.save(equipment);
        return mapToResponse(equipment);
    }

    @Transactional
    public EquipmentResponse updateEquipment(Long id, EquipmentRequest request) {
        Equipment equipment = equipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Equipment", id));

        if (securityUtils.isBranchManager()) {
            securityUtils.validateBranchAccess(equipment.getBranchId());
        }

        if (request.getSerialNumber() != null && !request.getSerialNumber().trim().isEmpty()) {
            String newSerial = request.getSerialNumber().trim();
            if (!newSerial.equalsIgnoreCase(equipment.getSerialNumber())) {
                if (equipmentRepository.existsBySerialNumber(newSerial)) {
                    throw new BusinessRuleException("Equipment with serial number '" + newSerial + "' already exists.");
                }
                equipment.setSerialNumber(newSerial);
            }
        }

        if (request.getEquipmentName() != null && !request.getEquipmentName().trim().isEmpty()) {
            equipment.setEquipmentName(request.getEquipmentName().trim());
        }
        if (request.getEquipmentType() != null) equipment.setEquipmentType(request.getEquipmentType());
        if (request.getModel() != null) equipment.setModel(request.getModel());
        if (request.getPurchaseDate() != null) equipment.setPurchaseDate(request.getPurchaseDate());
        if (request.getStatus() != null) equipment.setStatus(request.getStatus());
        if (request.getNextMaintenanceDate() != null) equipment.setNextMaintenanceDate(request.getNextMaintenanceDate());

        if (securityUtils.isAdmin() && request.getBranchId() != null) {
            equipment.setBranchId(request.getBranchId());
        }

        equipment = equipmentRepository.save(equipment);
        return mapToResponse(equipment);
    }

    @Transactional
    public EquipmentResponse updateStatus(Long id, EquipmentStatus status) {
        Equipment equipment = equipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Equipment", id));

        if (securityUtils.isBranchManager()) {
            securityUtils.validateBranchAccess(equipment.getBranchId());
        }

        equipment.setStatus(status);
        return mapToResponse(equipmentRepository.save(equipment));
    }

    @Transactional
    public EquipmentResponse assignBranch(Long id, Long branchId) {
        Equipment equipment = equipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Equipment", id));

        equipment.setBranchId(branchId);
        return mapToResponse(equipmentRepository.save(equipment));
    }

    @Transactional
    public void deleteEquipment(Long id) {
        Equipment equipment = equipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Equipment", id));

        if (securityUtils.isBranchManager()) {
            securityUtils.validateBranchAccess(equipment.getBranchId());
        }

        equipmentRepository.delete(equipment);
    }

    public EquipmentResponse mapToResponse(Equipment equipment) {
        String branchName = null;
        if (equipment.getBranchId() != null) {
            branchName = branchRepository.findById(equipment.getBranchId())
                    .map(Branch::getBranchName).orElse(null);
        }

        return EquipmentResponse.builder()
                .id(equipment.getId())
                .equipmentName(equipment.getEquipmentName())
                .equipmentType(equipment.getEquipmentType())
                .model(equipment.getModel())
                .serialNumber(equipment.getSerialNumber())
                .purchaseDate(equipment.getPurchaseDate())
                .status(equipment.getStatus() != null ? equipment.getStatus().name() : "ACTIVE")
                .branchId(equipment.getBranchId())
                .branchName(branchName)
                .lastMaintenanceDate(equipment.getLastMaintenanceDate())
                .nextMaintenanceDate(equipment.getNextMaintenanceDate())
                .build();
    }
}
