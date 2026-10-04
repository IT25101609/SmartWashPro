package com.smartwashpro.model.enums;

public enum BreakdownSeverity {
    LOW,
    MEDIUM,
    HIGH,
    CRITICAL;

    public static BreakdownSeverity fromString(String val) {
        if (val == null) return MEDIUM;
        String n = val.trim().toUpperCase();
        if ("URGENT".equals(n)) return CRITICAL;
        try {
            return BreakdownSeverity.valueOf(n);
        } catch (IllegalArgumentException e) {
            return MEDIUM;
        }
    }
}
