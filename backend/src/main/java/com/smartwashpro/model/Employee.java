package com.smartwashpro.model;

// Import the EmploymentStatus enum
import com.smartwashpro.model.enums.EmploymentStatus;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;


// This class will be mapped to a database table.
@Entity

// Specifies the database table name as "employees"
@Table(name = "employees")
public class Employee {

    // Automatically generates the ID value
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    // Creates a one-to-one relationship between Employee and User
    @OneToOne(fetch = FetchType.EAGER)

    // Creates the foreign key column "user_id"
    @JoinColumn(name = "user_id", nullable = false)
    private User user;


    @Column(name = "role", nullable = false)
    private String role;


    @Enumerated(EnumType.STRING)
    private EmploymentStatus employmentStatus = EmploymentStatus.ACTIVE;


    // Stores the branch ID where the employee works
    @Column(name = "branch_id")
    private Long branchId;


    // Stores the date the employee was hired
    private LocalDate hireDate;


    // Stores when the employee record was created
    private LocalDateTime createdAt;


    // Stores when the employee record was last updated
    private LocalDateTime updatedAt;


    // Default constructor
    // Required by JPA
    public Employee() {}


    // Constructor used to create an Employee object
    // with all the available fields
    public Employee(
            Long id,
            User user,
            String role,
            EmploymentStatus employmentStatus,
            Long branchId,
            LocalDate hireDate,
            LocalDateTime createdAt,
            LocalDateTime updatedAt) {

        this.id = id;
        this.user = user;
        this.role = role;

        // If employmentStatus is null,
        // ACTIVE will be used as the default value
        this.employmentStatus =
                employmentStatus != null
                        ? employmentStatus
                        : EmploymentStatus.ACTIVE;

        this.branchId = branchId;
        this.hireDate = hireDate;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }


    // This method runs automatically before a new Employee
    // object is saved to the database
    @PrePersist
    protected void onCreate() {

        // Set the creation time
        createdAt = LocalDateTime.now();

        // Set the initial update time
        updatedAt = LocalDateTime.now();
    }


    // This method runs automatically before an existing
    // Employee object is updated
    @PreUpdate
    protected void onUpdate() {

        // Update the last modified time
        updatedAt = LocalDateTime.now();
    }


    // Getter for employee ID
    public Long getId() {
        return id;
    }

    // Setter for employee ID
    public void setId(Long id) {
        this.id = id;
    }


    // Getter for User
    public User getUser() {
        return user;
    }

    // Setter for User
    public void setUser(User user) {
        this.user = user;
    }


    // Getter for employee role
    public String getRole() {
        return role;
    }

    // Setter for employee role
    public void setRole(String role) {
        this.role = role;
    }


    // Getter for employment status
    public EmploymentStatus getEmploymentStatus() {
        return employmentStatus;
    }

    // Setter for employment status
    public void setEmploymentStatus(EmploymentStatus employmentStatus) {
        this.employmentStatus = employmentStatus;
    }


    // Getter for branch ID
    public Long getBranchId() {
        return branchId;
    }

    // Setter for branch ID
    public void setBranchId(Long branchId) {
        this.branchId = branchId;
    }


    // Getter for hire date
    public LocalDate getHireDate() {
        return hireDate;
    }

    // Setter for hire date
    public void setHireDate(LocalDate hireDate) {
        this.hireDate = hireDate;
    }


    // Getter for creation date and time
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    // Setter for creation date and time
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }


    // Getter for last update date and time
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    // Setter for last update date and time
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }


    // Allows us to create Employee objects step-by-step
    public static Builder builder() {
        return new Builder();
    }


    // without using a long constructor
    public static class Builder {

        private Long id;
        private User user;
        private String role;

        // Default employment status is ACTIVE
        private EmploymentStatus employmentStatus =
                EmploymentStatus.ACTIVE;

        private Long branchId;
        private LocalDate hireDate;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;


        // Set employee ID
        public Builder id(Long id) {
            this.id = id;
            return this;
        }


        // Set User
        public Builder user(User user) {
            this.user = user;
            return this;
        }


        // Set employee role
        public Builder role(String role) {
            this.role = role;
            return this;
        }


        // Set employment status
        public Builder employmentStatus(
                EmploymentStatus employmentStatus) {

            this.employmentStatus = employmentStatus;
            return this;
        }


        // Set branch ID
        public Builder branchId(Long branchId) {
            this.branchId = branchId;
            return this;
        }


        // Set hire date
        public Builder hireDate(LocalDate hireDate) {
            this.hireDate = hireDate;
            return this;
        }


        // Set creation date and time
        public Builder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }


        // Set update date and time
        public Builder updatedAt(LocalDateTime updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }


        // Creates and returns the Employee object
        public Employee build() {

            return new Employee(
                    id,
                    user,
                    role,
                    employmentStatus,
                    branchId,
                    hireDate,
                    createdAt,
                    updatedAt
            );
        }
    }
}
