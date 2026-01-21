package com.example.demo.service;

import com.example.demo.dto.CreateUserRequest;
import com.example.demo.dto.UserResponse;
import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * User Service Tests
 * 
 * Demonstrates patterns that Drift can detect:
 * - @ExtendWith for JUnit 5 extensions
 * - @Mock and @InjectMocks for Mockito
 * - @BeforeEach for test setup
 * - @Test and @DisplayName for test methods
 * - AssertJ assertions
 * - Mockito stubbing patterns
 */
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
        testUser.setName("Test User");
    }

    @Test
    @DisplayName("Should return all users")
    void findAll_ShouldReturnAllUsers() {
        // Given
        when(userRepository.findAll()).thenReturn(List.of(testUser));

        // When
        List<UserResponse> result = userService.findAll();

        // Then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).email()).isEqualTo("test@example.com");
        verify(userRepository).findAll();
    }

    @Test
    @DisplayName("Should return user by id when exists")
    void findById_WhenUserExists_ShouldReturnUser() {
        // Given
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        // When
        Optional<UserResponse> result = userService.findById(1L);

        // Then
        assertThat(result).isPresent();
        assertThat(result.get().email()).isEqualTo("test@example.com");
        verify(userRepository).findById(1L);
    }

    @Test
    @DisplayName("Should return empty when user not found")
    void findById_WhenUserNotExists_ShouldReturnEmpty() {
        // Given
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        // When
        Optional<UserResponse> result = userService.findById(999L);

        // Then
        assertThat(result).isEmpty();
        verify(userRepository).findById(999L);
    }

    @Test
    @DisplayName("Should create new user")
    void create_ShouldCreateAndReturnUser() {
        // Given
        CreateUserRequest request = new CreateUserRequest("new@example.com", "New User");
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // When
        UserResponse result = userService.create(request);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.email()).isEqualTo("test@example.com");
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("Should delete user by id")
    void delete_ShouldDeleteUser() {
        // Given
        doNothing().when(userRepository).deleteById(1L);

        // When
        userService.delete(1L);

        // Then
        verify(userRepository).deleteById(1L);
    }
}
