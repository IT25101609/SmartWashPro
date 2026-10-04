package com.smartwashpro.dto.response;
import java.time.LocalDateTime;

public class OrderStatusHistoryResponse {
    private Long id;
    private String oldStatus;
    private String newStatus;
    private String changedBy;
    private String remarks;
    private LocalDateTime changedAt;
    public OrderStatusHistoryResponse() {}

    public OrderStatusHistoryResponse(Long id, String oldStatus, String newStatus, String changedBy, String remarks, LocalDateTime changedAt) {
        this.id = id;
        this.oldStatus = oldStatus;
        this.newStatus = newStatus;
        this.changedBy = changedBy;
        this.remarks = remarks;
        this.changedAt = changedAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getOldStatus() { return oldStatus; }
    public void setOldStatus(String oldStatus) { this.oldStatus = oldStatus; }

    public String getNewStatus() { return newStatus; }
    public void setNewStatus(String newStatus) { this.newStatus = newStatus; }

    public String getChangedBy() { return changedBy; }
    public void setChangedBy(String changedBy) { this.changedBy = changedBy; }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }

    public LocalDateTime getChangedAt() { return changedAt; }
    public void setChangedAt(LocalDateTime changedAt) { this.changedAt = changedAt; }


    public static Builder builder() { return new Builder(); }
    public static class Builder {
        private Long id;
        private String oldStatus;
        private String newStatus;
        private String changedBy;
        private String remarks;
        private LocalDateTime changedAt;
        public Builder id(Long id) { this.id = id; return this; }
        public Builder oldStatus(String oldStatus) { this.oldStatus = oldStatus; return this; }
        public Builder newStatus(String newStatus) { this.newStatus = newStatus; return this; }
        public Builder changedBy(String changedBy) { this.changedBy = changedBy; return this; }
        public Builder remarks(String remarks) { this.remarks = remarks; return this; }
        public Builder changedAt(LocalDateTime changedAt) { this.changedAt = changedAt; return this; }
        public OrderStatusHistoryResponse build() {
            OrderStatusHistoryResponse instance = new OrderStatusHistoryResponse();
            instance.id = this.id;
            instance.oldStatus = this.oldStatus;
            instance.newStatus = this.newStatus;
            instance.changedBy = this.changedBy;
            instance.remarks = this.remarks;
            instance.changedAt = this.changedAt;
            return instance;
        }
    }

}
