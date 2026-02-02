# MCP Setup Tools Design

## Implementation Status: ✅ COMPLETE (Full CLI Parity)

**Implemented:** February 2, 2026
**Updated:** February 2, 2026 - Full CLI parity achieved

The `drift_setup` MCP tool has been fully implemented with 100% CLI parity. AI agents can now initialize, scan, and build call graphs for drift projects directly through MCP, with all the same features as the CLI commands.

### CLI Parity Features:
- **Init**: Creates .drift directory structure, config.json, manifest.json, .driftignore, registers in global project registry
- **Scan**: Pattern detection with 100+ detectors, boundary scanning, test topology, constants extraction, history snapshots, data lake materialization
- **Callgraph**: Native Rust acceleration, TypeScript fallback, pre-scanning for data access detection, security prioritization

### Files Created/Modified:
- `drift/packages/mcp/src/tools/setup/index.ts` - Tool definition with full options
- `drift/packages/mcp/src/tools/setup/handler.ts` - Full handler implementation with CLI parity
- `drift/packages/mcp/src/tools/registry.ts` - Added SETUP_TOOLS
- `drift/packages/mcp/src/enterprise-server.ts` - Added drift_setup routing
- `drift/packages/core/src/services/scanner-service.ts` - Moved from CLI
- `drift/packages/core/src/services/detector-worker.ts` - Moved from CLI
- `drift/packages/core/src/services/index.ts` - Service exports
- `drift/packages/core/src/index.ts` - Added services export
- `drift/packages/mcp/package.json` - Added zod dependency
- `drift/packages/core/package.json` - Added driftdetect-detectors dependency

### Scan Action Options (matching CLI):
- `incremental`: Only scan changed files
- `categories`: Filter by pattern categories
- `boundaries`: Data boundary scanning (default: true)
- `contracts`: BE↔FE contract scanning (default: true)
- `testTopology`: Build test topology (default: false)
- `constants`: Extract constants with secret detection (default: false)
- `callgraph`: Build call graph during scan (default: false)
- `timeout`: Scan timeout in seconds (default: 300)

### Callgraph Action Options (matching CLI):
- `security`: Include security prioritization with P0-P4 tiers

---

## Executive Summary

This document specifies a new `drift_setup` MCP tool that enables AI agents to initialize, scan, and build call graphs for drift projects directly through MCP, without requiring CLI access. This addresses a key user request: "I want my LLM to set up drift on repos it already has access to."

## The Problem

Currently, drift's MCP server is **read-only**. It can query patterns, analyze code, and provide context, but it cannot:

1. Initialize drift in a new project (`drift init`)
2. Scan a codebase to discover patterns (`drift scan`)
3. Build call graphs for reachability analysis (`drift callgraph build`)

This forces users to manually run CLI commands before the MCP tools become useful. For AI agents that already have file system access to repositories, this is an unnecessary friction point.

## Design Principles

Following the established drift MCP patterns:

1. **Single Tool, Multiple Actions** - Like `drift_projects`, use an action-based interface
2. **Progressive Feedback** - Long-running operations should provide progress updates
3. **Fail Gracefully** - Errors include recovery suggestions
4. **Token Efficient** - Responses are structured for AI consumption
5. **Non-Blocking** - Operations should not hang the MCP server

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     MCP Client (Claude, Kiro, etc.)             │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    drift_setup Tool                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   init      │  │   scan      │  │   callgraph             │  │
│  │   action    │  │   action    │  │   action                │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Core Services (from CLI)                      │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌─────────────────┐  │
│  │ Init      │ │ Scanner   │ │ CallGraph │ │ Project         │  │
│  │ Service   │ │ Service   │ │ Builder   │ │ Registry        │  │
│  └───────────┘ └───────────┘ └───────────┘ └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tool Definition

### `drift_setup`

```typescript
{
  name: 'drift_setup',
  description: `Initialize and configure drift for a project. Enables AI agents to set up drift without CLI access.

Actions:
- init: Initialize drift in a project (creates .drift/ directory)
- scan: Run pattern detection scan on the codebase
- callgraph: Build call graph for reachability analysis
- full: Run init + scan + callgraph in sequence
- status: Check if drift is initialized and what's been run

Use this when:
- Starting work on a new project that doesn't have drift set up
- The project has drift but needs a fresh scan
- You need call graph data for impact/reachability analysis

Note: Long-running operations (scan, callgraph) may take 30s-5min depending on codebase size.`,
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['init', 'scan', 'callgraph', 'full', 'status'],
        description: 'Action to perform (default: status)',
      },
      project: {
        type: 'string',
        description: 'Project name or path. If not specified, uses active project.',
      },
      options: {
        type: 'object',
        description: 'Action-specific options',
        properties: {
          // Init options
          force: {
            type: 'boolean',
            description: 'For init: reinitialize even if already initialized',
          },
          // Scan options
          incremental: {
            type: 'boolean',
            description: 'For scan: only scan changed files (faster)',
          },
          categories: {
            type: 'array',
            items: { type: 'string' },
            description: 'For scan: limit to specific pattern categories',
          },
          boundaries: {
            type: 'boolean',
            description: 'For scan: include data boundary scanning (default: true)',
          },
          testTopology: {
            type: 'boolean',
            description: 'For scan: build test topology (default: false)',
          },
          constants: {
            type: 'boolean',
            description: 'For scan: extract constants (default: false)',
          },
          // Callgraph options
          security: {
            type: 'boolean',
            description: 'For callgraph: include security prioritization',
          },
        },
      },
    },
  },
}
```

---

## Action Specifications

### Action: `status`

**Purpose:** Check drift initialization state without modifying anything.

**Input:**
```json
{
  "action": "status",
  "project": "my-project"  // optional
}
```

**Output:**
```json
{
  "summary": "Drift initialized. Last scan: 2 hours ago. Call graph: built.",
  "data": {
    "initialized": true,
    "projectPath": "/path/to/project",
    "projectName": "my-project",
    "config": {
      "version": "2.0.0",
      "features": {
        "callGraph": true,
        "boundaries": true
      }
    },
    "lastScan": {
      "timestamp": "2024-01-20T10:30:00Z",
      "patternsFound": 156,
      "filesScanned": 423
    },
    "callGraph": {
      "built": true,
      "timestamp": "2024-01-20T10:35:00Z",
      "functions": 1250,
      "entryPoints": 45
    },
    "health": {
      "score": 78,
      "issues": 3
    }
  },
  "hints": {
    "nextActions": [
      "Use drift_scan to refresh patterns",
      "Use drift_status for detailed health info"
    ]
  }
}
```

**Not Initialized Response:**
```json
{
  "summary": "Drift not initialized in this project.",
  "data": {
    "initialized": false,
    "projectPath": "/path/to/project",
    "detectedLanguages": ["typescript", "python"],
    "detectedFrameworks": ["express", "fastapi"],
    "estimatedFiles": 523
  },
  "hints": {
    "nextActions": [
      "Use drift_setup action=\"init\" to initialize drift",
      "Or use drift_setup action=\"full\" to init + scan + build callgraph"
    ]
  }
}
```

---

### Action: `init`

**Purpose:** Initialize drift in a project (equivalent to `drift init -y`).

**Input:**
```json
{
  "action": "init",
  "project": "/path/to/project",  // or project name
  "options": {
    "force": false  // reinitialize if already exists
  }
}
```

**Output (Success):**
```json
{
  "summary": "Drift initialized successfully in my-project.",
  "data": {
    "success": true,
    "projectPath": "/path/to/project",
    "projectName": "my-project",
    "projectId": "uuid-here",
    "created": {
      "configFile": ".drift/config.json",
      "directories": [
        ".drift/patterns/discovered",
        ".drift/patterns/approved",
        ".drift/cache",
        ".drift/history"
      ],
      "driftignore": true
    },
    "detectedStack": {
      "languages": ["typescript"],
      "frameworks": ["express"],
      "orms": ["prisma"]
    },
    "registeredInGlobalRegistry": true
  },
  "hints": {
    "nextActions": [
      "Run drift_setup action=\"scan\" to discover patterns",
      "Or run drift_setup action=\"full\" to complete setup"
    ],
    "warnings": [
      "Add .drift/cache/ and .drift/lake/ to .gitignore"
    ]
  }
}
```

**Output (Already Initialized):**
```json
{
  "summary": "Drift already initialized. Use force=true to reinitialize.",
  "data": {
    "success": false,
    "alreadyInitialized": true,
    "projectPath": "/path/to/project",
    "initializedAt": "2024-01-15T08:00:00Z"
  },
  "hints": {
    "nextActions": [
      "Use drift_setup action=\"scan\" to run a new scan",
      "Use drift_setup action=\"init\" options={\"force\": true} to reinitialize"
    ]
  }
}
```

---

### Action: `scan`

**Purpose:** Run pattern detection scan (equivalent to `drift scan`).

**Input:**
```json
{
  "action": "scan",
  "project": "my-project",
  "options": {
    "incremental": false,
    "categories": ["api", "auth", "security"],  // optional filter
    "boundaries": true,
    "testTopology": false,
    "constants": false
  }
}
```

**Output (Success):**
```json
{
  "summary": "Scan complete. Found 156 patterns (89 approved, 67 discovered) in 423 files.",
  "data": {
    "success": true,
    "duration": {
      "totalMs": 45230,
      "formatted": "45.2s"
    },
    "files": {
      "scanned": 423,
      "skipped": 12,
      "errors": 2
    },
    "patterns": {
      "total": 156,
      "approved": 89,
      "discovered": 67,
      "byCategory": {
        "api": 34,
        "auth": 18,
        "security": 12,
        "errors": 28,
        "data-access": 45,
        "other": 19
      }
    },
    "boundaries": {
      "scanned": true,
      "accessPoints": 78,
      "sensitiveFields": 23
    },
    "health": {
      "score": 78,
      "criticalIssues": 2,
      "warnings": 5
    }
  },
  "hints": {
    "nextActions": [
      "Use drift_status for detailed health breakdown",
      "Use drift_patterns_list to explore discovered patterns",
      "Use drift_setup action=\"callgraph\" to enable reachability analysis"
    ],
    "warnings": [
      "2 files had parse errors - check verbose output"
    ]
  }
}
```

**Output (Not Initialized):**
```json
{
  "summary": "Cannot scan: drift not initialized.",
  "data": {
    "success": false,
    "error": "NOT_INITIALIZED",
    "projectPath": "/path/to/project"
  },
  "hints": {
    "nextActions": [
      "Use drift_setup action=\"init\" first",
      "Or use drift_setup action=\"full\" to init + scan"
    ]
  },
  "isError": true
}
```

---

### Action: `callgraph`

**Purpose:** Build call graph for reachability analysis (equivalent to `drift callgraph build`).

**Input:**
```json
{
  "action": "callgraph",
  "project": "my-project",
  "options": {
    "security": true  // include security prioritization
  }
}
```

**Output (Success):**
```json
{
  "summary": "Call graph built. 1,250 functions, 45 entry points, 78 data accessors.",
  "data": {
    "success": true,
    "native": true,  // used Rust native module
    "duration": {
      "totalMs": 12450,
      "formatted": "12.5s"
    },
    "stats": {
      "filesProcessed": 423,
      "totalFunctions": 1250,
      "totalCallSites": 3420,
      "resolvedCallSites": 2890,
      "resolutionRate": 0.845,
      "entryPoints": 45,
      "dataAccessors": 78
    },
    "detectedStack": {
      "languages": ["typescript", "python"],
      "orms": ["prisma", "sqlalchemy"],
      "frameworks": ["express", "fastapi"]
    },
    "security": {
      "criticalAccessPoints": 12,
      "highPriorityAccessPoints": 34,
      "regulations": ["GDPR", "PCI-DSS"]
    }
  },
  "hints": {
    "nextActions": [
      "Use drift_reachability to trace data access paths",
      "Use drift_impact_analysis to understand change impact",
      "Use drift_callers to find function callers"
    ]
  }
}
```

---

### Action: `full`

**Purpose:** Complete setup in one call: init + scan + callgraph.

**Input:**
```json
{
  "action": "full",
  "project": "/path/to/project",
  "options": {
    "boundaries": true,
    "security": true
  }
}
```

**Output (Success):**
```json
{
  "summary": "Full setup complete. Initialized, scanned 423 files (156 patterns), built call graph (1,250 functions).",
  "data": {
    "success": true,
    "totalDuration": {
      "totalMs": 58230,
      "formatted": "58.2s"
    },
    "steps": {
      "init": {
        "success": true,
        "durationMs": 450,
        "projectName": "my-project"
      },
      "scan": {
        "success": true,
        "durationMs": 45230,
        "patterns": 156,
        "files": 423
      },
      "callgraph": {
        "success": true,
        "durationMs": 12550,
        "functions": 1250,
        "entryPoints": 45
      }
    },
    "health": {
      "score": 78,
      "criticalIssues": 2
    }
  },
  "hints": {
    "nextActions": [
      "Use drift_context to get curated context for your task",
      "Use drift_status for detailed health info",
      "Use drift_patterns_list to explore patterns"
    ]
  }
}
```

---

## Implementation

### File Structure

```
drift/packages/mcp/src/tools/
├── setup/
│   ├── index.ts              # Tool definition and exports
│   ├── handler.ts            # Main handler with action routing
│   ├── actions/
│   │   ├── status.ts         # Status check action
│   │   ├── init.ts           # Initialize action
│   │   ├── scan.ts           # Scan action
│   │   ├── callgraph.ts      # Call graph build action
│   │   └── full.ts           # Full setup action
│   └── utils/
│       ├── progress.ts       # Progress tracking for long operations
│       └── validation.ts     # Input validation schemas
```

### Core Dependencies (VERIFIED)

All required exports are available from existing packages:

```typescript
// From driftdetect-core (verified in core/src/index.ts)
import {
  // Stores
  PatternStore,
  HistoryStore,
  BoundaryStore,
  CallGraphStore,
  ConstantStore,
  EnvStore,
  DNAStore,
  ContractStore,
  
  // Data Lake
  createDataLake,
  
  // Project Management
  getProjectRegistry,
  ProjectRegistry,
  
  // Stack Detection
  detectProjectStack,
  
  // Native Module (call graph)
  isNativeAvailable,
  buildCallGraph,
  type BuildConfig,
  type BuildResult,
  
  // File Walking
  FileWalker,
  getDefaultIgnorePatterns,
  mergeIgnorePatterns,
  
  // Test Topology
  createTestTopologyAnalyzer,
  analyzeTestTopologyWithFallback,
  
  // Boundaries
  scanBoundariesWithFallback,
  
  // Constants
  analyzeConstantsWithFallback,
  
  // Unified Scanner
  createUnifiedScanner,
} from 'driftdetect-core';

// From driftdetect-detectors (verified)
import {
  createAllDetectorsArray,
  getDetectorCounts,
  type BaseDetector,
  type DetectionContext,
} from 'driftdetect-detectors';
```

### CLI Services to Extract/Share

The following services from CLI need to be either:
1. Moved to `driftdetect-core` for shared access, OR
2. Duplicated in MCP package with shared types

```typescript
// Currently in drift/packages/cli/src/services/
// These need to be accessible from MCP

// scanner-service.ts - Main pattern detection orchestrator
// Key exports:
//   - ScannerService class
//   - createScannerService(config: ScannerServiceConfig)
//   - ScanResults interface
//   - AggregatedPattern interface
//   - AggregatedViolation interface

// boundary-scanner.ts - Data access boundary detection
// Key exports:
//   - BoundaryScanner class
//   - createBoundaryScanner(config: BoundaryScannerConfig)
//   - BoundaryScanResult interface (re-exported from core)
```

### CRITICAL: Service Extraction Plan

**Option A (Recommended): Move to Core**
```
drift/packages/core/src/services/
├── scanner-service.ts      # Move from CLI
├── boundary-scanner.ts     # Move from CLI (wrapper around core)
└── index.ts               # Export all services
```

**Option B: Duplicate with Shared Types**
```
drift/packages/mcp/src/services/
├── scanner-service.ts      # Copy from CLI
├── boundary-scanner.ts     # Copy from CLI
└── index.ts
```

**Recommendation:** Option A is cleaner but requires updating CLI imports.
For MVP, Option B is faster but creates maintenance burden.

### Handler Implementation Pattern

Following the established enterprise patterns:

```typescript
/**
 * drift_setup - Initialize and configure drift for a project
 * 
 * Layer: Setup (new category)
 * Token Budget: 500 target, 2000 max (varies by action)
 * Cache TTL: None (mutations)
 * Invalidation: Invalidates all caches on success
 * 
 * @file drift/packages/mcp/src/tools/setup/handler.ts
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as crypto from 'node:crypto';

// Infrastructure imports (all verified in infrastructure/index.ts)
import { 
  createResponseBuilder,
  type ResponseCache,
} from '../../infrastructure/response-builder.js';
import { 
  DriftError, 
  DriftErrorCode,
  Errors, 
  handleError,
} from '../../infrastructure/error-handler.js';
import { metrics } from '../../infrastructure/metrics.js';
import { z } from 'zod';

// Core imports (all verified to exist)
import {
  PatternStore,
  HistoryStore,
  BoundaryStore,
  DNAStore,
  ContractStore,
  CallGraphStore,
  createDataLake,
  getProjectRegistry,
  detectProjectStack,
  isNativeAvailable,
  buildCallGraph,
  createUnifiedScanner,
  getDefaultIgnorePatterns,
  mergeIgnorePatterns,
  type BuildConfig,
  type DetectedStack,
} from 'driftdetect-core';

// Input validation schema
const SetupInputSchema = z.object({
  action: z.enum(['init', 'scan', 'callgraph', 'full', 'status']).default('status'),
  project: z.string().optional(),
  options: z.object({
    force: z.boolean().optional(),
    incremental: z.boolean().optional(),
    categories: z.array(z.string()).optional(),
    boundaries: z.boolean().optional(),
    testTopology: z.boolean().optional(),
    constants: z.boolean().optional(),
    security: z.boolean().optional(),
  }).optional(),
});

type SetupInput = z.infer<typeof SetupInputSchema>;

// ============================================================================
// INIT ACTION IMPLEMENTATION (verified against CLI init.ts)
// ============================================================================

const DRIFT_DIR = '.drift';
const DRIFT_SUBDIRS = [
  'patterns/discovered',
  'patterns/approved',
  'patterns/ignored',
  'patterns/variants',
  'history',
  'cache',
  'reports',
  'lake/patterns',
  'lake/callgraph',
  'boundaries',
  'contracts/discovered',
  'contracts/verified',
  'constraints/discovered',
  'constraints/approved',
];

async function handleInitAction(
  projectPath: string,
  options?: { force?: boolean }
): Promise<SetupResult> {
  const driftDir = path.join(projectPath, DRIFT_DIR);
  
  // Check if already initialized
  try {
    await fs.access(driftDir);
    if (!options?.force) {
      return {
        success: false,
        error: 'ALREADY_INITIALIZED',
        message: 'Drift already initialized. Use force=true to reinitialize.',
      };
    }
  } catch {
    // Not initialized, proceed
  }
  
  // Create directory structure
  await fs.mkdir(driftDir, { recursive: true });
  for (const subdir of DRIFT_SUBDIRS) {
    await fs.mkdir(path.join(driftDir, subdir), { recursive: true });
  }
  
  // Create config file
  const projectId = crypto.randomUUID();
  const projectName = path.basename(projectPath);
  const now = new Date().toISOString();
  
  const config = {
    version: '2.0.0',
    project: {
      id: projectId,
      name: projectName,
      initializedAt: now,
    },
    ignore: getDefaultIgnorePatterns(),
    features: {
      callGraph: true,
      boundaries: true,
      dna: true,
      contracts: true,
    },
  };
  
  await fs.writeFile(
    path.join(driftDir, 'config.json'),
    JSON.stringify(config, null, 2)
  );
  
  // Create .driftignore if not exists
  const driftignorePath = path.join(projectPath, '.driftignore');
  try {
    await fs.access(driftignorePath);
  } catch {
    await fs.writeFile(driftignorePath, getDefaultIgnorePatterns().join('\n'));
  }
  
  // Detect project stack
  const detectedStack = await detectProjectStack(projectPath);
  
  // Register in global registry
  let registered = false;
  try {
    const registry = await getProjectRegistry();
    const project = await registry.register(projectPath);
    await registry.setActive(project.id);
    registered = true;
  } catch {
    // Registry registration failed, non-fatal
  }
  
  return {
    success: true,
    projectPath,
    projectName,
    projectId,
    detectedStack,
    registeredInGlobalRegistry: registered,
  };
}

// ============================================================================
// SCAN ACTION IMPLEMENTATION (verified against CLI scan.ts)
// ============================================================================

async function handleScanAction(
  projectPath: string,
  options?: {
    incremental?: boolean;
    categories?: string[];
    boundaries?: boolean;
    testTopology?: boolean;
    constants?: boolean;
  }
): Promise<SetupResult> {
  // Verify drift is initialized
  const driftDir = path.join(projectPath, DRIFT_DIR);
  try {
    await fs.access(driftDir);
  } catch {
    return {
      success: false,
      error: 'NOT_INITIALIZED',
      message: 'Drift not initialized. Run init first.',
    };
  }
  
  const startTime = Date.now();
  
  // Load ignore patterns
  let ignorePatterns: string[];
  try {
    const driftignorePath = path.join(projectPath, '.driftignore');
    const content = await fs.readFile(driftignorePath, 'utf-8');
    const userPatterns = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));
    ignorePatterns = mergeIgnorePatterns(userPatterns);
  } catch {
    ignorePatterns = getDefaultIgnorePatterns();
  }
  
  // NOTE: This is where we need the ScannerService
  // For MVP, we can use the UnifiedScanner from core for basic scanning
  // Full pattern detection requires ScannerService from CLI
  
  // Initialize stores
  const patternStore = new PatternStore({ rootDir: projectPath });
  await patternStore.initialize();
  
  // Run unified scanner for data access detection
  const unifiedScanner = createUnifiedScanner({
    rootDir: projectPath,
    verbose: false,
    autoDetect: true,
  });
  
  const filePatterns = [
    '**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx',
    '**/*.py', '**/*.cs', '**/*.java', '**/*.php',
  ];
  
  const scanResult = await unifiedScanner.scanDirectory({ patterns: filePatterns });
  
  // Run boundary scan if enabled
  let boundaryResult = null;
  if (options?.boundaries !== false) {
    const boundaryStore = new BoundaryStore({ rootDir: projectPath });
    await boundaryStore.initialize();
    // Boundary scanning would go here
    // For MVP, we note this requires the BoundaryScanner service
  }
  
  const duration = Date.now() - startTime;
  
  return {
    success: true,
    duration: {
      totalMs: duration,
      formatted: `${(duration / 1000).toFixed(1)}s`,
    },
    files: {
      scanned: scanResult.stats.filesScanned,
    },
    dataAccess: {
      accessPoints: scanResult.stats.accessPointsFound,
      byOrm: scanResult.stats.byOrm,
    },
    // NOTE: Full pattern detection requires ScannerService integration
    patterns: {
      total: 0,
      note: 'Full pattern detection requires ScannerService integration',
    },
  };
}

// ============================================================================
// CALLGRAPH ACTION IMPLEMENTATION (verified against CLI callgraph.ts)
// ============================================================================

async function handleCallgraphAction(
  projectPath: string,
  options?: { security?: boolean }
): Promise<SetupResult> {
  // Verify drift is initialized
  const driftDir = path.join(projectPath, DRIFT_DIR);
  try {
    await fs.access(driftDir);
  } catch {
    return {
      success: false,
      error: 'NOT_INITIALIZED',
      message: 'Drift not initialized. Run init first.',
    };
  }
  
  const startTime = Date.now();
  
  // Detect project stack first
  const detectedStack = await detectProjectStack(projectPath);
  
  const filePatterns = [
    '**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx',
    '**/*.py', '**/*.cs', '**/*.java', '**/*.php',
  ];
  
  // Try native Rust builder first (verified in core/src/native/index.ts)
  if (isNativeAvailable()) {
    try {
      const config: BuildConfig = {
        root: projectPath,
        patterns: filePatterns,
        resolutionBatchSize: 50,
      };
      
      const result = await buildCallGraph(config);
      
      return {
        success: true,
        native: true,
        duration: {
          totalMs: result.durationMs,
          formatted: `${(result.durationMs / 1000).toFixed(1)}s`,
        },
        stats: {
          filesProcessed: result.filesProcessed,
          totalFunctions: result.totalFunctions,
          totalCallSites: result.totalCalls,
          resolvedCallSites: result.resolvedCalls,
          resolutionRate: result.resolutionRate,
          entryPoints: result.entryPoints,
          dataAccessors: result.dataAccessors,
        },
        detectedStack,
        errors: result.errors,
      };
    } catch (error) {
      // Fall through to TypeScript fallback
    }
  }
  
  // TypeScript fallback would go here
  // For MVP, we return an error if native is not available
  return {
    success: false,
    error: 'NATIVE_REQUIRED',
    message: 'Call graph building requires native module. Install driftdetect-native.',
  };
}

interface SetupResult {
  success: boolean;
  error?: string;
  message?: string;
  [key: string]: unknown;
}

// Context type for the handler
interface SetupContext {
  projectRoot: string;
  cache: ResponseCache | null;
}

export async function handleSetup(
  args: unknown,
  context: SetupContext
): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
  const requestId = `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const startTime = Date.now();
  
  try {
    // 1. Validate input
    const input = SetupInputSchema.parse(args);
    
    // 2. Resolve project path
    const projectPath = input.project 
      ? path.resolve(context.projectRoot, input.project)
      : context.projectRoot;
    
    // Validate path is within allowed root
    if (!projectPath.startsWith(context.projectRoot)) {
      throw Errors.invalidArgument('project', 'Path traversal detected');
    }
    
    // 3. Route to action handler
    let result: SetupResult;
    switch (input.action) {
      case 'status':
        result = await handleStatusAction(projectPath);
        break;
      case 'init':
        result = await handleInitAction(projectPath, input.options);
        // Invalidate all caches after mutation
        if (context.cache) {
          await context.cache.invalidateAll();
        }
        break;
      case 'scan':
        result = await handleScanAction(projectPath, input.options);
        if (context.cache) {
          await context.cache.invalidateAll();
        }
        break;
      case 'callgraph':
        result = await handleCallgraphAction(projectPath, input.options);
        if (context.cache) {
          await context.cache.invalidateAll();
        }
        break;
      case 'full':
        result = await handleFullAction(projectPath, input.options);
        if (context.cache) {
          await context.cache.invalidateAll();
        }
        break;
      default:
        result = { success: false, error: 'UNKNOWN_ACTION' };
    }
    
    // 4. Record metrics
    metrics.recordRequest('drift_setup', Date.now() - startTime, result.success, false);
    
    // 5. Build response
    const builder = createResponseBuilder<SetupResult>(requestId);
    
    if (result.success) {
      return builder
        .withSummary(generateSummary(input.action, result))
        .withData(result)
        .withHints(generateHints(input.action, result))
        .buildContent();
    } else {
      return builder
        .withSummary(result.message || 'Operation failed')
        .withData(result)
        .withHints({
          nextActions: getRecoveryActions(result.error),
        })
        .buildContent();
    }
    
  } catch (error) {
    metrics.recordRequest('drift_setup', Date.now() - startTime, false, false);
    // Use the infrastructure error handler
    return handleError(error, requestId);
  }
}

function generateSummary(action: string, result: SetupResult): string {
  switch (action) {
    case 'init':
      return `Drift initialized in ${result.projectName}`;
    case 'scan':
      return `Scan complete in ${result.duration?.formatted}`;
    case 'callgraph':
      return `Call graph built: ${result.stats?.totalFunctions} functions`;
    case 'full':
      return `Full setup complete`;
    default:
      return 'Operation complete';
  }
}

function generateHints(action: string, _result: SetupResult): { nextActions: string[] } {
  switch (action) {
    case 'init':
      return { nextActions: ['Run drift_setup action="scan"', 'Run drift_setup action="full"'] };
    case 'scan':
      return { nextActions: ['Run drift_setup action="callgraph"', 'Use drift_patterns_list'] };
    case 'callgraph':
      return { nextActions: ['Use drift_reachability', 'Use drift_impact_analysis'] };
    default:
      return { nextActions: ['Use drift_context for curated context'] };
  }
}

function getRecoveryActions(error?: string): string[] {
  switch (error) {
    case 'NOT_INITIALIZED':
      return ['Run drift_setup action="init" first'];
    case 'ALREADY_INITIALIZED':
      return ['Use force=true to reinitialize', 'Run drift_setup action="scan"'];
    case 'NATIVE_REQUIRED':
      return ['Install driftdetect-native package'];
    default:
      return ['Check project path', 'Verify permissions'];
  }
}

async function handleStatusAction(projectPath: string): Promise<SetupResult> {
  // Implementation for status check
  const driftDir = path.join(projectPath, DRIFT_DIR);
  
  try {
    await fs.access(driftDir);
  } catch {
    const detectedStack = await detectProjectStack(projectPath);
    return {
      success: true,
      initialized: false,
      projectPath,
      detectedStack,
    };
  }
  
  // Check what's been run
  const configPath = path.join(driftDir, 'config.json');
  let config = null;
  try {
    const content = await fs.readFile(configPath, 'utf-8');
    config = JSON.parse(content);
  } catch {
    // Config missing or invalid
  }
  
  // Check for call graph
  let callGraphBuilt = false;
  try {
    await fs.access(path.join(driftDir, 'lake', 'callgraph', 'callgraph.db'));
    callGraphBuilt = true;
  } catch {
    try {
      await fs.access(path.join(driftDir, 'lake', 'callgraph', 'index.json'));
      callGraphBuilt = true;
    } catch {
      // No call graph
    }
  }
  
  // Check for patterns
  let patternsFound = 0;
  try {
    const discoveredDir = path.join(driftDir, 'patterns', 'discovered');
    const files = await fs.readdir(discoveredDir);
    patternsFound = files.filter(f => f.endsWith('.json')).length;
  } catch {
    // No patterns
  }
  
  return {
    success: true,
    initialized: true,
    projectPath,
    projectName: config?.project?.name || path.basename(projectPath),
    config,
    callGraphBuilt,
    patternsFound,
  };
}

async function handleFullAction(
  projectPath: string,
  options?: SetupInput['options']
): Promise<SetupResult> {
  const results: Record<string, SetupResult> = {};
  const startTime = Date.now();
  
  // Step 1: Init
  results.init = await handleInitAction(projectPath, { force: options?.force });
  if (!results.init.success && results.init.error !== 'ALREADY_INITIALIZED') {
    return {
      success: false,
      error: 'INIT_FAILED',
      message: results.init.message,
      steps: results,
    };
  }
  
  // Step 2: Scan
  results.scan = await handleScanAction(projectPath, options);
  if (!results.scan.success) {
    return {
      success: false,
      error: 'SCAN_FAILED',
      message: results.scan.message,
      steps: results,
    };
  }
  
  // Step 3: Call Graph
  results.callgraph = await handleCallgraphAction(projectPath, options);
  // Call graph failure is non-fatal
  
  const totalDuration = Date.now() - startTime;
  
  return {
    success: true,
    totalDuration: {
      totalMs: totalDuration,
      formatted: `${(totalDuration / 1000).toFixed(1)}s`,
    },
    steps: results,
  };
}
```

---

## Long-Running Operation Handling

Scan and callgraph operations can take 30s-5min. The MCP protocol doesn't have native streaming, so we need strategies:

### Option 1: Synchronous with Timeout (Recommended for MVP)

```typescript
// Set reasonable timeout (5 minutes)
const OPERATION_TIMEOUT_MS = 5 * 60 * 1000;

async function handleScanAction(projectPath: string, options: ScanOptions) {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Scan timeout')), OPERATION_TIMEOUT_MS);
  });
  
  const scanPromise = runScan(projectPath, options);
  
  return Promise.race([scanPromise, timeoutPromise]);
}
```

### Option 2: Async with Polling (Future Enhancement)

```typescript
// Start operation, return job ID
{
  "action": "scan",
  "async": true
}

// Response
{
  "jobId": "scan_abc123",
  "status": "running",
  "checkWith": "drift_setup action=\"job\" jobId=\"scan_abc123\""
}

// Poll for completion
{
  "action": "job",
  "jobId": "scan_abc123"
}
```

---

## Security Considerations

### Path Validation

```typescript
function validateProjectPath(inputPath: string, allowedRoot: string): string {
  const resolved = path.resolve(inputPath);
  
  // Prevent path traversal outside allowed root
  if (!resolved.startsWith(allowedRoot)) {
    throw Errors.invalidArgument(
      'project',
      'Path traversal detected',
      'Project path must be within the workspace'
    );
  }
  
  return resolved;
}
```

### Resource Limits

```typescript
const LIMITS = {
  maxFilesToScan: 10000,
  maxFileSizeBytes: 1024 * 1024, // 1MB
  scanTimeoutMs: 5 * 60 * 1000,  // 5 minutes
  callgraphTimeoutMs: 10 * 60 * 1000, // 10 minutes
};
```

---

## Integration with Existing Tools

After `drift_setup` completes, all existing MCP tools become functional:

| Tool | Requires | After Setup |
|------|----------|-------------|
| `drift_status` | init | ✅ Works |
| `drift_patterns_list` | scan | ✅ Works |
| `drift_code_examples` | scan | ✅ Works |
| `drift_context` | scan | ✅ Works |
| `drift_reachability` | callgraph | ✅ Works |
| `drift_impact_analysis` | callgraph | ✅ Works |
| `drift_callers` | callgraph | ✅ Works |

---

## Implementation Phases

### Phase 1: Core Actions (Week 1)
- [ ] Tool definition and input validation
- [ ] `status` action implementation
- [ ] `init` action implementation
- [ ] Basic error handling

### Phase 2: Scan Integration (Week 2)
- [ ] Extract scanner service for MCP use
- [ ] `scan` action implementation
- [ ] Progress tracking
- [ ] Timeout handling

### Phase 3: Call Graph Integration (Week 3)
- [ ] `callgraph` action implementation
- [ ] Native Rust integration
- [ ] `full` action (orchestrates all three)

### Phase 4: Polish (Week 4)
- [ ] Comprehensive error messages
- [ ] Cache invalidation
- [ ] Metrics and observability
- [ ] Documentation and examples

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Init success rate | > 99% |
| Scan completion rate | > 95% |
| Callgraph build rate | > 90% |
| Average full setup time | < 2 min (medium codebase) |
| User satisfaction | > 4/5 |

---

## Example Workflows

### Workflow 1: AI Agent Setting Up New Project

```
User: "Analyze this codebase for security issues"

Agent:
1. drift_setup action="status" 
   → "Drift not initialized"

2. drift_setup action="full" options={"security": true}
   → "Full setup complete. 156 patterns, 1250 functions."

3. drift_security_summary
   → "12 critical access points, 3 GDPR concerns..."

4. drift_reachability location="src/api/users.ts:45"
   → "Can reach: users.password_hash, users.ssn..."
```

### Workflow 2: Refreshing Stale Data

```
User: "The patterns seem outdated, can you rescan?"

Agent:
1. drift_setup action="scan" options={"incremental": false}
   → "Scan complete. 12 new patterns discovered."

2. drift_patterns_list status="discovered"
   → Shows newly discovered patterns
```

### Workflow 3: Adding Call Graph to Existing Setup

```
User: "I need to understand the impact of changing this function"

Agent:
1. drift_setup action="status"
   → "Initialized, scanned, but no call graph"

2. drift_setup action="callgraph"
   → "Call graph built. 1250 functions."

3. drift_impact_analysis target="src/services/auth.ts"
   → "45 callers, 12 entry points affected..."
```

---

## References

- [Enterprise MCP Server Design](./ENTERPRISE-MCP-SERVER.md)
- [AI Surgical Tools Design](./AI-SURGICAL-TOOLS.md)
- [Speculative Execution Engine](./SPECULATIVE-EXECUTION-ENGINE.md)
- [CLI Init Command](../../packages/cli/src/commands/init.ts)
- [CLI Scan Command](../../packages/cli/src/commands/scan.ts)
- [CLI Callgraph Command](../../packages/cli/src/commands/callgraph.ts)


---

## Integration Checklist

This section verifies all components are properly wired for a complete implementation.

### ✅ Verified Core Imports (from driftdetect-core)

All these exports have been verified to exist in `drift/packages/core/src/index.ts`:

| Import | Status | Location |
|--------|--------|----------|
| `PatternStore` | ✅ Verified | `store/pattern-store.ts` |
| `HistoryStore` | ✅ Verified | `store/history-store.ts` |
| `BoundaryStore` | ✅ Verified | `boundaries/index.ts` |
| `CallGraphStore` | ✅ Verified | `call-graph/index.ts` |
| `ConstantStore` | ✅ Verified | `constants/store/constant-store.ts` |
| `EnvStore` | ✅ Verified | `boundaries/index.ts` |
| `DNAStore` | ✅ Verified | `dna/index.ts` |
| `ContractStore` | ✅ Verified | `store/contract-store.ts` |
| `createDataLake` | ✅ Verified | `lake/index.ts` |
| `getProjectRegistry` | ✅ Verified | `store/project-registry.ts` |
| `detectProjectStack` | ✅ Verified | `call-graph/index.ts` |
| `isNativeAvailable` | ✅ Verified | `call-graph/index.ts` |
| `buildCallGraph` | ✅ Verified | `call-graph/index.ts` |
| `createUnifiedScanner` | ✅ Verified | `call-graph/index.ts` |
| `getDefaultIgnorePatterns` | ✅ Verified | `config/index.ts` |
| `mergeIgnorePatterns` | ✅ Verified | `config/index.ts` |

### ✅ Verified Infrastructure Imports (from MCP package)

All these exports have been verified to exist in `drift/packages/mcp/src/infrastructure/index.ts`:

| Import | Status | Location |
|--------|--------|----------|
| `createResponseBuilder` | ✅ Verified | `response-builder.ts` |
| `ResponseCache` | ✅ Verified | `cache.ts` |
| `DriftError` | ✅ Verified | `error-handler.ts` |
| `DriftErrorCode` | ✅ Verified | `error-handler.ts` |
| `Errors` | ✅ Verified | `error-handler.ts` |
| `handleError` | ✅ Verified | `error-handler.ts` |
| `metrics` | ✅ Verified | `metrics.ts` |

### ⚠️ Services Requiring Extraction

These services are currently in CLI and need to be shared with MCP:

| Service | Current Location | Action Required |
|---------|-----------------|-----------------|
| `ScannerService` | `cli/src/services/scanner-service.ts` | Move to core or duplicate |
| `BoundaryScanner` | `cli/src/services/boundary-scanner.ts` | Move to core or duplicate |

**Recommended Approach:** Create a new `drift/packages/core/src/services/` directory and move these services there. Update CLI imports to use the new location.

---

## 🔴 CRITICAL INTEGRATION VERIFICATION

This section identifies every potential silent failure point and how to prevent it.

### Issue #1: ScannerService Not Available in MCP

**Problem:** The `ScannerService` class that runs the full pattern detection with 100+ detectors is in `drift/packages/cli/src/services/scanner-service.ts`. It is NOT exported from `driftdetect-core` and NOT available in the MCP package.

**Impact:** Without `ScannerService`, the scan action will only run `createUnifiedScanner` which does basic data access detection, NOT full pattern detection with all detectors.

**Solution Options:**

**Option A (Recommended): Move ScannerService to Core**
```bash
# Move files
mv drift/packages/cli/src/services/scanner-service.ts drift/packages/core/src/services/
mv drift/packages/cli/src/workers/detector-worker.ts drift/packages/core/src/workers/

# Update exports in drift/packages/core/src/index.ts
export { ScannerService, createScannerService } from './services/scanner-service.js';
```

**Option B: Import from CLI (Not Recommended)**
The MCP package would need to depend on CLI package, creating a circular dependency risk.

**Option C: Duplicate ScannerService in MCP**
Copy the service to MCP package. Creates maintenance burden but works for MVP.

**Current Design Status:** The design document uses `createUnifiedScanner` as a fallback with a note that full pattern detection requires ScannerService. This is INCOMPLETE for production.

### Issue #2: Worker Threads Path Resolution

**Problem:** `ScannerService` uses Piscina worker threads with a hardcoded path:
```typescript
const workerPath = path.join(__dirname, '..', 'workers', 'detector-worker.js');
```

**Impact:** If ScannerService is moved to core, the worker path will be wrong.

**Solution:** Make worker path configurable or use `import.meta.url` for ESM-compatible path resolution.

### Issue #3: driftdetect-detectors Dependency

**Problem:** `ScannerService` imports from `driftdetect-detectors`:
```typescript
import { createAllDetectorsArray, getDetectorCounts } from 'driftdetect-detectors';
```

**Impact:** The MCP package must have `driftdetect-detectors` as a dependency.

**Status:** ✅ VERIFIED - `driftdetect-detectors` is already in `drift/packages/mcp/package.json`

### Issue #4: Native Module Fallback

**Problem:** The callgraph action uses `buildCallGraph` from native module:
```typescript
if (isNativeAvailable()) {
  const result = await buildCallGraph(config);
}
```

**Impact:** If native module is not installed, the function throws an error. The design shows returning an error, but this may not be the desired UX.

**Solution:** Add TypeScript fallback using `createStreamingCallGraphBuilder`:
```typescript
// If native not available, use TypeScript streaming builder
import { createStreamingCallGraphBuilder } from 'driftdetect-core';

if (!isNativeAvailable()) {
  const builder = createStreamingCallGraphBuilder({ rootDir: projectPath });
  const result = await builder.build(filePatterns);
  // ... format result
}
```

### Issue #5: Missing Zod Dependency

**Problem:** The handler uses `zod` for input validation:
```typescript
import { z } from 'zod';
const SetupInputSchema = z.object({ ... });
```

**Impact:** If `zod` is not in MCP package dependencies, import will fail.

**Status:** ❌ NOT FOUND - `zod` is NOT in `drift/packages/mcp/package.json`

**Action Required:** Add zod to MCP package:
```bash
cd drift/packages/mcp
pnpm add zod
```

**Alternative:** Use manual validation instead of zod (less type-safe but no new dependency)

### Issue #6: Cache Type Mismatch

**Problem:** The handler expects `ResponseCache` but the enterprise server passes the cache differently.

**Current enterprise-server.ts pattern:**
```typescript
const cache = config.enableCache !== false 
  ? createCache(config.projectRoot)
  : null;
```

**Solution:** Handler must handle `null` cache (already fixed in design).

### Issue #7: Metrics Method Signature

**Problem:** The design uses `metrics.recordRequest()` but the actual metrics API may differ.

**Status:** ✅ VERIFIED - Method exists with correct signature:
```typescript
recordRequest(tool: string, durationMs: number, success: boolean, cached?: boolean): void
```

### Issue #8: Path Traversal Security

**Problem:** The design validates paths but the check may be insufficient:
```typescript
if (!projectPath.startsWith(context.projectRoot)) {
  throw Errors.invalidArgument('project', 'Path traversal detected');
}
```

**Issue:** `path.resolve('/root', '../etc/passwd')` returns `/etc/passwd` which doesn't start with `/root`.

**Solution:** Use `path.resolve` and then check:
```typescript
const resolved = path.resolve(context.projectRoot, input.project || '.');
const normalized = path.normalize(resolved);
if (!normalized.startsWith(path.normalize(context.projectRoot))) {
  throw Errors.invalidArgument('project', 'Path traversal detected');
}
```

---

## 🟡 IMPLEMENTATION GAPS TO ADDRESS

### Gap #1: Full Pattern Detection

The current design only implements basic data access scanning via `createUnifiedScanner`. For full pattern detection with all 100+ detectors, we need:

1. Move `ScannerService` to core package
2. Move `detector-worker.ts` to core package
3. Update worker path resolution
4. Add `driftdetect-detectors` dependency to MCP package
5. Update scan action to use `ScannerService`

### Gap #2: TypeScript Callgraph Fallback

Add fallback for when native module is not available:

```typescript
async function handleCallgraphAction(projectPath: string, options?: { security?: boolean }): Promise<SetupResult> {
  // ... validation ...
  
  if (isNativeAvailable()) {
    // Native Rust path (fast, memory-efficient)
    const result = await buildCallGraph(config);
    return formatNativeResult(result);
  }
  
  // TypeScript fallback (slower, may OOM on large codebases)
  const builder = createStreamingCallGraphBuilder({
    rootDir: projectPath,
    onProgress: (current, total) => {
      // Progress tracking
    },
  });
  
  const result = await builder.build(filePatterns);
  return formatTSResult(result);
}
```

### Gap #3: Progress Reporting

MCP doesn't support streaming responses. For long-running operations:

1. **Option A:** Return immediately with estimated time, let user poll status
2. **Option B:** Block and return when complete (current design)
3. **Option C:** Use MCP notifications if supported

Current design uses Option B with timeout protection.

---

### 📁 Files to Create

```
drift/packages/mcp/src/tools/setup/
├── index.ts              # Tool definition export
├── handler.ts            # Main handler (from this design)
└── types.ts              # Shared types
```

### 📝 Files to Modify

1. **`drift/packages/mcp/src/tools/registry.ts`**
   - Add `SETUP_TOOLS` import
   - Add to `ALL_TOOLS` array
   - Add to `TOOL_CATEGORIES`

2. **`drift/packages/mcp/src/enterprise-server.ts`**
   - Import `handleSetup` from `./tools/setup/handler.js`
   - Add case in `routeToolCall` switch statement

3. **`drift/packages/mcp/src/tools/discovery/index.ts`** (or create setup/index.ts)
   - Export the tool definition

### 🔌 Registration Code

Add to `drift/packages/mcp/src/enterprise-server.ts`:

```typescript
// At top with other imports
import { handleSetup } from './tools/setup/handler.js';

// In routeToolCall function, add new case block:
// ============================================================================
// Setup Tools (Project Initialization)
// ============================================================================
switch (name) {
  case 'drift_setup':
    return handleSetup(args, {
      projectRoot: effectiveProjectRoot,
      cache,
    });
}
```

Add to `drift/packages/mcp/src/tools/registry.ts`:

```typescript
// Import
import { SETUP_TOOLS } from './setup/index.js';

// Add to ALL_TOOLS (after DISCOVERY_TOOLS)
export const ALL_TOOLS: Tool[] = [
  ...ORCHESTRATION_TOOLS,
  ...DISCOVERY_TOOLS,
  ...SETUP_TOOLS,        // NEW: Setup tools
  ...SURGICAL_TOOLS,
  // ... rest
];

// Add to TOOL_CATEGORIES
export const TOOL_CATEGORIES = {
  orchestration: ORCHESTRATION_TOOLS.map(t => t.name),
  discovery: DISCOVERY_TOOLS.map(t => t.name),
  setup: SETUP_TOOLS.map(t => t.name),  // NEW
  // ... rest
};
```

### 🧪 Test Scenarios

Before deployment, verify these scenarios work:

1. **Fresh Project**
   ```
   drift_setup action="status" → initialized: false
   drift_setup action="init" → success: true
   drift_setup action="status" → initialized: true
   ```

2. **Full Setup**
   ```
   drift_setup action="full" → success: true, steps: {init, scan, callgraph}
   drift_status → health score available
   drift_patterns_list → patterns available
   drift_callers function="someFunc" → callers available
   ```

3. **Error Cases**
   ```
   drift_setup action="scan" (not initialized) → error: NOT_INITIALIZED
   drift_setup action="init" (already initialized) → error: ALREADY_INITIALIZED
   drift_setup project="../outside" → error: INVALID_ARGUMENT (path traversal)
   ```

4. **Cache Invalidation**
   ```
   drift_patterns_list → cached result
   drift_setup action="scan" → invalidates cache
   drift_patterns_list → fresh result
   ```

### 🚀 Deployment Checklist

- [ ] Create `drift/packages/mcp/src/tools/setup/` directory
- [ ] Create `index.ts` with tool definition
- [ ] Create `handler.ts` with implementation
- [ ] Create `types.ts` with shared types
- [ ] Update `registry.ts` to include SETUP_TOOLS
- [ ] Update `enterprise-server.ts` to route drift_setup
- [ ] Extract ScannerService to core (or duplicate)
- [ ] Add `zod` dependency to MCP package: `pnpm add zod`
- [ ] Add unit tests for each action
- [ ] Add integration tests for full workflow
- [ ] Update MCP-Tools-Reference.md wiki page
- [ ] Test with Claude/Kiro MCP client

---

## 🎯 FINAL VERIFICATION SUMMARY

### ✅ Ready to Implement (No Blockers)
- Init action - all imports verified
- Status action - all imports verified  
- Callgraph action (native path) - all imports verified
- Infrastructure (ResponseBuilder, Errors, metrics) - all verified
- Tool registration pattern - documented

### ⚠️ Requires Additional Work
| Item | Status | Action |
|------|--------|--------|
| Zod dependency | ❌ Missing | `pnpm add zod` in MCP package |
| ScannerService | ❌ Not in core | Move from CLI or duplicate |
| TypeScript callgraph fallback | ⚠️ Partial | Add `createStreamingCallGraphBuilder` fallback |
| Full pattern detection | ⚠️ Partial | Requires ScannerService integration |

### 🔒 Security Verified
- Path traversal protection documented
- Input validation with zod schema
- Project root boundary enforcement

### 📊 Metrics Integration Verified
- `metrics.recordRequest()` signature confirmed
- Cache invalidation on mutations documented

---

## Appendix: Complete Tool Definition

```typescript
// drift/packages/mcp/src/tools/setup/index.ts

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const SETUP_TOOLS: Tool[] = [
  {
    name: 'drift_setup',
    description: `Initialize and configure drift for a project. Enables AI agents to set up drift without CLI access.

Actions:
- status: Check if drift is initialized and what's been run
- init: Initialize drift in a project (creates .drift/ directory)
- scan: Run pattern detection scan on the codebase
- callgraph: Build call graph for reachability analysis
- full: Run init + scan + callgraph in sequence

Use this when:
- Starting work on a new project that doesn't have drift set up
- The project has drift but needs a fresh scan
- You need call graph data for impact/reachability analysis

Note: Long-running operations (scan, callgraph) may take 30s-5min depending on codebase size.`,
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['init', 'scan', 'callgraph', 'full', 'status'],
          description: 'Action to perform (default: status)',
        },
        project: {
          type: 'string',
          description: 'Project name or path. If not specified, uses active project.',
        },
        options: {
          type: 'object',
          description: 'Action-specific options',
          properties: {
            force: {
              type: 'boolean',
              description: 'For init: reinitialize even if already initialized',
            },
            incremental: {
              type: 'boolean',
              description: 'For scan: only scan changed files (faster)',
            },
            categories: {
              type: 'array',
              items: { type: 'string' },
              description: 'For scan: limit to specific pattern categories',
            },
            boundaries: {
              type: 'boolean',
              description: 'For scan: include data boundary scanning (default: true)',
            },
            testTopology: {
              type: 'boolean',
              description: 'For scan: build test topology (default: false)',
            },
            constants: {
              type: 'boolean',
              description: 'For scan: extract constants (default: false)',
            },
            security: {
              type: 'boolean',
              description: 'For callgraph: include security prioritization',
            },
          },
        },
      },
    },
  },
];

export { handleSetup } from './handler.js';
```

