# Drift — Codebase Intelligence for AI Agents

<p align="center">
  <strong>The first-in-class tool that learns YOUR patterns and gives AI agents deep understanding of your conventions.</strong>
</p>

<p align="center">
  <code>40+ MCP Tools</code> • <code>28+ CLI Commands</code> • <code>8 Languages</code> • <code>15 Pattern Categories</code> • <code>170+ Detectors</code>
</p>

---

## Why Drift Exists

**The Problem:** AI agents generate generic code. They don't know YOUR conventions, YOUR patterns, YOUR architecture. Every time you ask Claude or Cursor to write code, you spend time fixing it to match your codebase.

**The Solution:** Drift scans your codebase, learns YOUR patterns, and gives AI agents that knowledge. Now when you ask for code, it matches YOUR style.

```
Before Drift:
  You: "Add a user endpoint"
  AI: *generates generic Express code*
  You: *spends 20 minutes fixing it to match your patterns*

After Drift:
  You: "Add a user endpoint"
  AI: *calls drift_context* → *sees your patterns* → *generates code that fits*
  You: *ships it*
```

---

## What Makes Drift Different

| Traditional Tools | Drift |
|-------------------|-------|
| Hardcoded lint rules | **Learns from YOUR code** |
| Generic suggestions | **Pattern-aware recommendations** |
| Single-file analysis | **Full call graph + data flow** |
| No AI integration | **40+ MCP tools for AI agents** |
| Static rules | **Evolves with your codebase** |

---

## Quick Start

```bash
# Install
npm install -g driftdetect

# Initialize & scan
cd your-project
drift init
drift scan

# See what Drift learned
drift status

# Connect to AI (Claude, Cursor, etc.)
# Add to your MCP config:
{
  "mcpServers": {
    "drift": {
      "command": "npx",
      "args": ["-y", "driftdetect-mcp"]
    }
  }
}
```

**[→ Full Getting Started Guide](Getting-Started)**

---

## Core Capabilities

### 🔍 Pattern Detection
Drift detects 15 categories of patterns across your codebase:

| Category | What It Detects |
|----------|-----------------|
| `api` | REST endpoints, GraphQL resolvers, route handlers |
| `auth` | Authentication flows, JWT, sessions, OAuth |
| `security` | Input validation, sanitization, CSRF protection |
| `errors` | Try/catch patterns, error boundaries, Result types |
| `data-access` | ORM queries, raw SQL, database transactions |
| `logging` | Structured logging, observability patterns |
| `testing` | Test patterns, mocks, fixtures |
| `components` | React/Vue/Angular components |
| `styling` | CSS patterns, design tokens, theming |

**[→ Full Pattern Categories](Pattern-Categories)**

### 📊 Call Graph Analysis
Map every function call in your codebase:

```bash
# What data can this code access?
drift callgraph reach src/api/users.ts:42

# Who can access this sensitive data?
drift callgraph inverse users.password_hash
```

**[→ Call Graph Deep Dive](Call-Graph-Analysis)**

### 🔒 Security Boundaries
Track sensitive data flows:

```bash
# Find all PII access
drift boundaries sensitive

# Check for boundary violations
drift boundaries check
```

**[→ Security Analysis Guide](Security-Analysis)**

### 🧪 Test Topology
Know exactly which tests to run:

```bash
# Build test mapping
drift test-topology build

# What tests cover this file?
drift test-topology affected src/auth/login.ts
```

**[→ Test Topology Guide](Test-Topology)**

### 🔗 Module Coupling
Find dependency issues:

```bash
# Find circular dependencies
drift coupling cycles

# Find highly coupled modules
drift coupling hotspots
```

**[→ Coupling Analysis Guide](Coupling-Analysis)**

### ✅ Quality Gates
Enforce patterns in CI/CD:

```bash
# Run quality gates
drift gate --policy strict

# CI mode with GitHub annotations
drift gate --ci --format github
```

**[→ Quality Gates & CI Integration](Quality-Gates)**

---

## Supported Languages

| Language | Frameworks | ORMs/Data Access |
|----------|------------|------------------|
| **TypeScript/JavaScript** | React, Next.js, Express, NestJS | Prisma, TypeORM, Drizzle, Supabase |
| **Python** | Django, FastAPI, Flask | SQLAlchemy, Django ORM |
| **Java** | Spring Boot, Spring MVC | JPA/Hibernate, Spring Data |
| **C#** | ASP.NET Core, WPF | Entity Framework, Dapper |
| **PHP** | Laravel | Eloquent |
| **Go** | Gin, Echo, Fiber, Chi | GORM, sqlx, database/sql |
| **Rust** | Actix-web, Axum, Rocket, Warp | SQLx, Diesel, SeaORM |
| **C++** | Unreal Engine, Qt, Boost | SQLite, ODBC |

**[→ Full Language Support](Language-Support)**

---

## MCP Tools for AI Agents

Drift provides **40+ MCP tools** organized for efficient token usage:

| Layer | Purpose | Key Tools |
|-------|---------|-----------|
| **Orchestration** | Start here | `drift_context` — curated context for any task |
| **Discovery** | Quick overview | `drift_status`, `drift_capabilities` |
| **Surgical** | Precise queries | `drift_callers`, `drift_signature`, `drift_imports` |
| **Exploration** | Browse patterns | `drift_patterns_list`, `drift_security_summary` |
| **Detail** | Deep dives | `drift_code_examples`, `drift_impact_analysis` |
| **Analysis** | Health metrics | `drift_test_topology`, `drift_coupling` |
| **Generation** | AI assistance | `drift_suggest_changes`, `drift_validate_change` |

**[→ Full MCP Tools Reference](MCP-Tools-Reference)**

---

## Documentation

### Getting Started
- **[Getting Started](Getting-Started)** — Install and run your first scan
- **[MCP Setup](MCP-Setup)** — Connect to Claude, Cursor, Windsurf, Kiro
- **[Configuration](Configuration)** — Customize Drift for your project

### Reference
- **[CLI Reference](CLI-Reference)** — All 28+ commands documented
- **[MCP Tools Reference](MCP-Tools-Reference)** — All 40+ MCP tools
- **[Pattern Categories](Pattern-Categories)** — 15 pattern categories
- **[Language Support](Language-Support)** — 8 languages with frameworks

### Deep Dives
- **[Architecture](Architecture)** — How Drift works under the hood
- **[Call Graph Analysis](Call-Graph-Analysis)** — Data flow and reachability
- **[Security Analysis](Security-Analysis)** — Sensitive data tracking
- **[Test Topology](Test-Topology)** — Test-to-code mapping
- **[Coupling Analysis](Coupling-Analysis)** — Dependency analysis

### Integration
- **[Quality Gates](Quality-Gates)** — CI/CD integration
- **[CI Integration](CI-Integration)** — GitHub Actions, GitLab CI
- **[Git Hooks](Git-Hooks)** — Pre-commit validation
- **[Incremental Scans](Incremental-Scans)** — Fast updates

### Community
- **[Contributing](Contributing)** — Help Drift learn
- **[Troubleshooting](Troubleshooting)** — Common issues
- **[FAQ](FAQ)** — Frequently asked questions

---

## Real-World Examples

### "Add a new API endpoint"

```
You: "Add a new endpoint for user preferences"

AI (via Drift):
  1. Calls drift_context with intent="add_feature", focus="user preferences"
  2. Drift returns:
     - Your controller pattern: @Controller with /api/v1 prefix
     - Your error format: { error: string, code: number }
     - Your auth pattern: @RequireAuth() middleware
     - Similar code: src/controllers/user.controller.ts
  3. AI generates code matching YOUR patterns
```

### "Fix this security issue"

```
You: "This endpoint might have a SQL injection vulnerability"

AI (via Drift):
  1. Calls drift_security_summary with focus="data-access"
  2. Calls drift_reachability to trace data flow
  3. Drift returns:
     - Your parameterized query pattern
     - Your input validation pattern
     - Similar secure implementations
  4. AI fixes the issue following YOUR security patterns
```

### "What tests do I need to run?"

```
You: "I changed src/auth/login.ts, what tests should I run?"

AI (via Drift):
  1. Calls drift_test_topology with action="affected"
  2. Drift returns minimum test set:
     - tests/auth/login.test.ts (direct)
     - tests/api/users.test.ts (calls login)
     - tests/e2e/auth.test.ts (integration)
  3. You run only the tests that matter
```

---

## Getting Help

- **[GitHub Issues](https://github.com/dadbodgeoff/drift/issues)** — Report bugs
- **[GitHub Discussions](https://github.com/dadbodgeoff/drift/discussions)** — Ask questions
- **[Troubleshooting](Troubleshooting)** — Common issues and solutions

---

<p align="center">
  <strong>Drift is open source under BSL-1.1 license.</strong><br>
  <a href="https://github.com/dadbodgeoff/drift">GitHub</a> •
  <a href="https://www.npmjs.com/package/driftdetect">npm</a>
</p>
