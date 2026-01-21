# Data Boundaries Design Document

**Feature Name:** Data Boundaries  
**Status:** Draft  
**Author:** Drift Team  
**Created:** 2026-01-21

## Overview

Data Boundaries is a semantic learning feature that discovers which code accesses which database tables/fields, and optionally enforces access rules. It extends Drift's existing contract detection (Frontend ↔ Backend) to cover the Backend ↔ Database layer.

```
Frontend → [API Contracts] → Backend → [Data Boundaries] → Database
```

### Goals

1. **Discovery**: Automatically map which code touches which data (tables, fields)
2. **Visibility**: Surface data access patterns via CLI, MCP, and Dashboard
3. **Enforcement** (opt-in): Define and enforce access boundaries for sensitive data
4. **AI Integration**: Provide context to AI code generators about data access rules

### Non-Goals

- Runtime enforcement (this is static analysis only)
- Database schema management
- Query optimization recommendations
- Full SQL parsing for all edge cases

---

## Architecture

### Integration Points

Data Boundaries integrates with existing Drift architecture:

| Component | Integration |
|-----------|-------------|
| **Detectors** | New semantic detectors in `packages/detectors/src/data-access/boundaries/` |
| **Core** | New `BoundaryStore` in `packages/core/src/store/` |
| **CLI** | New `drift boundaries` command in `packages/cli/src/commands/` |
| **MCP** | New `drift_boundaries` tool in `packages/mcp/src/server.ts` |
| **Dashboard** | New Boundaries tab in `packages/dashboard/` |

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         drift scan                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Semantic Detectors                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ ORM Model       │  │ Query Access    │  │ Sensitive Field │  │
│  │ Detector        │  │ Detector        │  │ Detector        │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BoundaryStore                               │
│  .drift/boundaries/                                              │
│    ├── access-map.json      # Code → Data relationships         │
│    ├── tables.json          # Discovered tables & access        │
│    ├── sensitive.json       # Auto-detected sensitive fields    │
│    └── rules.json           # User-defined boundaries (opt-in)  │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
         ┌────────┐     ┌─────────┐     ┌───────────┐
         │  CLI   │     │   MCP   │     │ Dashboard │
         └────────┘     └─────────┘     └───────────┘
```

---

## Semantic Detectors

All detectors extend `SemanticDetector` base class for language-agnostic pattern learning.

### 1. ORM Model Detector

**Purpose:** Extract table/model mappings from ORM definitions.

**File:** `packages/detectors/src/data-access/boundaries/orm-model-detector.ts`

**Semantic Keywords:**
```typescript
const KEYWORDS = [
  // EF Core
  'DbSet', 'DbContext', 'Entity', 'Table', 'Column',
  // Django
  'models.Model', 'CharField', 'ForeignKey', 'ManyToMany',
  // SQLAlchemy
  'Base', 'Column', 'relationship', 'ForeignKey',
  // Prisma
  'model', '@relation', '@id', '@unique',
  // TypeORM
  'Entity', 'Column', 'PrimaryColumn', 'ManyToOne',
  // Sequelize
  'Model', 'DataTypes', 'belongsTo', 'hasMany',
];
```

**Output:**
```typescript
interface ORMModelMatch {
  modelName: string;           // e.g., "User"
  tableName: string | null;    // e.g., "users" (if detectable)
  fields: string[];            // e.g., ["id", "email", "password_hash"]
  file: string;
  line: number;
  framework: 'efcore' | 'django' | 'sqlalchemy' | 'prisma' | 'typeorm' | 'sequelize' | 'unknown';
}
```

### 2. Query Access Detector

**Purpose:** Find data access points in code.

**File:** `packages/detectors/src/data-access/boundaries/query-access-detector.ts`

**Semantic Keywords:**
```typescript
const KEYWORDS = [
  // ORM queries
  'Where', 'Select', 'Include', 'Find', 'filter', 'get', 'all',
  'objects', 'query', 'execute', 'fetch',
  // Raw SQL indicators
  'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'FROM', 'JOIN',
  'execute', 'raw', 'sql', 'cursor',
  // Table references
  'table', 'Table', 'from', 'into',
];
```

**Output:**
```typescript
interface QueryAccessMatch {
  table: string;                    // Table/model being accessed
  fields: string[];                 // Fields accessed (if detectable)
  operation: 'read' | 'write' | 'delete' | 'unknown';
  file: string;
  line: number;
  context: string;                  // Surrounding code for AI explanation
  isRawSql: boolean;
  confidence: number;
}
```

### 3. Sensitive Field Detector

**Purpose:** Auto-flag potentially sensitive columns.

**File:** `packages/detectors/src/data-access/boundaries/sensitive-field-detector.ts`

**Semantic Keywords:**
```typescript
const SENSITIVE_PATTERNS = {
  pii: ['ssn', 'social_security', 'date_of_birth', 'dob', 'address', 'phone'],
  credentials: ['password', 'secret', 'token', 'api_key', 'private_key', 'hash'],
  financial: ['credit_card', 'card_number', 'cvv', 'bank_account', 'salary', 'income'],
  health: ['diagnosis', 'prescription', 'medical', 'health'],
};
```

**Output:**
```typescript
interface SensitiveFieldMatch {
  field: string;
  table: string | null;
  sensitivityType: 'pii' | 'credentials' | 'financial' | 'health' | 'unknown';
  file: string;
  line: number;
  confidence: number;
}
```

---

## Storage

### BoundaryStore

**File:** `packages/core/src/store/boundary-store.ts`

```typescript
export interface DataAccessMap {
  version: '1.0';
  generatedAt: string;
  
  tables: {
    [tableName: string]: {
      model?: string;              // ORM model name
      fields: string[];            // Known columns
      sensitiveFields: {
        field: string;
        type: string;
        confidence: number;
      }[];
      accessedBy: {
        file: string;
        line: number;
        operation: 'read' | 'write' | 'delete' | 'unknown';
        fields: string[];
      }[];
    };
  };
  
  accessPoints: {
    [id: string]: {
      file: string;
      line: number;
      table: string;
      fields: string[];
      operation: 'read' | 'write' | 'delete' | 'unknown';
      context: string;
      confidence: number;
    };
  };
}

export interface BoundaryRules {
  version: '1.0';
  
  sensitivity: {
    critical: string[];    // e.g., ["users.ssn", "payments.card_number"]
    sensitive: string[];   // e.g., ["users.email", "orders.total"]
    general: string[];     // Default: ["*"]
  };
  
  boundaries: {
    id: string;
    description: string;
    fields?: string[];           // Field-level: ["users.ssn", "users.password_hash"]
    tables?: string[];           // Table-level: ["audit_logs", "payments"]
    operations?: ('read' | 'write' | 'delete')[];
    allowedPaths: string[];      // Glob patterns: ["src/auth/**", "src/compliance/**"]
    severity: 'error' | 'warning' | 'info';
  }[];
}

export class BoundaryStore {
  constructor(config: { rootDir: string });
  
  async initialize(): Promise<void>;
  
  // Discovery
  getAccessMap(): DataAccessMap;
  getTableAccess(table: string): TableAccessInfo | null;
  getFileAccess(file: string): FileAccessInfo[];
  getSensitiveAccess(): SensitiveAccessInfo[];
  
  // Rules (opt-in)
  getRules(): BoundaryRules | null;
  checkViolations(accessPoint: AccessPoint): BoundaryViolation[];
  
  // Persistence
  async saveAccessMap(map: DataAccessMap): Promise<void>;
  async saveRules(rules: BoundaryRules): Promise<void>;
}
```

### File Structure

```
.drift/
  boundaries/
    access-map.json       # Discovered data access patterns
    tables.json           # Table-centric view
    sensitive.json        # Sensitive field detections
    rules.json            # User-defined boundaries (opt-in)
    violations.json       # Current violations (if rules defined)
```

---

## CLI Integration

### New Command: `drift boundaries`

**File:** `packages/cli/src/commands/boundaries.ts`

```bash
# Discovery commands (always available)
drift boundaries                    # Overview of data access
drift boundaries tables             # List all discovered tables
drift boundaries table users        # Show access to 'users' table
drift boundaries file src/auth/*    # What data does auth module access?
drift boundaries sensitive          # Show all sensitive field access

# Enforcement commands (require rules.json)
drift boundaries check              # Check for violations
drift boundaries init-rules         # Generate starter rules.json
drift boundaries violations         # List current violations
```

**Example Output:**

```
$ drift boundaries

🗄️  Data Boundaries - Access Map

Tables Discovered: 12
Access Points: 847
Sensitive Fields: 23

Top Accessed Tables:
  users          342 access points (18 files)
  orders         156 access points (12 files)
  products       128 access points (8 files)
  payments        67 access points (4 files)  ⚠️ sensitive
  audit_logs      45 access points (3 files)

Sensitive Field Access:
  users.password_hash    12 locations (src/auth/*, src/admin/*)
  users.email            89 locations (widespread)
  payments.card_number    3 locations (src/billing/*)

Run 'drift boundaries table <name>' for details
Run 'drift boundaries init-rules' to set up enforcement
```

```
$ drift boundaries table users

📊 Table: users

Model: User (src/models/user.ts)
Fields: id, email, password_hash, name, created_at, updated_at

Sensitive Fields:
  🔴 password_hash (credentials) - HIGH confidence
  🟡 email (pii) - MEDIUM confidence

Access Points (342 total):

  src/auth/login-service.ts
    Line 45: read [email, password_hash]
    Line 89: write [updated_at]
  
  src/users/user-service.ts
    Line 23: read [id, email, name]
    Line 67: write [name, email]
    Line 112: delete [*]
  
  src/admin/admin-service.ts
    Line 34: read [*]
  
  ... and 15 more files

⚠️  password_hash accessed outside src/auth/:
    src/admin/admin-service.ts:34
```

### Integration with `drift scan`

Add boundary scanning to the existing scan command:

```typescript
// In scan.ts, after contract scanning:

if (options.boundaries !== false) {
  const boundarySpinner = createSpinner('Scanning data boundaries...');
  boundarySpinner.start();
  
  const boundaryScanner = createBoundaryScanner({ rootDir, verbose });
  await boundaryScanner.initialize();
  const boundaryResult = await boundaryScanner.scanFiles(files);
  
  boundarySpinner.succeed(
    `Found ${boundaryResult.stats.tables} tables, ` +
    `${boundaryResult.stats.accessPoints} access points`
  );
  
  // Show sensitive access warnings
  if (boundaryResult.sensitiveAccess.length > 0) {
    console.log(chalk.yellow(`\n⚠️  Sensitive data access detected:`));
    // ... display details
  }
  
  // Check violations if rules exist
  if (boundaryResult.violations.length > 0) {
    console.log(chalk.red(`\n🚫 ${boundaryResult.violations.length} boundary violations:`));
    // ... display violations
  }
}
```

---

## MCP Integration

### New Tool: `drift_boundaries`

**File:** `packages/mcp/src/server.ts` (add to TOOLS array)

```typescript
{
  name: 'drift_boundaries',
  description: 'Get data access boundaries and check for violations. Shows which code accesses which database tables/fields. Use this before generating data access code to understand access rules.',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['overview', 'table', 'file', 'sensitive', 'check', 'rules'],
        description: 'Action to perform (default: overview)',
      },
      table: {
        type: 'string',
        description: 'Table name for table action',
      },
      file: {
        type: 'string',
        description: 'File path or glob for file action',
      },
      includeViolations: {
        type: 'boolean',
        description: 'Include boundary violations in response (default: true)',
      },
    },
    required: [],
  },
},
```

### Handler Implementation

```typescript
async function handleBoundaries(
  projectRoot: string,
  boundaryStore: BoundaryStore,
  args: {
    action?: string;
    table?: string;
    file?: string;
    includeViolations?: boolean;
  }
) {
  await boundaryStore.initialize();
  
  const action = args.action ?? 'overview';
  const includeViolations = args.includeViolations ?? true;
  
  switch (action) {
    case 'overview': {
      const accessMap = boundaryStore.getAccessMap();
      const tables = Object.keys(accessMap.tables);
      const sensitiveAccess = boundaryStore.getSensitiveAccess();
      
      let output = '# Data Boundaries Overview\n\n';
      output += `Tables: ${tables.length}\n`;
      output += `Access Points: ${Object.keys(accessMap.accessPoints).length}\n`;
      output += `Sensitive Fields: ${sensitiveAccess.length}\n\n`;
      
      output += '## Tables\n\n';
      for (const [name, info] of Object.entries(accessMap.tables)) {
        const sensitive = info.sensitiveFields.length > 0 ? ' ⚠️' : '';
        output += `- ${name}: ${info.accessedBy.length} access points${sensitive}\n`;
      }
      
      if (includeViolations) {
        const rules = boundaryStore.getRules();
        if (rules) {
          // Check all access points against rules
          const violations = [];
          for (const [id, access] of Object.entries(accessMap.accessPoints)) {
            violations.push(...boundaryStore.checkViolations(access));
          }
          
          if (violations.length > 0) {
            output += `\n## Violations (${violations.length})\n\n`;
            for (const v of violations.slice(0, 10)) {
              output += `- ${v.file}:${v.line} - ${v.message}\n`;
            }
          }
        }
      }
      
      return { content: [{ type: 'text', text: output }] };
    }
    
    case 'table': {
      if (!args.table) {
        return { content: [{ type: 'text', text: 'Error: table parameter required' }], isError: true };
      }
      
      const tableInfo = boundaryStore.getTableAccess(args.table);
      if (!tableInfo) {
        return { content: [{ type: 'text', text: `Table '${args.table}' not found` }] };
      }
      
      // Format table access info for AI consumption
      let output = `# Table: ${args.table}\n\n`;
      output += `Fields: ${tableInfo.fields.join(', ')}\n`;
      
      if (tableInfo.sensitiveFields.length > 0) {
        output += `\nSensitive Fields:\n`;
        for (const sf of tableInfo.sensitiveFields) {
          output += `- ${sf.field} (${sf.type})\n`;
        }
      }
      
      output += `\nAccess Points (${tableInfo.accessedBy.length}):\n`;
      // Group by file
      const byFile = new Map<string, typeof tableInfo.accessedBy>();
      for (const access of tableInfo.accessedBy) {
        if (!byFile.has(access.file)) byFile.set(access.file, []);
        byFile.get(access.file)!.push(access);
      }
      
      for (const [file, accesses] of byFile) {
        output += `\n${file}:\n`;
        for (const a of accesses) {
          output += `  Line ${a.line}: ${a.operation} [${a.fields.join(', ')}]\n`;
        }
      }
      
      return { content: [{ type: 'text', text: output }] };
    }
    
    case 'file': {
      if (!args.file) {
        return { content: [{ type: 'text', text: 'Error: file parameter required' }], isError: true };
      }
      
      const fileAccess = boundaryStore.getFileAccess(args.file);
      
      let output = `# Data Access: ${args.file}\n\n`;
      
      if (fileAccess.length === 0) {
        output += 'No data access detected in this file/pattern.\n';
      } else {
        // Group by table
        const byTable = new Map<string, typeof fileAccess>();
        for (const access of fileAccess) {
          if (!byTable.has(access.table)) byTable.set(access.table, []);
          byTable.get(access.table)!.push(access);
        }
        
        for (const [table, accesses] of byTable) {
          output += `## ${table}\n`;
          for (const a of accesses) {
            output += `- Line ${a.line}: ${a.operation} [${a.fields.join(', ')}]\n`;
          }
          output += '\n';
        }
      }
      
      // Include boundary rules context if available
      const rules = boundaryStore.getRules();
      if (rules) {
        const applicableRules = rules.boundaries.filter(b => 
          fileAccess.some(a => 
            b.tables?.includes(a.table) || 
            b.fields?.some(f => a.fields.includes(f.split('.')[1] || ''))
          )
        );
        
        if (applicableRules.length > 0) {
          output += '## Applicable Boundaries\n\n';
          for (const rule of applicableRules) {
            output += `- ${rule.description}\n`;
            output += `  Allowed: ${rule.allowedPaths.join(', ')}\n`;
          }
        }
      }
      
      return { content: [{ type: 'text', text: output }] };
    }
    
    case 'sensitive': {
      const sensitiveAccess = boundaryStore.getSensitiveAccess();
      
      let output = '# Sensitive Data Access\n\n';
      
      if (sensitiveAccess.length === 0) {
        output += 'No sensitive field access detected.\n';
      } else {
        // Group by sensitivity type
        const byType = new Map<string, typeof sensitiveAccess>();
        for (const access of sensitiveAccess) {
          if (!byType.has(access.sensitivityType)) byType.set(access.sensitivityType, []);
          byType.get(access.sensitivityType)!.push(access);
        }
        
        for (const [type, accesses] of byType) {
          output += `## ${type.toUpperCase()}\n\n`;
          for (const a of accesses) {
            output += `- ${a.table}.${a.field}\n`;
            output += `  Accessed in: ${a.file}:${a.line}\n`;
          }
          output += '\n';
        }
      }
      
      return { content: [{ type: 'text', text: output }] };
    }
    
    case 'rules': {
      const rules = boundaryStore.getRules();
      
      if (!rules) {
        return {
          content: [{
            type: 'text',
            text: 'No boundary rules defined.\n\n' +
              'To enable enforcement, create .drift/boundaries/rules.json\n' +
              'Run `drift boundaries init-rules` to generate a starter config.',
          }],
        };
      }
      
      let output = '# Data Boundary Rules\n\n';
      
      output += '## Sensitivity Tiers\n\n';
      output += `Critical: ${rules.sensitivity.critical.join(', ') || 'none'}\n`;
      output += `Sensitive: ${rules.sensitivity.sensitive.join(', ') || 'none'}\n`;
      
      output += '\n## Boundaries\n\n';
      for (const b of rules.boundaries) {
        output += `### ${b.id}\n`;
        output += `${b.description}\n`;
        if (b.tables) output += `Tables: ${b.tables.join(', ')}\n`;
        if (b.fields) output += `Fields: ${b.fields.join(', ')}\n`;
        if (b.operations) output += `Operations: ${b.operations.join(', ')}\n`;
        output += `Allowed: ${b.allowedPaths.join(', ')}\n`;
        output += `Severity: ${b.severity}\n\n`;
      }
      
      return { content: [{ type: 'text', text: output }] };
    }
    
    case 'check': {
      const rules = boundaryStore.getRules();
      
      if (!rules) {
        return {
          content: [{
            type: 'text',
            text: 'No boundary rules defined. Cannot check violations.',
          }],
        };
      }
      
      const accessMap = boundaryStore.getAccessMap();
      const violations = [];
      
      for (const [id, access] of Object.entries(accessMap.accessPoints)) {
        violations.push(...boundaryStore.checkViolations(access));
      }
      
      if (violations.length === 0) {
        return {
          content: [{
            type: 'text',
            text: '✅ No boundary violations detected.',
          }],
        };
      }
      
      let output = `# Boundary Violations (${violations.length})\n\n`;
      
      // Group by severity
      const errors = violations.filter(v => v.severity === 'error');
      const warnings = violations.filter(v => v.severity === 'warning');
      
      if (errors.length > 0) {
        output += `## Errors (${errors.length})\n\n`;
        for (const v of errors) {
          output += `- ${v.file}:${v.line}\n`;
          output += `  ${v.message}\n`;
          output += `  Rule: ${v.ruleId}\n\n`;
        }
      }
      
      if (warnings.length > 0) {
        output += `## Warnings (${warnings.length})\n\n`;
        for (const v of warnings) {
          output += `- ${v.file}:${v.line}\n`;
          output += `  ${v.message}\n\n`;
        }
      }
      
      return { content: [{ type: 'text', text: output }] };
    }
    
    default:
      return {
        content: [{ type: 'text', text: `Unknown action: ${action}` }],
        isError: true,
      };
  }
}
```

---

## AI Context Integration

When AI is generating code, it can query boundaries to understand access rules:

```
User: "Add a function to get user's full profile including SSN for tax purposes"

AI queries: drift_boundaries file="src/tax/*"

Response:
# Data Access: src/tax/*

## users
- Line 23: read [id, name, email]

## Applicable Boundaries

- pii-restricted: PII fields require explicit authorization
  Allowed: src/compliance/**
  
This file is NOT authorized to access users.ssn.
Consider: Use ComplianceService.getAuthorizedUserData() instead.
```

The AI can then generate code that respects the boundary:

```typescript
// Instead of direct access:
// const user = await db.users.findOne({ id, select: ['ssn'] }); // ❌

// Use authorized service:
const taxData = await complianceService.getAuthorizedTaxData(userId, {
  purpose: 'tax_filing',
  requestedBy: currentUser.id,
}); // ✅
```

---

## Implementation Phases

### Phase 1: Discovery (MVP)

**Deliverables:**
- [x] `OrmModelSemanticDetector` - Extract model/table mappings
- [x] `QueryAccessSemanticDetector` - Find data access points
- [x] `SensitiveFieldSemanticDetector` - Auto-flag sensitive fields
- [x] `BoundaryStore` - Persist access map
- [x] CLI: `drift boundaries` (overview, table, file, sensitive)
- [x] MCP: `drift_boundaries` tool (overview, table, file, sensitive)
- [x] Integration with `drift scan`

**Estimated Effort:** 3-4 weeks

### Phase 2: Enforcement

**Deliverables:**
- [x] Rules configuration schema
- [x] Violation detection engine
- [x] CLI: `drift boundaries check`, `drift boundaries init-rules`
- [x] MCP: `drift_boundaries` (check, rules actions)
- [x] Violation output in `drift scan`

**Estimated Effort:** 2 weeks

### Phase 3: Dashboard & Polish

**Deliverables:**
- [x] Dashboard: Boundaries tab
- [x] Table-centric visualization
- [x] File-centric visualization
- [x] Violation drill-down
- [x] Rule editor UI

**Estimated Effort:** 2 weeks

---

## Example Rules Configuration

```json
{
  "version": "1.0",
  "sensitivity": {
    "critical": [
      "users.ssn",
      "users.password_hash",
      "payments.card_number",
      "payments.cvv"
    ],
    "sensitive": [
      "users.email",
      "users.phone",
      "users.date_of_birth",
      "orders.total"
    ],
    "general": ["*"]
  },
  "boundaries": [
    {
      "id": "auth-owns-credentials",
      "description": "Only auth module can access credential fields",
      "fields": ["users.password_hash", "users.mfa_secret", "users.recovery_codes"],
      "allowedPaths": ["src/auth/**", "src/security/**"],
      "severity": "error"
    },
    {
      "id": "pii-restricted",
      "description": "PII fields require compliance module",
      "fields": ["users.ssn", "users.date_of_birth"],
      "allowedPaths": ["src/compliance/**", "src/tax/**"],
      "severity": "error"
    },
    {
      "id": "audit-append-only",
      "description": "Audit logs are append-only",
      "tables": ["audit_logs"],
      "operations": ["delete", "write"],
      "allowedPaths": ["src/archival/**"],
      "severity": "error"
    },
    {
      "id": "billing-owns-payments",
      "description": "Only billing service accesses payment data",
      "tables": ["payments", "subscriptions", "invoices"],
      "allowedPaths": ["src/billing/**", "src/webhooks/stripe/**"],
      "severity": "warning"
    },
    {
      "id": "no-direct-user-deletes",
      "description": "User deletion must go through GDPR service",
      "tables": ["users"],
      "operations": ["delete"],
      "allowedPaths": ["src/gdpr/**"],
      "severity": "error"
    }
  ]
}
```

---

## Open Questions

1. **Test file exemption**: Should test files be exempt from boundary rules by default?
   - Recommendation: Yes, add `excludePaths: ["**/*.test.*", "**/*.spec.*", "**/tests/**"]` to rules

2. **Indirect access**: If `ServiceA` calls `ServiceB.getData()` which accesses restricted data, is `ServiceA` in violation?
   - Recommendation: No, only direct data access is checked. Call-graph analysis is out of scope.

3. **Migration path**: How do teams adopt this incrementally?
   - Recommendation: Start with discovery only. Add rules one boundary at a time. Use `severity: warning` initially.

4. **Performance**: Scanning large codebases for data access patterns could be slow.
   - Recommendation: Use incremental scanning. Cache access map. Only re-scan changed files.

---

## Success Metrics

- **Discovery accuracy**: >80% of actual data access points detected
- **False positive rate**: <10% of flagged access points are incorrect
- **Adoption**: Teams can go from zero to first boundary rule in <30 minutes
- **AI integration**: AI code generators respect boundaries in >90% of cases when context is provided

---

## References

- [Semantic Detector Base Class](../packages/detectors/src/base/semantic-detector.ts)
- [API Contracts Documentation](../../driftscan/docs/contracts.md)
- [Pattern Store Implementation](../packages/core/src/store/pattern-store.ts)
- [MCP Server Implementation](../packages/mcp/src/server.ts)
