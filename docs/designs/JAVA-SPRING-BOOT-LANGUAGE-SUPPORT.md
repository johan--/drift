# Java/Spring Boot Language Support Design Specification

**Version**: 1.0  
**Status**: Implemented  
**Author**: Drift Team  
**Date**: January 2026  

## Executive Summary

This document specifies the design for adding comprehensive Java/Spring Boot language support to Drift. Unlike traditional linting tools, Drift uses **semantic learning** to discover patterns organically from the codebase - no hardcoded rules about what's "right" or "wrong."

The implementation provides:
- Java parser with semantic extraction (annotation, class, method extractors)
- 12 semantic learning detectors across Spring Boot categories  
- Spring MVC ↔ React/TypeScript contract detection
- Full integration with CLI, MCP server, Dashboard, and LSP

**Key Principle**: Drift learns what YOUR team does and flags deviations. It doesn't impose external opinions about Spring best practices.

## Implementation Status

| Component | Status | Location |
|-----------|--------|----------|
| Java Parser Types | ✅ Complete | `packages/core/src/parsers/tree-sitter/java/types.ts` |
| Annotation Extractor | ✅ Complete | `packages/core/src/parsers/tree-sitter/java/annotation-extractor.ts` |
| Class Extractor | ✅ Complete | `packages/core/src/parsers/tree-sitter/java/class-extractor.ts` |
| Method Extractor | ✅ Complete | `packages/core/src/parsers/tree-sitter/java/method-extractor.ts` |
| Spring Keywords | ✅ Complete | `packages/detectors/src/spring/keywords.ts` |
| 12 Semantic Detectors | ✅ Complete | `packages/detectors/src/spring/*-semantic.ts` |
| 12 Learning Detectors | ✅ Complete | `packages/detectors/src/spring/*-learning.ts` |
| Spring Endpoint Detector | ✅ Complete | `packages/detectors/src/contracts/spring/spring-endpoint-detector.ts` |
| DTO Extractor | ✅ Complete | `packages/detectors/src/contracts/spring/dto-extractor.ts` |
| Java Type Mapping | ✅ Complete | `packages/core/src/types/java-type-mapping.ts` |
| CLI Parser Command | ✅ Complete | `packages/cli/src/commands/parser.ts` |
| MCP Server Integration | ✅ Complete | `packages/mcp/src/server.ts` |
| MCP Spring Boot Pack | ✅ Complete | `packages/mcp/src/packs.ts` |
| Detectors Index | ✅ Complete | `packages/detectors/src/index.ts` |
| LSP Java Support | ✅ Complete | `packages/lsp/src/utils/document.ts` |
| Demo Spring Project | ✅ Complete | `demo/spring-backend/` |

## Table of Contents

1. [Philosophy: Semantic Learning](#1-philosophy-semantic-learning)
2. [Goals and Non-Goals](#2-goals-and-non-goals)
3. [Architecture Overview](#3-architecture-overview)
4. [Parser Implementation](#4-parser-implementation)
5. [Semantic Keyword Groups](#5-semantic-keyword-groups)
6. [Detector Implementation](#6-detector-implementation)
7. [Contract Detection](#7-contract-detection)
8. [System Integration](#8-system-integration)
9. [Implementation Plan](#9-implementation-plan)
10. [Testing Strategy](#10-testing-strategy)


---

## 1. Philosophy: Semantic Learning

### 1.1 Core Principle: No Hardcoded Rules

Drift does NOT tell teams what patterns they should use. Instead:

1. **Discover** - Scan the codebase for semantic concepts (keywords like `@Autowired`, `@PreAuthorize`, `Repository`)
2. **Learn** - Observe frequency and context to establish what's "normal" for THIS codebase
3. **Detect Drift** - Flag when code deviates from the learned dominant pattern
4. **Let Teams Decide** - The team determines if deviation is intentional or accidental

### 1.2 Example: Dependency Injection

❌ **Wrong (hardcoded rule)**: "Field injection with `@Autowired` is bad, use constructor injection"

✅ **Right (semantic learning)**:
```
Your codebase uses constructor injection in 94% of cases (847 occurrences across 156 files).
This file uses field injection with @Autowired. Is this intentional?

Dominant pattern: Constructor injection
  - UserService.java:15 - constructor(UserRepository, EmailService)
  - OrderService.java:12 - constructor(OrderRepository, PaymentGateway)
  
Outlier: ProductController.java:8
  - @Autowired private ProductService productService;
```

The detector doesn't know which is "better." It learns what THIS team does.

### 1.3 Why This Matters for Enterprise

Enterprise Java teams have:
- Legacy code with established patterns (even if not "modern best practices")
- Architectural decisions made years ago that are intentional
- Mixed patterns during migrations
- Team-specific conventions

A tool that says "you're doing it wrong" is useless. A tool that says "this is different from your norm" is valuable.


---

## 2. Goals and Non-Goals

### 2.1 Goals

| ID | Goal | Rationale |
|----|------|-----------|
| G1 | Parse Java source files using tree-sitter-java | Foundation for all detection |
| G2 | Extract semantic information: classes, methods, annotations, fields | Required for pattern detection |
| G3 | Implement ~40 semantic learning detectors for Spring patterns | Cover major Spring categories |
| G4 | Detect Spring MVC endpoints for contract matching | FE↔BE drift detection |
| G5 | Support Spring Boot 2.x and 3.x patterns | Modern Spring ecosystem |
| G6 | Integrate with existing semantic detector infrastructure | Leverage language-agnostic base |
| G7 | Full CLI, MCP, Dashboard, LSP integration | First-class language support |
| G8 | Maintain <100ms parse time for typical Java files | Performance requirement |

### 2.2 Non-Goals

| ID | Non-Goal | Rationale |
|----|----------|-----------|
| NG1 | Full Java compiler integration | Tree-sitter sufficient for pattern detection |
| NG2 | Type checking or compilation | We detect patterns, not compile |
| NG3 | Prescriptive "best practice" rules | Philosophy: learn, don't prescribe |
| NG4 | Support for Java < 11 | Focus on modern LTS versions |
| NG5 | Kotlin support (this phase) | Separate future effort (shares patterns) |
| NG6 | Android-specific patterns | Different ecosystem |
| NG7 | Spring WebFlux reactive patterns (this phase) | Future enhancement |


---

## 3. Architecture Overview

### 3.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Drift Core                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌───────────────────┐    ┌───────────────────┐    ┌───────────────────┐   │
│  │   ParserManager   │───▶│    JavaParser     │───▶│  tree-sitter-java │   │
│  └───────────────────┘    └───────────────────┘    └───────────────────┘   │
│            │                       │                                         │
│            │                       ▼                                         │
│            │              ┌───────────────────┐                             │
│            │              │  JavaParseResult  │                             │
│            │              │  - packages       │                             │
│            │              │  - imports        │                             │
│            │              │  - classes        │                             │
│            │              │  - annotations    │                             │
│            │              │  - methods        │                             │
│            │              └───────────────────┘                             │
│            │                       │                                         │
│            ▼                       ▼                                         │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                        Detector Registry                               │ │
│  ├───────────────────────────────────────────────────────────────────────┤ │
│  │                                                                        │ │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐    │ │
│  │  │ Semantic         │  │ Learning         │  │ Contract         │    │ │
│  │  │ Detectors        │  │ Detectors        │  │ Detectors        │    │ │
│  │  │ (keyword-based)  │  │ (frequency)      │  │ (endpoint)       │    │ │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘    │ │
│  │           │                    │                    │                  │ │
│  │           └────────────────────┴────────────────────┘                  │ │
│  │                                │                                        │ │
│  │                                ▼                                        │ │
│  │                       ┌──────────────────┐                             │ │
│  │                       │   PatternStore   │                             │ │
│  │                       └──────────────────┘                             │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                   │                                          │
└───────────────────────────────────┼──────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
┌───────────────┐          ┌───────────────┐          ┌───────────────┐
│      CLI      │          │  MCP Server   │          │   Dashboard   │
│  drift scan   │          │ drift_patterns│          │  Pattern View │
│  drift status │          │ drift_examples│          │ Contract View │
└───────────────┘          └───────────────┘          └───────────────┘
```

### 3.2 Data Flow

```
Java File (.java)
       │
       ▼
┌─────────────────┐
│  tree-sitter    │  Parse to AST
│  java parser    │
└─────────────────┘
       │
       ▼
┌─────────────────┐
│ JavaParseResult │  Extract semantic info
│ - annotations   │  (classes, methods, annotations)
│ - classes       │
│ - methods       │
└─────────────────┘
       │
       ▼
┌─────────────────┐
│ Semantic        │  Find keyword matches
│ Detector        │  Identify context types
└─────────────────┘
       │
       ▼
┌─────────────────┐
│ Learning        │  Cluster by context
│ Detector        │  Establish dominant patterns
└─────────────────┘
       │
       ▼
┌─────────────────┐
│ Pattern Store   │  Store learned patterns
│                 │  Flag outliers as violations
└─────────────────┘
```


### 3.3 File Structure

```
packages/
├── core/src/
│   ├── parsers/
│   │   ├── tree-sitter/
│   │   │   ├── tree-sitter-java-parser.ts      # NEW: Java parser
│   │   │   ├── tree-sitter-java-parser.test.ts # NEW: Parser tests
│   │   │   └── java/
│   │   │       ├── annotation-extractor.ts     # NEW: Annotation extraction
│   │   │       ├── class-extractor.ts          # NEW: Class/interface extraction
│   │   │       ├── method-extractor.ts         # NEW: Method extraction
│   │   │       └── types.ts                    # NEW: Java-specific types
│   │   └── types.ts                            # MODIFY: Add 'java' to Language
│   └── types/
│       └── common.ts                           # MODIFY: Add Java type mappings
│
├── detectors/src/
│   ├── spring/                                 # NEW: Spring detector folder
│   │   ├── index.ts                            # Barrel export
│   │   ├── keywords.ts                         # Semantic keyword definitions
│   │   ├── structural-semantic.ts              # @Component, @Service, etc.
│   │   ├── structural-learning.ts              # Learning variant
│   │   ├── api-semantic.ts                     # @RequestMapping, @GetMapping
│   │   ├── api-learning.ts                     # Learning variant
│   │   ├── auth-semantic.ts                    # @PreAuthorize, @Secured
│   │   ├── auth-learning.ts                    # Learning variant
│   │   ├── data-semantic.ts                    # @Repository, @Query
│   │   ├── data-learning.ts                    # Learning variant
│   │   ├── di-semantic.ts                      # @Autowired, @Bean
│   │   ├── di-learning.ts                      # Learning variant
│   │   ├── config-semantic.ts                  # @Value, @ConfigurationProperties
│   │   ├── config-learning.ts                  # Learning variant
│   │   ├── validation-semantic.ts              # @Valid, @NotNull
│   │   ├── validation-learning.ts              # Learning variant
│   │   ├── errors-semantic.ts                  # @ExceptionHandler
│   │   ├── errors-learning.ts                  # Learning variant
│   │   ├── logging-semantic.ts                 # Logger, SLF4J
│   │   ├── logging-learning.ts                 # Learning variant
│   │   ├── testing-semantic.ts                 # @SpringBootTest, @MockBean
│   │   ├── testing-learning.ts                 # Learning variant
│   │   ├── transaction-semantic.ts             # @Transactional
│   │   ├── transaction-learning.ts             # Learning variant
│   │   └── __tests__/                          # Test files
│   │
│   └── contracts/
│       └── spring/                             # NEW: Spring contract detection
│           ├── spring-endpoint-detector.ts     # Endpoint extraction
│           ├── dto-extractor.ts                # Request/response types
│           ├── types.ts                        # Spring contract types
│           └── __tests__/
│
├── cli/src/
│   └── commands/
│       └── parser.ts                           # MODIFY: Add Java support
│
├── mcp/src/
│   └── server.ts                               # MODIFY: Java in all tools
│
└── dashboard/src/
    └── client/components/
        └── patterns/
            └── constants.ts                    # MODIFY: Java language option
```


---

## 4. Parser Implementation

### 4.1 JavaParser Class

```typescript
/**
 * Java Parser - Java parsing using tree-sitter-java
 *
 * Extracts packages, imports, classes, interfaces, enums, records,
 * methods, fields, and annotations from Java files.
 *
 * Annotations are FIRST-CLASS CITIZENS - they're the primary signal
 * for Spring pattern detection.
 */
export class JavaParser extends BaseTreeSitterParser {
  readonly language: Language = 'java';
  readonly extensions: string[] = ['.java'];

  parse(source: string, filePath?: string): JavaParseResult;
  
  // Annotation-focused queries
  getAnnotationsOnClass(className: string): AnnotationUsage[];
  getAnnotationsOnMethod(className: string, methodName: string): AnnotationUsage[];
  getAnnotatedMethods(annotationName: string): MethodInfo[];
  getAnnotatedClasses(annotationName: string): JavaClassInfo[];
}
```

### 4.2 JavaParseResult Interface

```typescript
export interface JavaParseResult extends ParseResult {
  /** Package declaration */
  package: PackageInfo | null;
  
  /** Import statements */
  imports: JavaImportInfo[];
  
  /** Class declarations */
  classes: JavaClassInfo[];
  
  /** Interface declarations */
  interfaces: JavaInterfaceInfo[];
  
  /** Enum declarations */
  enums: JavaEnumInfo[];
  
  /** Record declarations (Java 16+) */
  records: JavaRecordInfo[];
  
  /** Annotation definitions (@interface) */
  annotationDefinitions: AnnotationDefinition[];
}
```

### 4.3 Core Type Definitions

```typescript
/** Package information */
export interface PackageInfo {
  name: string;                    // "com.example.service"
  startPosition: Position;
  endPosition: Position;
}

/** Import information */
export interface JavaImportInfo {
  path: string;                    // "org.springframework.web.bind.annotation.GetMapping"
  isStatic: boolean;               // import static ...
  isWildcard: boolean;             // import com.example.*
  alias: string | null;            // Not common in Java but possible
  startPosition: Position;
  endPosition: Position;
}

/** Class information */
export interface JavaClassInfo {
  name: string;
  package: string | null;
  
  /** Annotations on the class - CRITICAL for Spring detection */
  annotations: AnnotationUsage[];
  
  /** Modifiers */
  modifiers: JavaModifier[];       // public, abstract, final, static
  
  /** Inheritance */
  superclass: string | null;
  interfaces: string[];
  
  /** Members */
  fields: JavaFieldInfo[];
  methods: JavaMethodInfo[];
  constructors: JavaConstructorInfo[];
  innerClasses: JavaClassInfo[];
  
  /** Generics */
  typeParameters: string[];
  
  /** Location */
  startPosition: Position;
  endPosition: Position;
}

/** Annotation usage - THE KEY TYPE for Spring detection */
export interface AnnotationUsage {
  /** Simple name: "GetMapping" */
  name: string;
  
  /** Full qualified name if resolvable: "org.springframework.web.bind.annotation.GetMapping" */
  fullName: string | null;
  
  /** Annotation arguments */
  arguments: AnnotationArgument[];
  
  /** What is this annotation on? */
  target: 'class' | 'method' | 'field' | 'parameter' | 'constructor';
  
  /** Location */
  startPosition: Position;
  endPosition: Position;
}

/** Annotation argument */
export interface AnnotationArgument {
  /** Argument name (null for single-value annotations) */
  name: string | null;             // "value", "method", "roles"
  
  /** Argument value as string */
  value: string;                   // "/users", "RequestMethod.GET", "ADMIN"
  
  /** Value type hint */
  valueType: 'string' | 'number' | 'boolean' | 'enum' | 'class' | 'array' | 'annotation';
}

/** Method information */
export interface JavaMethodInfo {
  name: string;
  
  /** Annotations on the method */
  annotations: AnnotationUsage[];
  
  /** Return type */
  returnType: string;              // "ResponseEntity<UserDto>"
  
  /** Parameters with their annotations */
  parameters: JavaParameterInfo[];
  
  /** Modifiers */
  modifiers: JavaModifier[];
  
  /** Generics */
  typeParameters: string[];
  
  /** Throws clause */
  throwsTypes: string[];
  
  /** Location */
  startPosition: Position;
  endPosition: Position;
}

/** Parameter information */
export interface JavaParameterInfo {
  name: string;
  type: string;
  
  /** Annotations on the parameter - important for @PathVariable, @RequestBody, etc. */
  annotations: AnnotationUsage[];
  
  /** Is this a varargs parameter? */
  isVarargs: boolean;
}

/** Field information */
export interface JavaFieldInfo {
  name: string;
  type: string;
  
  /** Annotations on the field - important for @Autowired, @Value, etc. */
  annotations: AnnotationUsage[];
  
  modifiers: JavaModifier[];
  initializer: string | null;
  
  startPosition: Position;
  endPosition: Position;
}

/** Java modifiers */
export type JavaModifier = 
  | 'public' | 'private' | 'protected'
  | 'static' | 'final' | 'abstract'
  | 'synchronized' | 'volatile' | 'transient'
  | 'native' | 'strictfp';
```


### 4.4 Tree-sitter Integration

```typescript
import Parser from 'tree-sitter';
import Java from 'tree-sitter-java';

export class JavaParser extends BaseTreeSitterParser {
  private parser: Parser;
  
  constructor() {
    super();
    this.parser = new Parser();
    this.parser.setLanguage(Java);
  }
  
  parse(source: string, filePath?: string): JavaParseResult {
    const tree = this.parser.parse(source);
    const rootNode = tree.rootNode;
    
    // Extract semantic information
    const packageInfo = this.extractPackage(rootNode);
    const imports = this.extractImports(rootNode);
    const classes = this.extractClasses(rootNode, source);
    const interfaces = this.extractInterfaces(rootNode, source);
    const enums = this.extractEnums(rootNode, source);
    const records = this.extractRecords(rootNode, source);
    
    return {
      ...this.createSuccessResult(this.convertToAST(rootNode, source)),
      package: packageInfo,
      imports,
      classes,
      interfaces,
      enums,
      records,
      annotationDefinitions: [],
    };
  }
  
  /**
   * Extract all annotations from a node
   * This is the CRITICAL method for Spring detection
   */
  private extractAnnotations(node: Parser.SyntaxNode, source: string): AnnotationUsage[] {
    const annotations: AnnotationUsage[] = [];
    
    // Find all annotation nodes that are children/siblings
    const annotationNodes = this.findAnnotationNodes(node);
    
    for (const annoNode of annotationNodes) {
      annotations.push(this.parseAnnotation(annoNode, source));
    }
    
    return annotations;
  }
  
  /**
   * Parse a single annotation node
   */
  private parseAnnotation(node: Parser.SyntaxNode, source: string): AnnotationUsage {
    // @GetMapping("/users/{id}")
    // @PreAuthorize("hasRole('ADMIN')")
    // @Transactional(readOnly = true, propagation = Propagation.REQUIRED)
    
    const nameNode = node.childForFieldName('name');
    const argsNode = node.childForFieldName('arguments');
    
    return {
      name: nameNode?.text || '',
      fullName: this.resolveAnnotationFullName(nameNode?.text || ''),
      arguments: argsNode ? this.parseAnnotationArguments(argsNode, source) : [],
      target: this.determineAnnotationTarget(node),
      startPosition: this.toPosition(node.startPosition),
      endPosition: this.toPosition(node.endPosition),
    };
  }
}
```

### 4.5 AST Node Type Mappings

| Java Construct | tree-sitter Node Type | Drift Type |
|----------------|----------------------|------------|
| package | `package_declaration` | `PackageInfo` |
| import | `import_declaration` | `JavaImportInfo` |
| class | `class_declaration` | `JavaClassInfo` |
| interface | `interface_declaration` | `JavaInterfaceInfo` |
| enum | `enum_declaration` | `JavaEnumInfo` |
| record | `record_declaration` | `JavaRecordInfo` |
| method | `method_declaration` | `JavaMethodInfo` |
| constructor | `constructor_declaration` | `JavaConstructorInfo` |
| field | `field_declaration` | `JavaFieldInfo` |
| annotation | `annotation` / `marker_annotation` | `AnnotationUsage` |
| parameter | `formal_parameter` | `JavaParameterInfo` |


---

## 5. Semantic Keyword Groups

### 5.1 Overview

Semantic keyword groups are the foundation of pattern detection. Each group defines:
- **Keywords**: Terms to search for in the code
- **Context types**: Where these keywords appear (annotation, method call, class definition, etc.)
- **Category**: Which pattern category this belongs to

The semantic detector finds these keywords, the learning detector establishes what's "normal."

### 5.2 Keyword Group Definitions

```typescript
// packages/detectors/src/spring/keywords.ts

/**
 * Spring Semantic Keyword Groups
 * 
 * These keywords are used by semantic detectors to find Spring patterns.
 * NO HARDCODED RULES - just vocabulary for discovery.
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
      'get', 'post', 'put', 'delete',
      
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

  // ============================================================================
  // CACHING - Caching patterns
  // ============================================================================
  caching: {
    category: 'performance',
    keywords: [
      // Cache annotations
      'Cacheable', 'CacheEvict', 'CachePut', 'Caching',
      'EnableCaching', 'CacheConfig',
      
      // Cache managers
      'CacheManager', 'Cache', 'ConcurrentMapCacheManager',
      'RedisCacheManager', 'EhCacheCacheManager',
    ],
    description: 'Caching patterns',
  },
};

export type SpringKeywordGroup = keyof typeof SPRING_KEYWORD_GROUPS;
```


---

## 6. Detector Implementation

### 6.1 Detector Architecture

Each pattern category has TWO detectors:
1. **Semantic Detector** - Finds keywords, identifies context types
2. **Learning Detector** - Establishes dominant patterns from frequency

```
┌─────────────────────────────────────────────────────────────────┐
│                    Semantic Detector                             │
│  - Uses keyword group to find matches                           │
│  - Identifies context type (annotation, method call, etc.)      │
│  - Returns SemanticMatch[] with location and context            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Learning Detector                             │
│  - Clusters matches by context type                             │
│  - Calculates frequency per context type                        │
│  - Establishes dominant pattern (most common)                   │
│  - Flags outliers as potential violations                       │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Example: DI Patterns Detector

```typescript
// packages/detectors/src/spring/di-semantic.ts

import { SemanticDetector, type SemanticMatch } from '../base/semantic-detector.js';
import { SPRING_KEYWORD_GROUPS } from './keywords.js';

/**
 * Spring Dependency Injection Semantic Detector
 * 
 * Detects DI patterns: @Autowired, constructor injection, @Bean, etc.
 * Does NOT judge which is "better" - just finds them.
 */
export class SpringDISemanticDetector extends SemanticDetector {
  readonly id = 'spring/di-patterns';
  readonly category = 'structural' as const;
  readonly subcategory = 'dependency-injection';
  readonly name = 'Spring DI Patterns Detector';
  readonly description = 'Detects dependency injection patterns in Spring applications';
  
  // Add Java to supported languages
  readonly supportedLanguages = ['java', 'kotlin'] as const;

  protected getSemanticKeywords(): string[] {
    return SPRING_KEYWORD_GROUPS.di.keywords;
  }

  protected getSemanticCategory(): string {
    return 'di';
  }

  /**
   * Filter out false positives
   */
  protected isRelevantMatch(match: SemanticMatch): boolean {
    // Skip matches in comments
    if (match.contextType === 'comment') return false;
    
    // Skip matches in string literals (unless it's a SpEL expression)
    if (match.contextType === 'string_literal') {
      // SpEL expressions like "#{...}" are relevant
      if (!match.lineContent.includes('#{')) return false;
    }
    
    return true;
  }

  /**
   * Create violation for outlier pattern
   */
  protected createPatternViolation(
    match: SemanticMatch,
    dominantPattern: UsagePattern
  ): Violation {
    return {
      id: `${this.id}-${match.file}-${match.line}`,
      patternId: this.id,
      severity: 'info', // Not an error - just information
      file: match.file,
      range: {
        start: { line: match.line - 1, character: match.column - 1 },
        end: { line: match.line - 1, character: match.column + match.matchedText.length },
      },
      message: `DI pattern differs from codebase norm`,
      expected: `Dominant pattern: ${dominantPattern.contextType} (${dominantPattern.percentage.toFixed(0)}% of usages)`,
      actual: `This file uses: ${match.contextType}`,
      explanation: `Your codebase predominantly uses ${dominantPattern.contextType} for dependency injection. ` +
        `This file uses ${match.contextType}. This may be intentional or may indicate drift.`,
      aiExplainAvailable: true,
      aiFixAvailable: false, // We don't auto-fix - team decides
      firstSeen: new Date(),
      occurrences: 1,
    };
  }
}

// Factory function
export function createSpringDISemanticDetector(): SpringDISemanticDetector {
  return new SpringDISemanticDetector();
}
```

### 6.3 Example: DI Learning Detector

```typescript
// packages/detectors/src/spring/di-learning.ts

import { SemanticLearningDetector } from '../base/semantic-learning-detector.js';
import { SPRING_KEYWORD_GROUPS } from './keywords.js';

/**
 * Spring DI Learning Detector
 * 
 * Learns the dominant DI pattern from the codebase:
 * - Field injection (@Autowired on fields)
 * - Constructor injection (constructor parameters)
 * - Setter injection (@Autowired on setters)
 * - @Bean methods
 */
export class SpringDILearningDetector extends SemanticLearningDetector {
  readonly id = 'spring/di-patterns-learning';
  readonly category = 'structural' as const;
  readonly subcategory = 'dependency-injection';
  readonly name = 'Spring DI Learning Detector';
  readonly description = 'Learns dependency injection patterns from the codebase';
  
  readonly supportedLanguages = ['java', 'kotlin'] as const;

  protected getSemanticKeywords(): string[] {
    return SPRING_KEYWORD_GROUPS.di.keywords;
  }

  protected getSemanticCategory(): string {
    return 'di';
  }

  /**
   * Custom context classification for DI patterns
   * 
   * We want to distinguish:
   * - field_injection: @Autowired on a field
   * - constructor_injection: Dependencies in constructor
   * - setter_injection: @Autowired on a setter method
   * - bean_definition: @Bean method
   */
  protected classifyDIContext(match: SemanticMatch): string {
    const line = match.lineContent;
    
    // @Autowired on a field
    if (match.keyword === 'Autowired' && line.includes('private') && !line.includes('(')) {
      return 'field_injection';
    }
    
    // @Autowired on a setter
    if (match.keyword === 'Autowired' && line.includes('void set')) {
      return 'setter_injection';
    }
    
    // Constructor with dependencies (look for @RequiredArgsConstructor or constructor pattern)
    if (match.keyword === 'RequiredArgsConstructor' || match.keyword === 'AllArgsConstructor') {
      return 'constructor_injection';
    }
    
    // @Bean method
    if (match.keyword === 'Bean') {
      return 'bean_definition';
    }
    
    // Default to the standard context type
    return match.contextType;
  }
}

export function createSpringDILearningDetector(): SpringDILearningDetector {
  return new SpringDILearningDetector();
}
```

### 6.4 Detector Summary

| Category | Semantic Detector | Learning Detector | Keywords |
|----------|------------------|-------------------|----------|
| Structural | `spring/structural-semantic` | `spring/structural-learning` | @Component, @Service, @Repository, @Controller |
| API | `spring/api-semantic` | `spring/api-learning` | @GetMapping, @PostMapping, @RequestBody |
| Auth | `spring/auth-semantic` | `spring/auth-learning` | @PreAuthorize, @Secured, hasRole |
| Data | `spring/data-semantic` | `spring/data-learning` | @Repository, @Query, @Transactional |
| DI | `spring/di-semantic` | `spring/di-learning` | @Autowired, @Bean, @Qualifier |
| Config | `spring/config-semantic` | `spring/config-learning` | @Value, @ConfigurationProperties |
| Validation | `spring/validation-semantic` | `spring/validation-learning` | @Valid, @NotNull, @Size |
| Errors | `spring/errors-semantic` | `spring/errors-learning` | @ExceptionHandler, @ControllerAdvice |
| Logging | `spring/logging-semantic` | `spring/logging-learning` | Logger, log.info, MDC |
| Testing | `spring/testing-semantic` | `spring/testing-learning` | @SpringBootTest, @MockBean, MockMvc |
| Transaction | `spring/transaction-semantic` | `spring/transaction-learning` | @Transactional, Propagation |
| Async | `spring/async-semantic` | `spring/async-learning` | @Async, @Scheduled, CompletableFuture |

**Total: 24 detectors** (12 semantic + 12 learning)


---

## 7. Contract Detection

### 7.1 Overview

Contract detection extracts API endpoints from Spring MVC controllers to match against frontend API calls (React/TypeScript). This enables detection of FE↔BE drift.

### 7.2 Spring Endpoint Extraction

```typescript
// packages/detectors/src/contracts/spring/spring-endpoint-detector.ts

import type { ContractField, HttpMethod, Language } from 'driftdetect-core';
import { BaseDetector } from '../../base/base-detector.js';
import type { SpringEndpoint, SpringExtractionResult } from './types.js';

/**
 * Spring MVC Endpoint Detector
 * 
 * Extracts API endpoints from:
 * - @RestController classes with @RequestMapping methods
 * - @Controller classes with @ResponseBody methods
 */
export class SpringEndpointDetector extends BaseDetector {
  readonly id = 'contracts/spring-endpoints';
  readonly category = 'api' as const;
  readonly subcategory = 'contracts';
  readonly name = 'Spring MVC Endpoint Detector';
  readonly description = 'Extracts API endpoints from Spring MVC controllers';
  readonly supportedLanguages: Language[] = ['java'];
  readonly detectionMethod = 'custom' as const;

  async detect(context: DetectionContext): Promise<DetectionResult> {
    const { content, file } = context;
    
    // Check if this is a controller file
    if (!this.isControllerFile(content)) {
      return this.createEmptyResult();
    }

    const result = this.extractEndpoints(content, file);
    
    return this.createResult([], [], result.confidence, {
      custom: {
        extractedEndpoints: result.endpoints,
        framework: 'spring-mvc',
        controllers: result.controllers,
      },
    });
  }

  private isControllerFile(content: string): boolean {
    return (
      content.includes('@RestController') ||
      content.includes('@Controller') ||
      (content.includes('@RequestMapping') && content.includes('class'))
    );
  }

  extractEndpoints(content: string, file: string): SpringExtractionResult {
    const endpoints: SpringEndpoint[] = [];
    const controllers: SpringControllerInfo[] = [];
    
    // Find controller class
    const controllerMatch = this.findControllerClass(content);
    if (!controllerMatch) {
      return { endpoints: [], framework: 'spring-mvc', confidence: 0, controllers: [] };
    }
    
    const { className, classAnnotations, baseRoute, line: classLine } = controllerMatch;
    
    controllers.push({
      name: className,
      baseRoute,
      isRestController: classAnnotations.includes('RestController'),
      file,
      line: classLine,
    });
    
    // Find all methods with mapping annotations
    const methods = this.findMappingMethods(content);
    
    for (const method of methods) {
      const fullPath = this.combinePaths(baseRoute, method.route);
      const normalizedPath = this.normalizePath(fullPath);
      
      endpoints.push({
        method: method.httpMethod,
        path: fullPath,
        normalizedPath,
        file,
        line: method.line,
        responseFields: this.extractResponseFields(method.returnType, content),
        requestFields: this.extractRequestFields(method.parameters, content),
        framework: 'spring-mvc',
        controller: className,
        action: method.name,
        authorization: this.extractAuthAnnotations(method.annotations),
      });
    }
    
    return {
      endpoints,
      framework: 'spring-mvc',
      confidence: endpoints.length > 0 ? 0.9 : 0,
      controllers,
    };
  }

  /**
   * Normalize Spring path to common format
   * 
   * Spring: /users/{id} → :id
   * Spring: /users/{id:\\d+} → :id (strip regex constraints)
   */
  private normalizePath(path: string): string {
    return path
      // Remove regex constraints: {id:\d+} → {id}
      .replace(/\{(\w+):[^}]+\}/g, '{$1}')
      // Convert {param} to :param
      .replace(/\{(\w+)\}/g, ':$1')
      // Clean up double slashes
      .replace(/\/+/g, '/')
      // Ensure leading slash
      .replace(/^([^/])/, '/$1')
      // Remove trailing slash
      .replace(/\/$/, '');
  }

  /**
   * Extract HTTP method from annotation
   */
  private getHttpMethod(annotation: string): HttpMethod {
    const mapping: Record<string, HttpMethod> = {
      'GetMapping': 'GET',
      'PostMapping': 'POST',
      'PutMapping': 'PUT',
      'DeleteMapping': 'DELETE',
      'PatchMapping': 'PATCH',
      'RequestMapping': 'GET', // Default, but check method attribute
    };
    return mapping[annotation] || 'GET';
  }
}
```

### 7.3 Spring Contract Types

```typescript
// packages/detectors/src/contracts/spring/types.ts

import type { ContractField, HttpMethod } from 'driftdetect-core';

export interface SpringEndpoint {
  /** HTTP method */
  method: HttpMethod;
  
  /** Original path as written */
  path: string;
  
  /** Normalized path for matching (/{id} → /:id) */
  normalizedPath: string;
  
  /** Source file */
  file: string;
  
  /** Line number */
  line: number;
  
  /** Response fields extracted from return type */
  responseFields: ContractField[];
  
  /** Request fields extracted from @RequestBody parameter */
  requestFields: ContractField[];
  
  /** Framework identifier */
  framework: 'spring-mvc';
  
  /** Controller class name */
  controller: string;
  
  /** Method name */
  action: string;
  
  /** Authorization annotations */
  authorization: SpringAuthInfo[];
}

export interface SpringControllerInfo {
  name: string;
  baseRoute: string | null;
  isRestController: boolean;
  file: string;
  line: number;
}

export interface SpringAuthInfo {
  type: 'PreAuthorize' | 'Secured' | 'RolesAllowed' | 'Anonymous';
  expression: string | null;
  roles: string[];
}

export interface SpringExtractionResult {
  endpoints: SpringEndpoint[];
  framework: 'spring-mvc';
  confidence: number;
  controllers: SpringControllerInfo[];
}
```

### 7.4 Type Mapping (Java → Contract)

```typescript
// packages/core/src/types/java-type-mapping.ts

/**
 * Map Java types to contract types for FE↔BE matching
 */
export const JAVA_TYPE_MAP: Record<string, string> = {
  // Primitives
  'String': 'string',
  'string': 'string',
  'int': 'number',
  'Integer': 'number',
  'long': 'number',
  'Long': 'number',
  'short': 'number',
  'Short': 'number',
  'float': 'number',
  'Float': 'number',
  'double': 'number',
  'Double': 'number',
  'boolean': 'boolean',
  'Boolean': 'boolean',
  'byte': 'number',
  'Byte': 'number',
  'char': 'string',
  'Character': 'string',
  
  // Date/Time
  'Date': 'string',
  'LocalDate': 'string',
  'LocalDateTime': 'string',
  'ZonedDateTime': 'string',
  'Instant': 'string',
  'OffsetDateTime': 'string',
  
  // Other common types
  'UUID': 'string',
  'BigDecimal': 'number',
  'BigInteger': 'number',
  'Object': 'any',
  'void': 'void',
  'Void': 'void',
};

/**
 * Map Java generic types to contract types
 */
export function mapJavaType(javaType: string): string {
  // Handle nullable (Optional<T>)
  const optionalMatch = javaType.match(/Optional<(.+)>/);
  if (optionalMatch) {
    return `${mapJavaType(optionalMatch[1])} | null`;
  }
  
  // Handle collections
  if (javaType.match(/^(List|Set|Collection|Iterable)<.+>$/) || javaType.endsWith('[]')) {
    const innerType = javaType.match(/<(.+)>/)?.[1] || javaType.replace('[]', '');
    return 'array';
  }
  
  // Handle maps
  if (javaType.match(/^Map<.+,.+>$/)) {
    return 'object';
  }
  
  // Handle ResponseEntity<T>
  const responseEntityMatch = javaType.match(/ResponseEntity<(.+)>/);
  if (responseEntityMatch) {
    return mapJavaType(responseEntityMatch[1]);
  }
  
  // Handle Page<T> (Spring Data)
  const pageMatch = javaType.match(/Page<(.+)>/);
  if (pageMatch) {
    return 'object'; // Page has content array + pagination metadata
  }
  
  // Direct mapping
  return JAVA_TYPE_MAP[javaType] || javaType.toLowerCase();
}
```


---

## 8. System Integration

### 8.1 CLI Integration

#### 8.1.1 Parser Command

```typescript
// packages/cli/src/commands/parser.ts - MODIFY

// Add Java to supported languages
const SUPPORTED_LANGUAGES = ['typescript', 'javascript', 'python', 'csharp', 'java'];

// Add Java parser info
case 'java':
  return {
    language: 'java',
    parser: 'tree-sitter-java',
    extensions: ['.java'],
    features: [
      'Full AST parsing',
      'Annotation extraction (first-class)',
      'Class/interface/enum/record extraction',
      'Method and field extraction',
      'Generic type support',
    ],
  };
```

#### 8.1.2 Scan Command

The scan command automatically recognizes `.java` files and routes them to the Java parser. No changes needed if the parser is properly registered.

#### 8.1.3 Status Command

```bash
$ drift status

Language Support:
  ✓ TypeScript/JavaScript (tree-sitter)
  ✓ Python (tree-sitter)
  ✓ C# (tree-sitter)
  ✓ Java (tree-sitter)          # NEW

Detected Frameworks:
  - Spring Boot 3.2.1
  - Spring Security 6.2.0
  - Spring Data JPA 3.2.1

Pattern Categories:
  structural: 847 patterns (94% consistent)
  api: 234 patterns (89% consistent)
  auth: 156 patterns (91% consistent)
  data-access: 423 patterns (87% consistent)
  ...
```

### 8.2 MCP Server Integration

#### 8.2.1 drift_patterns Tool

```typescript
// packages/mcp/src/server.ts - MODIFY

// drift_patterns returns Java patterns
{
  "patterns": [
    {
      "id": "spring/di-patterns/constructor_injection",
      "category": "structural",
      "subcategory": "dependency-injection",
      "confidence": 0.94,
      "occurrences": 847,
      "files": 156,
      "examples": [
        "UserService.java:15",
        "OrderService.java:12"
      ],
      "language": "java"
    }
  ]
}
```

#### 8.2.2 drift_examples Tool

```typescript
// Returns actual Java code examples
{
  "examples": [
    {
      "pattern": "spring/di-patterns/constructor_injection",
      "file": "src/main/java/com/example/service/UserService.java",
      "line": 15,
      "code": "@Service\npublic class UserService {\n    private final UserRepository userRepository;\n    private final EmailService emailService;\n\n    public UserService(UserRepository userRepository, EmailService emailService) {\n        this.userRepository = userRepository;\n        this.emailService = emailService;\n    }\n}",
      "language": "java"
    }
  ]
}
```

#### 8.2.3 drift_contracts Tool

```typescript
// Returns Spring endpoints matched against frontend
{
  "contracts": [
    {
      "status": "verified",
      "backend": {
        "method": "GET",
        "path": "/api/users/:id",
        "file": "UserController.java",
        "line": 45,
        "framework": "spring-mvc"
      },
      "frontend": {
        "method": "GET", 
        "path": "/api/users/:id",
        "file": "src/api/users.ts",
        "line": 23,
        "framework": "fetch"
      }
    },
    {
      "status": "mismatch",
      "backend": {
        "method": "POST",
        "path": "/api/users",
        "responseFields": ["id", "email", "name", "createdAt"]
      },
      "frontend": {
        "method": "POST",
        "path": "/api/users",
        "responseFields": ["id", "email", "name"]  // Missing createdAt!
      },
      "issues": ["Response field mismatch: backend returns 'createdAt' but frontend doesn't expect it"]
    }
  ]
}
```

#### 8.2.4 drift_pack Tool

```typescript
// New pack for Spring Boot projects
{
  "name": "spring-boot",
  "description": "Pattern pack for Spring Boot applications",
  "categories": ["structural", "api", "auth", "data-access", "testing"],
  "patterns": [
    // Curated patterns for Spring Boot context
  ]
}
```

### 8.3 Dashboard Integration

#### 8.3.1 Language Filter

```typescript
// packages/dashboard/src/client/components/patterns/constants.ts - MODIFY

export const SUPPORTED_LANGUAGES = [
  { value: 'all', label: 'All Languages' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'csharp', label: 'C#' },
  { value: 'java', label: 'Java' },  // NEW
];
```

#### 8.3.2 Pattern Display

Java patterns display with:
- Java syntax highlighting
- Spring-specific icons for categories
- Annotation-aware code snippets

### 8.4 LSP Integration

```typescript
// packages/lsp/src/server.ts - MODIFY

// Register Java document selector
const JAVA_SELECTOR: DocumentSelector = [
  { scheme: 'file', language: 'java' },
];

// Java diagnostics for pattern violations
connection.onDidChangeTextDocument((params) => {
  if (params.textDocument.uri.endsWith('.java')) {
    const diagnostics = analyzeJavaFile(params);
    connection.sendDiagnostics({ uri: params.textDocument.uri, diagnostics });
  }
});
```


---

## 9. Implementation Plan

### 9.1 Phase Overview

| Phase | Name | Duration | Deliverable |
|-------|------|----------|-------------|
| 1 | Parser Foundation | 1-2 weeks | Java files parse, basic structure extracted |
| 2 | Semantic Keywords | 2-3 weeks | Spring patterns detected, learning works |
| 3 | Contract Detection | 1-2 weeks | FE↔BE matching for Spring MVC |
| 4 | Full Integration | 1-2 weeks | CLI, MCP, Dashboard, LSP complete |

**Total: 5-9 weeks**

### 9.2 Phase 1: Parser Foundation

**Goal**: Java files are parseable and integrated into the system

#### 9.2.1 Tasks

| Task | Package | Files | Effort |
|------|---------|-------|--------|
| Add `'java'` to Language type | core | `parsers/types.ts` | S |
| Implement JavaParser class | core | `parsers/tree-sitter/tree-sitter-java-parser.ts` | L |
| Implement annotation extractor | core | `parsers/tree-sitter/java/annotation-extractor.ts` | M |
| Implement class extractor | core | `parsers/tree-sitter/java/class-extractor.ts` | M |
| Implement method extractor | core | `parsers/tree-sitter/java/method-extractor.ts` | M |
| Define Java types | core | `parsers/tree-sitter/java/types.ts` | M |
| Register parser in ParserManager | core | `parsers/parser-manager.ts` | S |
| Add Java to CLI parser command | cli | `commands/parser.ts` | S |
| Parser unit tests | core | `__tests__/tree-sitter-java-parser.test.ts` | M |

#### 9.2.2 Acceptance Criteria

- [ ] `drift parser info java` returns parser capabilities
- [ ] `drift scan` recognizes `.java` files
- [ ] Parser extracts classes, methods, fields, annotations
- [ ] Annotation arguments are correctly parsed
- [ ] Parse time < 100ms for typical files
- [ ] All parser tests pass

### 9.3 Phase 2: Semantic Keywords & Learning

**Goal**: Spring patterns are detected and learning establishes baselines

#### 9.3.1 Tasks

| Task | Package | Files | Effort |
|------|---------|-------|--------|
| Define keyword groups | detectors | `spring/keywords.ts` | M |
| Structural semantic detector | detectors | `spring/structural-semantic.ts` | M |
| Structural learning detector | detectors | `spring/structural-learning.ts` | M |
| API semantic detector | detectors | `spring/api-semantic.ts` | M |
| API learning detector | detectors | `spring/api-learning.ts` | M |
| Auth semantic detector | detectors | `spring/auth-semantic.ts` | M |
| Auth learning detector | detectors | `spring/auth-learning.ts` | M |
| Data semantic detector | detectors | `spring/data-semantic.ts` | M |
| Data learning detector | detectors | `spring/data-learning.ts` | M |
| DI semantic detector | detectors | `spring/di-semantic.ts` | M |
| DI learning detector | detectors | `spring/di-learning.ts` | M |
| Config semantic detector | detectors | `spring/config-semantic.ts` | M |
| Config learning detector | detectors | `spring/config-learning.ts` | M |
| Validation semantic detector | detectors | `spring/validation-semantic.ts` | M |
| Validation learning detector | detectors | `spring/validation-learning.ts` | M |
| Errors semantic detector | detectors | `spring/errors-semantic.ts` | M |
| Errors learning detector | detectors | `spring/errors-learning.ts` | M |
| Logging semantic detector | detectors | `spring/logging-semantic.ts` | M |
| Logging learning detector | detectors | `spring/logging-learning.ts` | M |
| Testing semantic detector | detectors | `spring/testing-semantic.ts` | M |
| Testing learning detector | detectors | `spring/testing-learning.ts` | M |
| Transaction semantic detector | detectors | `spring/transaction-semantic.ts` | M |
| Transaction learning detector | detectors | `spring/transaction-learning.ts` | M |
| Register all detectors | detectors | `spring/index.ts` | S |
| Detector unit tests | detectors | `spring/__tests__/*.test.ts` | L |

#### 9.3.2 Acceptance Criteria

- [ ] All 24 detectors implemented and registered
- [ ] `drift scan` on Spring project finds patterns
- [ ] Learning establishes dominant patterns from frequency
- [ ] Outliers are flagged as potential violations
- [ ] `drift status` shows Spring pattern categories
- [ ] All detector tests pass

### 9.4 Phase 3: Contract Detection

**Goal**: Spring MVC endpoints are extracted and matched against frontend

#### 9.4.1 Tasks

| Task | Package | Files | Effort |
|------|---------|-------|--------|
| Define Spring contract types | detectors | `contracts/spring/types.ts` | M |
| Implement endpoint detector | detectors | `contracts/spring/spring-endpoint-detector.ts` | L |
| Implement DTO extractor | detectors | `contracts/spring/dto-extractor.ts` | M |
| Implement path normalizer | detectors | `contracts/spring/path-normalizer.ts` | S |
| Add Java type mapping | core | `types/java-type-mapping.ts` | M |
| Integrate with ContractMatcher | detectors | `contracts/contract-matcher.ts` | M |
| Contract detector tests | detectors | `contracts/spring/__tests__/*.test.ts` | M |

#### 9.4.2 Acceptance Criteria

- [ ] `drift contracts` shows Spring endpoints
- [ ] Endpoints are matched against React/TypeScript frontend
- [ ] Path normalization works (`/{id}` → `:id`)
- [ ] Request/response types are extracted
- [ ] Mismatches are detected and reported
- [ ] All contract tests pass

### 9.5 Phase 4: Full Integration

**Goal**: Java is a first-class citizen across all tools

#### 9.5.1 Tasks

| Task | Package | Files | Effort |
|------|---------|-------|--------|
| MCP drift_patterns Java support | mcp | `server.ts` | M |
| MCP drift_examples Java support | mcp | `server.ts` | M |
| MCP drift_contracts Java support | mcp | `server.ts` | M |
| MCP drift_pack spring-boot pack | mcp | `packs.ts` | M |
| Dashboard language filter | dashboard | `components/patterns/constants.ts` | S |
| Dashboard Java syntax highlighting | dashboard | `components/patterns/CodeBlock.tsx` | M |
| LSP Java document support | lsp | `server.ts` | M |
| Demo Spring Boot project | demo | `spring-backend/` | L |
| Integration tests | all | Various | L |
| Documentation | docs | `README.md`, guides | M |

#### 9.5.2 Acceptance Criteria

- [ ] All MCP tools return Java patterns/examples
- [ ] Dashboard displays Java patterns correctly
- [ ] LSP provides real-time Java diagnostics
- [ ] Demo project demonstrates all features
- [ ] Documentation is complete
- [ ] All integration tests pass


---

## 10. Testing Strategy

### 10.1 Test Categories

| Category | Purpose | Location |
|----------|---------|----------|
| Unit Tests | Test individual components in isolation | `__tests__/*.test.ts` |
| Integration Tests | Test component interactions | `__tests__/*.integration.test.ts` |
| Snapshot Tests | Verify parser output stability | `__tests__/*.snapshot.test.ts` |
| Property Tests | Verify invariants hold for all inputs | `__tests__/*.property.test.ts` |

### 10.2 Parser Tests

```typescript
// packages/core/src/parsers/tree-sitter/__tests__/tree-sitter-java-parser.test.ts

describe('JavaParser', () => {
  describe('annotation extraction', () => {
    it('extracts simple annotation', () => {
      const source = `
        @Service
        public class UserService { }
      `;
      const result = parser.parse(source);
      
      expect(result.classes[0].annotations).toHaveLength(1);
      expect(result.classes[0].annotations[0].name).toBe('Service');
    });

    it('extracts annotation with single value', () => {
      const source = `
        @RequestMapping("/api/users")
        public class UserController { }
      `;
      const result = parser.parse(source);
      
      expect(result.classes[0].annotations[0].arguments[0].value).toBe('/api/users');
    });

    it('extracts annotation with named arguments', () => {
      const source = `
        @Transactional(readOnly = true, propagation = Propagation.REQUIRED)
        public void findAll() { }
      `;
      const result = parser.parse(source);
      
      const anno = result.classes[0].methods[0].annotations[0];
      expect(anno.arguments).toContainEqual({ name: 'readOnly', value: 'true', valueType: 'boolean' });
    });

    it('extracts multiple annotations on same element', () => {
      const source = `
        @GetMapping("/{id}")
        @PreAuthorize("hasRole('ADMIN')")
        @Cacheable("users")
        public User getUser(@PathVariable Long id) { }
      `;
      const result = parser.parse(source);
      
      expect(result.classes[0].methods[0].annotations).toHaveLength(3);
    });

    it('extracts parameter annotations', () => {
      const source = `
        public void createUser(@RequestBody @Valid CreateUserRequest request) { }
      `;
      const result = parser.parse(source);
      
      const param = result.classes[0].methods[0].parameters[0];
      expect(param.annotations).toHaveLength(2);
      expect(param.annotations.map(a => a.name)).toContain('RequestBody');
      expect(param.annotations.map(a => a.name)).toContain('Valid');
    });
  });

  describe('class extraction', () => {
    it('extracts class with inheritance', () => {
      const source = `
        public class UserController extends BaseController implements Auditable {
        }
      `;
      const result = parser.parse(source);
      
      expect(result.classes[0].superclass).toBe('BaseController');
      expect(result.classes[0].interfaces).toContain('Auditable');
    });

    it('extracts generic class', () => {
      const source = `
        public class GenericRepository<T extends Entity, ID> {
        }
      `;
      const result = parser.parse(source);
      
      expect(result.classes[0].typeParameters).toEqual(['T extends Entity', 'ID']);
    });
  });

  describe('method extraction', () => {
    it('extracts method with generic return type', () => {
      const source = `
        public ResponseEntity<List<UserDto>> getUsers() { }
      `;
      const result = parser.parse(source);
      
      expect(result.classes[0].methods[0].returnType).toBe('ResponseEntity<List<UserDto>>');
    });

    it('extracts throws clause', () => {
      const source = `
        public void process() throws IOException, ValidationException { }
      `;
      const result = parser.parse(source);
      
      expect(result.classes[0].methods[0].throwsTypes).toEqual(['IOException', 'ValidationException']);
    });
  });
});
```

### 10.3 Detector Tests

```typescript
// packages/detectors/src/spring/__tests__/di-semantic.test.ts

describe('SpringDISemanticDetector', () => {
  const detector = createSpringDISemanticDetector();

  it('finds @Autowired field injection', async () => {
    const context = createTestContext(`
      @Service
      public class UserService {
        @Autowired
        private UserRepository userRepository;
      }
    `, 'UserService.java');

    const result = await detector.detect(context);
    
    expect(result.patterns).toHaveLength(1);
    expect(result.patterns[0].patternId).toContain('di-patterns');
  });

  it('finds constructor injection', async () => {
    const context = createTestContext(`
      @Service
      @RequiredArgsConstructor
      public class UserService {
        private final UserRepository userRepository;
      }
    `, 'UserService.java');

    const result = await detector.detect(context);
    
    expect(result.patterns).toHaveLength(1);
  });

  it('does not flag patterns in test files', async () => {
    const context = createTestContext(`
      @Autowired
      private MockMvc mockMvc;
    `, 'UserServiceTest.java', { isTestFile: true });

    const result = await detector.detect(context);
    
    expect(result.patterns).toHaveLength(0);
  });
});
```

### 10.4 Contract Tests

```typescript
// packages/detectors/src/contracts/spring/__tests__/spring-endpoint-detector.test.ts

describe('SpringEndpointDetector', () => {
  const detector = new SpringEndpointDetector();

  it('extracts GET endpoint', () => {
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

    const result = detector.extractEndpoints(content, 'UserController.java');
    
    expect(result.endpoints).toHaveLength(1);
    expect(result.endpoints[0]).toMatchObject({
      method: 'GET',
      path: '/api/users/{id}',
      normalizedPath: '/api/users/:id',
      controller: 'UserController',
      action: 'getUser',
    });
  });

  it('extracts POST endpoint with request body', () => {
    const content = `
      @RestController
      @RequestMapping("/api/users")
      public class UserController {
        @PostMapping
        public ResponseEntity<UserDto> createUser(@RequestBody @Valid CreateUserRequest request) {
          return ResponseEntity.ok(userService.create(request));
        }
      }
    `;

    const result = detector.extractEndpoints(content, 'UserController.java');
    
    expect(result.endpoints[0]).toMatchObject({
      method: 'POST',
      path: '/api/users',
    });
    expect(result.endpoints[0].requestFields.length).toBeGreaterThan(0);
  });

  it('extracts authorization annotations', () => {
    const content = `
      @RestController
      public class AdminController {
        @GetMapping("/admin/users")
        @PreAuthorize("hasRole('ADMIN')")
        public List<UserDto> getAllUsers() { }
      }
    `;

    const result = detector.extractEndpoints(content, 'AdminController.java');
    
    expect(result.endpoints[0].authorization).toContainEqual({
      type: 'PreAuthorize',
      expression: "hasRole('ADMIN')",
      roles: ['ADMIN'],
    });
  });

  it('normalizes path with regex constraints', () => {
    const content = `
      @RestController
      public class UserController {
        @GetMapping("/users/{id:\\\\d+}")
        public UserDto getUser(@PathVariable Long id) { }
      }
    `;

    const result = detector.extractEndpoints(content, 'UserController.java');
    
    expect(result.endpoints[0].normalizedPath).toBe('/users/:id');
  });
});
```

### 10.5 Integration Tests

```typescript
// packages/cli/src/__tests__/java-integration.test.ts

describe('Java Integration', () => {
  it('scans Spring Boot project end-to-end', async () => {
    const result = await runCLI(['scan', '--path', 'demo/spring-backend']);
    
    expect(result.exitCode).toBe(0);
    expect(result.patterns.length).toBeGreaterThan(0);
    expect(result.patterns.some(p => p.category === 'structural')).toBe(true);
    expect(result.patterns.some(p => p.category === 'api')).toBe(true);
  });

  it('detects contracts between Spring and React', async () => {
    const result = await runCLI(['contracts', '--backend', 'demo/spring-backend', '--frontend', 'demo/frontend']);
    
    expect(result.contracts.verified.length).toBeGreaterThan(0);
  });

  it('MCP server returns Java patterns', async () => {
    const response = await mcpClient.call('drift_patterns', { 
      categories: ['structural'],
      language: 'java'
    });
    
    expect(response.patterns.length).toBeGreaterThan(0);
    expect(response.patterns[0].language).toBe('java');
  });
});
```

### 10.6 Demo Project

A sample Spring Boot project will be created at `demo/spring-backend/` with:

```
demo/spring-backend/
├── src/main/java/com/example/
│   ├── DemoApplication.java
│   ├── config/
│   │   ├── SecurityConfig.java
│   │   └── WebConfig.java
│   ├── controller/
│   │   ├── UserController.java
│   │   ├── ProductController.java
│   │   └── OrderController.java
│   ├── service/
│   │   ├── UserService.java
│   │   ├── ProductService.java
│   │   └── OrderService.java
│   ├── repository/
│   │   ├── UserRepository.java
│   │   ├── ProductRepository.java
│   │   └── OrderRepository.java
│   ├── model/
│   │   ├── User.java
│   │   ├── Product.java
│   │   └── Order.java
│   └── dto/
│       ├── UserDto.java
│       ├── CreateUserRequest.java
│       └── ...
├── src/test/java/com/example/
│   ├── controller/
│   │   └── UserControllerTest.java
│   └── service/
│       └── UserServiceTest.java
├── pom.xml
└── README.md
```

This demo will include:
- Intentional pattern variations (some field injection, some constructor injection)
- Multiple auth annotation styles
- Various test patterns
- Endpoints that match the existing React frontend demo

---

## Appendix A: Detector Reference

### A.1 Complete Detector List

| ID | Category | Type | Keywords (sample) |
|----|----------|------|-------------------|
| `spring/structural-semantic` | structural | semantic | @Component, @Service, @Repository |
| `spring/structural-learning` | structural | learning | (same) |
| `spring/api-semantic` | api | semantic | @GetMapping, @PostMapping, @RequestBody |
| `spring/api-learning` | api | learning | (same) |
| `spring/auth-semantic` | auth | semantic | @PreAuthorize, @Secured, hasRole |
| `spring/auth-learning` | auth | learning | (same) |
| `spring/data-semantic` | data-access | semantic | @Repository, @Query, @Entity |
| `spring/data-learning` | data-access | learning | (same) |
| `spring/di-semantic` | structural | semantic | @Autowired, @Bean, @Qualifier |
| `spring/di-learning` | structural | learning | (same) |
| `spring/config-semantic` | config | semantic | @Value, @ConfigurationProperties |
| `spring/config-learning` | config | learning | (same) |
| `spring/validation-semantic` | security | semantic | @Valid, @NotNull, @Size |
| `spring/validation-learning` | security | learning | (same) |
| `spring/errors-semantic` | errors | semantic | @ExceptionHandler, @ControllerAdvice |
| `spring/errors-learning` | errors | learning | (same) |
| `spring/logging-semantic` | logging | semantic | Logger, log.info, MDC |
| `spring/logging-learning` | logging | learning | (same) |
| `spring/testing-semantic` | testing | semantic | @SpringBootTest, @MockBean |
| `spring/testing-learning` | testing | learning | (same) |
| `spring/transaction-semantic` | data-access | semantic | @Transactional, Propagation |
| `spring/transaction-learning` | data-access | learning | (same) |
| `spring/async-semantic` | performance | semantic | @Async, @Scheduled |
| `spring/async-learning` | performance | learning | (same) |
| `contracts/spring-endpoints` | api | contract | (endpoint extraction) |

**Total: 25 detectors**

### A.2 Future Enhancements

| Enhancement | Description | Priority |
|-------------|-------------|----------|
| Kotlin support | Same Spring patterns, different syntax | High |
| WebFlux reactive | Mono, Flux, reactive patterns | Medium |
| Spring Cloud | Feign, circuit breakers, config server | Medium |
| Spring Batch | Batch job patterns | Low |
| Gradle/Maven analysis | Build file pattern detection | Low |

---

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| Semantic Detector | Detector that finds patterns using keyword-based discovery |
| Learning Detector | Detector that establishes "normal" from frequency analysis |
| Dominant Pattern | The most common pattern in a category (by occurrence count) |
| Outlier | A pattern usage that differs from the dominant pattern |
| Contract | API endpoint definition that can be matched FE↔BE |
| Keyword Group | Set of related keywords for a pattern category |

---

*End of Design Specification*
