# Call Graph Memory Optimization

## Problem

The current call graph builder hits `RangeError: Invalid string length` on large codebases because:

1. **Single-file storage**: The entire call graph is serialized to one `graph.json` file
2. **In-memory accumulation**: All functions are accumulated in a `Map<string, FunctionNode>` before serialization
3. **No streaming**: `JSON.stringify()` is called on the entire graph at once

For the drift codebase itself (~1800 files), this exceeds Node.js string limits.

## Solution: Sharded Storage

Use the existing `CallGraphShardStore` in `packages/core/src/lake/callgraph-shard-store.ts` which already implements:

### Storage Structure
```
.drift/lake/callgraph/
├── index.json           # Summary index with file list
├── entry-points.json    # API entry points (separate file)
└── files/
    ├── {file-hash}.json # Functions per source file
    └── ...
```

## Full Migration Scope

### Phase 1: Core Infrastructure (DONE ✅)

1. ✅ `StreamingCallGraphBuilder` - Writes shards incrementally during build
2. ✅ `CallGraphShardStore` - Already exists, stores per-file shards
3. ✅ CLI `callgraph build` - Updated to use streaming builder

### Phase 2: Unified Call Graph Provider (DONE ✅)

Created a unified provider that abstracts the storage format and provides lazy loading:

**File: `packages/core/src/call-graph/unified-provider.ts`**

```typescript
/**
 * UnifiedCallGraphProvider
 * 
 * Provides a unified interface for call graph queries regardless of storage format.
 * Supports both legacy single-file and new sharded storage.
 * Implements lazy loading for memory efficiency.
 */
export class UnifiedCallGraphProvider {
  // Auto-detect storage format
  async initialize(): Promise<void>;
  
  // Core queries (lazy-loaded)
  getFunction(id: string): Promise<UnifiedFunction | null>;
  getFunctionsInFile(file: string): Promise<UnifiedFunction[]>;
  getFunctionAtLine(file: string, line: number): Promise<UnifiedFunction | null>;
  
  // Entry points and data accessors (from index)
  getEntryPoints(): Promise<string[]>;
  getDataAccessors(): Promise<string[]>;
  
  // Stats (from index, no full load needed)
  getStats(): Promise<CallGraphStats>;
  getProviderStats(): ProviderStats;
  
  // Reachability (lazy traversal with LRU cache)
  getReachableData(file: string, line: number, options?: ReachabilityOptions): Promise<ReachabilityResult>;
  getCodePathsToData(options: InverseReachabilityOptions): Promise<InverseReachabilityResult>;
}
```

Key features:
- Auto-detects storage format (legacy `graph.json` vs sharded `lake/callgraph/`)
- LRU cache for shards (default 100 shards)
- Unified `UnifiedFunction` type that works with both formats
- Built-in reachability queries with lazy traversal
- Exported from `packages/core/src/call-graph/index.ts` and `packages/core/src/index.ts`

### Phase 3: Update All Consumers (IN PROGRESS)

#### 3.1 Core Package (`packages/core`) - DONE ✅

| File | Status | Change |
|------|--------|--------|
| `call-graph/index.ts` | ✅ | Export `UnifiedCallGraphProvider` |
| `index.ts` | ✅ | Export provider types |

#### 3.2 CLI Package (`packages/cli`) - PENDING

| File | Status | Change |
|------|--------|--------|
| `commands/callgraph.ts` | ✅ | Build uses streaming |
| `commands/callgraph.ts` | ⏳ | status/reach/inverse need provider |
| `commands/test-topology.ts` | ⏳ | Use provider instead of analyzer |
| `commands/error-handling.ts` | ⏳ | Use provider instead of analyzer |
| `commands/coupling.ts` | ⏳ | Use provider instead of analyzer |
| `commands/simulate.ts` | ⏳ | Use provider instead of analyzer |

#### 3.3 MCP Package (`packages/mcp`) - PARTIAL

| File | Status | Change |
|------|--------|--------|
| `infrastructure/startup-warmer.ts` | ✅ | Updated to use provider |
| `enterprise-server.ts` | ⏳ | Replace `CallGraphStore` with provider |
| `tools/detail/reachability.ts` | ⏳ | Use provider |
| `tools/detail/impact-analysis.ts` | ⏳ | Use provider |
| `tools/generation/explain.ts` | ⏳ | Use provider |
| `tools/generation/suggest-changes.ts` | ⏳ | Use provider |
| `tools/surgical/test-template.ts` | ⏳ | Use provider |
| `tools/surgical/callers.ts` | ⏳ | Use provider |
| `tools/orchestration/context.ts` | ⏳ | Use provider |
| `tools/analysis/coupling.ts` | ⏳ | Use provider |
| `tools/analysis/error-handling.ts` | ⏳ | Use provider |
| `tools/analysis/test-topology.ts` | ⏳ | Use provider |

### Phase 4: Lazy Reachability Engine (DONE ✅)

The `UnifiedCallGraphProvider` includes built-in lazy reachability:

```typescript
// Built into UnifiedCallGraphProvider
async getReachableData(file: string, line: number, options?: ReachabilityOptions): Promise<ReachabilityResult> {
  // 1. Find function at location (single shard load)
  const func = await this.getFunctionAtLine(file, line);
  
  // 2. BFS traversal, loading shards on-demand with LRU cache
  const visited = new Set<string>();
  const queue = [{ id: func.id, depth: 0, path: [...] }];
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current.id) || current.depth > maxDepth) continue;
    visited.add(current.id);
    
    // Load function (may load shard, uses LRU cache)
    const fn = await this.getFunction(current.id);
    if (!fn) continue;
    
    // Collect data access
    for (const access of fn.dataAccess) {
      reachableAccess.push({ access, path: current.path, depth: current.depth });
    }
    
    // Queue callees
    for (const calleeId of fn.calleeIds) {
      if (!visited.has(calleeId)) {
        queue.push({ id: calleeId, depth: current.depth + 1, path: [...] });
      }
    }
  }
  
  return { reachableAccess, tables, sensitiveFields, ... };
}
```

### Phase 5: Backward Compatibility

1. **Auto-detect format**: Check for `graph.json` (legacy) vs `index.json` (sharded)
2. **Migration command**: `drift callgraph migrate` to convert legacy to sharded
3. **Deprecation warnings**: Log warnings when using legacy format

## Implementation Order

1. ✅ **Create `StreamingCallGraphBuilder`** - Writes shards incrementally
2. ✅ **Create `UnifiedCallGraphProvider`** - Core abstraction with lazy loading
3. ✅ **Update startup warmer** - Uses provider for call graph
4. ⏳ **Update CLI commands** - One by one
5. ⏳ **Update MCP tools** - One by one
6. ⏳ **Add migration command** - For existing users
7. ⏳ **Update tests** - Mock provider instead of store

## Memory Budget

Target: Query call graph for 10,000+ file codebase with < 256MB memory

- Index file: ~1MB (always loaded)
- Per-shard: ~10-50KB (loaded on demand)
- LRU cache: 100 shards max (~5MB)
- Reachability traversal: Only visited functions in memory

## Testing Strategy

1. **Unit tests**: Mock provider for all consumers
2. **Integration tests**: Build and query on demo projects
3. **Memory tests**: Profile memory usage on large codebases
4. **Backward compat tests**: Ensure legacy format still works
