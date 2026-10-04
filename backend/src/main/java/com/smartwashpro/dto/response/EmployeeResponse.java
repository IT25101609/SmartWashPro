package com.smartwashpro.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class EmployeeResponse {
    private Long id;
    private Long userId;
    private String fullName;
    private String email;
    private String phoneNumber;
    private String address;
    private String role;
    private String employmentStatus;
    private Long branchId;
    private String branchName;
    private String branchCode;
    private LocalDate hireDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long assignedTasksCount;
    private Long completedTasksCount;
    private Long attendanceCount;

    public EmployeeResponse() {}

    public EmployeeResponse(Long id, Long userId, String fullName, String email, String phoneNumber, String address,
                            String role, String employmentStatus, Long branchId, String branchName, String branchCode,
                            LocalDate hireDate, LocalDateTime createdAt, LocalDateTime updatedAt,
                            Long assignedTasksCount, Long completedTasksCount, Long attendanceCount) {
        this.id = id;
        this.userId = userId;
        this.fullName = fullName;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.address = address;
        this.role = role;
        this.employmentStatus = employmentStatus;
        this.branchId = branchId;
        this.branchName = branchName;
        this.branchCode = branchCode;
        this.hireDate = hireDate;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.assignedTasksCount = assignedTasksCount;
        this.completedTasksCount = completedTasksCount;
        this.attendanceCount = attendanceCount;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getEmploymentStatus() { return employmentStatus; }
    public void setEmploymentStatus(String employmentStatus) { this.employmentStatus = employmentStatus; }
    public Long getBranchId() { return branchId; }
    public void setBranchId(Long branchId) { this.branchId = branchId; }
    public String getBranchName() { return branchName; }
    public void setBranchName(String branchName) { this.branchName = branchName; }
    public String getBranchCode() { return branchCode; }
    public void setBranchCode(String branchCode) { this.branchCode = branchCode; }
    public LocalDate getHireDate() { return hireDate; }
    public void setHireDate(LocalDate hireDate) { this.hireDate = hireDate; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public Long getAssignedTasksCount() { return assignedTasksCount; }
    public void setAssignedTasksCount(Long assignedTasksCount) { this.assignedTasksCount = assignedTasksCount; }
    public Long getCompletedTasksCount() { return completedTasksCount; }
    public void setCompletedTasksCount(Long completedTasksCount) { this.completedTasksCount = completedTasksCount; }
    public Long getAttendanceCount() { return attendanceCount; }
    public void setAttendanceCount(Long attendanceCount) { this.attendanceCount = attendanceCount; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private Long userId;
        private String fullName;
        private String email;
        private String phoneNumber;
        private String address;
        private String role;
        private String employmentStatus;
        private Long branchId;
        private String branchName;
        private String branchCode;
        private LocalDate hireDate;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private Long assignedTasksCount = 0L;
        private Long completedTasksCount = 0L;
        private Long attendanceCount = 0L;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder userId(Long userId) { this.userId = userId; return this; }
        public Builder fullName(String fullName) { this.fullName = fullName; return this; }
        public Builder email(String email) { this.email = email; return this; }
        public Builder phoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; return this; }
        public Builder address(String address) { this.address = address; return this; }
        public Builder role(String role) { this.role = role; return this; }
        public Builder employmentStatus(String employmentStatus) { this.employmentStatus = employmentStatus; return this; }
        public Builder branchId(Long branchId) { this.branchId = branchId; return this; }
        public Builder branchName(String branchName) { this.branchName = branchName; return this; }
        public Builder branchCode(String branchCode) { this.branchCode = branchCode; return this; }
        public Builder hireDate(LocalDate hireDate) { this.hireDate = hireDate; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public Builder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }
        public Builder assignedTasksCount(Long count) { this.assignedTasksCount = count; return this; }
        public Builder completedTasksCount(Long count) { this.completedTasksCount = count; return this; }
        public Builder attendanceCount(Long count) { this.attendanceCount = count; return this; }

        public EmployeeResponse build() {
            return new EmployeeResponse(id, userId, fullName, email, phoneNumber, address, role,
                    employmentStatus, branchId, branchName, branchCode, hireDate, createdAt, updatedAt,
                    assignedTasksCount, completedTasksCount, attendanceCount);
        }
    }
}
