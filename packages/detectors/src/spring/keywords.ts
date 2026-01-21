/**
 * Spring Semantic Keyword Groups
 * 
 * These keywords are used by semantic detectors to find Spring patterns.
 * NO HARDCODED RULES - just vocabulary for discovery.
 * 
 * The semantic detector finds these keywords, the learning detector
 * establishes what's "normal" from frequency.
 */

export const SPRING_KEYWORD_GROUPS = {
  
  // ============================================================================
  // STRUCTURAL - How the application is organized
  // ============================================================================
  structural: {
    category: 'structural',
    keywords: [
      // Stereotype annotations
      'Component', 'Service', 'Repository', 'Controller', 'RestController',
      'Configuration', 'Bean',
      
      // Component scanning
      'ComponentScan', 'EnableAutoConfiguration', 'SpringBootApplication',
      
      // Conditional
      'Conditional', 'ConditionalOnProperty', 'ConditionalOnClass',
      'ConditionalOnMissingBean', 'ConditionalOnBean',
      
      // Profiles
      'Profile', 'ActiveProfiles',
    ],
    description: 'Application structure and component organization',
  },

  // ============================================================================
  // API - Web layer patterns
  // ============================================================================
  api: {
    category: 'api',
    keywords: [
      // Request mapping
      'RequestMapping', 'GetMapping', 'PostMapping', 'PutMapping', 
      'DeleteMapping', 'PatchMapping',
      
      // Parameters
      'PathVariable', 'RequestParam', 'RequestBody', 'RequestHeader',
      'RequestPart', 'ModelAttribute', 'MatrixVariable',
      
      // Response
      'ResponseBody', 'ResponseStatus', 'ResponseEntity',
      
      // REST
      'RestController', 'CrossOrigin',
      
      // Content types
      'Consumes', 'Produces', 'MediaType',
    ],
    description: 'REST API and web layer patterns',
  },

  // ============================================================================
  // AUTH - Security patterns
  // ============================================================================
  auth: {
    category: 'auth',
    keywords: [
      // Method security
      'PreAuthorize', 'PostAuthorize', 'PreFilter', 'PostFilter',
      'Secured', 'RolesAllowed',
      
      // Programmatic checks
      'hasRole', 'hasAuthority', 'hasPermission', 'hasAnyRole',
      'isAuthenticated', 'isAnonymous', 'isFullyAuthenticated',
      'permitAll', 'denyAll',
      
      // Security context
      'SecurityContext', 'SecurityContextHolder', 'Authentication',
      'Principal', 'AuthenticationPrincipal', 'CurrentUser',
      
      // Configuration
      'EnableWebSecurity', 'EnableMethodSecurity', 'EnableGlobalMethodSecurity',
      'SecurityFilterChain', 'WebSecurityConfigurerAdapter',
      
      // JWT/OAuth
      'JwtDecoder', 'JwtEncoder', 'OAuth2', 'OAuth2Login',
    ],
    description: 'Authentication and authorization patterns',
  },

  // ============================================================================
  // DATA - Data access patterns
  // ============================================================================
  data: {
    category: 'data-access',
    keywords: [
      // Repository
      'Repository', 'JpaRepository', 'CrudRepository', 'PagingAndSortingRepository',
      
      // Queries
      'Query', 'Modifying', 'Param', 'NativeQuery',
      'NamedQuery', 'NamedNativeQuery',
      
      // JPA entities
      'Entity', 'Table', 'Column', 'Id', 'GeneratedValue',
      'ManyToOne', 'OneToMany', 'ManyToMany', 'OneToOne',
      'JoinColumn', 'JoinTable', 'Embedded', 'Embeddable',
      
      // Fetch strategies
      'Fetch', 'FetchType', 'LAZY', 'EAGER',
      'EntityGraph', 'NamedEntityGraph',
      
      // EntityManager
      'EntityManager', 'PersistenceContext', 'PersistenceUnit',
      
      // Specifications
      'Specification', 'Criteria', 'CriteriaBuilder',
    ],
    description: 'Data access and persistence patterns',
  },

  // ============================================================================
  // DI - Dependency injection patterns
  // ============================================================================
  di: {
    category: 'structural',
    keywords: [
      // Injection
      'Autowired', 'Inject', 'Resource',
      
      // Qualifiers
      'Qualifier', 'Primary', 'Named',
      
      // Scope
      'Scope', 'Singleton', 'Prototype', 'RequestScope', 'SessionScope',
      
      // Lifecycle
      'PostConstruct', 'PreDestroy', 'Lazy', 'DependsOn',
      
      // Bean definition
      'Bean', 'Configuration', 'Import', 'ImportResource',
      
      // Constructor injection (detected by pattern, not keyword)
      'RequiredArgsConstructor', 'AllArgsConstructor',
    ],
    description: 'Dependency injection and IoC patterns',
  },

  // ============================================================================
  // CONFIG - Configuration patterns
  // ============================================================================
  config: {
    category: 'config',
    keywords: [
      // Property binding
      'Value', 'ConfigurationProperties', 'EnableConfigurationProperties',
      'ConstructorBinding', 'DefaultValue',
      
      // Profiles
      'Profile', 'ActiveProfiles', 'PropertySource', 'PropertySources',
      
      // Environment
      'Environment', 'getProperty', 'getRequiredProperty',
      
      // Validation
      'Validated', 'Valid',
    ],
    description: 'Configuration and property binding patterns',
  },

  // ============================================================================
  // VALIDATION - Input validation patterns
  // ============================================================================
  validation: {
    category: 'security',
    keywords: [
      // Bean validation
      'Valid', 'Validated', 'NotNull', 'NotEmpty', 'NotBlank',
      'Size', 'Min', 'Max', 'Pattern', 'Email',
      'Positive', 'PositiveOrZero', 'Negative', 'NegativeOrZero',
      'Past', 'PastOrPresent', 'Future', 'FutureOrPresent',
      
      // Custom validation
      'Constraint', 'ConstraintValidator', 'ConstraintValidatorContext',
      
      // Binding result
      'BindingResult', 'Errors', 'FieldError', 'ObjectError',
    ],
    description: 'Input validation patterns',
  },

  // ============================================================================
  // ERRORS - Error handling patterns
  // ============================================================================
  errors: {
    category: 'errors',
    keywords: [
      // Exception handling
      'ExceptionHandler', 'ControllerAdvice', 'RestControllerAdvice',
      'ResponseEntityExceptionHandler',
      
      // Response status
      'ResponseStatus', 'HttpStatus',
      
      // Problem details (Spring 6+)
      'ProblemDetail', 'ErrorResponse',
      
      // Custom exceptions
      'RuntimeException', 'Exception', 'throw', 'throws',
    ],
    description: 'Error and exception handling patterns',
  },

  // ============================================================================
  // LOGGING - Logging patterns
  // ============================================================================
  logging: {
    category: 'logging',
    keywords: [
      // SLF4J
      'Logger', 'LoggerFactory', 'getLogger',
      'log', 'logger',
      
      // Log levels
      'trace', 'debug', 'info', 'warn', 'error',
      
      // MDC
      'MDC', 'put', 'get', 'remove', 'clear',
      
      // Lombok
      'Slf4j', 'Log4j', 'Log4j2', 'CommonsLog',
    ],
    description: 'Logging and observability patterns',
  },

  // ============================================================================
  // TESTING - Test patterns
  // ============================================================================
  testing: {
    category: 'testing',
    keywords: [
      // Spring test
      'SpringBootTest', 'WebMvcTest', 'DataJpaTest', 'WebFluxTest',
      'JsonTest', 'RestClientTest',
      
      // Test configuration
      'TestConfiguration', 'MockBean', 'SpyBean', 'Import',
      'AutoConfigureMockMvc', 'AutoConfigureTestDatabase',
      
      // MockMvc
      'MockMvc', 'perform', 'andExpect', 'andReturn',
      
      // Assertions
      'assertThat', 'assertEquals', 'assertTrue', 'assertFalse',
      'assertThrows', 'assertNotNull',
      
      // JUnit
      'Test', 'BeforeEach', 'AfterEach', 'BeforeAll', 'AfterAll',
      'DisplayName', 'Nested', 'ParameterizedTest',
      
      // Mockito
      'Mock', 'InjectMocks', 'when', 'thenReturn', 'verify',
      'any', 'eq', 'ArgumentCaptor',
    ],
    description: 'Testing patterns and frameworks',
  },

  // ============================================================================
  // TRANSACTION - Transaction patterns
  // ============================================================================
  transaction: {
    category: 'data-access',
    keywords: [
      // Transactional
      'Transactional', 'EnableTransactionManagement',
      
      // Propagation
      'Propagation', 'REQUIRED', 'REQUIRES_NEW', 'NESTED',
      'SUPPORTS', 'NOT_SUPPORTED', 'MANDATORY', 'NEVER',
      
      // Isolation
      'Isolation', 'READ_UNCOMMITTED', 'READ_COMMITTED',
      'REPEATABLE_READ', 'SERIALIZABLE',
      
      // Rollback
      'rollbackFor', 'noRollbackFor', 'rollbackOn',
      
      // Transaction manager
      'TransactionManager', 'PlatformTransactionManager',
      'TransactionTemplate', 'TransactionStatus',
    ],
    description: 'Transaction management patterns',
  },

  // ============================================================================
  // ASYNC - Async patterns
  // ============================================================================
  async: {
    category: 'performance',
    keywords: [
      // Async
      'Async', 'EnableAsync', 'AsyncConfigurer',
      
      // Futures
      'CompletableFuture', 'Future', 'ListenableFuture',
      
      // Scheduling
      'Scheduled', 'EnableScheduling', 'Schedules',
      'fixedRate', 'fixedDelay', 'cron',
      
      // Thread pools
      'ThreadPoolTaskExecutor', 'TaskExecutor', 'Executor',
    ],
    description: 'Async and scheduling patterns',
  },
} as const;

export type SpringKeywordGroup = keyof typeof SPRING_KEYWORD_GROUPS;

/**
 * Get keywords for a specific group
 */
export function getSpringKeywords(group: SpringKeywordGroup): readonly string[] {
  return SPRING_KEYWORD_GROUPS[group].keywords;
}

/**
 * Get all Spring keywords across all groups
 */
export function getAllSpringKeywords(): string[] {
  const allKeywords: string[] = [];
  for (const group of Object.values(SPRING_KEYWORD_GROUPS)) {
    allKeywords.push(...group.keywords);
  }
  return [...new Set(allKeywords)]; // Remove duplicates
}

/**
 * Get the category for a keyword group
 */
export function getSpringKeywordCategory(group: SpringKeywordGroup): string {
  return SPRING_KEYWORD_GROUPS[group].category;
}
