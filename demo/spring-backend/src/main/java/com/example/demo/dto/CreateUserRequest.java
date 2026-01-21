package com.example.demo.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Create User Request DTO (Java Record)
 * 
 * Demonstrates patterns that Drift can detect:
 * - Java Record for immutable DTOs
 * - Bean Validation annotations (@NotBlank, @Email, @Size)
 * - Request body structure
 */
public record CreateUserRequest(
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        String email,

        @NotBlank(message = "Name is required")
        @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
        String name
) {}
