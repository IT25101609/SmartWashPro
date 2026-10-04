package com.smartwashpro.dto.response;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public class AttendanceResponse {
    private Long id;
    private Long employeeId;
    private String employeeName;
    private String employeeRole;
    private Long branchId;
    private String branchName;
    private String attendanceStatus;
    private LocalDate date;
    private LocalTime checkIn;
    private LocalTime checkOut;
    private Double workingHours;
    private String workingHoursFormatted;
    private LocalDateTime createdAt;

    public AttendanceResponse() {}

    public AttendanceResponse(Long id, Long employeeId, String employeeName, String employeeRole, Long branchId, String branchName,
                              String attendanceStatus, LocalDate date, LocalTime checkIn, LocalTime checkOut,
                              Double workingHours, String workingHoursFormatted, LocalDateTime createdAt) {
        this.id = id;
        this.employeeId = employeeId;
        this.employeeName = employeeName;
        this.employeeRole = employeeRole;
        this.branchId = branchId;
        this.branchName = branchName;
        this.attendanceStatus = attendanceStatus;
        this.date = date;
        this.checkIn = checkIn;
        this.checkOut = checkOut;
        this.workingHours = workingHours;
        this.workingHoursFormatted = workingHoursFormatted;
        this.createdAt = createdAt;
    }

    public static Double calculateWorkingHours(LocalTime checkIn, LocalTime checkOut) {
        if (checkIn == null || checkOut == null) return null;
        long minutes = Duration.between(checkIn, checkOut).toMinutes();
        if (minutes < 0) minutes = 0;
        return Math.round((minutes / 60.0) * 100.0) / 100.0;
    }

    public static String formatWorkingHours(LocalTime checkIn, LocalTime checkOut) {
        if (checkIn == null) return "—";
        if (checkOut == null) return "In Progress";
        long minutes = Duration.between(checkIn, checkOut).toMinutes();
        if (minutes < 0) minutes = 0;
        long hours = minutes / 60;
        long mins = minutes % 60;
        return String.format("%dh %02dm", hours, mins);
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
    public String getEmployeeName() { return employeeName; }
    public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }
    public String getEmployeeRole() { return employeeRole; }
    public void setEmployeeRole(String employeeRole) { this.employeeRole = employeeRole; }
    public Long getBranchId() { return branchId; }
    public void setBranchId(Long branchId) { this.branchId = branchId; }
    public String getBranchName() { return branchName; }
    public void setBranchName(String branchName) { this.branchName = branchName; }
    public String getAttendanceStatus() { return attendanceStatus; }
    public void setAttendanceStatus(String attendanceStatus) { this.attendanceStatus = attendanceStatus; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public LocalTime getCheckIn() { return checkIn; }
    public void setCheckIn(LocalTime checkIn) { this.checkIn = checkIn; }
    public LocalTime getCheckOut() { return checkOut; }
    public void setCheckOut(LocalTime checkOut) { this.checkOut = checkOut; }
    public Double getWorkingHours() { return workingHours; }
    public void setWorkingHours(Double workingHours) { this.workingHours = workingHours; }
    public String getWorkingHoursFormatted() { return workingHoursFormatted; }
    public void setWorkingHoursFormatted(String workingHoursFormatted) { this.workingHoursFormatted = workingHoursFormatted; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public static Builder builder() { return new Builder(); }
    public static class Builder {
        private Long id;
        private Long employeeId;
        private String employeeName;
        private String employeeRole;
        private Long branchId;
        private String branchName;
        private String attendanceStatus;
        private LocalDate date;
        private LocalTime checkIn;
        private LocalTime checkOut;
        private Double workingHours;
        private String workingHoursFormatted;
        private LocalDateTime createdAt;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder employeeId(Long employeeId) { this.employeeId = employeeId; return this; }
        public Builder employeeName(String employeeName) { this.employeeName = employeeName; return this; }
        public Builder employeeRole(String employeeRole) { this.employeeRole = employeeRole; return this; }
        public Builder branchId(Long branchId) { this.branchId = branchId; return this; }
        public Builder branchName(String branchName) { this.branchName = branchName; return this; }
        public Builder attendanceStatus(String attendanceStatus) { this.attendanceStatus = attendanceStatus; return this; }
        public Builder date(LocalDate date) { this.date = date; return this; }
        public Builder checkIn(LocalTime checkIn) { this.checkIn = checkIn; return this; }
        public Builder checkOut(LocalTime checkOut) { this.checkOut = checkOut; return this; }
        public Builder workingHours(Double workingHours) { this.workingHours = workingHours; return this; }
        public Builder workingHoursFormatted(String workingHoursFormatted) { this.workingHoursFormatted = workingHoursFormatted; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public AttendanceResponse build() {
            Double wh = this.workingHours != null ? this.workingHours : calculateWorkingHours(checkIn, checkOut);
            String whf = this.workingHoursFormatted != null ? this.workingHoursFormatted : formatWorkingHours(checkIn, checkOut);
            return new AttendanceResponse(id, employeeId, employeeName, employeeRole, branchId, branchName, attendanceStatus, date, checkIn, checkOut, wh, whf, createdAt);
        }
    }
}
