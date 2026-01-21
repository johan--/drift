package com.example.demo.service;

import com.example.demo.dto.CreateUserRequest;
import com.example.demo.dto.UserResponse;
import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * User Service
 * 
 * Demonstrates patterns that Drift can detect:
 * - @Service stereotype
 * - @Transactional for transaction management
 * - Constructor injection (DI pattern)
 * - Logger usage patterns
 * - DTO mapping patterns
 */
@Service
public class UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<UserResponse> findAll() {
        logger.debug("Finding all users");
        return userRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public Optional<UserResponse> findById(Long id) {
        logger.debug("Finding user by id: {}", id);
        return userRepository.findById(id)
                .map(this::toResponse);
    }

    @Transactional
    public UserResponse create(CreateUserRequest request) {
        logger.info("Creating user with email: {}", request.email());
        
        User user = new User();
        user.setEmail(request.email());
        user.setName(request.name());
        
        User saved = userRepository.save(user);
        logger.info("Created user with id: {}", saved.getId());
        
        return toResponse(saved);
    }

    @Transactional
    public Optional<UserResponse> update(Long id, CreateUserRequest request) {
        logger.info("Updating user with id: {}", id);
        
        return userRepository.findById(id)
                .map(user -> {
                    user.setEmail(request.email());
                    user.setName(request.name());
                    return toResponse(userRepository.save(user));
                });
    }

    @Transactional
    public void delete(Long id) {
        logger.info("Deleting user with id: {}", id);
        userRepository.deleteById(id);
    }

    private UserResponse toResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getCreatedAt()
        );
    }
}
