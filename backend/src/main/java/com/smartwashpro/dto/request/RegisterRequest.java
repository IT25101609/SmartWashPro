package com.smartwashpro.dto.request;

import jakarta.validation.constraints.*;
public class RegisterRequest {
    @NotBlank(message = "Full name is required")
    private String fullName;
    @NotBlank @Email(message = "Valid email is required")
    private String email;
    @NotBlank(message = "Phone number is required")
    private String phoneNumber;
    private String address;
    @NotBlank @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;
    public RegisterRequest() {}

    public RegisterRequest(String fullName, String email, String phoneNumber, String address, String password) {
        this.fullName = fullName;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.address = address;
        this.password = password;
    }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

}
