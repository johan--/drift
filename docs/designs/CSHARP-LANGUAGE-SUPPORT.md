# C# Language Support Design Specification

**Version**: 1.0  
**Status**: Draft  
**Author**: Drift Team  
**Date**: January 2026  

## Executive Summary

This document specifies the design for adding comprehensive C# (.NET) language support to Drift. The implementation will provide full parity with existing TypeScript/Python support, including:

- Tree-sitter based C# parser with semantic extraction
- 86 C#-specific pattern detectors across 13 categories
- ASP.NET Core ↔ React/TypeScript contract detection
- Integration with existing semantic and learning detector infrastructure

## Table of Contents

1. [Goals and Non-Goals](#1-goals-and-non-goals)
2. [Architecture Overview](#2-architecture-overview)
3. [Parser Implementation](#3-parser-implementation)
4. [Detector Categories](#4-detector-categories)
5. [Contract Detection](#5-contract-detection)
6. [Type System Integration](#6-type-system-integration)
7. [Implementation Plan](#7-implementation-plan)
8. [Testing Strategy](#8-testing-strategy)
9. [Appendix: Detector Specifications](#appendix-detector-specifications)

---

## 1. Goals and Non-Goals

### 1.1 Goals

- **G1**: Parse C# source files using tree-sitter-c-sharp with full AST extraction
- **G2**: Extract semantic information: classes, records, methods, properties, attributes
- **G3**: Implement 86 C#-specific detectors matching TypeScript/Python parity
- **G4**: Detect ASP.NET Core API endpoints for contract matching with React frontends
- **G5**: Support .NET 6+ patterns including records, nullable reference types, minimal APIs
- **G6**: Integrate with existing semantic detectors (language-agnostic)
- **G7**: Maintain <100ms parse time for typical C# files

### 1.2 Non-Goals

- **NG1**: Full Roslyn integration (tree-sitter is sufficient for pattern detection)
- **NG2**: C# compilation or type checking (we detect patterns, not compile)
- **NG3**: Support for C# versions before .NET 6 (focus on modern patterns)
- **NG4**: F# or VB.NET support (separate future effort)


---

## 2. Architecture Overview

### 2.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Drift Core                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐  │
│  │  ParserManager   │───▶│   CSharpParser   │───▶│ tree-sitter-c#   │  │
│  └──────────────────┘    └──────────────────┘    └──────────────────┘  │
│           │                       │                                      │
│           │                       ▼                                      │
│           │              ┌──────────────────┐                           │
│           │              │ CSharpParseResult│                           │
│           │              │  - classes       │                           │
│           │              │  - records       │                           │
│           │              │  - methods       │                           │
│           │              │  - attributes    │                           │
│           │              │  - usings        │                           │
│           │              └──────────────────┘                           │
│           │                       │                                      │
│           ▼                       ▼                                      │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                      Detector Registry                            │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │                                                                    │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │  │
│  │  │ AST-based   │  │  Semantic   │  │  Learning   │               │  │
│  │  │ Detectors   │  │  Detectors  │  │  Detectors  │               │  │
│  │  │ (C#-only)   │  │ (all langs) │  │ (all langs) │               │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘               │  │
│  │         │                │                │                        │  │
│  │         └────────────────┴────────────────┘                        │  │
│  │                          │                                          │  │
│  │                          ▼                                          │  │
│  │                 ┌──────────────────┐                               │  │
│  │                 │  PatternStore    │                               │  │
│  │                 └──────────────────┘                               │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Integration Points

| Component | Integration Method | Notes |
|-----------|-------------------|-------|
| ParserManager | `registerParser()` | Add C# to extension mapping |
| Language type | Union extension | Add `'csharp'` to Language type |
| DetectorRegistry | `registerDetectors()` | Register C# detectors |
| SemanticDetector | `supportedLanguages` | Add `'csharp'` to existing detectors |
| ContractMatcher | Backend detector | Add ASP.NET Core endpoint extraction |

### 2.3 File Structure

```
packages/
├── core/src/
│   ├── parsers/
│   │   ├── csharp-parser.ts          # NEW: C# parser implementation
│   │   ├── csharp-parser.test.ts     # NEW: Parser tests
│   │   ├── types.ts                  # MODIFY: Add 'csharp' to Language
│   │   └── parser-manager.ts         # MODIFY: Add .cs extension mapping
│   └── types/
│       └── common.ts                 # MODIFY: Add C# type mappings
│
├── detectors/src/
│   ├── api/
│   │   ├── aspnet-routes.ts          # NEW: ASP.NET route detection
│   │   ├── aspnet-routes-learning.ts # NEW: Learning variant
│   │   ├── minimal-api.ts            # NEW: Minimal API patterns
│   │   └── ... (existing files)      # MODIFY: Add C# support
│   ├── auth/
│   │   ├── authorize-attribute.ts    # NEW: [Authorize] patterns
│   │   ├── identity-patterns.ts      # NEW: ASP.NET Identity
│   │   └── ... (existing files)      # MODIFY: Add C# keywords
│   ├── data-access/
│   │   ├── efcore-patterns.ts        # NEW: Entity Framework Core
│   │   ├── efcore-learning.ts        # NEW: Learning variant
│   │   └── ... (existing files)      # MODIFY: Add C# support
│   ├── contracts/
│   │   ├── aspnet-endpoint-detector.ts  # NEW: ASP.NET endpoint extraction
│   │   └── ... (existing files)
│   └── ... (other categories)
```


---

## 3. Parser Implementation

### 3.1 CSharpParser Class

```typescript
/**
 * C# Parser - C# parsing using tree-sitter-c-sharp
 *
 * Extracts usings, namespaces, classes, records, structs, interfaces,
 * methods, properties, fields, and attributes from C# files.
 *
 * @requirements 3.2 - Support C# language
 */
export class CSharpParser extends BaseParser {
  readonly language: Language = 'csharp';
  readonly extensions: string[] = ['.cs'];

  parse(source: string, filePath?: string): CSharpParseResult;
  query(ast: AST, pattern: string): ASTNode[];
}
```

### 3.2 CSharpParseResult Interface

```typescript
export interface CSharpParseResult extends ParseResult {
  /** Using directives */
  usings: UsingInfo[];
  
  /** Namespace declarations */
  namespaces: NamespaceInfo[];
  
  /** Class declarations (including partial) */
  classes: CSharpClassInfo[];
  
  /** Record declarations */
  records: RecordInfo[];
  
  /** Struct declarations */
  structs: StructInfo[];
  
  /** Interface declarations */
  interfaces: CSharpInterfaceInfo[];
  
  /** Enum declarations */
  enums: EnumInfo[];
  
  /** Top-level statements (for minimal APIs) */
  topLevelStatements: StatementInfo[];
  
  /** Global using directives */
  globalUsings: UsingInfo[];
}
```

### 3.3 Semantic Extraction Types

```typescript
/** Using directive information */
export interface UsingInfo {
  namespace: string;
  alias: string | null;
  isStatic: boolean;
  isGlobal: boolean;
  startPosition: Position;
  endPosition: Position;
}

/** Class information */
export interface CSharpClassInfo {
  name: string;
  namespace: string | null;
  isExported: boolean;        // public
  isAbstract: boolean;
  isSealed: boolean;
  isStatic: boolean;
  isPartial: boolean;
  baseClass: string | null;
  interfaces: string[];
  attributes: AttributeInfo[];
  methods: MethodInfo[];
  properties: PropertyInfo[];
  fields: FieldInfo[];
  constructors: ConstructorInfo[];
  genericParameters: string[];
  startPosition: Position;
  endPosition: Position;
}

/** Record information */
export interface RecordInfo {
  name: string;
  namespace: string | null;
  isClass: boolean;           // record class vs record struct
  primaryConstructorParams: ParameterInfo[];
  attributes: AttributeInfo[];
  properties: PropertyInfo[];
  methods: MethodInfo[];
  genericParameters: string[];
  startPosition: Position;
  endPosition: Position;
}

/** Attribute information */
export interface AttributeInfo {
  name: string;
  arguments: AttributeArgument[];
  target: 'class' | 'method' | 'property' | 'parameter' | 'return' | 'assembly';
  startPosition: Position;
  endPosition: Position;
}

/** Method information */
export interface MethodInfo {
  name: string;
  returnType: string;
  parameters: ParameterInfo[];
  attributes: AttributeInfo[];
  isAsync: boolean;
  isStatic: boolean;
  isVirtual: boolean;
  isOverride: boolean;
  isAbstract: boolean;
  accessibility: 'public' | 'private' | 'protected' | 'internal' | 'protected internal';
  genericParameters: string[];
  startPosition: Position;
  endPosition: Position;
}

/** Property information */
export interface PropertyInfo {
  name: string;
  type: string;
  hasGetter: boolean;
  hasSetter: boolean;
  isInit: boolean;            // init-only setter
  isRequired: boolean;        // required modifier
  attributes: AttributeInfo[];
  accessibility: 'public' | 'private' | 'protected' | 'internal';
  startPosition: Position;
  endPosition: Position;
}
```

### 3.4 Tree-sitter Integration

```typescript
import Parser from 'tree-sitter';
import CSharp from 'tree-sitter-c-sharp';

export class CSharpParser extends BaseParser {
  private parser: Parser;
  
  constructor() {
    super();
    this.parser = new Parser();
    this.parser.setLanguage(CSharp);
  }
  
  parse(source: string, filePath?: string): CSharpParseResult {
    const tree = this.parser.parse(source);
    const rootNode = this.convertNode(tree.rootNode, source);
    const ast = this.createAST(rootNode, source);
    
    // Extract semantic information
    const usings = this.extractUsings(tree.rootNode);
    const namespaces = this.extractNamespaces(tree.rootNode);
    const classes = this.extractClasses(tree.rootNode);
    const records = this.extractRecords(tree.rootNode);
    // ... etc
    
    return {
      ...this.createSuccessResult(ast),
      usings,
      namespaces,
      classes,
      records,
      // ... etc
    };
  }
}
```

### 3.5 AST Node Type Mappings

| C# Construct | tree-sitter Node Type | Drift AST Type |
|--------------|----------------------|----------------|
| class | `class_declaration` | `ClassDeclaration` |
| record | `record_declaration` | `RecordDeclaration` |
| struct | `struct_declaration` | `StructDeclaration` |
| interface | `interface_declaration` | `InterfaceDeclaration` |
| method | `method_declaration` | `MethodDeclaration` |
| property | `property_declaration` | `PropertyDeclaration` |
| attribute | `attribute` | `Attribute` |
| using | `using_directive` | `UsingDirective` |
| namespace | `namespace_declaration` | `NamespaceDeclaration` |


---

## 4. Detector Categories

### 4.1 Category Overview

| Category | New Detectors | Modified Detectors | Total |
|----------|---------------|-------------------|-------|
| api | 4 | 3 | 7 |
| auth | 5 | 3 | 8 |
| data-access | 5 | 3 | 8 |
| errors | 4 | 3 | 7 |
| logging | 4 | 4 | 8 |
| security | 4 | 3 | 7 |
| config | 4 | 2 | 6 |
| testing | 5 | 3 | 8 |
| types | 4 | 2 | 6 |
| structural | 5 | 3 | 8 |
| performance | 4 | 2 | 6 |
| documentation | 3 | 2 | 5 |
| contracts | 2 | 0 | 2 |
| **Total** | **53** | **33** | **86** |

### 4.2 API Detectors

#### 4.2.1 aspnet-routes (NEW)

**Purpose**: Detect ASP.NET Core controller route patterns

**Patterns Detected**:
- `[Route("api/[controller]")]` class-level routing
- `[HttpGet]`, `[HttpPost]`, etc. action-level routing
- `[Route("{id}")]` parameter routing
- Route constraints `[Route("{id:int}")]`

**Implementation Type**: AST Detector

```typescript
export class AspNetRoutesDetector extends ASTDetector {
  readonly id = 'api/aspnet-routes';
  readonly category = 'api';
  readonly subcategory = 'route-structure';
  readonly supportedLanguages: Language[] = ['csharp'];
  
  protected getASTPatterns(): ASTPattern[] {
    return [
      { type: 'attribute', text: /Route|Http(Get|Post|Put|Patch|Delete)/ },
    ];
  }
}
```

#### 4.2.2 minimal-api (NEW)

**Purpose**: Detect .NET 6+ Minimal API patterns

**Patterns Detected**:
- `app.MapGet("/api/...", handler)`
- `app.MapPost("/api/...", handler)`
- Route groups `app.MapGroup("/api")`
- Endpoint filters

**Implementation Type**: AST Detector

#### 4.2.3 aspnet-response-types (NEW)

**Purpose**: Detect response type patterns

**Patterns Detected**:
- `ActionResult<T>` return types
- `IActionResult` patterns
- `[ProducesResponseType]` attributes
- `Results.Ok()`, `Results.NotFound()` patterns

#### 4.2.4 aspnet-model-binding (NEW)

**Purpose**: Detect model binding patterns

**Patterns Detected**:
- `[FromBody]`, `[FromQuery]`, `[FromRoute]`
- `[FromServices]` DI injection
- `[FromForm]` form binding
- Custom model binders

### 4.3 Auth Detectors

#### 4.3.1 authorize-attribute (NEW)

**Purpose**: Detect authorization attribute patterns

**Patterns Detected**:
- `[Authorize]` basic authorization
- `[Authorize(Roles = "Admin")]` role-based
- `[Authorize(Policy = "...")]` policy-based
- `[AllowAnonymous]` exceptions

**Semantic Keywords** (for existing semantic detector):
```typescript
const CSHARP_AUTH_KEYWORDS = [
  'Authorize', 'AllowAnonymous', 'AuthorizeAttribute',
  'ClaimsPrincipal', 'User.Identity', 'User.IsInRole',
  'IAuthorizationHandler', 'AuthorizationPolicy',
  'RequireRole', 'RequireClaim', 'RequireAssertion',
];
```

#### 4.3.2 identity-patterns (NEW)

**Purpose**: Detect ASP.NET Identity patterns

**Patterns Detected**:
- `UserManager<T>` usage
- `SignInManager<T>` usage
- `IdentityUser` extensions
- Password hashing patterns

#### 4.3.3 jwt-patterns (NEW)

**Purpose**: Detect JWT authentication patterns

**Patterns Detected**:
- `JwtBearerDefaults.AuthenticationScheme`
- Token validation parameters
- Claims extraction patterns
- Token generation patterns

#### 4.3.4 policy-handlers (NEW)

**Purpose**: Detect authorization policy patterns

**Patterns Detected**:
- `IAuthorizationHandler` implementations
- `AuthorizationHandler<T>` base class
- `IAuthorizationRequirement` implementations
- Policy registration in `AddAuthorization()`

#### 4.3.5 resource-authorization (NEW)

**Purpose**: Detect resource-based authorization

**Patterns Detected**:
- `IAuthorizationService.AuthorizeAsync()`
- Resource-based policy checks
- Ownership validation patterns

### 4.4 Data Access Detectors

#### 4.4.1 efcore-dbcontext (NEW)

**Purpose**: Detect Entity Framework Core DbContext patterns

**Patterns Detected**:
- `DbContext` inheritance
- `DbSet<T>` properties
- `OnModelCreating` configuration
- Connection string patterns

#### 4.4.2 efcore-queries (NEW)

**Purpose**: Detect EF Core query patterns

**Patterns Detected**:
- LINQ query patterns
- `Include()` / `ThenInclude()` eager loading
- `AsNoTracking()` usage
- Raw SQL patterns `FromSqlRaw()`

#### 4.4.3 efcore-migrations (NEW)

**Purpose**: Detect migration patterns

**Patterns Detected**:
- Migration class structure
- `Up()` / `Down()` methods
- Fluent API configuration
- Data seeding patterns

#### 4.4.4 repository-pattern-csharp (NEW)

**Purpose**: Detect repository pattern implementations

**Patterns Detected**:
- `IRepository<T>` interfaces
- Generic repository implementations
- Unit of Work patterns
- Specification pattern

#### 4.4.5 dapper-patterns (NEW)

**Purpose**: Detect Dapper usage patterns

**Patterns Detected**:
- `Query<T>()` / `QueryAsync<T>()`
- `Execute()` / `ExecuteAsync()`
- Parameterized queries
- Multi-mapping patterns


### 4.5 Error Handling Detectors

#### 4.5.1 exception-hierarchy-csharp (NEW)

**Purpose**: Detect custom exception class patterns

**Patterns Detected**:
- Custom exception classes extending `Exception`
- Exception constructors (message, inner exception)
- Serialization support
- Exception properties

#### 4.5.2 global-exception-handler (NEW)

**Purpose**: Detect global exception handling patterns

**Patterns Detected**:
- `IExceptionHandler` implementations (.NET 8+)
- Exception middleware patterns
- `UseExceptionHandler()` configuration
- `ProblemDetails` responses

#### 4.5.3 result-pattern (NEW)

**Purpose**: Detect Result/Either pattern usage

**Patterns Detected**:
- `Result<T>` / `Result<T, TError>` types
- `OneOf<T1, T2>` discriminated unions
- Error handling without exceptions
- Railway-oriented programming

#### 4.5.4 validation-exceptions (NEW)

**Purpose**: Detect validation exception patterns

**Patterns Detected**:
- `ValidationException` usage
- FluentValidation integration
- DataAnnotations validation
- Model state error handling

### 4.6 Logging Detectors

#### 4.6.1 ilogger-patterns (NEW)

**Purpose**: Detect `ILogger<T>` usage patterns

**Patterns Detected**:
- `ILogger<T>` injection
- Log level usage (Debug, Info, Warning, Error, Critical)
- Structured logging with templates
- Log scopes

**Semantic Keywords**:
```typescript
const CSHARP_LOGGING_KEYWORDS = [
  'ILogger', 'LogDebug', 'LogInformation', 'LogWarning', 'LogError', 'LogCritical',
  'BeginScope', 'LoggerMessage', 'LoggerFactory',
  'Serilog', 'NLog', 'Log4Net',
];
```

#### 4.6.2 serilog-patterns (NEW)

**Purpose**: Detect Serilog-specific patterns

**Patterns Detected**:
- Serilog configuration
- Enrichers usage
- Sink configuration
- Destructuring patterns

#### 4.6.3 high-performance-logging (NEW)

**Purpose**: Detect high-performance logging patterns

**Patterns Detected**:
- `LoggerMessage.Define()` source generators
- `[LoggerMessage]` attribute (.NET 6+)
- Avoiding boxing in log calls
- Conditional logging

#### 4.6.4 correlation-id-csharp (NEW)

**Purpose**: Detect correlation ID patterns

**Patterns Detected**:
- `Activity.Current?.Id`
- Custom correlation ID middleware
- Header propagation
- Distributed tracing integration

### 4.7 Security Detectors

#### 4.7.1 input-validation-csharp (NEW)

**Purpose**: Detect input validation patterns

**Patterns Detected**:
- DataAnnotations (`[Required]`, `[StringLength]`, etc.)
- FluentValidation validators
- Custom validation attributes
- Model state checking

#### 4.7.2 sql-injection-csharp (NEW)

**Purpose**: Detect SQL injection vulnerabilities

**Patterns Detected**:
- String concatenation in SQL (violation)
- Parameterized queries (correct)
- `FromSqlRaw` with interpolation (violation)
- `FromSqlInterpolated` (correct)

#### 4.7.3 secrets-management (NEW)

**Purpose**: Detect secrets management patterns

**Patterns Detected**:
- `IConfiguration` for secrets
- Azure Key Vault integration
- User secrets in development
- Hardcoded secrets (violation)

#### 4.7.4 cors-configuration (NEW)

**Purpose**: Detect CORS configuration patterns

**Patterns Detected**:
- `AddCors()` configuration
- Policy-based CORS
- `[EnableCors]` / `[DisableCors]` attributes
- Wildcard origins (warning)

### 4.8 Configuration Detectors

#### 4.8.1 options-pattern (NEW)

**Purpose**: Detect Options pattern usage

**Patterns Detected**:
- `IOptions<T>` injection
- `IOptionsSnapshot<T>` for reloadable config
- `IOptionsMonitor<T>` for change notifications
- Options validation

#### 4.8.2 configuration-binding (NEW)

**Purpose**: Detect configuration binding patterns

**Patterns Detected**:
- `Configuration.GetSection().Bind()`
- `Configure<T>()` registration
- Environment-specific configuration
- Configuration providers

#### 4.8.3 feature-flags-csharp (NEW)

**Purpose**: Detect feature flag patterns

**Patterns Detected**:
- `IFeatureManager` usage
- `[FeatureGate]` attribute
- Feature filter implementations
- Azure App Configuration integration

#### 4.8.4 environment-detection (NEW)

**Purpose**: Detect environment detection patterns

**Patterns Detected**:
- `IHostEnvironment.IsDevelopment()`
- `IWebHostEnvironment` usage
- Environment-specific branching
- `#if DEBUG` preprocessor directives

### 4.9 Testing Detectors

#### 4.9.1 xunit-patterns (NEW)

**Purpose**: Detect xUnit test patterns

**Patterns Detected**:
- `[Fact]` / `[Theory]` attributes
- `[InlineData]` / `[MemberData]` / `[ClassData]`
- `IClassFixture<T>` / `ICollectionFixture<T>`
- Test naming conventions

#### 4.9.2 nunit-patterns (NEW)

**Purpose**: Detect NUnit test patterns

**Patterns Detected**:
- `[Test]` / `[TestCase]` attributes
- `[SetUp]` / `[TearDown]` lifecycle
- `[TestFixture]` class attribute
- Constraint-based assertions

#### 4.9.3 moq-patterns (NEW)

**Purpose**: Detect Moq mocking patterns

**Patterns Detected**:
- `Mock<T>` creation
- `Setup()` / `Verify()` patterns
- `It.IsAny<T>()` matchers
- Callback patterns

#### 4.9.4 integration-test-patterns (NEW)

**Purpose**: Detect integration test patterns

**Patterns Detected**:
- `WebApplicationFactory<T>` usage
- `IClassFixture<WebApplicationFactory<T>>`
- Test server configuration
- Database fixture patterns

#### 4.9.5 fluent-assertions (NEW)

**Purpose**: Detect FluentAssertions patterns

**Patterns Detected**:
- `.Should().Be()` patterns
- Collection assertions
- Exception assertions
- Object graph comparison


### 4.10 Type System Detectors

#### 4.10.1 record-patterns (NEW)

**Purpose**: Detect record type usage patterns

**Patterns Detected**:
- `record` vs `record class` vs `record struct`
- Primary constructor parameters
- `with` expression usage
- Positional records

#### 4.10.2 nullable-patterns (NEW)

**Purpose**: Detect nullable reference type patterns

**Patterns Detected**:
- `#nullable enable` directives
- Null-forgiving operator `!`
- Null-conditional operators `?.` `??`
- `[NotNull]` / `[MaybeNull]` attributes

#### 4.10.3 generic-constraints (NEW)

**Purpose**: Detect generic constraint patterns

**Patterns Detected**:
- `where T : class` / `struct` / `new()`
- Interface constraints
- Base class constraints
- `notnull` constraint

#### 4.10.4 interface-patterns-csharp (NEW)

**Purpose**: Detect interface usage patterns

**Patterns Detected**:
- `I` prefix convention
- Default interface implementations
- Explicit interface implementation
- Interface segregation

### 4.11 Structural Detectors

#### 4.11.1 namespace-patterns (NEW)

**Purpose**: Detect namespace organization patterns

**Patterns Detected**:
- File-scoped namespaces (`namespace X;`)
- Block-scoped namespaces
- Namespace naming conventions
- Nested namespace patterns

#### 4.11.2 project-structure (NEW)

**Purpose**: Detect project organization patterns

**Patterns Detected**:
- Clean Architecture layers
- Vertical slice architecture
- Feature folders
- Traditional N-tier structure

#### 4.11.3 dependency-injection-registration (NEW)

**Purpose**: Detect DI registration patterns

**Patterns Detected**:
- `AddScoped<T>()` / `AddTransient<T>()` / `AddSingleton<T>()`
- Extension method registration
- Assembly scanning
- Decorator patterns

#### 4.11.4 partial-classes (NEW)

**Purpose**: Detect partial class patterns

**Patterns Detected**:
- Partial class usage
- Source generator patterns
- Code-behind patterns
- Separation of concerns

#### 4.11.5 using-patterns (NEW)

**Purpose**: Detect using directive patterns

**Patterns Detected**:
- Global usings
- Using aliases
- Static usings
- Implicit usings

### 4.12 Performance Detectors

#### 4.12.1 async-patterns (NEW)

**Purpose**: Detect async/await patterns

**Patterns Detected**:
- `async Task` vs `async ValueTask`
- `ConfigureAwait(false)` usage
- Async void (warning)
- `Task.Run()` patterns

#### 4.12.2 caching-patterns-csharp (NEW)

**Purpose**: Detect caching patterns

**Patterns Detected**:
- `IMemoryCache` usage
- `IDistributedCache` usage
- Cache-aside pattern
- Cache invalidation patterns

#### 4.12.3 span-memory-patterns (NEW)

**Purpose**: Detect Span/Memory patterns

**Patterns Detected**:
- `Span<T>` / `ReadOnlySpan<T>` usage
- `Memory<T>` / `ReadOnlyMemory<T>` usage
- Stackalloc patterns
- ArrayPool usage

#### 4.12.4 cancellation-patterns (NEW)

**Purpose**: Detect CancellationToken patterns

**Patterns Detected**:
- `CancellationToken` parameter passing
- `ThrowIfCancellationRequested()`
- Linked cancellation tokens
- Timeout patterns

### 4.13 Documentation Detectors

#### 4.13.1 xml-documentation (NEW)

**Purpose**: Detect XML documentation patterns

**Patterns Detected**:
- `/// <summary>` comments
- `<param>`, `<returns>`, `<exception>` tags
- `<inheritdoc/>` usage
- Documentation coverage

#### 4.13.2 obsolete-patterns (NEW)

**Purpose**: Detect deprecation patterns

**Patterns Detected**:
- `[Obsolete]` attribute usage
- Deprecation messages
- Error vs warning obsolete
- Migration guidance

#### 4.13.3 code-comments (NEW)

**Purpose**: Detect code comment patterns

**Patterns Detected**:
- TODO/FIXME/HACK comments
- Region usage
- Comment density
- Commented-out code (warning)


---

## 5. Contract Detection

### 5.1 ASP.NET Core Endpoint Extraction

The contract detection system needs to extract API endpoints from ASP.NET Core backends to match against React/TypeScript frontend API calls.

#### 5.1.1 Controller-Based APIs

```csharp
// Example: Traditional Controller
[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetUsers()
    
    [HttpGet("{id}")]
    public async Task<ActionResult<UserDto>> GetUser(int id)
    
    [HttpPost]
    public async Task<ActionResult<UserDto>> CreateUser([FromBody] CreateUserRequest request)
}
```

**Extraction Logic**:
1. Find classes with `[ApiController]` or inheriting `ControllerBase`
2. Extract class-level `[Route]` attribute
3. For each method with `[Http*]` attribute:
   - Extract HTTP method
   - Combine class route with method route
   - Extract parameters (`[FromBody]`, `[FromQuery]`, `[FromRoute]`)
   - Extract return type from `ActionResult<T>` or `Task<ActionResult<T>>`

#### 5.1.2 Minimal APIs

```csharp
// Example: Minimal API
var app = builder.Build();

app.MapGet("/api/users", async (IUserService service) => 
    await service.GetAllAsync());

app.MapGet("/api/users/{id}", async (int id, IUserService service) => 
    await service.GetByIdAsync(id));

app.MapPost("/api/users", async (CreateUserRequest request, IUserService service) => 
    await service.CreateAsync(request));
```

**Extraction Logic**:
1. Find `app.Map*()` calls
2. Extract HTTP method from method name
3. Extract route from first string argument
4. Extract parameters from lambda parameters
5. Infer return type from lambda body

#### 5.1.3 AspNetEndpointDetector Implementation

```typescript
export class AspNetEndpointDetector extends BaseDetector {
  readonly id = 'contracts/aspnet-endpoints';
  readonly category = 'contracts';
  readonly supportedLanguages: Language[] = ['csharp'];

  async detect(context: DetectionContext): Promise<BackendExtractionResult> {
    const endpoints: ExtractedEndpoint[] = [];
    
    // Extract from controllers
    const controllers = this.findControllers(context);
    for (const controller of controllers) {
      endpoints.push(...this.extractControllerEndpoints(controller, context));
    }
    
    // Extract from minimal APIs
    const minimalApiCalls = this.findMinimalApiCalls(context);
    for (const call of minimalApiCalls) {
      endpoints.push(...this.extractMinimalApiEndpoint(call, context));
    }
    
    return { endpoints, language: 'csharp' };
  }
}
```

### 5.2 Type Extraction for Contracts

#### 5.2.1 DTO/Model Extraction

```csharp
// Example: Request/Response DTOs
public record CreateUserRequest(
    string Email,
    string Name,
    string? PhoneNumber
);

public record UserDto(
    int Id,
    string Email,
    string Name,
    string? PhoneNumber,
    DateTime CreatedAt
);
```

**Extraction Logic**:
1. Find record/class definitions referenced in endpoints
2. Extract properties with types
3. Detect nullable types (`string?`)
4. Map C# types to contract types

#### 5.2.2 Type Mapping

| C# Type | Contract Type | Notes |
|---------|--------------|-------|
| `string` | `string` | |
| `int`, `long`, `short` | `number` | |
| `float`, `double`, `decimal` | `number` | |
| `bool` | `boolean` | |
| `DateTime`, `DateTimeOffset` | `string` | ISO 8601 format |
| `Guid` | `string` | UUID format |
| `T?` | `T \| null` | Nullable |
| `List<T>`, `IEnumerable<T>` | `T[]` | Arrays |
| `Dictionary<K,V>` | `Record<K,V>` | Objects |

### 5.3 Contract Matching

The existing `ContractMatcher` will be extended to handle ASP.NET Core endpoints:

```typescript
// Path normalization
// ASP.NET: /api/users/{id} → /api/users/:id
// React:   /api/users/${id} → /api/users/:id

function normalizeAspNetPath(path: string): string {
  return path
    .replace(/\{(\w+)(?::\w+)?\}/g, ':$1')  // {id} or {id:int} → :id
    .replace(/\[controller\]/g, controllerName.toLowerCase());
}
```


---

## 6. Type System Integration

### 6.1 Language Type Extension

```typescript
// packages/core/src/parsers/types.ts
export type Language = 
  | 'typescript'
  | 'javascript'
  | 'python'
  | 'csharp'      // NEW
  | 'css'
  | 'scss'
  | 'json'
  | 'yaml'
  | 'markdown';
```

### 6.2 Extension Mapping

```typescript
// packages/core/src/parsers/parser-manager.ts
const EXTENSION_TO_LANGUAGE: Record<string, Language> = {
  // ... existing mappings
  
  // C#
  '.cs': 'csharp',
};
```

### 6.3 Semantic Detector Updates

All existing semantic detectors need `'csharp'` added to their `supportedLanguages`:

```typescript
// Example: packages/detectors/src/auth/rbac-semantic.ts
export class RBACSemanticDetector extends SemanticDetector {
  override readonly supportedLanguages: Language[] = [
    'typescript', 'javascript', 'python', 'csharp'  // Add csharp
  ];
  
  protected getSemanticKeywords(): string[] {
    return [
      // Existing keywords work for C# too
      'role', 'permission', 'authorize', 'authentication',
      
      // C#-specific additions
      'Authorize', 'AllowAnonymous', 'ClaimsPrincipal',
      'AuthorizationPolicy', 'IAuthorizationHandler',
    ];
  }
}
```

### 6.4 Context Type Detection for C#

The semantic detector's context detection patterns need C#-specific additions:

```typescript
// Additional context patterns for C#
const CSHARP_CONTEXT_PATTERNS: Array<{ type: ContextType; pattern: RegExp }> = [
  // Attributes: [Authorize], [HttpGet]
  { type: 'decorator', pattern: /^\s*\[\s*\w*{KEYWORD}\w*\s*(?:\([^)]*\))?\s*\]/i },
  
  // Property: public string Role { get; set; }
  { type: 'property_access', pattern: /(?:public|private|protected|internal)\s+\w+\s+{KEYWORD}\s*\{/i },
  
  // Method: public async Task<Role> GetRole()
  { type: 'function_definition', pattern: /(?:public|private|protected|internal)\s+(?:async\s+)?(?:Task<)?[\w<>]+\s+{KEYWORD}\s*\(/i },
  
  // Generic: IRepository<Role>
  { type: 'type_annotation', pattern: /<\s*{KEYWORD}\s*>/i },
  
  // Using: using Microsoft.AspNetCore.Authorization;
  { type: 'import', pattern: /using\s+[\w.]*{KEYWORD}/i },
];
```

---

## 7. Implementation Plan

### 7.1 Phase 1: Foundation (Week 1)

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| Add `'csharp'` to Language type | P0 | 1h | None |
| Add `.cs` extension mapping | P0 | 1h | Language type |
| Implement CSharpParser skeleton | P0 | 4h | Extension mapping |
| Integrate tree-sitter-c-sharp | P0 | 4h | Parser skeleton |
| Implement basic AST extraction | P0 | 8h | tree-sitter |
| Implement semantic extraction (classes, methods) | P0 | 8h | AST extraction |
| Parser unit tests | P0 | 8h | Semantic extraction |
| **Total** | | **34h** | |

**Deliverables**:
- Working C# parser with AST generation
- Class, method, property extraction
- Attribute extraction
- 90%+ test coverage on parser

### 7.2 Phase 2: Core Detectors (Week 2)

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| API detectors (4 new) | P0 | 16h | Parser |
| Auth detectors (5 new) | P0 | 16h | Parser |
| Update semantic detectors for C# | P1 | 8h | Parser |
| Detector unit tests | P0 | 8h | Detectors |
| **Total** | | **48h** | |

**Deliverables**:
- ASP.NET route detection
- Minimal API detection
- Authorization attribute detection
- Identity pattern detection
- All semantic detectors support C#

### 7.3 Phase 3: Data & Error Handling (Week 3)

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| Data access detectors (5 new) | P0 | 20h | Parser |
| Error handling detectors (4 new) | P0 | 16h | Parser |
| Logging detectors (4 new) | P1 | 12h | Parser |
| Detector unit tests | P0 | 8h | Detectors |
| **Total** | | **56h** | |

**Deliverables**:
- EF Core pattern detection
- Repository pattern detection
- Exception handling detection
- ILogger pattern detection

### 7.4 Phase 4: Remaining Categories (Week 4)

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| Security detectors (4 new) | P0 | 12h | Parser |
| Config detectors (4 new) | P1 | 12h | Parser |
| Testing detectors (5 new) | P1 | 16h | Parser |
| Type detectors (4 new) | P1 | 12h | Parser |
| Structural detectors (5 new) | P1 | 16h | Parser |
| Performance detectors (4 new) | P2 | 12h | Parser |
| Documentation detectors (3 new) | P2 | 8h | Parser |
| Contract detection (2 new) | P0 | 16h | Parser |
| Integration tests | P0 | 16h | All detectors |
| **Total** | | **120h** | |

**Deliverables**:
- All 53 new detectors implemented
- ASP.NET ↔ React contract detection
- Full integration test suite
- Documentation updates

### 7.5 Milestones

| Milestone | Date | Criteria |
|-----------|------|----------|
| M1: Parser Complete | Week 1 | Parser passes all unit tests |
| M2: Core Detectors | Week 2 | API + Auth detectors working |
| M3: Data Layer | Week 3 | EF Core + Error handling working |
| M4: Full Support | Week 4 | All 86 detectors, contracts working |
| M5: Release | Week 4 | Documentation, changelog, npm publish |


---

## 8. Testing Strategy

### 8.1 Parser Testing

#### 8.1.1 Unit Tests

```typescript
describe('CSharpParser', () => {
  describe('parse()', () => {
    it('should parse empty file', () => {
      const result = parser.parse('');
      expect(result.success).toBe(true);
    });
    
    it('should parse class declaration', () => {
      const source = `
        public class MyClass
        {
            public string Name { get; set; }
        }
      `;
      const result = parser.parse(source);
      expect(result.classes).toHaveLength(1);
      expect(result.classes[0].name).toBe('MyClass');
    });
    
    it('should extract attributes', () => {
      const source = `
        [ApiController]
        [Route("api/[controller]")]
        public class UsersController : ControllerBase
        {
            [HttpGet]
            public IActionResult Get() => Ok();
        }
      `;
      const result = parser.parse(source);
      expect(result.classes[0].attributes).toContainEqual(
        expect.objectContaining({ name: 'ApiController' })
      );
    });
    
    it('should parse records', () => {
      const source = `
        public record UserDto(string Name, int Age);
      `;
      const result = parser.parse(source);
      expect(result.records).toHaveLength(1);
      expect(result.records[0].primaryConstructorParams).toHaveLength(2);
    });
  });
});
```

#### 8.1.2 Test Fixtures

Create comprehensive test fixtures in `packages/core/src/parsers/__fixtures__/csharp/`:

```
__fixtures__/csharp/
├── basic/
│   ├── empty.cs
│   ├── class.cs
│   ├── record.cs
│   ├── struct.cs
│   └── interface.cs
├── aspnet/
│   ├── controller.cs
│   ├── minimal-api.cs
│   ├── middleware.cs
│   └── startup.cs
├── efcore/
│   ├── dbcontext.cs
│   ├── entity.cs
│   └── migration.cs
└── patterns/
    ├── repository.cs
    ├── options.cs
    └── validation.cs
```

### 8.2 Detector Testing

#### 8.2.1 Unit Tests

```typescript
describe('AspNetRoutesDetector', () => {
  const detector = new AspNetRoutesDetector();
  
  it('should detect controller routes', async () => {
    const context = createTestContext(`
      [ApiController]
      [Route("api/[controller]")]
      public class UsersController : ControllerBase
      {
          [HttpGet]
          public IActionResult GetAll() => Ok();
          
          [HttpGet("{id}")]
          public IActionResult GetById(int id) => Ok();
      }
    `, 'csharp');
    
    const result = await detector.detect(context);
    
    expect(result.patterns).toHaveLength(2);
    expect(result.patterns[0].patternId).toContain('api/aspnet-routes');
  });
  
  it('should detect minimal API routes', async () => {
    const context = createTestContext(`
      app.MapGet("/api/users", () => Results.Ok());
      app.MapPost("/api/users", (CreateUserDto dto) => Results.Created());
    `, 'csharp');
    
    const result = await detector.detect(context);
    
    expect(result.patterns).toHaveLength(2);
  });
});
```

#### 8.2.2 Integration Tests

```typescript
describe('C# Integration Tests', () => {
  it('should scan a complete ASP.NET Core project', async () => {
    const scanner = new Scanner({
      rootDir: 'test-repos/aspnet-sample',
      languages: ['csharp'],
    });
    
    const results = await scanner.scan();
    
    expect(results.patterns.length).toBeGreaterThan(0);
    expect(results.patterns.some(p => p.category === 'api')).toBe(true);
    expect(results.patterns.some(p => p.category === 'auth')).toBe(true);
  });
});
```

### 8.3 Contract Testing

```typescript
describe('ASP.NET ↔ React Contract Detection', () => {
  it('should match controller endpoint with fetch call', async () => {
    const backendContext = createTestContext(`
      [HttpGet("api/users/{id}")]
      public async Task<ActionResult<UserDto>> GetUser(int id)
    `, 'csharp');
    
    const frontendContext = createTestContext(`
      const user = await fetch(\`/api/users/\${id}\`);
    `, 'typescript');
    
    const backendEndpoints = await backendDetector.detect(backendContext);
    const frontendCalls = await frontendDetector.detect(frontendContext);
    
    const contracts = contractMatcher.match(
      backendEndpoints.endpoints,
      frontendCalls.apiCalls
    );
    
    expect(contracts).toHaveLength(1);
    expect(contracts[0].status).toBe('verified');
  });
});
```

### 8.4 Test Coverage Requirements

| Component | Minimum Coverage |
|-----------|-----------------|
| CSharpParser | 90% |
| AST Detectors | 85% |
| Semantic Detectors | 80% |
| Contract Detection | 85% |
| Integration | 70% |

---

## 9. Risk Assessment

### 9.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| tree-sitter-c-sharp bugs | Medium | High | Fallback to regex for critical patterns |
| Performance on large files | Low | Medium | Implement incremental parsing |
| Complex generic types | Medium | Medium | Limit depth of type extraction |
| Minimal API edge cases | Medium | Low | Focus on common patterns first |

### 9.2 Schedule Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Underestimated complexity | Medium | High | Buffer time in Phase 4 |
| Dependency issues | Low | Medium | Pin tree-sitter versions |
| Testing bottleneck | Medium | Medium | Parallel test development |

---

## Appendix: Detector Specifications

### A.1 Detector ID Conventions

```
{category}/{subcategory}[-{variant}]

Examples:
- api/aspnet-routes
- api/aspnet-routes-learning
- auth/authorize-attribute
- data-access/efcore-queries
```

### A.2 Confidence Scoring

| Evidence | Confidence Boost |
|----------|-----------------|
| Attribute present | +0.3 |
| Naming convention match | +0.2 |
| Multiple occurrences | +0.1 per occurrence (max +0.3) |
| In expected file location | +0.1 |
| Has related patterns | +0.1 |

### A.3 Violation Severity Guidelines

| Severity | Criteria |
|----------|----------|
| Error | Security vulnerability, will cause runtime failure |
| Warning | Inconsistent with project conventions, potential bug |
| Info | Style preference, optimization opportunity |
| Hint | Suggestion for improvement |

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-20 | Initial specification |
