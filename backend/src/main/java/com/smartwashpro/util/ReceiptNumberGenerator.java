package com.smartwashpro.util;

import org.springframework.stereotype.Component;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Component
public class ReceiptNumberGenerator {
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    public static String generateReceiptNumber() {
        String datePart = LocalDateTime.now().format(FORMATTER);
        String uuidSuffix = UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        return "RCP-" + datePart + "-" + uuidSuffix;
    }

    public String generate() {
        return generateReceiptNumber();
    }
}
