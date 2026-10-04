package com.smartwashpro.model;

import com.smartwashpro.model.enums.AttendanceStatus;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "attendance")
public class Attendance {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    private LocalDate date;
    private LocalTime checkIn;
    private LocalTime checkOut;

    @Enumerated(EnumType.STRING)
    private AttendanceStatus attendanceStatus = AttendanceStatus.PRESENT;

    private LocalDateTime createdAt;

    public Attendance() {}

    public Attendance(Long id, Employee employee, LocalDate date, LocalTime checkIn, LocalTime checkOut, AttendanceStatus attendanceStatus, LocalDateTime createdAt) {
        this.id = id;
        this.employee = employee;
        this.date = date;
        this.checkIn = checkIn;
        this.checkOut = checkOut;
        this.attendanceStatus = attendanceStatus != null ? attendanceStatus : AttendanceStatus.PRESENT;
        this.createdAt = createdAt;
    }

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Employee getEmployee() { return employee; }
    public void setEmployee(Employee employee) { this.employee = employee; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public LocalTime getCheckIn() { return checkIn; }
    public void setCheckIn(LocalTime checkIn) { this.checkIn = checkIn; }
    public LocalTime getCheckOut() { return checkOut; }
    public void setCheckOut(LocalTime checkOut) { this.checkOut = checkOut; }
    public AttendanceStatus getAttendanceStatus() { return attendanceStatus; }
    public void setAttendanceStatus(AttendanceStatus attendanceStatus) { this.attendanceStatus = attendanceStatus; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public static Builder builder() { return new Builder(); }
    public static class Builder {
        private Long id;
        private Employee employee;
        private LocalDate date;
        private LocalTime checkIn;
        private LocalTime checkOut;
        private AttendanceStatus attendanceStatus = AttendanceStatus.PRESENT;
        private LocalDateTime createdAt;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder employee(Employee employee) { this.employee = employee; return this; }
        public Builder date(LocalDate date) { this.date = date; return this; }
        public Builder checkIn(LocalTime checkIn) { this.checkIn = checkIn; return this; }
        public Builder checkOut(LocalTime checkOut) { this.checkOut = checkOut; return this; }
        public Builder attendanceStatus(AttendanceStatus attendanceStatus) { this.attendanceStatus = attendanceStatus; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public Attendance build() {
            return new Attendance(id, employee, date, checkIn, checkOut, attendanceStatus, createdAt);
        }
    }
}
