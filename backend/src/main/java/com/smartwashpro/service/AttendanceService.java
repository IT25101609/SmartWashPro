package com.smartwashpro.service;

import com.smartwashpro.dto.request.AttendanceRequest;
import com.smartwashpro.dto.response.AttendanceResponse;
import com.smartwashpro.exception.BusinessRuleException;
import com.smartwashpro.exception.ResourceNotFoundException;
import com.smartwashpro.model.Attendance;
import com.smartwashpro.model.Branch;
import com.smartwashpro.model.Employee;
import com.smartwashpro.model.User;
import com.smartwashpro.model.enums.AttendanceStatus;
import com.smartwashpro.model.enums.EmploymentStatus;
import com.smartwashpro.repository.AttendanceRepository;
import com.smartwashpro.repository.BranchRepository;
import com.smartwashpro.repository.EmployeeRepository;
import com.smartwashpro.security.SecurityUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;

@Service
public class AttendanceService {
    private final AttendanceRepository attendanceRepository;
    private final EmployeeRepository employeeRepository;
    private final BranchRepository branchRepository;
    private final SecurityUtils securityUtils;

    public AttendanceService(AttendanceRepository attendanceRepository,
                             EmployeeRepository employeeRepository,
                             BranchRepository branchRepository,
                             SecurityUtils securityUtils) {
        this.attendanceRepository = attendanceRepository;
        this.employeeRepository = employeeRepository;
        this.branchRepository = branchRepository;
        this.securityUtils = securityUtils;
    }

    private Employee resolveEmployee(Long employeeId, User currentUser) {
        if (employeeId != null) {
            return employeeRepository.findById(employeeId)
                    .orElseThrow(() -> new ResourceNotFoundException("Employee", employeeId));
        }
        if (currentUser != null) {
            return employeeRepository.findByUserId(currentUser.getId())
                    .orElseThrow(() -> new IllegalArgumentException("No employee profile found for current user. Please provide employeeId."));
        }
        throw new IllegalArgumentException("Employee ID is required");
    }

    @Transactional
    public AttendanceResponse checkIn(Long employeeId, LocalDate date, LocalTime time, User currentUser) {
        final LocalDate effectiveDate = date != null ? date : LocalDate.now();
        final LocalTime effectiveTime = time != null ? time : LocalTime.now().withNano(0);

        Employee employee = resolveEmployee(employeeId, currentUser);

        if (employee.getEmploymentStatus() != EmploymentStatus.ACTIVE) {
            throw new BusinessRuleException("Cannot check in: Employee '" +
                    (employee.getUser() != null ? employee.getUser().getFullName() : employee.getId()) +
                    "' is not active (Status: " + employee.getEmploymentStatus() + ").");
        }

        if (securityUtils.isBranchManager()) {
            securityUtils.validateBranchAccess(employee.getBranchId());
        }

        // Business Rule: An employee cannot check in twice on the same shift/date.
        Optional<Attendance> existingOpt = attendanceRepository.findByEmployeeIdAndDate(employee.getId(), effectiveDate);
        Attendance attendance;
        if (existingOpt.isPresent()) {
            Attendance existing = existingOpt.get();
            if (existing.getCheckIn() != null) {
                throw new BusinessRuleException("Employee has already checked in for this shift on " + effectiveDate + " at " + existing.getCheckIn());
            }
            existing.setCheckIn(effectiveTime);
            if (existing.getAttendanceStatus() == null || existing.getAttendanceStatus() == AttendanceStatus.ABSENT) {
                existing.setAttendanceStatus(effectiveTime.isAfter(LocalTime.of(8, 30)) ? AttendanceStatus.LATE : AttendanceStatus.PRESENT);
            }
            attendance = attendanceRepository.save(existing);
        } else {
            AttendanceStatus status = effectiveTime.isAfter(LocalTime.of(8, 30)) ? AttendanceStatus.LATE : AttendanceStatus.PRESENT;
            attendance = Attendance.builder()
                    .employee(employee)
                    .date(effectiveDate)
                    .checkIn(effectiveTime)
                    .attendanceStatus(status)
                    .build();
            attendance = attendanceRepository.save(attendance);
        }

        return mapToResponse(attendance);
    }

    @Transactional
    public AttendanceResponse checkOut(Long employeeId, LocalDate date, LocalTime time, User currentUser) {
        final LocalDate effectiveDate = date != null ? date : LocalDate.now();
        final LocalTime effectiveTime = time != null ? time : LocalTime.now().withNano(0);

        Employee employee = resolveEmployee(employeeId, currentUser);

        if (securityUtils.isBranchManager()) {
            securityUtils.validateBranchAccess(employee.getBranchId());
        }

        // Business Rule: An employee cannot check out before checking in.
        Attendance attendance = attendanceRepository.findByEmployeeIdAndDate(employee.getId(), effectiveDate)
                .orElseThrow(() -> new BusinessRuleException("Cannot check out before checking in. No attendance record found for " + effectiveDate));

        if (attendance.getCheckIn() == null) {
            throw new BusinessRuleException("Cannot check out before checking in. No check-in recorded for " + effectiveDate);
        }

        if (attendance.getCheckOut() != null) {
            throw new BusinessRuleException("Employee has already checked out for this shift on " + effectiveDate + " at " + attendance.getCheckOut());
        }

        // Business Rule: Check-out time cannot be earlier than check-in time.
        if (effectiveTime.isBefore(attendance.getCheckIn())) {
            throw new BusinessRuleException("Check-out time (" + effectiveTime + ") cannot be before check-in time (" + attendance.getCheckIn() + ").");
        }

        attendance.setCheckOut(effectiveTime);
        attendance = attendanceRepository.save(attendance);

        return mapToResponse(attendance);
    }

    @Transactional
    public AttendanceResponse recordAttendance(AttendanceRequest request, User currentUser) {
        if (request.getEmployeeId() == null) {
            throw new IllegalArgumentException("Employee ID is required");
        }
        LocalDate date = request.getDate() != null ? request.getDate() : LocalDate.now();

        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee", request.getEmployeeId()));

        if (employee.getEmploymentStatus() != EmploymentStatus.ACTIVE) {
            throw new BusinessRuleException("Cannot record attendance: Employee is not active.");
        }

        if (securityUtils.isBranchManager()) {
            securityUtils.validateBranchAccess(employee.getBranchId());
        }

        Optional<Attendance> existingOpt = attendanceRepository.findByEmployeeIdAndDate(employee.getId(), date);
        if (existingOpt.isPresent()) {
            throw new BusinessRuleException("Attendance record already exists for employee on " + date + ". Please update existing record instead.");
        }

        LocalTime checkIn = request.getCheckIn() != null ? request.getCheckIn() : request.getTime();
        LocalTime checkOut = request.getCheckOut();

        if (checkIn != null && checkOut != null && checkOut.isBefore(checkIn)) {
            throw new BusinessRuleException("Check-out time (" + checkOut + ") cannot be before check-in time (" + checkIn + ").");
        }

        AttendanceStatus status = request.getAttendanceStatus();
        if (status == null) {
            if (checkIn != null) {
                status = checkIn.isAfter(LocalTime.of(8, 30)) ? AttendanceStatus.LATE : AttendanceStatus.PRESENT;
            } else {
                status = AttendanceStatus.PRESENT;
            }
        }

        Attendance attendance = Attendance.builder()
                .employee(employee)
                .date(date)
                .checkIn(checkIn)
                .checkOut(checkOut)
                .attendanceStatus(status)
                .build();

        return mapToResponse(attendanceRepository.save(attendance));
    }

    @Transactional
    public AttendanceResponse updateAttendance(Long id, AttendanceRequest request, User currentUser) {
        Attendance attendance = attendanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Attendance", id));

        if (securityUtils.isBranchManager()) {
            securityUtils.validateBranchAccess(attendance.getEmployee().getBranchId());
        }

        LocalTime checkIn = request.getCheckIn() != null ? request.getCheckIn() : attendance.getCheckIn();
        LocalTime checkOut = request.getCheckOut() != null ? request.getCheckOut() : attendance.getCheckOut();

        if (checkIn != null && checkOut != null && checkOut.isBefore(checkIn)) {
            throw new BusinessRuleException("Check-out time (" + checkOut + ") cannot be before check-in time (" + checkIn + ").");
        }

        if (request.getDate() != null && !request.getDate().equals(attendance.getDate())) {
            Optional<Attendance> conflict = attendanceRepository.findByEmployeeIdAndDate(attendance.getEmployee().getId(), request.getDate());
            if (conflict.isPresent() && !conflict.get().getId().equals(id)) {
                throw new BusinessRuleException("An attendance record already exists for this employee on " + request.getDate());
            }
            attendance.setDate(request.getDate());
        }

        if (request.getCheckIn() != null) attendance.setCheckIn(request.getCheckIn());
        if (request.getCheckOut() != null) attendance.setCheckOut(request.getCheckOut());
        if (request.getAttendanceStatus() != null) attendance.setAttendanceStatus(request.getAttendanceStatus());

        return mapToResponse(attendanceRepository.save(attendance));
    }

    @Transactional
    public void deleteAttendance(Long id, User currentUser) {
        Attendance attendance = attendanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Attendance", id));

        if (securityUtils.isBranchManager()) {
            securityUtils.validateBranchAccess(attendance.getEmployee().getBranchId());
        }

        attendanceRepository.delete(attendance);
    }

    public Page<AttendanceResponse> getAttendance(Long branchId, Long employeeId, LocalDate date,
                                                  LocalDate startDate, LocalDate endDate,
                                                  AttendanceStatus status, String search, Pageable pageable) {
        final Long effectiveBranchId = securityUtils.isBranchManager() ?
                securityUtils.getCurrentUserBranchId() : branchId;

        return attendanceRepository.filterAttendance(effectiveBranchId, employeeId, date, startDate, endDate, status, search, pageable)
                .map(this::mapToResponse);
    }

    public Page<AttendanceResponse> getAttendance(Long branchId, Long employeeId, LocalDate date, AttendanceStatus status, Pageable pageable) {
        return getAttendance(branchId, employeeId, date, null, null, status, null, pageable);
    }

    public AttendanceResponse getAttendanceById(Long id) {
        Attendance attendance = attendanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Attendance", id));
        if (securityUtils.isBranchManager()) {
            securityUtils.validateBranchAccess(attendance.getEmployee().getBranchId());
        }
        return mapToResponse(attendance);
    }

    public AttendanceResponse mapToResponse(Attendance attendance) {
        Employee emp = attendance.getEmployee();
        String name = emp != null && emp.getUser() != null ? emp.getUser().getFullName() : "Employee #" + (emp != null ? emp.getId() : "");
        String role = emp != null ? emp.getRole() : null;
        Long branchId = emp != null ? emp.getBranchId() : null;
        String branchName = null;
        if (branchId != null) {
            branchName = branchRepository.findById(branchId).map(Branch::getBranchName).orElse(null);
        }

        LocalTime checkIn = attendance.getCheckIn();
        LocalTime checkOut = attendance.getCheckOut();
        Double workingHours = AttendanceResponse.calculateWorkingHours(checkIn, checkOut);
        String workingHoursFormatted = AttendanceResponse.formatWorkingHours(checkIn, checkOut);

        return AttendanceResponse.builder()
                .id(attendance.getId())
                .employeeId(emp != null ? emp.getId() : null)
                .employeeName(name)
                .employeeRole(role)
                .branchId(branchId)
                .branchName(branchName)
                .date(attendance.getDate())
                .checkIn(checkIn)
                .checkOut(checkOut)
                .attendanceStatus(attendance.getAttendanceStatus() != null ? attendance.getAttendanceStatus().name() : "PRESENT")
                .workingHours(workingHours)
                .workingHoursFormatted(workingHoursFormatted)
                .createdAt(attendance.getCreatedAt())
                .build();
    }
}
