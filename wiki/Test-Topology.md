# Test Topology

Drift maps your tests to source code, enabling intelligent test selection and coverage analysis.

## What is Test Topology?

Test topology answers the question: **"Which tests should I run when I change this code?"**

Instead of running your entire test suite, Drift identifies the minimum set of tests that cover your changes:

```
Changed: src/auth/login.ts

Affected Tests:
  ✓ tests/auth/login.test.ts (direct)
  ✓ tests/api/auth.controller.test.ts (calls login)
  ✓ tests/e2e/auth-flow.test.ts (integration)
  
Skip: 247 other tests (not affected)
```

---

## Building Test Topology

```bash
# Build test-to-code mapping
drift test-topology build

# Check status
drift test-topology status
```

**Output:**
```
Test Topology Status
====================

Test Files: 89
Source Files: 247
Mappings: 1,234

Coverage:
  High coverage (>80%): 156 files
  Medium coverage (50-80%): 67 files
  Low coverage (<50%): 24 files
  No coverage: 12 files ⚠️

Test Frameworks Detected:
  Jest: 67 test files
  Vitest: 22 test files
```

---

## Finding Affected Tests

### For Changed Files

```bash
# Single file
drift test-topology affected src/auth/login.ts

# Multiple files
drift test-topology affected src/auth/login.ts src/auth/session.ts

# From git diff
drift test-topology affected --staged
```

**Output:**
```
Affected Tests for src/auth/login.ts
====================================

Direct Tests (test this file directly):
  tests/auth/login.test.ts
    - loginUser
    - validateCredentials
    - handleLoginError

Indirect Tests (call functions in this file):
  tests/api/auth.controller.test.ts
    - POST /api/auth/login
    - POST /api/auth/refresh
    
  tests/middleware/auth.test.ts
    - requireAuth middleware
    
Integration Tests:
  tests/e2e/auth-flow.test.ts
    - complete login flow
    - session management

Total: 4 test files, 12 test cases
Estimated time: 8.3s (vs 45.2s for full suite)
```

### MCP Tool: `drift_test_topology`

```json
{
  "action": "affected",
  "files": ["src/auth/login.ts", "src/auth/session.ts"]
}
```

---

## Finding Uncovered Code

### List Uncovered Files

```bash
drift test-topology uncovered
```

**Output:**
```
Uncovered Code
==============

High Risk (no tests, high complexity):
  ⚠️  src/payments/refund.ts
      Complexity: 15, Lines: 234
      Calls: processRefund, validateRefund, notifyUser
      
  ⚠️  src/admin/bulk-operations.ts
      Complexity: 12, Lines: 189
      Calls: bulkUpdate, bulkDelete, validateBatch

Medium Risk (no tests, medium complexity):
  src/utils/date-helpers.ts
  src/formatters/currency.ts
  
Low Risk (no tests, low complexity):
  src/constants/errors.ts
  src/types/user.ts

Total: 12 files without test coverage
```

### Filter by Risk

```bash
# Only high risk
drift test-topology uncovered --min-risk high

# Specific directory
drift test-topology uncovered --path src/payments/
```

### MCP Tool

```json
{
  "action": "uncovered",
  "minRisk": "high",
  "limit": 20
}
```

---

## Test Coverage Analysis

### File Coverage

```bash
drift test-topology coverage src/auth/login.ts
```

**Output:**
```
Coverage for src/auth/login.ts
==============================

Functions (5 total):
  ✅ loginUser - 3 tests
  ✅ validateCredentials - 2 tests
  ✅ hashPassword - 1 test
  ⚠️  handleMFA - 0 tests
  ⚠️  logLoginAttempt - 0 tests

Lines: 78% covered (156/200)
Branches: 65% covered (13/20)

Missing Coverage:
  Lines 45-52: MFA handling
  Lines 78-89: Audit logging
  Lines 120-135: Error edge cases
```

### MCP Tool

```json
{
  "action": "coverage",
  "file": "src/auth/login.ts"
}
```

---

## Mock Analysis

### Find Mock Patterns

```bash
drift test-topology mocks
```

**Output:**
```
Mock Analysis
=============

Most Mocked:
  1. prisma (45 tests)
     Pattern: jest.mock('@prisma/client')
     
  2. fetch (34 tests)
     Pattern: jest.spyOn(global, 'fetch')
     
  3. AuthService (23 tests)
     Pattern: jest.mock('../services/auth')

Mock Inconsistencies:
  ⚠️  UserRepository mocked differently in 3 files
      - tests/api/users.test.ts: partial mock
      - tests/services/user.test.ts: full mock
      - tests/e2e/users.test.ts: no mock
      
  ⚠️  Date.now() mocked in some tests but not others
      May cause flaky tests
```

### MCP Tool

```json
{
  "action": "mocks"
}
```

---

## Test Quality Metrics

### Analyze Test Quality

```bash
drift test-topology quality tests/auth/login.test.ts
```

**Output:**
```
Test Quality: tests/auth/login.test.ts
======================================

Score: 78/100

✅ Good:
  - Descriptive test names
  - Proper setup/teardown
  - Tests error cases
  - Uses beforeEach for isolation

⚠️  Improvements:
  - Missing edge case: empty password
  - Missing edge case: SQL injection attempt
  - Test "should login" is too broad (tests multiple things)
  - No timeout handling tests

Suggestions:
  1. Split "should login" into smaller focused tests
  2. Add test for rate limiting
  3. Add test for concurrent login attempts
```

### MCP Tool

```json
{
  "action": "quality",
  "file": "tests/auth/login.test.ts"
}
```

---

## CI/CD Integration

### Run Only Affected Tests

```bash
# Get affected tests as JSON
drift test-topology affected --staged --format json > affected.json

# Run with Jest
jest $(cat affected.json | jq -r '.files | join(" ")')

# Run with Vitest
vitest run $(cat affected.json | jq -r '.files | join(" ")')
```

### GitHub Actions Example

```yaml
name: Smart Tests
on: [pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
          
      - name: Install
        run: npm ci
        
      - name: Install Drift
        run: npm install -g driftdetect
        
      - name: Build Test Topology
        run: drift test-topology build
        
      - name: Get Affected Tests
        id: affected
        run: |
          TESTS=$(drift test-topology affected --staged --format json | jq -r '.files | join(" ")')
          echo "tests=$TESTS" >> $GITHUB_OUTPUT
          
      - name: Run Affected Tests
        if: steps.affected.outputs.tests != ''
        run: npm test -- ${{ steps.affected.outputs.tests }}
        
      - name: Skip Tests
        if: steps.affected.outputs.tests == ''
        run: echo "No tests affected by changes"
```

### Pre-commit Hook

```bash
#!/bin/sh
# .husky/pre-commit

# Get affected tests
AFFECTED=$(drift test-topology affected --staged --format list)

if [ -n "$AFFECTED" ]; then
  echo "Running affected tests..."
  npm test -- $AFFECTED
fi
```

---

## How It Works

### 1. Test File Detection

Drift identifies test files by:
- File patterns: `*.test.ts`, `*.spec.ts`, `__tests__/*`
- Framework markers: `describe()`, `it()`, `test()`
- Directory conventions: `tests/`, `__tests__/`

### 2. Import Analysis

Drift traces imports from test files:

```typescript
// tests/auth/login.test.ts
import { loginUser } from '../../src/auth/login';
import { UserRepository } from '../../src/repositories/user';

// Drift maps:
// tests/auth/login.test.ts → src/auth/login.ts
// tests/auth/login.test.ts → src/repositories/user.ts
```

### 3. Call Graph Integration

Drift uses the call graph to find indirect dependencies:

```
tests/auth/login.test.ts
  → imports src/auth/login.ts
    → calls src/auth/session.ts
      → calls src/repositories/user.ts
```

So changes to `src/repositories/user.ts` affect `tests/auth/login.test.ts`.

### 4. Mock Detection

Drift identifies mocked dependencies:

```typescript
jest.mock('../../src/repositories/user');

// Drift knows: this test doesn't actually test UserRepository
// So changes to UserRepository don't require this test
```

---

## Supported Test Frameworks

| Framework | Language | Detection |
|-----------|----------|-----------|
| Jest | JS/TS | ✅ Full |
| Vitest | JS/TS | ✅ Full |
| Mocha | JS/TS | ✅ Full |
| pytest | Python | ✅ Full |
| unittest | Python | ✅ Full |
| JUnit | Java | ✅ Full |
| xUnit | C# | ✅ Full |
| PHPUnit | PHP | ✅ Full |
| Go testing | Go | ✅ Full |
| Rust #[test] | Rust | ✅ Full |
| Google Test | C++ | ✅ Full |
| Catch2 | C++ | ✅ Full |

---

## Best Practices

### 1. Build Topology Regularly

```bash
# Add to CI
drift test-topology build

# Or run after significant changes
drift test-topology build --force
```

### 2. Use Affected Tests in CI

Don't run the full suite on every PR:

```bash
drift test-topology affected --staged | xargs npm test --
```

### 3. Monitor Uncovered Code

```bash
# Weekly check
drift test-topology uncovered --min-risk high
```

### 4. Fix Mock Inconsistencies

```bash
drift test-topology mocks
# Review and standardize mock patterns
```

### 5. Generate Test Templates

```bash
# For uncovered code
drift test-topology template src/payments/refund.ts
```

---

## Troubleshooting

### "No test mappings found"

1. Check test files are detected:
   ```bash
   drift test-topology status
   ```

2. Verify test file patterns in config:
   ```json
   // .drift/config.json
   {
     "testing": {
       "patterns": ["**/*.test.ts", "**/*.spec.ts", "tests/**/*"]
     }
   }
   ```

### "Affected tests seem wrong"

1. Rebuild topology:
   ```bash
   drift test-topology build --force
   ```

2. Check for dynamic imports that Drift can't trace

### "Missing framework support"

For custom test frameworks, add patterns:

```json
// .drift/config.json
{
  "testing": {
    "frameworks": {
      "custom": {
        "testPattern": "myTest\\(",
        "describePattern": "mySuite\\("
      }
    }
  }
}
```
