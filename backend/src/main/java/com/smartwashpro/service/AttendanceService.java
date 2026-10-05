package com.smartwashpro.service;

// Request and response DTOs used to receive and return attendance data
import com.smartwashpro.dto.request.AttendanceRequest;
import com.smartwashpro.dto.response.AttendanceResponse;

// Custom exceptions for business rules and missing resources
import com.smartwashpro.exception.BusinessRuleException;
import com.smartwashpro.exception.ResourceNotFoundException;

// Entity classes
import com.smartwashpro.model.Attendance;
import com.smartwashpro.model.Branch;
import com.smartwashpro.model.Employee;
import com.smartwashpro.model.User;

// Enums used for attendance and employment status
import com.smartwashpro.model.enums.AttendanceStatus;
import com.smartwashpro.model.enums.EmploymentStatus;

// Repositories used to access database data
import com.smartwashpro.repository.AttendanceRepository;
import com.smartwashpro.repository.BranchRepository;
import com.smartwashpro.repository.EmployeeRepository;

// Used to check the logged-in user's permissions
import com.smartwashpro.security.SecurityUtils;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;


// @Service marks this class as a Spring Service.
// It contains the business logic of attendance management.
@Service
public class AttendanceService {

    // Repository objects used to communicate with the database
    private final AttendanceRepository attendanceRepository;
    private final EmployeeRepository employeeRepository;
    private final BranchRepository branchRepository;

    // Used for security and branch access validation
    private final SecurityUtils securityUtils;


    // Constructor injection is used to provide required dependencies
    public AttendanceService(
            AttendanceRepository attendanceRepository,
            EmployeeRepository employeeRepository,
            BranchRepository branchRepository,
            SecurityUtils securityUtils) {

        this.attendanceRepository = attendanceRepository;
        this.employeeRepository = employeeRepository;
        this.branchRepository = branchRepository;
        this.securityUtils = securityUtils;
    }


    // Finds the employee using either the given employee ID
    // or the currently logged-in user's ID
    private Employee resolveEmployee(Long employeeId, User currentUser) {

        // If employeeId is provided, find employee by ID
        if (employeeId != null) {

            return employeeRepository.findById(employeeId)
                    .orElseThrow(() ->
                            new ResourceNotFoundException(
                                    "Employee",
                                    employeeId));
        }

        // If employeeId is not provided,
        // try to find the employee using the current user
        if (currentUser != null) {

            return employeeRepository.findByUserId(currentUser.getId())
                    .orElseThrow(() ->
                            new IllegalArgumentException(
                                    "No employee profile found for current user. " +
                                    "Please provide employeeId."));
        }

        // If neither employee ID nor current user is available
        throw new IllegalArgumentException("Employee ID is required");
    }


    // Makes the check-in operation a database transaction
    @Transactional
    public AttendanceResponse checkIn(
            Long employeeId,
            LocalDate date,
            LocalTime time,
            User currentUser) {


        // If date is not provided, use today's date
        final LocalDate effectiveDate =
                date != null ? date : LocalDate.now();


        // If time is not provided, use the current time
        final LocalTime effectiveTime =
                time != null ? time : LocalTime.now().withNano(0);


        // Find the employee who is checking in
        Employee employee = resolveEmployee(employeeId, currentUser);


        // Only active employees can check in
        if (employee.getEmploymentStatus()
                != EmploymentStatus.ACTIVE) {

            throw new BusinessRuleException(
                    "Cannot check in: Employee '" +
                    (employee.getUser() != null
                            ? employee.getUser().getFullName()
                            : employee.getId()) +
                    "' is not active (Status: " +
                    employee.getEmploymentStatus() + ").");
        }


        // Branch managers can only access employees
        // belonging to their own branch
        if (securityUtils.isBranchManager()) {
            securityUtils.validateBranchAccess(
                    employee.getBranchId());
        }


        // Check whether an attendance record already exists
        // for this employee on this date
        Optional<Attendance> existingOpt =
                attendanceRepository.findByEmployeeIdAndDate(
                        employee.getId(),
                        effectiveDate);


        Attendance attendance;


        // If an attendance record already exists
        if (existingOpt.isPresent()) {

            Attendance existing = existingOpt.get();


            // An employee cannot check in twice
            if (existing.getCheckIn() != null) {

                throw new BusinessRuleException(
                        "Employee has already checked in for this shift on "
                        + effectiveDate
                        + " at "
                        + existing.getCheckIn());
            }


            // Add the check-in time to the existing record
            existing.setCheckIn(effectiveTime);


            // If status is missing or ABSENT,
            // automatically determine PRESENT or LATE
            if (existing.getAttendanceStatus() == null
                    || existing.getAttendanceStatus()
                    == AttendanceStatus.ABSENT) {

                existing.setAttendanceStatus(
                        effectiveTime.isAfter(
                                LocalTime.of(8, 30))
                                ? AttendanceStatus.LATE
                                : AttendanceStatus.PRESENT);
            }


            // Save the updated attendance record
            attendance = attendanceRepository.save(existing);

        } else {

            // If no attendance record exists,
            // determine the employee's attendance status
            AttendanceStatus status =
                    effectiveTime.isAfter(
                            LocalTime.of(8, 30))
                            ? AttendanceStatus.LATE
                            : AttendanceStatus.PRESENT;


            // Create a new attendance record
            Attendance newAttendance = Attendance.builder()
                    .employee(employee)
                    .date(effectiveDate)
                    .checkIn(effectiveTime)
                    .attendanceStatus(status)
                    .build();


            // Save the new attendance record
            attendance =
                    attendanceRepository.save(newAttendance);
        }


        // Convert entity to response DTO and return it
        return mapToResponse(attendance);
    }


    // Handles employee check-out
    @Transactional
    public AttendanceResponse checkOut(
            Long employeeId,
            LocalDate date,
            LocalTime time,
            User currentUser) {


        // Use today's date if no date is provided
        final LocalDate effectiveDate =
                date != null ? date : LocalDate.now();


        // Use current time if no time is provided
        final LocalTime effectiveTime =
                time != null
                        ? time
                        : LocalTime.now().withNano(0);


        // Find the employee
        Employee employee =
                resolveEmployee(employeeId, currentUser);


        // Check branch manager's access
        if (securityUtils.isBranchManager()) {
            securityUtils.validateBranchAccess(
                    employee.getBranchId());
        }


        // Find the attendance record for the employee and date
        Attendance attendance =
                attendanceRepository
                        .findByEmployeeIdAndDate(
                                employee.getId(),
                                effectiveDate)
                        .orElseThrow(() ->
                                new BusinessRuleException(
                                        "Cannot check out before checking in. " +
                                        "No attendance record found for "
                                        + effectiveDate));


        // Employee must check in before checking out
        if (attendance.getCheckIn() == null) {

            throw new BusinessRuleException(
                    "Cannot check out before checking in. " +
                    "No check-in recorded for "
                    + effectiveDate);
        }


        // Prevent multiple check-outs
        if (attendance.getCheckOut() != null) {

            throw new BusinessRuleException(
                    "Employee has already checked out for this shift on "
                    + effectiveDate
                    + " at "
                    + attendance.getCheckOut());
        }


        // Check-out cannot happen before check-in
        if (effectiveTime.isBefore(
                attendance.getCheckIn())) {

            throw new BusinessRuleException(
                    "Check-out time ("
                    + effectiveTime
                    + ") cannot be before check-in time ("
                    + attendance.getCheckIn()
                    + ").");
        }


        // Set the check-out time
        attendance.setCheckOut(effectiveTime);


        // Save the updated attendance record
        attendance =
                attendanceRepository.save(attendance);


        // Return the attendance as a response DTO
        return mapToResponse(attendance);
    }


    // Used to manually create an attendance record
    @Transactional
    public AttendanceResponse recordAttendance(
            AttendanceRequest request,
            User currentUser) {


        // Employee ID is required
        if (request.getEmployeeId() == null) {
            throw new IllegalArgumentException(
                    "Employee ID is required");
        }


        // Use today's date if no date is provided
        LocalDate date =
                request.getDate() != null
                        ? request.getDate()
                        : LocalDate.now();


        // Find the employee
        Employee employee =
                employeeRepository
                        .findById(request.getEmployeeId())
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Employee",
                                        request.getEmployeeId()));


        // Only active employees can have attendance records
        if (employee.getEmploymentStatus()
                != EmploymentStatus.ACTIVE) {

            throw new BusinessRuleException(
                    "Cannot record attendance: Employee is not active.");
        }


        // Validate branch manager access
        if (securityUtils.isBranchManager()) {
            securityUtils.validateBranchAccess(
                    employee.getBranchId());
        }


        // Prevent duplicate attendance records
        Optional<Attendance> existingOpt =
                attendanceRepository
                        .findByEmployeeIdAndDate(
                                employee.getId(),
                                date);

        if (existingOpt.isPresent()) {

            throw new BusinessRuleException(
                    "Attendance record already exists for employee on "
                    + date
                    + ". Please update existing record instead.");
        }


        // Get check-in time from checkIn field.
        // If it is null, use the time field.
        LocalTime checkIn =
                request.getCheckIn() != null
                        ? request.getCheckIn()
                        : request.getTime();


        // Get check-out time
        LocalTime checkOut =
                request.getCheckOut();


        // Check that check-out is not before check-in
        if (checkIn != null
                && checkOut != null
                && checkOut.isBefore(checkIn)) {

            throw new BusinessRuleException(
                    "Check-out time ("
                    + checkOut
                    + ") cannot be before check-in time ("
                    + checkIn
                    + ").");
        }


        // Get the attendance status from the request
        AttendanceStatus status =
                request.getAttendanceStatus();


        // If status was not provided,
        // automatically calculate it
        if (status == null) {

            if (checkIn != null) {

                // After 8:30 AM = LATE
                // 8:30 AM or earlier = PRESENT
                status = checkIn.isAfter(
                        LocalTime.of(8, 30))
                        ? AttendanceStatus.LATE
                        : AttendanceStatus.PRESENT;

            } else {

                status = AttendanceStatus.PRESENT;
            }
        }


        // Create a new Attendance object
        Attendance attendance =
                Attendance.builder()
                        .employee(employee)
                        .date(date)
                        .checkIn(checkIn)
                        .checkOut(checkOut)
                        .attendanceStatus(status)
                        .build();


        // Save the attendance and return the response
        return mapToResponse(
                attendanceRepository.save(attendance));
    }


    // Updates an existing attendance record
    @Transactional
    public AttendanceResponse updateAttendance(
            Long id,
            AttendanceRequest request,
            User currentUser) {


        // Find attendance by ID
        Attendance attendance =
                attendanceRepository.findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Attendance",
                                        id));


        // Branch managers can only update attendance
        // belonging to their own branch
        if (securityUtils.isBranchManager()) {
            securityUtils.validateBranchAccess(
                    attendance.getEmployee().getBranchId());
        }


        // Use new check-in time if provided.
        // Otherwise keep the existing time.
        LocalTime checkIn =
                request.getCheckIn() != null
                        ? request.getCheckIn()
                        : attendance.getCheckIn();


        // Use new check-out time if provided.
        // Otherwise keep the existing time.
        LocalTime checkOut =
                request.getCheckOut() != null
                        ? request.getCheckOut()
                        : attendance.getCheckOut();


        // Validate check-in and check-out times
        if (checkIn != null
                && checkOut != null
                && checkOut.isBefore(checkIn)) {

            throw new BusinessRuleException(
                    "Check-out time ("
                    + checkOut
                    + ") cannot be before check-in time ("
                    + checkIn
                    + ").");
        }


        // If the date is changed,
        // check that another record does not already exist
        if (request.getDate() != null
                && !request.getDate()
                .equals(attendance.getDate())) {

            Optional<Attendance> conflict =
                    attendanceRepository
                            .findByEmployeeIdAndDate(
                                    attendance.getEmployee().getId(),
                                    request.getDate());


            // Prevent duplicate attendance for the new date
            if (conflict.isPresent()
                    && !conflict.get().getId().equals(id)) {

                throw new BusinessRuleException(
                        "An attendance record already exists for this employee on "
                        + request.getDate());
            }


            attendance.setDate(request.getDate());
        }


        // Update only the fields provided in the request
        if (request.getCheckIn() != null)
            attendance.setCheckIn(request.getCheckIn());

        if (request.getCheckOut() != null)
            attendance.setCheckOut(request.getCheckOut());

        if (request.getAttendanceStatus() != null)
            attendance.setAttendanceStatus(
                    request.getAttendanceStatus());


        // Save the updated attendance record
        return mapToResponse(
                attendanceRepository.save(attendance));
    }


    // Deletes an attendance record
    @Transactional
    public void deleteAttendance(
            Long id,
            User currentUser) {


        // Find the attendance record
        Attendance attendance =
                attendanceRepository.findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Attendance",
                                        id));


        // Validate branch manager access
        if (securityUtils.isBranchManager()) {
            securityUtils.validateBranchAccess(
                    attendance.getEmployee().getBranchId());
        }


        // Delete the attendance record
        attendanceRepository.delete(attendance);
    }


    // Gets attendance records using multiple filters
    // Supports pagination
    public Page<AttendanceResponse> getAttendance(
            Long branchId,
            Long employeeId,
            LocalDate date,
            LocalDate startDate,
            LocalDate endDate,
            AttendanceStatus status,
            String search,
            Pageable pageable) {


        // If the current user is a branch manager,
        // automatically use their own branch
        final Long effectiveBranchId =
                securityUtils.isBranchManager()
                        ? securityUtils.getCurrentUserBranchId()
                        : branchId;


        // Get filtered attendance records from repository
        // and convert each record into a response DTO
        return attendanceRepository
                .filterAttendance(
                        effectiveBranchId,
                        employeeId,
                        date,
                        startDate,
                        endDate,
                        status,
                        search,
                        pageable)
                .map(this::mapToResponse);
    }


    // Simplified version of getAttendance()
    // Used when date range and search are not needed
    public Page<AttendanceResponse> getAttendance(
            Long branchId,
            Long employeeId,
            LocalDate date,
            AttendanceStatus status,
            Pageable pageable) {

        // Call the main method with null values
        // for startDate, endDate and search
        return getAttendance(
                branchId,
                employeeId,
                date,
                null,
                null,
                status,
                null,
                pageable);
    }


    // Gets one attendance record using its ID
    public AttendanceResponse getAttendanceById(
            Long id) {


        // Find attendance by ID
        Attendance attendance =
                attendanceRepository.findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Attendance",
                                        id));


        // Check branch manager access
        if (securityUtils.isBranchManager()) {
            securityUtils.validateBranchAccess(
                    attendance.getEmployee().getBranchId());
        }


        // Convert entity to response DTO
        return mapToResponse(attendance);
    }


    // Converts Attendance entity into AttendanceResponse DTO
    // This keeps database entity details separate from API response
    public AttendanceResponse mapToResponse(
            Attendance attendance) {


        // Get the employee related to this attendance
        Employee emp = attendance.getEmployee();


        // Get employee name safely
        String name =
                emp != null && emp.getUser() != null
                        ? emp.getUser().getFullName()
                        : "Employee #"
                        + (emp != null
                        ? emp.getId()
                        : "");


        // Get employee role
        String role =
                emp != null
                        ? emp.getRole()
                        : null;


        // Get employee branch ID
        Long branchId =
                emp != null
                        ? emp.getBranchId()
                        : null;


        // Branch name will be found using branch ID
        String branchName = null;


        // If branch ID exists, find the branch name
        if (branchId != null) {

            branchName =
                    branchRepository
                            .findById(branchId)
                            .map(Branch::getBranchName)
                            .orElse(null);
        }


        // Get check-in and check-out times
        LocalTime checkIn =
                attendance.getCheckIn();

        LocalTime checkOut =
                attendance.getCheckOut();


        // Calculate total working hours
        Double workingHours =
                AttendanceResponse.calculateWorkingHours(
                        checkIn,
                        checkOut);


        // Convert working hours into a readable format
        String workingHoursFormatted =
                AttendanceResponse.formatWorkingHours(
                        checkIn,
                        checkOut);


        // Build the response object
        return AttendanceResponse.builder()
                .id(attendance.getId())
                .employeeId(
                        emp != null
                                ? emp.getId()
                                : null)
                .employeeName(name)
                .employeeRole(role)
                .branchId(branchId)
                .branchName(branchName)
                .date(attendance.getDate())
                .checkIn(checkIn)
                .checkOut(checkOut)

                // If status is null, use PRESENT
                .attendanceStatus(
                        attendance.getAttendanceStatus() != null
                                ? attendance
                                    .getAttendanceStatus()
                                    .name()
                                : "PRESENT")

                .workingHours(workingHours)
                .workingHoursFormatted(
                        workingHoursFormatted)
                .createdAt(
                        attendance.getCreatedAt())
                .build();
    }
}
