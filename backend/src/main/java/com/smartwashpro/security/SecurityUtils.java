package com.smartwashpro.security;

import com.smartwashpro.exception.ForbiddenException;
import com.smartwashpro.model.User;
import com.smartwashpro.model.enums.Role;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class SecurityUtils {

    public Optional<User> getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof User user) {
            return Optional.of(user);
        }
        return Optional.empty();
    }

    public boolean isAdmin() {
        return getCurrentUser().map(u -> u.getRole() == Role.ADMIN).orElse(false);
    }

    public boolean isBranchManager() {
        return getCurrentUser().map(u -> u.getRole() == Role.BRANCH_MANAGER_ADMIN).orElse(false);
    }

    public boolean isCustomer() {
        return getCurrentUser().map(u -> u.getRole() == Role.CUSTOMER).orElse(false);
    }

    public Long getCurrentUserBranchId() {
        return getCurrentUser().map(User::getBranchId).orElse(null);
    }

    /**
     * Enforces that the current authenticated user has access to the specified branchId.
     * Admin has access to all branches.
     * Branch Manager Admin only has access if branchId matches their assigned branch.
     * Throws ForbiddenException if access is denied.
     */
    public void validateBranchAccess(Long branchId) {
        if (isAdmin()) {
            return; // Admin can access all branches
        }
        if (isBranchManager()) {
            Long userBranchId = getCurrentUserBranchId();
            if (userBranchId == null || (branchId != null && !userBranchId.equals(branchId))) {
                throw new ForbiddenException("Access denied: You cannot access or modify resources of another branch");
            }
            return;
        }
        throw new ForbiddenException("Access denied: Insufficient privileges");
    }
}
