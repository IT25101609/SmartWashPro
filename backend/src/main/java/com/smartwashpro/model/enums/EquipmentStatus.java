package com.smartwashpro.model.enums;

public enum EquipmentStatus {
    ACTIVE,
    MAINTENANCE,
    UNDER_MAINTENANCE,
    BROKEN,
    INACTIVE,
    RETIRED;

    public static EquipmentStatus fromString(String val) {
        if (val == null) return ACTIVE;
        String s = val.trim().toUpperCase();
        if (s.equals("MAINTENANCE") || s.equals("UNDER_MAINTENANCE")) return MAINTENANCE;
        if (s.equals("INACTIVE") || s.equals("RETIRED")) return INACTIVE;
        if (s.equals("BROKEN")) return BROKEN;
        if (s.equals("ACTIVE")) return ACTIVE;
        try {
            return EquipmentStatus.valueOf(s);
        } catch (Exception e) {
            return ACTIVE;
        }
    }
}
