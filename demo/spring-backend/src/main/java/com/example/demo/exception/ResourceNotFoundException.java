package com.example.demo.exception;

/**
 * Resource Not Found Exception
 * 
 * Demonstrates patterns that Drift can detect:
 * - Custom exception hierarchy
 * - RuntimeException extension pattern
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }

    public ResourceNotFoundException(String resourceType, Long id) {
        super(String.format("%s not found with id: %d", resourceType, id));
    }
}
