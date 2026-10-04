package com.smartwashpro.repository;

import com.smartwashpro.model.Supplier;
import com.smartwashpro.model.enums.SupplierStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SupplierRepository extends JpaRepository<Supplier, Long> {
    List<Supplier> findByStatusOrderBySupplierNameAsc(SupplierStatus status);

    boolean existsBySupplierName(String supplierName);
    boolean existsBySupplierNameAndIdNot(String supplierName, Long id);

    @Query("SELECT s FROM Supplier s WHERE " +
           "(:status IS NULL OR s.status = :status) AND " +
           "(:search IS NULL OR :search = '' OR " +
           " LOWER(s.supplierName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(s.contactPerson) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(s.phone) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(s.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(s.address) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Supplier> filterSuppliers(
            @Param("search") String search,
            @Param("status") SupplierStatus status,
            Pageable pageable);
}
