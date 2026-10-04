package com.smartwashpro.model.enums;

public enum BreakdownStatus {
    REPORTED,
    IN_PROGRESS,
    IN_REPAIR,
    REPAIRED,
    CLOSED,
    SCRAPPED;

    public static BreakdownStatus fromString(String value) {
        if (value == null) return REPORTED;
        String normalized = value.trim().toUpperCase().replace(" ", "_");
        if ("IN_REPAIR".equals(normalized)) return IN_PROGRESS;
        try {
            return BreakdownStatus.valueOf(normalized);
        } catch (IllegalArgumentException e) {
            return REPORTED;
        }
    }
}
