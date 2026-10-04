package com.smartwashpro.dto.response;

import java.time.LocalDateTime;

public class BranchManagerResponse {
    private Long id;
    private String fullName;
    private String email;
    private String phoneNumber;
    private String address;
    private String status;
    private Long branchId;
    private String branchName;
    private String branchCode;
    private LocalDateTime createdAt;

    public BranchManagerResponse() {}

    public BranchManagerResponse(Long id, String fullName, String email, String phoneNumber, String address, String status, Long branchId, String branchName, String branchCode, LocalDateTime createdAt) {
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.address = address;
        this.status = status;
        this.branchId = branchId;
        this.branchName = branchName;
        this.branchCode = branchCode;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Long getBranchId() { return branchId; }
    public void setBranchId(Long branchId) { this.branchId = branchId; }
    public String getBranchName() { return branchName; }
    public void setBranchName(String branchName) { this.branchName = branchName; }
    public String getBranchCode() { return branchCode; }
    public void setBranchCode(String branchCode) { this.branchCode = branchCode; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public static Builder builder() { return new Builder(); }
    public static class Builder {
        private Long id;
        private String fullName;
        private String email;
        private String phoneNumber;
        private String address;
        private String status;
        private Long branchId;
        private String branchName;
        private String branchCode;
        private LocalDateTime createdAt;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder fullName(String fullName) { this.fullName = fullName; return this; }
        public Builder email(String email) { this.email = email; return this; }
        public Builder phoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; return this; }
        public Builder address(String address) { this.address = address; return this; }
        public Builder status(String status) { this.status = status; return this; }
        public Builder branchId(Long branchId) { this.branchId = branchId; return this; }
        public Builder branchName(String branchName) { this.branchName = branchName; return this; }
        public Builder branchCode(String branchCode) { this.branchCode = branchCode; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public BranchManagerResponse build() {
            return new BranchManagerResponse(id, fullName, email, phoneNumber, address, status, branchId, branchName, branchCode, createdAt);
        }
    }
}
