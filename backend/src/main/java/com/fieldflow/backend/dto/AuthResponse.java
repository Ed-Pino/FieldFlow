package com.fieldflow.backend.dto;

public record AuthResponse(
        String token,
        String username,
        String role) {
}