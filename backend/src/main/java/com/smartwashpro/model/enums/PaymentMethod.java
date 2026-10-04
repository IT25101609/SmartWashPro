package com.smartwashpro.model.enums;

public enum PaymentMethod { 
    CASH, 
    CARD, 
    ONLINE_PAYMENT, 
    DIGITAL_PAYMENT, 
    CASH_ON_DELIVERY;

    public static PaymentMethod fromString(String val) {
        if (val == null) return CASH;
        String upper = val.toUpperCase().trim();
        for (PaymentMethod m : values()) {
            if (m.name().equals(upper)) return m;
        }
        if (upper.equals("ONLINE") || upper.equals("DIGITAL")) return ONLINE_PAYMENT;
        return CASH;
    }
}
