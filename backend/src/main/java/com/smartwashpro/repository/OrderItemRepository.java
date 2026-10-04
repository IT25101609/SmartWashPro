package com.smartwashpro.repository;

import com.smartwashpro.model.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    List<OrderItem> findByOrderId(Long orderId);
    
    @Query("SELECT oi.serviceName, COUNT(oi) as cnt FROM OrderItem oi GROUP BY oi.serviceName ORDER BY cnt DESC")
    List<Object[]> getPopularServices();
}
