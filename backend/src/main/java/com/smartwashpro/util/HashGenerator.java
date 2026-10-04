package com.smartwashpro.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class HashGenerator {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String password = "SmartWash2026!";
        String hash = encoder.encode(password);
        System.out.println("BCRYPT_HASH:" + hash);
    }
}
