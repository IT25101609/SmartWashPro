package com.smartwashpro.controller;

import com.smartwashpro.exception.DuplicateResourceException;
import com.smartwashpro.exception.ResourceNotFoundException;
import com.smartwashpro.model.Branch;
import com.smartwashpro.repository.BranchRepository;
import com.smartwashpro.security.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/branches")
public class BranchController {

    private final BranchRepository branchRepository;
    private final SecurityUtils securityUtils;

    public BranchController(BranchRepository branchRepository, SecurityUtils securityUtils) {
        this.branchRepository = branchRepository;
        this.securityUtils = securityUtils;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'BRANCH_MANAGER_ADMIN')")
    public ResponseEntity<List<Branch>> getAllBranches() {
        if (securityUtils.isAdmin()) {
            return ResponseEntity.ok(branchRepository.findAll());
        }
        Long branchId = securityUtils.getCurrentUserBranchId();
        if (branchId != null) {
            return ResponseEntity.ok(branchRepository.findById(branchId).map(List::of).orElse(List.of()));
        }
        return ResponseEntity.ok(List.of());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'BRANCH_MANAGER_ADMIN')")
    public ResponseEntity<Branch> getBranchById(@PathVariable Long id) {
        securityUtils.validateBranchAccess(id);
        return ResponseEntity.ok(branchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Branch", id)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Branch> createBranch(@RequestBody Branch branch) {
        if (branchRepository.existsByBranchCode(branch.getBranchCode())) {
            throw new DuplicateResourceException("Branch code already exists: " + branch.getBranchCode());
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(branchRepository.save(branch));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Branch> updateBranch(@PathVariable Long id, @RequestBody Branch req) {
        Branch branch = branchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Branch", id));
        if (req.getBranchName() != null) branch.setBranchName(req.getBranchName());
        if (req.getAddress() != null) branch.setAddress(req.getAddress());
        if (req.getPhone() != null) branch.setPhone(req.getPhone());
        if (req.getStatus() != null) branch.setStatus(req.getStatus());
        return ResponseEntity.ok(branchRepository.save(branch));
    }
}
