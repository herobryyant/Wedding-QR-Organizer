package com.example.wedding.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.server.ResponseStatusException;

@Component
public class AdminAuthInterceptor implements HandlerInterceptor {
    private final AdminAuthService auth;
    public AdminAuthInterceptor(AdminAuthService auth) { this.auth = auth; }

    @Override public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String header = request.getHeader("Authorization");
        String token = header != null && header.startsWith("Bearer ") ? header.substring(7) : null;
        if (!auth.isValid(token)) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Organizer session expired. Please sign in again.");
        return true;
    }
}
