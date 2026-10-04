package script;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.Map;

public class AppendRepos {
    public static void main(String[] args) throws Exception {
        String basePath = "c:/Users/pc/Desktop/Smartwash Pro/backend/src/main/java/com/smartwashpro/repository/";
        Map<String, String> appends = Map.ofEntries(
            Map.entry("CustomerRepository.java", 
                "    @org.springframework.data.jpa.repository.Query(\"SELECT c FROM Customer c JOIN c.user u WHERE LOWER(u.fullName) LIKE LOWER(CONCAT('%',:q,'%')) OR LOWER(u.email) LIKE LOWER(CONCAT('%',:q,'%'))\")\n" +
                "    org.springframework.data.domain.Page<com.smartwashpro.model.Customer> searchCustomers(@org.springframework.data.repository.query.Param(\"q\") String query, org.springframework.data.domain.Pageable pageable);\n" +
                "    java.util.Optional<com.smartwashpro.model.Customer> findByUserId(Long userId);\n"),
            Map.entry("EmployeeRepository.java", 
                "    @org.springframework.data.jpa.repository.Query(\"SELECT e FROM Employee e JOIN e.user u WHERE LOWER(u.fullName) LIKE LOWER(CONCAT('%',:q,'%'))\")\n" +
                "    org.springframework.data.domain.Page<com.smartwashpro.model.Employee> searchEmployees(@org.springframework.data.repository.query.Param(\"q\") String query, org.springframework.data.domain.Pageable pageable);\n" +
                "    java.util.Optional<com.smartwashpro.model.Employee> findByUserId(Long userId);\n" +
                "    org.springframework.data.domain.Page<com.smartwashpro.model.Employee> findAll(org.springframework.data.domain.Pageable pageable);\n"),
            Map.entry("InventoryRepository.java", 
                "    @org.springframework.data.jpa.repository.Query(\"SELECT i FROM Inventory i WHERE LOWER(i.itemName) LIKE LOWER(CONCAT('%',:q,'%'))\")\n" +
                "    org.springframework.data.domain.Page<com.smartwashpro.model.Inventory> searchByName(@org.springframework.data.repository.query.Param(\"q\") String query, org.springframework.data.domain.Pageable pageable);\n" +
                "    @org.springframework.data.jpa.repository.Query(\"SELECT i FROM Inventory i WHERE i.quantity <= i.minimumStockLevel\")\n" +
                "    java.util.List<com.smartwashpro.model.Inventory> findLowStockItems();\n"),
            Map.entry("NotificationRepository.java", 
                "    org.springframework.data.domain.Page<com.smartwashpro.model.Notification> findByUserIdOrderByCreatedAtDesc(Long userId, org.springframework.data.domain.Pageable pageable);\n" +
                "    long countByUserIdAndIsReadFalse(Long userId);\n" +
                "    @org.springframework.data.jpa.repository.Modifying @org.springframework.data.jpa.repository.Query(\"UPDATE Notification n SET n.isRead = true WHERE n.user.id = :userId\")\n" +
                "    void markAllAsRead(@org.springframework.data.repository.query.Param(\"userId\") Long userId);\n"),
            Map.entry("MaintenanceRepository.java", 
                "    java.util.List<com.smartwashpro.model.Maintenance> findByEquipmentIdOrderByScheduledDateDesc(Long equipmentId);\n"),
            Map.entry("PaymentRepository.java", 
                "    java.util.Optional<com.smartwashpro.model.Payment> findByOrderId(Long orderId);\n"),
            Map.entry("PickupRepository.java", 
                "    org.springframework.data.domain.Page<com.smartwashpro.model.Pickup> findByDriverId(Long driverId, org.springframework.data.domain.Pageable pageable);\n" +
                "    java.util.List<com.smartwashpro.model.Pickup> findByCustomerId(Long customerId);\n"),
            Map.entry("DeliveryRepository.java", 
                "    org.springframework.data.domain.Page<com.smartwashpro.model.Delivery> findByDriverId(Long driverId, org.springframework.data.domain.Pageable pageable);\n"),
            Map.entry("StockTransactionRepository.java", 
                "    org.springframework.data.domain.Page<com.smartwashpro.model.StockTransaction> findByInventoryIdOrderByCreatedAtDesc(Long inventoryId, org.springframework.data.domain.Pageable pageable);\n"),
            Map.entry("EmployeeTaskRepository.java", 
                "    org.springframework.data.domain.Page<com.smartwashpro.model.EmployeeTask> findByEmployeeId(Long employeeId, org.springframework.data.domain.Pageable pageable);\n"),
            Map.entry("FeedbackRepository.java", 
                "    org.springframework.data.domain.Page<com.smartwashpro.model.Feedback> findByCustomerId(Long customerId, org.springframework.data.domain.Pageable pageable);\n"),
            Map.entry("ComplaintRepository.java", 
                "    org.springframework.data.domain.Page<com.smartwashpro.model.Complaint> findByCustomerId(Long customerId, org.springframework.data.domain.Pageable pageable);\n")
        );

        for (Map.Entry<String, String> entry : appends.entrySet()) {
            Path file = Paths.get(basePath + entry.getKey());
            if (Files.exists(file)) {
                String content = Files.readString(file);
                // check if it already has one of the keywords
                if (entry.getKey().equals("CustomerRepository.java") && content.contains("findByUserId")) continue;
                if (entry.getKey().equals("EmployeeRepository.java") && content.contains("findByUserId")) continue;
                if (entry.getKey().equals("InventoryRepository.java") && content.contains("findLowStockItems")) continue;
                if (entry.getKey().equals("NotificationRepository.java") && content.contains("markAllAsRead")) continue;
                if (entry.getKey().equals("MaintenanceRepository.java") && content.contains("findByEquipmentIdOrderByScheduledDateDesc")) continue;
                if (entry.getKey().equals("PaymentRepository.java") && content.contains("findByOrderId")) continue;
                if (entry.getKey().equals("PickupRepository.java") && content.contains("findByDriverId")) continue;
                if (entry.getKey().equals("DeliveryRepository.java") && content.contains("findByDriverId")) continue;
                if (entry.getKey().equals("StockTransactionRepository.java") && content.contains("findByInventoryIdOrderByCreatedAtDesc")) continue;
                if (entry.getKey().equals("EmployeeTaskRepository.java") && content.contains("findByEmployeeId")) continue;
                if (entry.getKey().equals("FeedbackRepository.java") && content.contains("findByCustomerId")) continue;
                if (entry.getKey().equals("ComplaintRepository.java") && content.contains("findByCustomerId")) continue;

                int lastBrace = content.lastIndexOf("}");
                if (lastBrace != -1) {
                    String newContent = content.substring(0, lastBrace) + "\n" + entry.getValue() + "\n}\n";
                    Files.writeString(file, newContent, StandardOpenOption.TRUNCATE_EXISTING);
                }
            }
        }
    }
}
