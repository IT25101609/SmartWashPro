package com.smartwashpro.repository;

import com.smartwashpro.model.Attendance;
import com.smartwashpro.model.enums.AttendanceStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    Optional<Attendance> findByEmployeeIdAndDate(Long employeeId, LocalDate date);
    Page<Attendance> findByEmployeeId(Long employeeId, Pageable pageable);
    List<Attendance> findByDate(LocalDate date);
    long countByEmployeeId(Long employeeId);

    @Query("SELECT a FROM Attendance a WHERE " +
           "(:branchId IS NULL OR a.employee.branchId = :branchId) AND " +
           "(:employeeId IS NULL OR a.employee.id = :employeeId) AND " +
           "(:date IS NULL OR a.date = :date) AND " +
           "(:startDate IS NULL OR a.date >= :startDate) AND " +
           "(:endDate IS NULL OR a.date <= :endDate) AND " +
           "(:status IS NULL OR a.attendanceStatus = :status) AND " +
           "(:search IS NULL OR :search = '' OR " +
           " LOWER(a.employee.user.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(a.employee.user.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " a.employee.user.phoneNumber LIKE CONCAT('%', :search, '%')) " +
           "ORDER BY a.date DESC, a.id DESC")
    Page<Attendance> filterAttendance(
            @Param("branchId") Long branchId,
            @Param("employeeId") Long employeeId,
            @Param("date") LocalDate date,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("status") AttendanceStatus status,
            @Param("search") String search,
            Pageable pageable);

    default Page<Attendance> filterAttendance(Long branchId, Long employeeId, LocalDate date, AttendanceStatus status, Pageable pageable) {
        return filterAttendance(branchId, employeeId, date, null, null, status, null, pageable);
    }
}
