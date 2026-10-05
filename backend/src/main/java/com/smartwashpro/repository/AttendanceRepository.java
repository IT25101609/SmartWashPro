package com.smartwashpro.repository;

// Attendance entity that this repository manages
import com.smartwashpro.model.Attendance;

// Enum used to represent attendance status
import com.smartwashpro.model.enums.AttendanceStatus;

// Spring Data pagination classes
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

// Used to write custom JPQL queries
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

// Marks this interface as a Spring repository
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;


// @Repository tells Spring that this is a database repository
@Repository

// JpaRepository provides ready-made CRUD operations
// for the Attendance entity using Long as the ID type
public interface AttendanceRepository
        extends JpaRepository<Attendance, Long> {


    // Find attendance of a specific employee on a specific date
    // Returns Optional because a record may or may not exist
    Optional<Attendance> findByEmployeeIdAndDate(
            Long employeeId,
            LocalDate date);


    // Find all attendance records for an employee
    // Pageable allows pagination, sorting, and page size
    Page<Attendance> findByEmployeeId(
            Long employeeId,
            Pageable pageable);


    // Find all attendance records for a specific date
    List<Attendance> findByDate(LocalDate date);


    // Count the total number of attendance records
    // belonging to a specific employee
    long countByEmployeeId(Long employeeId);


    // Custom JPQL query for filtering attendance records
    // based on different optional search/filter values
    @Query("SELECT a FROM Attendance a WHERE " +

           // Filter by branch if branchId is provided
           "(:branchId IS NULL OR a.employee.branchId = :branchId) AND " +

           // Filter by employee if employeeId is provided
           "(:employeeId IS NULL OR a.employee.id = :employeeId) AND " +

           // Filter by an exact date if date is provided
           "(:date IS NULL OR a.date = :date) AND " +

           // Filter from a starting date
           "(:startDate IS NULL OR a.date >= :startDate) AND " +

           // Filter until an ending date
           "(:endDate IS NULL OR a.date <= :endDate) AND " +

           // Filter by attendance status
           "(:status IS NULL OR a.attendanceStatus = :status) AND " +

           // Search by employee name, email, or phone number
           "(:search IS NULL OR :search = '' OR " +

           // Search employee's full name
           " LOWER(a.employee.user.fullName) LIKE " +
           "LOWER(CONCAT('%', :search, '%')) OR " +

           // Search employee's email
           " LOWER(a.employee.user.email) LIKE " +
           "LOWER(CONCAT('%', :search, '%')) OR " +

           // Search employee's phone number
           " a.employee.user.phoneNumber LIKE " +
           "CONCAT('%', :search, '%')) " +

           // Show newest attendance records first
           "ORDER BY a.date DESC, a.id DESC")


    // Method that executes the custom filter query
    // @Param connects Java parameters with query parameters
    Page<Attendance> filterAttendance(

            @Param("branchId")
            Long branchId,

            @Param("employeeId")
            Long employeeId,

            @Param("date")
            LocalDate date,

            @Param("startDate")
            LocalDate startDate,

            @Param("endDate")
            LocalDate endDate,

            @Param("status")
            AttendanceStatus status,

            @Param("search")
            String search,

            // Controls pagination and sorting
            Pageable pageable
    );


    // A simplified version of filterAttendance()
    // Used when we only need branch, employee, date and status filters
    default Page<Attendance> filterAttendance(
            Long branchId,
            Long employeeId,
            LocalDate date,
            AttendanceStatus status,
            Pageable pageable) {

        // Calls the main filter method
        // startDate, endDate and search are not required here,
        // so they are passed as null
        return filterAttendance(
                branchId,
                employeeId,
                date,
                null,
                null,
                status,
                null,
                pageable
        );
    }
}
