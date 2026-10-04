package com.smartwashpro.dto.response;

import java.time.LocalDateTime;

public class SupplierResponse {
    private Long id;
    private String supplierName;
    private String contactPerson;
    private String phone;
    private String email;
    private String address;
    private String status;
    private long suppliedItemsCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public SupplierResponse() {}

    public SupplierResponse(Long id, String supplierName, String contactPerson, String phone, String email, String address, String status) {
        this.id = id;
        this.supplierName = supplierName;
        this.contactPerson = contactPerson;
        this.phone = phone;
        this.email = email;
        this.address = address;
        this.status = status;
    }

    public SupplierResponse(Long id, String supplierName, String contactPerson, String phone, String email, String address, String status, long suppliedItemsCount, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.supplierName = supplierName;
        this.contactPerson = contactPerson;
        this.phone = phone;
        this.email = email;
        this.address = address;
        this.status = status;
        this.suppliedItemsCount = suppliedItemsCount;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getSupplierName() { return supplierName; }
    public void setSupplierName(String supplierName) { this.supplierName = supplierName; }
    public String getContactPerson() { return contactPerson; }
    public void setContactPerson(String contactPerson) { this.contactPerson = contactPerson; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public long getSuppliedItemsCount() { return suppliedItemsCount; }
    public void setSuppliedItemsCount(long suppliedItemsCount) { this.suppliedItemsCount = suppliedItemsCount; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public static Builder builder() { return new Builder(); }
    public static class Builder {
        private Long id;
        private String supplierName;
        private String contactPerson;
        private String phone;
        private String email;
        private String address;
        private String status;
        private long suppliedItemsCount = 0;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder supplierName(String supplierName) { this.supplierName = supplierName; return this; }
        public Builder contactPerson(String contactPerson) { this.contactPerson = contactPerson; return this; }
        public Builder phone(String phone) { this.phone = phone; return this; }
        public Builder email(String email) { this.email = email; return this; }
        public Builder address(String address) { this.address = address; return this; }
        public Builder status(String status) { this.status = status; return this; }
        public Builder suppliedItemsCount(long suppliedItemsCount) { this.suppliedItemsCount = suppliedItemsCount; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public Builder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public SupplierResponse build() {
            return new SupplierResponse(id, supplierName, contactPerson, phone, email, address, status, suppliedItemsCount, createdAt, updatedAt);
        }
    }
}
