# Security Analysis

Drift tracks sensitive data flows through your codebase, helping you understand and secure data access patterns.

## Overview

Drift's security analysis answers critical questions:

- **Where is sensitive data accessed?** — Find all code that touches PII, credentials, financial data
- **Who can reach sensitive data?** — Trace from entry points to data access
- **Are there boundary violations?** — Detect unauthorized data access
- **What's the attack surface?** — Map entry points to sensitive operations

---

## Sensitive Data Classification

Drift automatically classifies data sensitivity:

| Classification | Examples | Risk Level |
|----------------|----------|------------|
| **CRITICAL** | Passwords, API keys, tokens, secrets | 🔴 Highest |
| **SENSITIVE** | SSN, credit cards, bank accounts | 🔴 High |
| **PII** | Email, phone, address, name, DOB | 🟡 Medium |
| **INTERNAL** | User IDs, internal flags | 🟢 Low |

### Automatic Detection

Drift detects sensitive data by:

1. **Column/field names** — `password`, `ssn`, `credit_card`, `api_key`
2. **Table names** — `users`, `payments`, `credentials`
3. **Patterns** — Email regex, phone patterns, card numbers
4. **Annotations** — `@sensitive`, `@pii`, custom markers

---

## Security Summary

Get an overview of your security posture:

```bash
drift boundaries overview
```

**Output:**
```
Security Overview
=================

Sensitive Data Access Points: 47
  CRITICAL: 8 (passwords, tokens, keys)
  SENSITIVE: 12 (financial, SSN)
  PII: 27 (email, phone, address)

Entry Points with Sensitive Access: 23
  Authenticated: 19
  Unauthenticated: 4 ⚠️

Potential Issues:
  ⚠️  4 unauthenticated endpoints access PII
  ⚠️  2 functions access passwords without audit logging
  ⚠️  1 endpoint returns sensitive data in error messages

Run 'drift boundaries check' for detailed analysis
```

### MCP Tool: `drift_security_summary`

```json
{
  "focus": "critical",
  "limit": 10
}
```

---

## Finding Sensitive Data Access

### List All Sensitive Access

```bash
drift boundaries sensitive
```

**Output:**
```
Sensitive Data Access
=====================

CRITICAL (8 locations):
  src/auth/login.ts:45 → users.password_hash
    Called by: POST /api/auth/login
    
  src/auth/register.ts:23 → users.password_hash
    Called by: POST /api/auth/register
    
  src/services/api-keys.ts:12 → api_keys.secret
    Called by: GET /api/keys (admin only)
    
  ...

SENSITIVE (12 locations):
  src/payments/processor.ts:67 → payments.card_number
    Called by: POST /api/payments/charge
    
  src/users/profile.ts:34 → users.ssn
    Called by: GET /api/users/:id/tax-info
    
  ...

PII (27 locations):
  src/users/profile.ts:12 → users.email, users.phone
  src/notifications/email.ts:45 → users.email
  ...
```

### Filter by Classification

```bash
# Only critical
drift boundaries sensitive --level critical

# Only PII
drift boundaries sensitive --level pii

# Specific table
drift boundaries sensitive --table users
```

---

## Tracing Data Flow

### Forward: "What sensitive data can this code access?"

```bash
drift callgraph reach src/api/users.ts:42 --sensitive-only
```

**Output:**
```
Sensitive Data Reachable from src/api/users.ts:42
=================================================

Direct Access:
  → users.email (PII)
  → users.phone (PII)

Via getUserProfile (depth 2):
  → users.address (PII)
  → users.date_of_birth (PII)

Via getPaymentMethods (depth 3):
  → payment_methods.card_last_four (SENSITIVE)
  → payment_methods.billing_address (PII)

⚠️  This code path can access 6 PII fields and 1 SENSITIVE field
```

### Inverse: "Who can access this sensitive data?"

```bash
drift callgraph inverse users.password_hash
```

**Output:**
```
Code That Can Access users.password_hash
========================================

Direct Access (3 functions):
  ← src/auth/login.ts:verifyPassword
  ← src/auth/register.ts:hashPassword  
  ← src/admin/users.ts:resetPassword

Entry Points (4 routes):
  POST /api/auth/login
  POST /api/auth/register
  POST /api/auth/change-password
  POST /api/admin/users/:id/reset-password

Authentication Required:
  ✅ POST /api/auth/change-password (user)
  ✅ POST /api/admin/users/:id/reset-password (admin)
  ⚠️  POST /api/auth/login (none - expected)
  ⚠️  POST /api/auth/register (none - expected)
```

---

## Boundary Rules

Define rules for who can access what data:

### Initialize Rules

```bash
drift boundaries init-rules
```

Creates `.drift/boundaries/rules.json`:

```json
{
  "rules": [
    {
      "id": "no-pii-in-logs",
      "description": "PII should not be logged",
      "deny": {
        "source": "src/logging/**",
        "access": ["*.email", "*.phone", "*.ssn", "*.address"]
      }
    },
    {
      "id": "passwords-auth-only",
      "description": "Password access restricted to auth module",
      "allow": {
        "access": ["users.password_hash"],
        "only": ["src/auth/**"]
      }
    },
    {
      "id": "financial-requires-audit",
      "description": "Financial data access must be audited",
      "require": {
        "access": ["payments.*", "transactions.*"],
        "pattern": "audit-logging"
      }
    }
  ]
}
```

### Check Violations

```bash
drift boundaries check
```

**Output:**
```
Boundary Violations
===================

❌ VIOLATION: no-pii-in-logs
   src/logging/request-logger.ts:34 accesses users.email
   Rule: PII should not be logged
   
❌ VIOLATION: passwords-auth-only
   src/admin/debug.ts:12 accesses users.password_hash
   Rule: Password access restricted to auth module
   
⚠️  WARNING: financial-requires-audit
   src/payments/refund.ts:45 accesses payments.* without audit logging
   Rule: Financial data access must be audited

3 violations, 1 warning
```

---

## Security Patterns

Drift detects security-related patterns in your code:

### Authentication Patterns

```bash
drift patterns list --category auth
```

**Detected patterns:**
- JWT token verification
- Session management
- OAuth flows
- API key validation
- Rate limiting

### Input Validation

```bash
drift patterns list --category security
```

**Detected patterns:**
- Input sanitization
- SQL injection prevention
- XSS prevention
- CSRF protection
- Request validation

### Error Handling

```bash
drift error-handling gaps --security
```

**Finds:**
- Sensitive data in error messages
- Stack traces exposed to users
- Missing error handling on auth paths

---

## CI/CD Integration

### Quality Gate: Security Boundary

```bash
drift gate --gates security-boundary
```

**Checks:**
- No new boundary violations
- No unauthenticated access to sensitive data
- No sensitive data in logs
- Audit logging on financial operations

### GitHub Actions Example

```yaml
name: Security Check
on: [pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Drift
        run: npm install -g driftdetect
        
      - name: Scan
        run: drift scan
        
      - name: Security Check
        run: drift boundaries check --ci
        
      - name: Quality Gate
        run: drift gate --gates security-boundary --format github
```

---

## MCP Tools for Security

### `drift_security_summary`

Get security overview:

```json
{
  "focus": "critical",  // all, critical, data-access, auth
  "limit": 10
}
```

### `drift_reachability`

Trace sensitive data:

```json
{
  "direction": "inverse",
  "target": "users.password_hash",
  "sensitiveOnly": true,
  "maxDepth": 10
}
```

### `drift_boundaries`

Check boundaries:

```json
{
  "action": "check",
  "file": "src/api/users.ts"
}
```

---

## Best Practices

### 1. Define Boundaries Early

Create boundary rules before issues arise:

```bash
drift boundaries init-rules
# Edit .drift/boundaries/rules.json
drift boundaries check
```

### 2. Review Sensitive Access Regularly

```bash
# Weekly security review
drift boundaries sensitive --level critical
drift boundaries check
```

### 3. Audit New Endpoints

Before deploying new endpoints:

```bash
# Check what sensitive data the new code can access
drift callgraph reach src/api/new-endpoint.ts --sensitive-only
```

### 4. Integrate with CI

```bash
# Block PRs that violate boundaries
drift gate --gates security-boundary --fail-on warning
```

### 5. Use AI for Security Reviews

Ask your AI agent:

> "Review this endpoint for security issues using Drift"

The AI will call `drift_security_summary` and `drift_reachability` to analyze the code.

---

## Troubleshooting

### "No sensitive data detected"

Drift may not recognize custom sensitive fields. Add them to config:

```json
// .drift/config.json
{
  "security": {
    "sensitivePatterns": [
      "custom_secret_field",
      "*_token",
      "*_key"
    ]
  }
}
```

### "Too many false positives"

Adjust sensitivity or add exceptions:

```json
// .drift/boundaries/rules.json
{
  "exceptions": [
    {
      "file": "src/tests/**",
      "reason": "Test files can access any data"
    }
  ]
}
```

### "Missing data access points"

Some ORMs or custom data access may not be detected. Check:

```bash
drift parser --test
drift boundaries tables
```

If tables are missing, Drift may need framework-specific detection for your ORM.
