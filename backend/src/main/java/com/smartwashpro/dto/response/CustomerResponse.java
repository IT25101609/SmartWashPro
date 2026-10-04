package com.smartwashpro.dto.response;
public class CustomerResponse {
    private Long id;
    private Long userId;
    private String fullName;
    private String email;
    private String phoneNumber;
    private String address;
    private String status;
    private Integer loyaltyPoints;
    private Integer totalOrders;
    private Double totalSpent;
    private String preferredPaymentMethod;
    public CustomerResponse() {}

    public CustomerResponse(Long id, Long userId, String fullName, String email, String phoneNumber, String address, String status, Integer loyaltyPoints, Integer totalOrders, Double totalSpent, String preferredPaymentMethod) {
        this.id = id;
        this.userId = userId;
        this.fullName = fullName;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.address = address;
        this.status = status;
        this.loyaltyPoints = loyaltyPoints;
        this.totalOrders = totalOrders;
        this.totalSpent = totalSpent;
        this.preferredPaymentMethod = preferredPaymentMethod;
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

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getLoyaltyPoints() { return loyaltyPoints; }
    public void setLoyaltyPoints(Integer loyaltyPoints) { this.loyaltyPoints = loyaltyPoints; }

    public Integer getTotalOrders() { return totalOrders; }
    public void setTotalOrders(Integer totalOrders) { this.totalOrders = totalOrders; }

    public Double getTotalSpent() { return totalSpent; }
    public void setTotalSpent(Double totalSpent) { this.totalSpent = totalSpent; }

    public String getPreferredPaymentMethod() { return preferredPaymentMethod; }
    public void setPreferredPaymentMethod(String preferredPaymentMethod) { this.preferredPaymentMethod = preferredPaymentMethod; }


    public static Builder builder() { return new Builder(); }
    public static class Builder {
        private Long id;
        private Long userId;
        private String fullName;
        private String email;
        private String phoneNumber;
        private String address;
        private String status;
        private Integer loyaltyPoints;
        private Integer totalOrders;
        private Double totalSpent;
        private String preferredPaymentMethod;
        public Builder id(Long id) { this.id = id; return this; }
        public Builder userId(Long userId) { this.userId = userId; return this; }
        public Builder fullName(String fullName) { this.fullName = fullName; return this; }
        public Builder email(String email) { this.email = email; return this; }
        public Builder phoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; return this; }
        public Builder address(String address) { this.address = address; return this; }
        public Builder status(String status) { this.status = status; return this; }
        public Builder loyaltyPoints(Integer loyaltyPoints) { this.loyaltyPoints = loyaltyPoints; return this; }
        public Builder totalOrders(Integer totalOrders) { this.totalOrders = totalOrders; return this; }
        public Builder totalSpent(Double totalSpent) { this.totalSpent = totalSpent; return this; }
        public Builder preferredPaymentMethod(String preferredPaymentMethod) { this.preferredPaymentMethod = preferredPaymentMethod; return this; }
        public CustomerResponse build() {
            CustomerResponse instance = new CustomerResponse();
            instance.id = this.id;
            instance.userId = this.userId;
            instance.fullName = this.fullName;
            instance.email = this.email;
            instance.phoneNumber = this.phoneNumber;
            instance.address = this.address;
            instance.status = this.status;
            instance.loyaltyPoints = this.loyaltyPoints;
            instance.totalOrders = this.totalOrders;
            instance.totalSpent = this.totalSpent;
            instance.preferredPaymentMethod = this.preferredPaymentMethod;
            return instance;
        }
    }

}
