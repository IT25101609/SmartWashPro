package com.smartwashpro.repository;

import com.smartwashpro.model.LaundryService;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface LaundryServiceRepository extends JpaRepository<LaundryService, Long> {
    List<LaundryService> findByAvailableTrue();
    boolean existsByServiceName(String serviceName);
}
