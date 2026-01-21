# PHP/Laravel Language Support Design

## Executive Summary

This document outlines a modular, scalable architecture for PHP/Laravel pattern detection in Drift. The design prioritizes:

1. **Single Responsibility** - Each file does one thing well
2. **Composability** - Small extractors compose into larger detectors
3. **Testability** - Every component is independently testable
4. **Extensibility** - Easy to add Symfony, WordPress, or other PHP frameworks later
5. **Consistency** - Follows patterns established by Django detectors (the best current example)

## Architecture Overview

```
packages/detectors/src/
├── php/                              # Shared PHP utilities
│   ├── types.ts                      # Core PHP type definitions
│   ├── php-parser.ts                 # PHP-specific parsing utilities
│   ├── class-extractor.ts            # Extract PHP class definitions
│   ├── method-extractor.ts           # Extract method signatures
│   ├── attribute-extractor.ts        # Extract PHP 8 attributes
│   ├── docblock-extractor.ts         # Extract PHPDoc annotations
│   └── index.ts
│
├── auth/
│   └── laravel/
│       ├── types.ts                  # Laravel auth type definitions
│       ├── extractors/
│       │   ├── gate-extractor.ts     # Extract Gate::define patterns
│       │   ├── policy-extractor.ts   # Extract Policy classes
│       │   ├── middleware-extractor.ts
│       │   └── index.ts
│       ├── auth-detector.ts          # Orchestrator detector
│       ├── __tests__/
│       │   ├── gate-extractor.test.ts
│       │   ├── policy-extractor.test.ts
│       │   ├── middleware-extractor.test.ts
│       │   └── auth-detector.test.ts
│       └── index.ts
│
├── data-access/
│   └── laravel/
│       ├── types.ts
│       ├── extractors/
│       │   ├── eloquent-model-extractor.ts
│       │   ├── relationship-extractor.ts
│       │   ├── scope-extractor.ts
│       │   ├── query-builder-extractor.ts
│       │   └── index.ts
│       ├── eloquent-detector.ts      # Orchestrator
│       ├── __tests__/
│       └── index.ts
│
├── contracts/
│   └── laravel/
│       ├── types.ts
│       ├── extractors/
│       │   ├── route-extractor.ts    # Extract Route:: definitions
│       │   ├── controller-extractor.ts
│       │   ├── resource-extractor.ts # API Resources
│       │   ├── form-request-extractor.ts
│       │   └── index.ts
│       ├── endpoint-detector.ts      # Orchestrator
│       ├── __tests__/
│       └── index.ts
│
├── errors/
│   └── laravel/
│       ├── types.ts
│       ├── extractors/
│       │   ├── exception-handler-extractor.ts
│       │   ├── custom-exception-extractor.ts
│       │   └── index.ts
│       ├── exception-detector.ts
│       ├── __tests__/
│       └── index.ts
│
├── logging/
│   └── laravel/
│       ├── types.ts
│       ├── extractors/
│       │   ├── log-facade-extractor.ts
│       │   ├── channel-extractor.ts
│       │   └── index.ts
│       ├── logging-detector.ts
│       ├── __tests__/
│       └── index.ts
│
├── testing/
│   └── laravel/
│       ├── types.ts
│       ├── extractors/
│       │   ├── test-case-extractor.ts
│       │   ├── factory-extractor.ts
│       │   ├── mock-extractor.ts
│       │   └── index.ts
│       ├── testing-detector.ts
│       ├── __tests__/
│       └── index.ts
│
├── structural/
│   └── laravel/
│       ├── types.ts
│       ├── extractors/
│       │   ├── service-provider-extractor.ts
│       │   ├── facade-extractor.ts
│       │   ├── container-binding-extractor.ts
│       │   └── index.ts
│       ├── di-detector.ts
│       ├── __tests__/
│       └── index.ts
│
├── security/
│   └── laravel/
│       ├── types.ts
│       ├── extractors/
│       │   ├── csrf-extractor.ts
│       │   ├── xss-extractor.ts
│       │   ├── mass-assignment-extractor.ts
│       │   └── index.ts
│       ├── security-detector.ts
│       ├── __tests__/
│       └── index.ts
│
├── config/
│   └── laravel/
│       ├── types.ts
│       ├── extractors/
│       │   ├── env-extractor.ts
│       │   ├── config-extractor.ts
│       │   └── index.ts
│       ├── config-detector.ts
│       ├── __tests__/
│       └── index.ts
│
└── performance/
    └── laravel/
        ├── types.ts
        ├── extractors/
        │   ├── cache-extractor.ts
        │   ├── queue-extractor.ts
        │   ├── eager-loading-extractor.ts
        │   └── index.ts
        ├── performance-detector.ts
        ├── __tests__/
        └── index.ts
```

## Design Principles

### 1. Extractor Pattern

Every detector is composed of small, focused extractors. Each extractor:
- Has a single responsibility
- Returns typed extraction results
- Is independently testable
- Has no side effects

```typescript
// Example: gate-extractor.ts
export interface GateDefinition {
  name: string;
  callback: string;
  abilities: string[];
  line: number;
  file: string;
}

export interface GateExtractionResult {
  definitions: GateDefinition[];
  checks: GateCheck[];
  confidence: number;
}

export class GateExtractor {
  extract(content: string, file: string): GateExtractionResult {
    // Single responsibility: extract Gate patterns only
  }
}
```

### 2. Orchestrator Pattern

Detectors are orchestrators that:
- Compose multiple extractors
- Aggregate results
- Calculate confidence
- Generate patterns and violations

```typescript
// Example: auth-detector.ts
export class LaravelAuthDetector extends BaseDetector {
  private readonly gateExtractor: GateExtractor;
  private readonly policyExtractor: PolicyExtractor;
  private readonly middlewareExtractor: MiddlewareExtractor;

  constructor() {
    super();
    this.gateExtractor = new GateExtractor();
    this.policyExtractor = new PolicyExtractor();
    this.middlewareExtractor = new MiddlewareExtractor();
  }

  async detect(context: DetectionContext): Promise<DetectionResult> {
    // Orchestrate extractors, aggregate results
  }
}
```

### 3. Type-First Design

Every module starts with comprehensive type definitions:

```typescript
// types.ts for each domain
export interface LaravelAuthAnalysis {
  gates: GateDefinition[];
  policies: PolicyInfo[];
  middleware: MiddlewareInfo[];
  guards: GuardInfo[];
  confidence: number;
}
```

### 4. Shared PHP Utilities

Common PHP parsing logic lives in `packages/detectors/src/php/`:

```typescript
// php-parser.ts
export class PhpParser {
  extractClasses(content: string): PhpClassInfo[];
  extractMethods(content: string): PhpMethodInfo[];
  extractUseStatements(content: string): UseStatement[];
  extractNamespace(content: string): string | null;
}

// attribute-extractor.ts (PHP 8 attributes)
export class AttributeExtractor {
  extract(content: string): PhpAttribute[];
}

// docblock-extractor.ts
export class DocblockExtractor {
  extract(content: string): DocblockInfo[];
  extractAnnotations(docblock: string): Annotation[];
}
```

## Detailed Component Specifications

### Phase 1: Core Infrastructure (Week 1)

#### 1.1 PHP Shared Utilities

**File: `packages/detectors/src/php/types.ts`**
```typescript
export interface PhpClassInfo {
  name: string;
  namespace: string | null;
  extends: string | null;
  implements: string[];
  traits: string[];
  isAbstract: boolean;
  isFinal: boolean;
  methods: PhpMethodInfo[];
  properties: PhpPropertyInfo[];
  constants: PhpConstantInfo[];
  attributes: PhpAttribute[];
  docblock: DocblockInfo | null;
  line: number;
  file: string;
}

export interface PhpMethodInfo {
  name: string;
  visibility: 'public' | 'protected' | 'private';
  isStatic: boolean;
  isAbstract: boolean;
  isFinal: boolean;
  parameters: PhpParameterInfo[];
  returnType: string | null;
  attributes: PhpAttribute[];
  docblock: DocblockInfo | null;
  line: number;
}

export interface PhpAttribute {
  name: string;
  arguments: string[];
  line: number;
}

export interface DocblockInfo {
  summary: string;
  description: string;
  tags: DocblockTag[];
  line: number;
}

export interface DocblockTag {
  name: string;  // @param, @return, @throws, etc.
  type: string | null;
  variable: string | null;
  description: string;
}
```

**File: `packages/detectors/src/php/class-extractor.ts`**
- Extract class definitions with full metadata
- Handle namespaces, inheritance, traits
- Support PHP 8 attributes

**File: `packages/detectors/src/php/method-extractor.ts`**
- Extract method signatures
- Parse parameter types and defaults
- Handle return types

**File: `packages/detectors/src/php/docblock-extractor.ts`**
- Parse PHPDoc blocks
- Extract @param, @return, @throws tags
- Handle Laravel-specific annotations

### Phase 2: Auth Detectors (Week 1-2)

#### 2.1 Gate Extractor
Detects:
- `Gate::define('ability', callback)`
- `Gate::before()`, `Gate::after()`
- `Gate::allows()`, `Gate::denies()`, `Gate::check()`
- `@can` Blade directives

#### 2.2 Policy Extractor
Detects:
- Policy class definitions
- Policy method patterns (view, create, update, delete)
- `$this->authorize()` calls
- Policy registration in AuthServiceProvider

#### 2.3 Middleware Extractor
Detects:
- Middleware class definitions
- `$routeMiddleware` registration
- Middleware groups
- Route middleware application

### Phase 3: Data Access Detectors (Week 2)

#### 3.1 Eloquent Model Extractor
Detects:
- Model class definitions
- `$fillable`, `$guarded`, `$hidden`, `$casts`
- Accessors and mutators
- Model events and observers

#### 3.2 Relationship Extractor
Detects:
- `hasOne`, `hasMany`, `belongsTo`, `belongsToMany`
- `morphTo`, `morphMany`, `morphToMany`
- Relationship method patterns
- Eager loading hints

#### 3.3 Query Builder Extractor
Detects:
- Query builder chains
- Raw queries (security concern)
- Scope definitions
- Query optimization patterns

### Phase 4: Contract Detectors (Week 2-3)

#### 4.1 Route Extractor
Detects:
- `Route::get/post/put/patch/delete`
- Route groups with middleware/prefix
- Resource routes
- API routes
- Route model binding

#### 4.2 Controller Extractor
Detects:
- Controller class definitions
- Action methods
- Dependency injection
- Form request usage

#### 4.3 API Resource Extractor
Detects:
- Resource class definitions
- `toArray()` field mappings
- Resource collections
- Conditional attributes

#### 4.4 Form Request Extractor
Detects:
- Form request classes
- `rules()` method
- `authorize()` method
- Custom validation messages

### Phase 5: Remaining Detectors (Week 3-4)

- Error handling (Exception Handler, custom exceptions)
- Logging (Log facade, channels, context)
- Testing (TestCase, factories, mocks)
- Structural (Service providers, facades, DI)
- Security (CSRF, XSS, mass assignment)
- Config (env, config files)
- Performance (caching, queues, eager loading)

## Pattern Detection Examples

### Auth Patterns

```php
// Gate definition - detected by GateExtractor
Gate::define('update-post', function (User $user, Post $post) {
    return $user->id === $post->user_id;
});

// Policy - detected by PolicyExtractor
class PostPolicy
{
    public function update(User $user, Post $post): bool
    {
        return $user->id === $post->user_id;
    }
}

// Middleware - detected by MiddlewareExtractor
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index']);
});
```

### Eloquent Patterns

```php
// Model definition - detected by EloquentModelExtractor
class Post extends Model
{
    protected $fillable = ['title', 'content', 'user_id'];
    protected $casts = ['published_at' => 'datetime'];
    
    // Relationship - detected by RelationshipExtractor
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
    
    // Scope - detected by ScopeExtractor
    public function scopePublished(Builder $query): Builder
    {
        return $query->whereNotNull('published_at');
    }
}
```

### Route/Controller Patterns

```php
// Route definition - detected by RouteExtractor
Route::apiResource('posts', PostController::class);

// Controller - detected by ControllerExtractor
class PostController extends Controller
{
    public function store(StorePostRequest $request): PostResource
    {
        $post = Post::create($request->validated());
        return new PostResource($post);
    }
}

// Form Request - detected by FormRequestExtractor
class StorePostRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'content' => ['required', 'string'],
        ];
    }
}

// API Resource - detected by ResourceExtractor
class PostResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'author' => new UserResource($this->whenLoaded('user')),
        ];
    }
}
```

## Violation Detection

### Security Violations

```php
// Mass assignment vulnerability
$user = User::create($request->all()); // VIOLATION: Use $request->validated()

// Raw SQL injection risk
DB::select("SELECT * FROM users WHERE id = $id"); // VIOLATION: Use bindings

// XSS vulnerability
{!! $userInput !!} // VIOLATION: Use {{ }} for escaping
```

### Performance Violations

```php
// N+1 query
foreach (Post::all() as $post) {
    echo $post->user->name; // VIOLATION: Missing eager loading
}

// Missing index hint
Post::where('status', 'published')->get(); // INFO: Consider index on status
```

### Consistency Violations

```php
// Inconsistent authorization
public function update(Post $post) // VIOLATION: Missing authorize() call
{
    $post->update(request()->all());
}
```

## Testing Strategy

Each extractor has dedicated tests:

```typescript
// gate-extractor.test.ts
describe('GateExtractor', () => {
  it('extracts Gate::define patterns', () => {
    const content = `Gate::define('update-post', fn($user, $post) => $user->id === $post->user_id);`;
    const result = extractor.extract(content, 'test.php');
    expect(result.definitions).toHaveLength(1);
    expect(result.definitions[0].name).toBe('update-post');
  });

  it('extracts Gate::allows checks', () => { /* ... */ });
  it('handles multiline callbacks', () => { /* ... */ });
  it('extracts abilities from Gate::before', () => { /* ... */ });
});
```

## File Count Estimate

| Category | Extractors | Detector | Types | Tests | Index | Total |
|----------|------------|----------|-------|-------|-------|-------|
| php (shared) | 5 | - | 1 | 5 | 1 | 12 |
| auth/laravel | 3 | 1 | 1 | 4 | 2 | 11 |
| data-access/laravel | 4 | 1 | 1 | 5 | 2 | 13 |
| contracts/laravel | 4 | 1 | 1 | 5 | 2 | 13 |
| errors/laravel | 2 | 1 | 1 | 3 | 2 | 9 |
| logging/laravel | 2 | 1 | 1 | 3 | 2 | 9 |
| testing/laravel | 3 | 1 | 1 | 4 | 2 | 11 |
| structural/laravel | 3 | 1 | 1 | 4 | 2 | 11 |
| security/laravel | 3 | 1 | 1 | 4 | 2 | 11 |
| config/laravel | 2 | 1 | 1 | 3 | 2 | 9 |
| performance/laravel | 3 | 1 | 1 | 4 | 2 | 11 |
| **Total** | **34** | **10** | **11** | **44** | **21** | **~120 files** |

## Implementation Order

1. **Week 1**: PHP shared utilities + Auth detectors
2. **Week 2**: Data access + Contracts detectors  
3. **Week 3**: Errors + Logging + Testing detectors
4. **Week 4**: Structural + Security + Config + Performance detectors

## Key Differences from ASP.NET Implementation

| Aspect | ASP.NET (Current) | Laravel (Proposed) |
|--------|-------------------|-------------------|
| Structure | Monolithic detector files | Extractor + Orchestrator pattern |
| Testability | Test whole detector | Test each extractor independently |
| Reusability | Limited | Extractors reusable across detectors |
| Extensibility | Add new detector file | Add new extractor, compose |
| File size | 200-400 lines | 50-150 lines per file |
| Separation | Mixed concerns | Single responsibility |

## Success Criteria

1. All 120+ files follow single responsibility principle
2. Each extractor is independently testable
3. 90%+ test coverage on extractors
4. Detectors are thin orchestrators (<100 lines)
5. Types are comprehensive and reusable
6. Easy to add Symfony/WordPress support later by reusing PHP utilities
7. Pattern detection accuracy >95% on real Laravel codebases

## Future Extensions

This architecture enables:
- **Symfony support**: Reuse PHP utilities, add `symfony/` folders
- **WordPress support**: Reuse PHP utilities, add `wordpress/` folders
- **CodeIgniter support**: Same pattern
- **Custom PHP frameworks**: Compose existing extractors

The shared `php/` utilities become the foundation for all PHP framework support.
