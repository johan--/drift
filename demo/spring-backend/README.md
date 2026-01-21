# Spring Boot Demo

This is a sample Spring Boot application demonstrating patterns that Drift can detect.

## Patterns Demonstrated

### Structural Patterns
- `@SpringBootApplication` - Main application class
- `@RestController`, `@Service`, `@Repository` - Stereotype annotations
- `@Configuration` - Configuration classes

### API Patterns
- `@GetMapping`, `@PostMapping`, `@PutMapping`, `@DeleteMapping` - HTTP method mappings
- `@RequestMapping` - Base path configuration
- `@PathVariable`, `@RequestBody`, `@RequestParam` - Parameter binding
- `@Valid` - Request validation

### Auth/Security Patterns
- `@PreAuthorize` - Method-level security
- `@EnableWebSecurity`, `@EnableMethodSecurity` - Security configuration
- Security filter chain configuration

### Data Access Patterns
- `@Entity`, `@Table`, `@Column` - JPA entity mapping
- `@Repository` with `JpaRepository` - Spring Data repositories
- `@Query` - Custom JPQL queries
- `@Transactional` - Transaction management

### Validation Patterns
- `@NotBlank`, `@Email`, `@Size` - Bean Validation annotations
- Java Records for DTOs

### Error Handling Patterns
- `@RestControllerAdvice` - Global exception handling
- `@ExceptionHandler` - Specific exception handlers
- Custom exception hierarchy

### Logging Patterns
- SLF4J Logger usage
- Structured logging with placeholders

### Testing Patterns
- `@ExtendWith(MockitoExtension.class)` - JUnit 5 + Mockito
- `@Mock`, `@InjectMocks` - Mockito annotations
- `@Test`, `@DisplayName`, `@BeforeEach` - JUnit 5 annotations
- AssertJ assertions

### DI Patterns
- Constructor injection
- `@Bean` for bean definitions
- `@Autowired` (implicit via constructor)

### Async Patterns
- `@EnableAsync` - Async support
- `@EnableScheduling` - Scheduled tasks

## Running Drift Scan

```bash
cd drift/demo/spring-backend
drift scan
```

## Expected Detections

Drift should detect patterns in these categories:
- `structural` - Component stereotypes, file organization
- `api` - REST endpoints, HTTP methods
- `auth` - Security annotations, authorization
- `data-access` - JPA entities, repositories, transactions
- `validation` - Bean validation annotations
- `errors` - Exception handling patterns
- `logging` - Logger usage patterns
- `testing` - Test structure, mocking patterns
- `config` - Configuration classes, beans
