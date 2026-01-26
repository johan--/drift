# MCP Architecture — The Gold Standard

Drift's MCP server represents a **gold standard** for how AI tool servers should be built. This document explains the architectural decisions that make Drift's MCP implementation exceptional.

## Why This Architecture Matters

Most MCP servers expose tools as flat lists. AI agents must:
1. Read all tool descriptions
2. Figure out which tools to call
3. Call multiple tools
4. Synthesize results themselves

**Drift's approach is different:**

```
Traditional MCP:                    Drift MCP:
┌─────────────────┐                ┌─────────────────┐
│ 50 flat tools   │                │ Orchestration   │ ← Start here
│ AI figures out  │                │ (1 smart call)  │
│ which to call   │                ├─────────────────┤
│ and synthesizes │                │ Discovery       │ ← Quick checks
│ results         │                ├─────────────────┤
└─────────────────┘                │ Surgical        │ ← Precise lookups
                                   ├─────────────────┤
                                   │ Exploration     │ ← Browse/filter
                                   ├─────────────────┤
                                   │ Detail          │ ← Deep dives
                                   ├─────────────────┤
                                   │ Analysis        │ ← Complex analysis
                                   ├─────────────────┤
                                   │ Generation      │ ← AI assistance
                                   └─────────────────┘
```

---

## The 7-Layer Architecture

### Layer 1: Orchestration — "The Final Boss"

**Purpose:** Understand intent, return curated context.

Instead of making the AI call 5 tools and synthesize results, one orchestration call returns everything:

```typescript
// Traditional approach (5 tool calls):
const patterns = await drift_patterns_list({ category: 'auth' });
const examples = await drift_code_examples({ category: 'auth' });
const files = await drift_files_list({ path: 'src/auth/**' });
const security = await drift_security_summary({ focus: 'auth' });
const impact = await drift_impact_analysis({ target: 'src/auth' });
// AI must synthesize all this

// Drift approach (1 tool call):
const context = await drift_context({
  intent: 'add_feature',
  focus: 'authentication'
});
// Returns patterns, examples, files, warnings, guidance — all curated
```

**Key insight:** The orchestration layer does the synthesis work, not the AI.

### Layer 2: Discovery — "Quick Health Check"

**Purpose:** Instant status without heavy computation.

```typescript
// Always fast, always lightweight
const status = await drift_status();
// Returns: pattern counts, health score, critical issues
// Token budget: 200-500 tokens
```

**Key insight:** Discovery tools never do expensive computation.

### Layer 3: Surgical — "Exactly What I Need"

**Purpose:** Ultra-focused lookups for code generation.

The problem: AI reads 500-line files just to see a 1-line signature.

```typescript
// Traditional: Read entire file
const file = await readFile('src/auth/login.ts');
// 500+ lines, 2000+ tokens

// Surgical: Get exactly what's needed
const sig = await drift_signature({ symbol: 'handleLogin' });
// 10 lines, 200 tokens
```

**12 surgical tools:**

| Tool | Purpose | Token Budget |
|------|---------|--------------|
| `drift_signature` | Function signatures | 200-500 |
| `drift_callers` | Who calls this | 300-800 |
| `drift_imports` | Import statements | 200-400 |
| `drift_prevalidate` | Quick validation | 200-500 |
| `drift_similar` | Similar code | 300-600 |
| `drift_type` | Type definitions | 200-500 |
| `drift_recent` | Recent changes | 300-600 |
| `drift_test_template` | Test scaffolding | 400-800 |
| `drift_dependencies` | Package deps | 300-600 |
| `drift_middleware` | Middleware chain | 300-600 |
| `drift_hooks` | React hooks | 300-600 |
| `drift_errors` | Error handling | 300-600 |

**Key insight:** Each surgical tool does exactly one thing, returns minimal tokens.

### Layer 4: Exploration — "Let Me Browse"

**Purpose:** Paginated listing with filters.

```typescript
// Browse patterns with filters
const patterns = await drift_patterns_list({
  categories: ['api', 'auth'],
  status: 'approved',
  minConfidence: 0.8,
  limit: 20,
  cursor: 'next_page_token'
});
```

**Key insight:** Exploration tools support pagination and filtering.

### Layer 5: Detail — "Deep Dive"

**Purpose:** Complete information about specific items.

```typescript
// Get everything about a pattern
const pattern = await drift_pattern_get({
  id: 'api-rest-controller',
  includeLocations: true,
  includeOutliers: true
});
```

**Key insight:** Detail tools return comprehensive data for specific items.

### Layer 6: Analysis — "Complex Computation"

**Purpose:** Deep analysis that may require pre-built data.

```typescript
// Find dependency cycles
const cycles = await drift_coupling({
  action: 'cycles',
  minSeverity: 'warning'
});
```

**Key insight:** Analysis tools may require `drift <analysis> build` first.

### Layer 7: Generation — "Help Me Write Code"

**Purpose:** AI-assisted code generation and validation.

```typescript
// Validate generated code against patterns
const validation = await drift_validate_change({
  file: 'src/api/users.ts',
  content: generatedCode,
  strictMode: true
});
```

**Key insight:** Generation tools help AI write code that fits the codebase.

---

## Response Structure Standard

Every Drift response follows a consistent structure:

```typescript
interface MCPResponse<T> {
  // 1. Summary first — AI can stop here if sufficient
  summary: string;
  
  // 2. Actual data payload
  data: T;
  
  // 3. Pagination for large results
  pagination?: {
    cursor?: string;
    hasMore: boolean;
    totalCount?: number;
    pageSize: number;
  };
  
  // 4. Hints for AI to understand next steps
  hints?: {
    nextActions?: string[];
    relatedTools?: string[];
    warnings?: string[];
  };
  
  // 5. Metadata for debugging/optimization
  meta: {
    requestId: string;
    durationMs: number;
    cached: boolean;
    tokenEstimate: number;
  };
}
```

### Why This Structure?

1. **Summary first** — AI can often stop after reading summary
2. **Structured data** — Easy to parse and use
3. **Pagination** — Handle large results gracefully
4. **Hints** — Guide AI to next steps
5. **Metadata** — Enable optimization and debugging

---

## Token Budget Management

### The Problem

AI context windows are limited. Every token counts.

### The Solution

Every tool has a token budget:

```typescript
/**
 * drift_signature - Get Function/Class Signatures
 * 
 * Layer: Surgical
 * Token Budget: 200 target, 500 max
 * Cache TTL: 5 minutes
 */
```

### Implementation

```typescript
class ResponseBuilder<T> {
  private readonly config = {
    maxResponseTokens: 4000,
    maxSectionTokens: 1000,
  };
  
  build(): MCPResponse<T> {
    const response = this.buildResponse();
    
    // Check if we need to fit to budget
    if (response.meta.tokenEstimate > this.config.maxResponseTokens) {
      return this.fitToBudget(response);
    }
    
    return response;
  }
  
  private fitToBudget(response: MCPResponse<T>): MCPResponse<T> {
    // Strategy 1: Reduce page size for arrays
    if (Array.isArray(response.data) && response.pagination) {
      return this.reducePageSize(response);
    }
    
    // Strategy 2: Add truncation warning
    return this.addTruncationWarning(response);
  }
}
```

---

## Caching Strategy

### Cache Keys

```typescript
function generateCacheKey(tool: string, args: Record<string, unknown>): string {
  const normalized = JSON.stringify(sortKeys(args));
  return `${tool}:${hash(normalized)}`;
}
```

### Cache Invalidation

```typescript
const INVALIDATION_KEYS = {
  'drift_signature': ['callgraph', 'file:{path}'],
  'drift_patterns_list': ['patterns'],
  'drift_status': ['patterns', 'manifest'],
};
```

### Cache TTL

| Tool Type | TTL |
|-----------|-----|
| Surgical | 5 minutes |
| Discovery | 1 minute |
| Exploration | 2 minutes |
| Detail | 5 minutes |
| Analysis | 10 minutes |

---

## Error Handling

### Structured Errors

```typescript
class DriftError extends Error {
  constructor(
    public code: string,
    message: string,
    public hints: string[] = [],
    public retryable: boolean = false
  ) {
    super(message);
  }
}

const Errors = {
  notFound: (type: string, id: string) => new DriftError(
    'NOT_FOUND',
    `${type} "${id}" not found`,
    ['Check spelling', 'Use drift_status to see available items']
  ),
  
  missingParameter: (param: string) => new DriftError(
    'MISSING_PARAMETER',
    `Required parameter "${param}" is missing`,
    ['Check the tool schema for required parameters']
  ),
  
  dataNotBuilt: (type: string) => new DriftError(
    'DATA_NOT_BUILT',
    `${type} data has not been built`,
    [`Run "drift ${type} build" first`],
    true
  ),
};
```

### Error Response Format

```json
{
  "error": "NOT_FOUND",
  "message": "Pattern 'xyz' not found",
  "hints": [
    "Check spelling",
    "Use drift_patterns_list to see available patterns"
  ],
  "retryable": false
}
```

---

## Warmup Strategy

### The Problem

First tool call is slow because data isn't loaded.

### The Solution

Warm up stores on server startup:

```typescript
async function warmupStores(stores, projectRoot, dataLake) {
  const result = {
    loaded: {},
    errors: [],
    duration: 0
  };
  
  const start = Date.now();
  
  // Load in parallel
  await Promise.all([
    stores.pattern.initialize().then(() => result.loaded.patterns = true),
    stores.manifest.load().then(() => result.loaded.manifest = true),
    stores.callGraph.initialize().then(() => result.loaded.callGraph = true),
    // ... more stores
  ]);
  
  result.duration = Date.now() - start;
  return result;
}
```

### Background Building

If data is missing, build it in the background:

```typescript
if (!result.loaded.callGraph) {
  buildMissingData(projectRoot, result.loaded).catch(() => {
    // Silently fail - user can build manually
  });
}
```

---

## Multi-Project Support

### The Problem

Developers work on multiple projects. Tools should work across all of them.

### The Solution

Project registry with resolution:

```typescript
async function resolveProject(projectName, defaultRoot) {
  if (!projectName) {
    return { projectRoot: defaultRoot, fromRegistry: false };
  }
  
  const registry = await loadProjectRegistry();
  const project = registry.find(p => p.name === projectName);
  
  if (!project) {
    throw Errors.notFound('project', projectName);
  }
  
  return {
    projectRoot: project.path,
    project,
    fromRegistry: true
  };
}
```

### Usage

```json
{
  "intent": "add_feature",
  "focus": "authentication",
  "project": "backend"  // Target specific project
}
```

---

## Metrics & Observability

### What We Track

```typescript
const metrics = {
  // Request metrics
  'tools.call': { tool: string },
  'tools.duration_ms': { tool: string },
  'tools.error': { tool: string },
  'tools.rate_limited': { tool: string },
  
  // Cache metrics
  'tools.cache_hit': { tool: string },
  'tools.cache_miss': { tool: string },
  
  // Data metrics
  'data.patterns_loaded': {},
  'data.callgraph_size': {},
};
```

### Implementation

```typescript
class Metrics {
  increment(name: string, labels?: Record<string, string>) {
    // Increment counter
  }
  
  observe(name: string, value: number, labels?: Record<string, string>) {
    // Record observation
  }
  
  recordRequest(tool: string, duration: number, success: boolean, cached: boolean) {
    this.increment('tools.call', { tool });
    this.observe('tools.duration_ms', duration, { tool });
    if (!success) this.increment('tools.error', { tool });
    if (cached) this.increment('tools.cache_hit', { tool });
  }
}
```

---

## Lessons for MCP Server Builders

### 1. Layer Your Tools

Don't expose 50 flat tools. Organize them by purpose:
- Orchestration for common workflows
- Discovery for quick checks
- Surgical for precise lookups
- Exploration for browsing
- Detail for deep dives

### 2. Manage Token Budgets

Every tool should have a token budget. Implement automatic truncation.

### 3. Structure Responses Consistently

Use the same response structure everywhere:
- Summary first
- Structured data
- Pagination
- Hints
- Metadata

### 4. Provide Hints

Tell the AI what to do next:
- Next actions
- Related tools
- Warnings

### 5. Handle Errors Gracefully

Return structured errors with:
- Error code
- Human message
- Recovery hints
- Retryable flag

### 6. Warm Up on Startup

Don't make the first call slow. Load data on startup.

### 7. Cache Aggressively

Cache responses with smart invalidation.

### 8. Support Multi-Project

Developers work on multiple projects. Support targeting specific projects.

---

## Conclusion

Drift's MCP architecture demonstrates that AI tool servers can be:
- **Efficient** — Minimal tokens, maximum value
- **Intelligent** — Understand intent, not just commands
- **Helpful** — Guide AI to next steps
- **Robust** — Handle errors gracefully
- **Fast** — Warm up, cache, optimize

This is the standard other MCP servers should follow.
