# Contributing to Drift

Help Drift learn from your codebase and improve pattern detection.

## How Drift Learns

Drift learns patterns through a **feedback loop**:

```
Your Code → Drift Scans → Patterns Discovered → You Review → Drift Learns
                                    ↑                              │
                                    └──────────────────────────────┘
```

### Pattern Lifecycle

1. **Discovery** — Drift analyzes your code and finds patterns
2. **Review** — You approve or ignore discovered patterns
3. **Enforcement** — Drift uses approved patterns to detect outliers
4. **Evolution** — Patterns update as your code evolves

---

## Approving Patterns

When Drift discovers patterns, review and approve the ones that represent your conventions:

```bash
# See discovered patterns
drift status

# Approve a pattern
drift approve <pattern-id>

# Approve all patterns in a category
drift approve --category api

# Approve with a note
drift approve <pattern-id> --note "Our standard controller pattern"
```

### What to Approve

✅ **Approve patterns that:**
- Represent your team's conventions
- Should be consistent across the codebase
- You want AI to follow when generating code

❌ **Ignore patterns that:**
- Are one-off implementations
- Are legacy code you're migrating away from
- Don't represent your preferred approach

---

## Ignoring Patterns

Ignore patterns that don't represent your conventions:

```bash
# Ignore a pattern
drift ignore <pattern-id>

# Ignore with reason
drift ignore <pattern-id> --reason "Legacy code, migrating to new pattern"
```

---

## Adding Custom Constraints

Define architectural constraints that Drift should enforce:

```bash
# Create a constraint
drift constraints add
```

### Constraint Types

| Type | Description | Example |
|------|-------------|---------|
| `dependency` | Module dependencies | "auth cannot import billing" |
| `naming` | Naming conventions | "Controllers must end with Controller" |
| `structure` | Code structure | "Services must be in services/" |
| `security` | Security rules | "No direct DB access from controllers" |

### Example Constraint

```json
{
  "id": "no-direct-db-in-controllers",
  "type": "security",
  "description": "Controllers should not access database directly",
  "rule": {
    "source": "src/controllers/**",
    "cannot-import": ["src/db/**", "prisma"]
  }
}
```

---

## Skills System

Skills are reusable pattern templates that Drift can apply to your codebase.

### Using Skills

```bash
# List available skills
drift skills list

# Apply a skill
drift skills apply circuit-breaker

# Preview what a skill would do
drift skills preview circuit-breaker
```

### Available Skills

Drift includes 60+ skills covering:

| Category | Skills |
|----------|--------|
| **Resilience** | circuit-breaker, retry-fallback, graceful-shutdown |
| **Auth** | jwt-auth, oauth-social-login, middleware-protection |
| **API** | api-client, idempotency, rate-limiting |
| **Data** | batch-processing, deduplication, validation-quarantine |
| **Observability** | logging-observability, metrics-collection, health-checks |
| **Caching** | intelligent-cache, caching-strategies |
| **Workers** | background-jobs, dead-letter-queue, job-state-machine |

### Creating Custom Skills

Create your own skills in `.drift/skills/`:

```
.drift/skills/
└── my-custom-skill/
    ├── skill.json       # Skill metadata
    ├── pattern.ts       # Pattern definition
    └── examples/        # Example implementations
```

---

## Improving Pattern Detection

### Report False Positives

If Drift detects a pattern incorrectly:

```bash
# Report a false positive
drift report false-positive <pattern-id> --file <file>
```

### Suggest New Patterns

If Drift misses a pattern in your codebase:

```bash
# Suggest a new pattern
drift suggest-pattern --category api --description "Our custom API pattern"
```

### Provide Examples

Help Drift learn by providing good examples:

```bash
# Mark a file as a good example
drift example add <file> --pattern <pattern-id>
```

---

## Contributing to Drift Core

### Setting Up Development

```bash
# Clone the repo
git clone https://github.com/dadbodgeoff/drift.git
cd drift

# Install dependencies
pnpm install

# Build
pnpm build

# Run tests
pnpm test
```

### Project Structure

```
drift/
├── packages/
│   ├── core/          # Core analysis engine
│   ├── cli/           # CLI commands
│   ├── mcp/           # MCP server
│   ├── lsp/           # LSP server
│   ├── dashboard/     # Web dashboard
│   └── detectors/     # Pattern detectors
├── skills/            # Skill templates
├── demo/              # Demo projects
└── docs/              # Documentation
```

### Adding Language Support

To add support for a new language:

1. **Add Tree-sitter grammar** in `packages/core/src/parsers/`
2. **Create extractor** in `packages/core/src/call-graph/extractors/`
3. **Add data access detector** for ORMs
4. **Add framework detectors** in `packages/detectors/`
5. **Add tests** for the new language

### Adding Pattern Detectors

To add a new pattern detector:

1. Create detector in `packages/detectors/src/<category>/`
2. Register in detector index
3. Add tests
4. Document the pattern

---

## Telemetry

Drift collects anonymous usage telemetry to improve the tool:

```bash
# Check telemetry status
drift telemetry status

# Disable telemetry
drift telemetry disable

# Enable telemetry
drift telemetry enable
```

### What We Collect

- Command usage (which commands are run)
- Language distribution (what languages are scanned)
- Error rates (to fix bugs)
- Performance metrics (to optimize)

### What We Don't Collect

- Source code
- File contents
- Pattern details
- Personal information

---

## Getting Help

- [GitHub Issues](https://github.com/dadbodgeoff/drift/issues) — Report bugs
- [GitHub Discussions](https://github.com/dadbodgeoff/drift/discussions) — Ask questions
- [Discord](https://discord.gg/drift) — Community chat

---

## Code of Conduct

We follow the [Contributor Covenant](https://www.contributor-covenant.org/). Be respectful and inclusive.
