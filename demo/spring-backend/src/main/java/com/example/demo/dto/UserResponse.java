package com.example.demo.dto;

import java.time.LocalDateTime;

/**
 * User Response DTO (Java Record)
 * 
 * Demonstrates patterns that Drift can detect:
 * - Java Record for immutable DTOs
 * - Response body structure
 */
public record UserResponse(
        Long id,
        String email,
        String name,
        LocalDateTime createdAt
) {}
