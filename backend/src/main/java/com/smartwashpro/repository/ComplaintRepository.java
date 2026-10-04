package com.smartwashpro.repository;

import com.smartwashpro.model.Complaint;
import com.smartwashpro.model.enums.ComplaintStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, Long>, JpaSpecificationExecutor<Complaint> {
    Page<Complaint> findByCustomerId(Long customerId, Pageable pageable);
    Page<Complaint> findByStatus(ComplaintStatus status, Pageable pageable);
    List<Complaint> findByCustomerId(Long customerId);
    List<Complaint> findByOrderId(Long orderId);
    long countByStatus(ComplaintStatus status);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(c) FROM Complaint c WHERE c.status IN (com.smartwashpro.model.enums.ComplaintStatus.OPEN, com.smartwashpro.model.enums.ComplaintStatus.IN_PROGRESS)")
    long countOpenComplaints();
}
