package com.example.demo.repository;

import com.example.demo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * User Repository
 * 
 * Demonstrates patterns that Drift can detect:
 * - @Repository stereotype
 * - JpaRepository extension (Spring Data pattern)
 * - @Query for custom queries
 * - Method naming conventions for derived queries
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Find user by email (derived query)
     */
    Optional<User> findByEmail(String email);

    /**
     * Find users by name containing (derived query)
     */
    List<User> findByNameContainingIgnoreCase(String name);

    /**
     * Custom JPQL query
     */
    @Query("SELECT u FROM User u WHERE u.email LIKE %:domain")
    List<User> findByEmailDomain(@Param("domain") String domain);

    /**
     * Check if email exists (derived query)
     */
    boolean existsByEmail(String email);
}
