package com.smartwashpro.dto.response;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class ReportDataResponse {
    private String reportType;
    private String title;
    private String description;
    private Map<String, Object> filters;
    private Map<String, Object> summary;
    private List<Map<String, Object>> chartData;
    private List<Map<String, String>> columns;
    private List<Map<String, Object>> records;
    private int totalRecords;
    private LocalDateTime generatedAt;

    public ReportDataResponse() {
        this.generatedAt = LocalDateTime.now();
    }

    public String getReportType() { return reportType; }
    public void setReportType(String reportType) { this.reportType = reportType; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Map<String, Object> getFilters() { return filters; }
    public void setFilters(Map<String, Object> filters) { this.filters = filters; }

    public Map<String, Object> getSummary() { return summary; }
    public void setSummary(Map<String, Object> summary) { this.summary = summary; }

    public List<Map<String, Object>> getChartData() { return chartData; }
    public void setChartData(List<Map<String, Object>> chartData) { this.chartData = chartData; }

    public List<Map<String, String>> getColumns() { return columns; }
    public void setColumns(List<Map<String, String>> columns) { this.columns = columns; }

    public List<Map<String, Object>> getRecords() { return records; }
    public void setRecords(List<Map<String, Object>> records) { 
        this.records = records; 
        this.totalRecords = records != null ? records.size() : 0;
    }

    public int getTotalRecords() { return totalRecords; }
    public void setTotalRecords(int totalRecords) { this.totalRecords = totalRecords; }

    public LocalDateTime getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(LocalDateTime generatedAt) { this.generatedAt = generatedAt; }
}
