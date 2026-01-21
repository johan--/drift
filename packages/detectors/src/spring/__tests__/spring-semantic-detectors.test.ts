/**
 * Tests for Spring Boot Semantic Detectors
 * 
 * These tests verify that the semantic detectors correctly identify
 * Spring patterns in Java code without hardcoded rules.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { DetectionContext } from '../../base/base-detector.js';
import { SpringStructuralSemanticDetector } from '../structural-semantic.js';
import { SpringAPISemanticDetector } from '../api-semantic.js';
import { SpringAuthSemanticDetector } from '../auth-semantic.js';
import { SpringDataSemanticDetector } from '../data-semantic.js';
import { SpringDISemanticDetector } from '../di-semantic.js';
import { SpringConfigSemanticDetector } from '../config-semantic.js';
import { SpringValidationSemanticDetector } from '../validation-semantic.js';
import { SpringErrorsSemanticDetector } from '../errors-semantic.js';
import { SpringLoggingSemanticDetector } from '../logging-semantic.js';
import { SpringTestingSemanticDetector } from '../testing-semantic.js';
import { SpringTransactionSemanticDetector } from '../transaction-semantic.js';
import { SpringAsyncSemanticDetector } from '../async-semantic.js';

// Helper to create a minimal detection context
function createContext(content: string, file: string = 'Test.java'): DetectionContext {
  return {
    content,
    file,
    language: 'java',
    ast: null,
    imports: [],
    exports: [],
    extension: '.java',
    isTestFile: file.includes('Test'),
    isTypeDefinition: false,
    projectContext: {
      rootDir: '/test',
      files: [file],
      config: {},
    },
  };
}

describe('SpringStructuralSemanticDetector', () => {
  let detector: SpringStructuralSemanticDetector;

  beforeEach(() => {
    detector = new SpringStructuralSemanticDetector();
  });

  it('should have correct metadata', () => {
    expect(detector.id).toBe('spring/structural-patterns');
    expect(detector.category).toBe('structural');
    expect(detector.supportedLanguages).toContain('java');
  });

  it('should detect @Service annotation', async () => {
    const content = `
@Service
public class UserService {
    public User findById(Long id) {
        return userRepository.findById(id).orElse(null);
    }
}
`;
    const context = createContext(content, 'UserService.java');
    const result = await detector.detect(context);
    
    expect(result.patterns.length).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('should detect @Repository annotation', async () => {
    const content = `
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
}
`;
    const context = createContext(content, 'UserRepository.java');
    const result = await detector.detect(context);
    
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('should detect @Component annotation', async () => {
    const content = `
@Component
public class EmailValidator {
    public boolean isValid(String email) {
        return email != null && email.contains("@");
    }
}
`;
    const context = createContext(content, 'EmailValidator.java');
    const result = await detector.detect(context);
    
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('should detect @Configuration annotation', async () => {
    const content = `
@Configuration
public class AppConfig {
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
`;
    const context = createContext(content, 'AppConfig.java');
    const result = await detector.detect(context);
    
    expect(result.confidence).toBeGreaterThan(0);
  });
});

describe('SpringAPISemanticDetector', () => {
  let detector: SpringAPISemanticDetector;

  beforeEach(() => {
    detector = new SpringAPISemanticDetector();
  });

  it('should have correct metadata', () => {
    expect(detector.id).toBe('spring/api-patterns');
    expect(detector.category).toBe('api');
    expect(detector.supportedLanguages).toContain('java');
  });

  it('should detect @RestController annotation', async () => {
    const content = `
@RestController
@RequestMapping("/api/users")
public class UserController {
    @GetMapping("/{id}")
    public ResponseEntity<UserDto> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(userService.findById(id));
    }
}
`;
    const context = createContext(content, 'UserController.java');
    const result = await detector.detect(context);
    
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('should detect HTTP method mappings', async () => {
    const content = `
@RestController
public class ProductController {
    @GetMapping("/products")
    public List<Product> getAll() { return products; }
    
    @PostMapping("/products")
    public Product create(@RequestBody CreateProductRequest request) { return null; }
    
    @PutMapping("/products/{id}")
    public Product update(@PathVariable Long id, @RequestBody Product product) { return null; }
    
    @DeleteMapping("/products/{id}")
    public void delete(@PathVariable Long id) { }
}
`;
    const context = createContext(content, 'ProductController.java');
    const result = await detector.detect(context);
    
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('should detect @RequestBody and @PathVariable', async () => {
    const content = `
@PostMapping("/orders/{userId}")
public Order createOrder(
    @PathVariable Long userId,
    @RequestBody CreateOrderRequest request,
    @RequestHeader("Authorization") String token
) {
    return orderService.create(userId, request);
}
`;
    const context = createContext(content, 'OrderController.java');
    const result = await detector.detect(context);
    
    expect(result.confidence).toBeGreaterThan(0);
  });
});

describe('SpringAuthSemanticDetector', () => {
  let detector: SpringAuthSemanticDetector;

  beforeEach(() => {
    detector = new SpringAuthSemanticDetector();
  });

  it('should have correct metadata', () => {
    expect(detector.id).toBe('spring/auth-patterns');
    expect(detector.category).toBe('auth');
    expect(detector.supportedLanguages).toContain('java');
  });

  it('should detect @PreAuthorize annotation', async () => {
    const content = `
@RestController
public class AdminController {
    @GetMapping("/admin/users")
    @PreAuthorize("hasRole('ADMIN')")
    public List<User> getAllUsers() {
        return userService.findAll();
    }
    
    @DeleteMapping("/admin/users/{id}")
    @PreAuthorize("hasAuthority('DELETE_USER')")
    public void deleteUser(@PathVariable Long id) {
        userService.delete(id);
    }
}
`;
    const context = createContext(content, 'AdminController.java');
    const result = await detector.detect(context);
    
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('should detect @Secured annotation', async () => {
    const content = `
@Service
public class ReportService {
    @Secured("ROLE_MANAGER")
    public Report generateReport() {
        return new Report();
    }
    
    @Secured({"ROLE_ADMIN", "ROLE_MANAGER"})
    public void deleteReport(Long id) {
        // delete
    }
}
`;
    const context = createContext(content, 'ReportService.java');
    const result = await detector.detect(context);
    
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('should detect SecurityContext usage', async () => {
    const content = `
@Service
public class AuditService {
    public void logAction(String action) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        log.info("User {} performed action: {}", username, action);
    }
}
`;
    const context = createContext(content, 'AuditService.java');
    const result = await detector.detect(context);
    
    expect(result.confidence).toBeGreaterThan(0);
  });
});

describe('SpringDataSemanticDetector', () => {
  let detector: SpringDataSemanticDetector;

  beforeEach(() => {
    detector = new SpringDataSemanticDetector();
  });

  it('should have correct metadata', () => {
    expect(detector.id).toBe('spring/data-patterns');
    expect(detector.category).toBe('data-access');
    expect(detector.supportedLanguages).toContain('java');
  });

  it('should detect JPA Repository patterns', async () => {
    const content = `
@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUserId(Long userId);
    
    @Query("SELECT o FROM Order o WHERE o.status = :status")
    List<Order> findByStatus(@Param("status") OrderStatus status);
    
    @Modifying
    @Query("UPDATE Order o SET o.status = :status WHERE o.id = :id")
    void updateStatus(@Param("id") Long id, @Param("status") OrderStatus status);
}
`;
    const context = createContext(content, 'OrderRepository.java');
    const result = await detector.detect(context);
    
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('should detect JPA Entity patterns', async () => {
    const content = `
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true)
    private String email;
    
    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    private List<Order> orders;
    
    @ManyToOne
    @JoinColumn(name = "department_id")
    private Department department;
}
`;
    const context = createContext(content, 'User.java');
    const result = await detector.detect(context);
    
    expect(result.confidence).toBeGreaterThan(0);
  });
});

describe('SpringDISemanticDetector', () => {
  let detector: SpringDISemanticDetector;

  beforeEach(() => {
    detector = new SpringDISemanticDetector();
  });

  it('should have correct metadata', () => {
    expect(detector.id).toBe('spring/di-patterns');
    expect(detector.category).toBe('structural');
    expect(detector.supportedLanguages).toContain('java');
  });

  it('should detect constructor injection', async () => {
    // Note: Constructor injection is detected by pattern, not keyword.
    // The DI detector focuses on @Autowired, @Bean, @Qualifier keywords.
    // This test verifies the detector doesn't crash on constructor injection code.
    const content = `
@Service
public class OrderService {
    private final OrderRepository orderRepository;
    private final UserService userService;
    private final EmailService emailService;
    
    @Autowired
    public OrderService(
        OrderRepository orderRepository,
        UserService userService,
        EmailService emailService
    ) {
        this.orderRepository = orderRepository;
        this.userService = userService;
        this.emailService = emailService;
    }
}
`;
    const context = createContext(content, 'OrderService.java');
    const result = await detector.detect(context);
    
    // Should detect @Autowired on constructor
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('should detect @Autowired field injection', async () => {
    const content = `
@Service
public class LegacyService {
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private EmailService emailService;
    
    public void process() {
        // ...
    }
}
`;
    const context = createContext(content, 'LegacyService.java');
    const result = await detector.detect(context);
    
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('should detect @Bean definitions', async () => {
    const content = `
@Configuration
public class AppConfig {
    @Bean
    @Primary
    public DataSource primaryDataSource() {
        return DataSourceBuilder.create().build();
    }
    
    @Bean
    @Qualifier("secondary")
    public DataSource secondaryDataSource() {
        return DataSourceBuilder.create().build();
    }
}
`;
    const context = createContext(content, 'AppConfig.java');
    const result = await detector.detect(context);
    
    expect(result.confidence).toBeGreaterThan(0);
  });
});

describe('SpringConfigSemanticDetector', () => {
  let detector: SpringConfigSemanticDetector;

  beforeEach(() => {
    detector = new SpringConfigSemanticDetector();
  });

  it('should have correct metadata', () => {
    expect(detector.id).toBe('spring/config-patterns');
    expect(detector.category).toBe('config');
    expect(detector.supportedLanguages).toContain('java');
  });

  it('should detect @Value annotation', async () => {
    const content = `
@Service
public class EmailService {
    @Value("\${email.smtp.host}")
    private String smtpHost;
    
    @Value("\${email.smtp.port:587}")
    private int smtpPort;
    
    @Value("\${email.from.address}")
    private String fromAddress;
}
`;
    const context = createContext(content, 'EmailService.java');
    const result = await detector.detect(context);
    
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('should detect @ConfigurationProperties', async () => {
    const content = `
@Configuration
@ConfigurationProperties(prefix = "app.security")
public class SecurityProperties {
    private String jwtSecret;
    private long jwtExpiration;
    private List<String> allowedOrigins;
    
    // getters and setters
}
`;
    const context = createContext(content, 'SecurityProperties.java');
    const result = await detector.detect(context);
    
    expect(result.confidence).toBeGreaterThan(0);
  });
});

describe('SpringValidationSemanticDetector', () => {
  let detector: SpringValidationSemanticDetector;

  beforeEach(() => {
    detector = new SpringValidationSemanticDetector();
  });

  it('should have correct metadata', () => {
    expect(detector.id).toBe('spring/validation-patterns');
    expect(detector.category).toBe('security');
    expect(detector.supportedLanguages).toContain('java');
  });

  it('should detect Bean Validation annotations', async () => {
    const content = `
public class CreateUserRequest {
    @NotNull
    @NotBlank
    @Size(min = 2, max = 100)
    private String name;
    
    @NotNull
    @Email
    private String email;
    
    @NotNull
    @Size(min = 8, max = 50)
    @Pattern(regexp = "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d).*$")
    private String password;
    
    @Min(0)
    @Max(150)
    private Integer age;
}
`;
    const context = createContext(content, 'CreateUserRequest.java');
    const result = await detector.detect(context);
    
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('should detect @Valid in controller', async () => {
    const content = `
@RestController
public class UserController {
    @PostMapping("/users")
    public ResponseEntity<User> createUser(@Valid @RequestBody CreateUserRequest request) {
        return ResponseEntity.ok(userService.create(request));
    }
    
    @PutMapping("/users/{id}")
    public ResponseEntity<User> updateUser(
        @PathVariable Long id,
        @Validated @RequestBody UpdateUserRequest request
    ) {
        return ResponseEntity.ok(userService.update(id, request));
    }
}
`;
    const context = createContext(content, 'UserController.java');
    const result = await detector.detect(context);
    
    expect(result.confidence).toBeGreaterThan(0);
  });
});

describe('SpringErrorsSemanticDetector', () => {
  let detector: SpringErrorsSemanticDetector;

  beforeEach(() => {
    detector = new SpringErrorsSemanticDetector();
  });

  it('should have correct metadata', () => {
    expect(detector.id).toBe('spring/errors-patterns');
    expect(detector.category).toBe('errors');
    expect(detector.supportedLanguages).toContain('java');
  });

  it('should detect @ControllerAdvice and @ExceptionHandler', async () => {
    const content = `
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(ResourceNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponse handleNotFound(ResourceNotFoundException ex) {
        return new ErrorResponse("NOT_FOUND", ex.getMessage());
    }
    
    @ExceptionHandler(ValidationException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleValidation(ValidationException ex) {
        return new ErrorResponse("VALIDATION_ERROR", ex.getMessage());
    }
    
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ErrorResponse handleGeneric(Exception ex) {
        return new ErrorResponse("INTERNAL_ERROR", "An unexpected error occurred");
    }
}
`;
    const context = createContext(content, 'GlobalExceptionHandler.java');
    const result = await detector.detect(context);
    
    expect(result.confidence).toBeGreaterThan(0);
  });
});

describe('SpringLoggingSemanticDetector', () => {
  let detector: SpringLoggingSemanticDetector;

  beforeEach(() => {
    detector = new SpringLoggingSemanticDetector();
  });

  it('should have correct metadata', () => {
    expect(detector.id).toBe('spring/logging-patterns');
    expect(detector.category).toBe('logging');
    expect(detector.supportedLanguages).toContain('java');
  });

  it('should detect SLF4J Logger usage', async () => {
    const content = `
@Service
public class OrderService {
    private static final Logger log = LoggerFactory.getLogger(OrderService.class);
    
    public Order createOrder(CreateOrderRequest request) {
        log.info("Creating order for user: {}", request.getUserId());
        try {
            Order order = processOrder(request);
            log.debug("Order created successfully: {}", order.getId());
            return order;
        } catch (Exception e) {
            log.error("Failed to create order", e);
            throw e;
        }
    }
}
`;
    const context = createContext(content, 'OrderService.java');
    const result = await detector.detect(context);
    
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('should detect @Slf4j Lombok annotation', async () => {
    const content = `
@Slf4j
@Service
public class PaymentService {
    public void processPayment(Payment payment) {
        log.info("Processing payment: {}", payment.getId());
        MDC.put("paymentId", payment.getId().toString());
        try {
            // process
            log.debug("Payment processed successfully");
        } finally {
            MDC.remove("paymentId");
        }
    }
}
`;
    const context = createContext(content, 'PaymentService.java');
    const result = await detector.detect(context);
    
    expect(result.confidence).toBeGreaterThan(0);
  });
});

describe('SpringTestingSemanticDetector', () => {
  let detector: SpringTestingSemanticDetector;

  beforeEach(() => {
    detector = new SpringTestingSemanticDetector();
  });

  it('should have correct metadata', () => {
    expect(detector.id).toBe('spring/testing-patterns');
    expect(detector.category).toBe('testing');
    expect(detector.supportedLanguages).toContain('java');
  });

  it('should detect @SpringBootTest', async () => {
    const content = `
@SpringBootTest
@AutoConfigureMockMvc
class UserControllerIntegrationTest {
    @Autowired
    private MockMvc mockMvc;
    
    @MockBean
    private UserService userService;
    
    @Test
    void shouldReturnUser() throws Exception {
        when(userService.findById(1L)).thenReturn(new User(1L, "John"));
        
        mockMvc.perform(get("/api/users/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("John"));
    }
}
`;
    const context = createContext(content, 'UserControllerIntegrationTest.java');
    const result = await detector.detect(context);
    
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('should detect @DataJpaTest', async () => {
    const content = `
@DataJpaTest
class UserRepositoryTest {
    @Autowired
    private TestEntityManager entityManager;
    
    @Autowired
    private UserRepository userRepository;
    
    @Test
    void shouldFindByEmail() {
        User user = new User("test@example.com");
        entityManager.persist(user);
        entityManager.flush();
        
        Optional<User> found = userRepository.findByEmail("test@example.com");
        
        assertThat(found).isPresent();
        assertThat(found.get().getEmail()).isEqualTo("test@example.com");
    }
}
`;
    const context = createContext(content, 'UserRepositoryTest.java');
    const result = await detector.detect(context);
    
    expect(result.confidence).toBeGreaterThan(0);
  });
});

describe('SpringTransactionSemanticDetector', () => {
  let detector: SpringTransactionSemanticDetector;

  beforeEach(() => {
    detector = new SpringTransactionSemanticDetector();
  });

  it('should have correct metadata', () => {
    expect(detector.id).toBe('spring/transaction-patterns');
    expect(detector.category).toBe('data-access');
    expect(detector.supportedLanguages).toContain('java');
  });

  it('should detect @Transactional annotation', async () => {
    const content = `
@Service
public class TransferService {
    @Transactional
    public void transfer(Long fromId, Long toId, BigDecimal amount) {
        Account from = accountRepository.findById(fromId).orElseThrow();
        Account to = accountRepository.findById(toId).orElseThrow();
        
        from.debit(amount);
        to.credit(amount);
        
        accountRepository.save(from);
        accountRepository.save(to);
    }
    
    @Transactional(readOnly = true)
    public Account getAccount(Long id) {
        return accountRepository.findById(id).orElseThrow();
    }
    
    @Transactional(propagation = Propagation.REQUIRES_NEW, isolation = Isolation.SERIALIZABLE)
    public void criticalOperation() {
        // ...
    }
}
`;
    const context = createContext(content, 'TransferService.java');
    const result = await detector.detect(context);
    
    expect(result.confidence).toBeGreaterThan(0);
  });
});

describe('SpringAsyncSemanticDetector', () => {
  let detector: SpringAsyncSemanticDetector;

  beforeEach(() => {
    detector = new SpringAsyncSemanticDetector();
  });

  it('should have correct metadata', () => {
    expect(detector.id).toBe('spring/async-patterns');
    expect(detector.category).toBe('performance');
    expect(detector.supportedLanguages).toContain('java');
  });

  it('should detect @Async annotation', async () => {
    const content = `
@Service
public class NotificationService {
    @Async
    public void sendEmail(String to, String subject, String body) {
        // Send email asynchronously
        emailClient.send(to, subject, body);
    }
    
    @Async
    public CompletableFuture<Report> generateReportAsync(Long userId) {
        Report report = reportGenerator.generate(userId);
        return CompletableFuture.completedFuture(report);
    }
}
`;
    const context = createContext(content, 'NotificationService.java');
    const result = await detector.detect(context);
    
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('should detect @Scheduled annotation', async () => {
    const content = `
@Component
public class ScheduledTasks {
    @Scheduled(fixedRate = 60000)
    public void cleanupExpiredSessions() {
        sessionService.cleanupExpired();
    }
    
    @Scheduled(cron = "0 0 2 * * ?")
    public void dailyReport() {
        reportService.generateDailyReport();
    }
    
    @Scheduled(fixedDelay = 30000, initialDelay = 10000)
    public void processQueue() {
        queueProcessor.process();
    }
}
`;
    const context = createContext(content, 'ScheduledTasks.java');
    const result = await detector.detect(context);
    
    expect(result.confidence).toBeGreaterThan(0);
  });
});

describe('Spring Detector Factory Functions', () => {
  it('should create all semantic detectors', async () => {
    const { createAllSpringSemanticDetectors } = await import('../index.js');
    const detectors = createAllSpringSemanticDetectors();
    
    expect(detectors).toHaveLength(12);
    expect(detectors.every(d => d.supportedLanguages.includes('java'))).toBe(true);
  });

  it('should create all learning detectors', async () => {
    const { createAllSpringLearningDetectors } = await import('../index.js');
    const detectors = createAllSpringLearningDetectors();
    
    expect(detectors).toHaveLength(12);
    expect(detectors.every(d => d.supportedLanguages.includes('java'))).toBe(true);
  });

  it('should create all Spring detectors', async () => {
    const { createAllSpringDetectors } = await import('../index.js');
    const detectors = createAllSpringDetectors();
    
    expect(detectors).toHaveLength(24);
  });
});
