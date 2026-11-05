package com.example.wedding.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AdminAuthService {
    private final String configuredPassword;
    private final Map<String, Instant> sessions = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();

    public AdminAuthService(@Value("${app.admin.password:change-me-now}") String configuredPassword) {
        this.configuredPassword = configuredPassword;
    }

    public String login(String password) {
        if (password == null || !constantTimeEquals(configuredPassword, password)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Incorrect organizer password");
        }
        byte[] bytes = new byte[32]; random.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        sessions.put(token, Instant.now().plusSeconds(12 * 60 * 60));
        return token;
    }

    public boolean isValid(String token) {
        if (token == null) return false;
        Instant expiry = sessions.get(token);
        if (expiry == null) return false;
        if (expiry.isBefore(Instant.now())) { sessions.remove(token); return false; }
        return true;
    }

    public void logout(String token) { if (token != null) sessions.remove(token); }

    private boolean constantTimeEquals(String a, String b) {
        return java.security.MessageDigest.isEqual(a.getBytes(java.nio.charset.StandardCharsets.UTF_8), b.getBytes(java.nio.charset.StandardCharsets.UTF_8));
    }
}
