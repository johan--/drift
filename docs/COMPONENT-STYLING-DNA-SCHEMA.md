# Component Styling DNA System - Full Schema

> **Purpose**: Keep styling context coherent across AI interactions by learning and documenting how YOUR codebase does things. Not about enforcing standards - about eliminating spaghetti and maintaining context.

---

## 1. Core Concepts

### 1.1 What is Styling DNA?

Styling DNA is a learned profile of how a codebase implements component styling. It captures:
- **Genes**: Individual styling conventions (variant handling, responsive approach, etc.)
- **Alleles**: Specific implementations of each gene (e.g., "className composition" vs "styled-components")
- **Mutations**: Deviations from the dominant pattern
- **Health Score**: Overall consistency metric

### 1.2 Why DNA Metaphor?

| Biology | Drift DNA |
|---------|-----------|
| Gene | A styling concern (variants, responsive, state, etc.) |
| Allele | A specific approach to that concern |
| Dominant | The most common approach (>60% usage) |
| Recessive | Less common but valid approaches |
| Mutation | A one-off deviation that fragments context |
| Genetic Diversity | How many different approaches exist |

---

## 2. Data Schemas

### 2.1 DNA Profile Schema

```typescript
// Stored at: .drift/dna/styling.json

interface StylingDNAProfile {
  version: "1.0.0";
  generatedAt: string;  // ISO timestamp
  projectRoot: string;
  
  // Summary metrics
  summary: {
    totalComponentsAnalyzed: number;
    totalFilesAnalyzed: number;
    healthScore: number;  // 0-100
    geneticDiversity: number;  // 0-1 (lower = more consistent)
    dominantFramework: StylingFramework;
    lastUpdated: string;
  };
  
  // The 6 core genes
  genes: {
    variantHandling: Gene;
    responsiveApproach: Gene;
    stateStyling: Gene;
    theming: Gene;
    spacingPhilosophy: Gene;
    animationApproach: Gene;
  };
  
  // Files that deviate from dominant patterns
  mutations: Mutation[];
  
  // Historical tracking
  evolution: EvolutionEntry[];
}

type StylingFramework = 
  | "tailwind"
  | "css-modules"
  | "styled-components"
  | "emotion"
  | "vanilla-css"
  | "scss"
  | "mixed";
```

### 2.2 Gene Schema

```typescript
interface Gene {
  id: string;  // e.g., "variant-handling"
  name: string;  // e.g., "Variant Handling"
  description: string;
  
  // The dominant approach
  dominant: Allele | null;
  
  // All detected approaches
  alleles: Allele[];
  
  // Confidence in the dominant pattern
  confidence: number;  // 0-1
  
  // How consistent is this gene across the codebase?
  consistency: number;  // 0-1
  
  // Example files demonstrating the dominant pattern
  exemplars: string[];  // file paths
}

interface Allele {
  id: string;  // e.g., "classname-composition"
  name: string;  // e.g., "className Composition"
  description: string;
  
  // How common is this approach?
  frequency: number;  // 0-1 (percentage of components)
  fileCount: number;
  
  // Detection details
  pattern: string;  // Regex or description
  examples: AlleleExample[];
  
  // Is this the recommended approach?
  isDominant: boolean;
}

interface AlleleExample {
  file: string;
  line: number;
  code: string;  // Snippet
  context: string;  // Surrounding context
}
```

### 2.3 Mutation Schema

```typescript
interface Mutation {
  id: string;  // UUID
  file: string;
  line: number;
  
  // Which gene is affected?
  gene: string;  // Gene ID
  
  // What's the deviation?
  expected: string;  // Allele ID of dominant
  actual: string;  // Allele ID found
  
  // Severity
  impact: "low" | "medium" | "high";
  
  // Context
  code: string;
  suggestion: string;  // How to align with dominant
  
  // Metadata
  detectedAt: string;
  resolved: boolean;
  resolvedAt?: string;
}
```

### 2.4 Evolution Schema

```typescript
interface EvolutionEntry {
  timestamp: string;
  commitHash?: string;
  
  // Snapshot of health
  healthScore: number;
  geneticDiversity: number;
  
  // Changes
  changes: EvolutionChange[];
}

interface EvolutionChange {
  type: "gene_shift" | "mutation_introduced" | "mutation_resolved" | "new_allele";
  gene?: string;
  description: string;
  files?: string[];
}
```

---

## 3. Gene Definitions

### 3.1 Variant Handling Gene

**Question**: How does the codebase implement component variants (primary/secondary, sizes, etc.)?

| Allele ID | Name | Detection Pattern |
|-----------|------|-------------------|
| `classname-composition` | className Composition | `className={variants[variant]}` or template literals |
| `cva` | Class Variance Authority | `import { cva }` + `cva()` usage |
| `styled-variants` | Styled Components Variants | `styled.div` with `${props => ...}` |
| `data-attributes` | Data Attribute Variants | `data-variant={variant}` + CSS `[data-variant="x"]` |
| `prop-spreading` | Prop Spreading | `{...variantProps[variant]}` |
| `conditional-classes` | Conditional Classes | `clsx()`, `classnames()`, `cn()` |

**Exemplar Detection**:
```typescript
// classname-composition
const variants = { primary: 'bg-blue-500', secondary: 'bg-gray-500' };
<button className={variants[variant]} />

// cva
const buttonVariants = cva('base-class', {
  variants: { intent: { primary: '...', secondary: '...' } }
});

// conditional-classes
<button className={cn('base', variant === 'primary' && 'bg-blue-500')} />
```

### 3.2 Responsive Approach Gene

**Question**: How does the codebase handle responsive design?

| Allele ID | Name | Detection Pattern |
|-----------|------|-------------------|
| `tailwind-mobile-first` | Tailwind Mobile-First | `className="w-full md:w-1/2 lg:w-1/3"` |
| `tailwind-desktop-first` | Tailwind Desktop-First | `className="w-1/3 md:w-1/2 sm:w-full"` |
| `css-media-queries` | CSS Media Queries | `@media (min-width: ...)` in CSS files |
| `container-queries` | Container Queries | `@container` or Tailwind `@container` |
| `js-responsive` | JS-Based Responsive | `useMediaQuery()`, `useBreakpoint()` hooks |
| `responsive-props` | Responsive Props | `<Box width={{ base: '100%', md: '50%' }}>` |

**Exemplar Detection**:
```typescript
// tailwind-mobile-first (breakpoints go up)
<div className="flex flex-col md:flex-row lg:gap-8" />

// js-responsive
const isMobile = useMediaQuery('(max-width: 768px)');
return isMobile ? <MobileView /> : <DesktopView />;
```

### 3.3 State Styling Gene

**Question**: How does the codebase style interactive states (hover, focus, disabled)?

| Allele ID | Name | Detection Pattern |
|-----------|------|-------------------|
| `tailwind-variants` | Tailwind State Variants | `hover:`, `focus:`, `active:`, `disabled:` |
| `css-pseudo` | CSS Pseudo Classes | `:hover`, `:focus`, `:disabled` in CSS |
| `state-props` | State Props | `isHovered`, `isFocused` props |
| `data-state` | Data State Attributes | `data-state="hover"` + CSS selectors |
| `styled-props` | Styled Component Props | `${props => props.isHovered && ...}` |

**Exemplar Detection**:
```typescript
// tailwind-variants
<button className="bg-blue-500 hover:bg-blue-600 focus:ring-2 disabled:opacity-50" />

// data-state (Radix pattern)
<button data-state={isOpen ? 'open' : 'closed'} />
// CSS: [data-state="open"] { ... }
```

### 3.4 Theming Gene

**Question**: How does the codebase implement theming/dark mode?

| Allele ID | Name | Detection Pattern |
|-----------|------|-------------------|
| `tailwind-dark` | Tailwind Dark Mode | `dark:` prefix classes |
| `css-variables` | CSS Custom Properties | `var(--color-primary)` |
| `theme-context` | Theme Context | `useTheme()`, `ThemeProvider` |
| `styled-theming` | Styled Theming | `${props => props.theme.colors.primary}` |
| `data-theme` | Data Theme Attribute | `data-theme="dark"` on root |
| `class-theme` | Class-Based Theme | `.dark` or `.light` class on root |

**Exemplar Detection**:
```typescript
// tailwind-dark
<div className="bg-white dark:bg-gray-900 text-black dark:text-white" />

// css-variables
<div style={{ backgroundColor: 'var(--bg-primary)' }} />
// or in Tailwind: bg-[var(--bg-primary)]
```

### 3.5 Spacing Philosophy Gene

**Question**: How does the codebase handle spacing (margins, padding, gaps)?

| Allele ID | Name | Detection Pattern |
|-----------|------|-------------------|
| `tailwind-scale` | Tailwind Spacing Scale | `p-4`, `m-2`, `gap-6` (standard scale) |
| `tailwind-arbitrary` | Tailwind Arbitrary | `p-[13px]`, `m-[2.5rem]` |
| `design-tokens` | Design Token Spacing | `var(--spacing-md)`, `theme.spacing.md` |
| `hardcoded` | Hardcoded Values | `padding: 16px`, `margin: 1rem` |
| `spacing-components` | Spacing Components | `<Stack spacing={4}>`, `<Box p={3}>` |

**Exemplar Detection**:
```typescript
// tailwind-scale (consistent 4px base)
<div className="p-4 m-2 gap-6" />  // 16px, 8px, 24px

// design-tokens
<div style={{ padding: 'var(--spacing-md)' }} />
```

### 3.6 Animation Approach Gene

**Question**: How does the codebase implement animations and transitions?

| Allele ID | Name | Detection Pattern |
|-----------|------|-------------------|
| `tailwind-transitions` | Tailwind Transitions | `transition-all`, `duration-200`, `ease-in-out` |
| `framer-motion` | Framer Motion | `import { motion }`, `<motion.div>` |
| `css-animations` | CSS Animations | `@keyframes`, `animation:` in CSS |
| `css-transitions` | CSS Transitions | `transition:` property in CSS |
| `react-spring` | React Spring | `import { useSpring }` |
| `no-animation` | No Animation | Absence of animation patterns |

**Exemplar Detection**:
```typescript
// tailwind-transitions
<button className="transition-colors duration-200 ease-in-out hover:bg-blue-600" />

// framer-motion
<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
```

---

## 4. Detection Algorithm

### 4.1 Scanning Process

```
1. IDENTIFY COMPONENT FILES
   - *.tsx, *.jsx in src/components, src/features, etc.
   - Exclude test files, stories, index files
   
2. FOR EACH COMPONENT FILE:
   a. Parse imports (detect framework: Tailwind, styled-components, etc.)
   b. Extract className usages
   c. Extract style prop usages
   d. Extract CSS-in-JS patterns
   e. Identify variant patterns
   f. Identify responsive patterns
   g. Identify state patterns
   h. Identify theming patterns
   i. Identify spacing patterns
   j. Identify animation patterns
   
3. AGGREGATE RESULTS
   - Count allele frequencies per gene
   - Identify dominant allele (>60% or highest)
   - Calculate consistency scores
   - Identify mutations (files using non-dominant alleles)
   
4. GENERATE DNA PROFILE
   - Build gene objects with alleles
   - Select exemplar files
   - Calculate health score
   - Store in .drift/dna/styling.json
```

### 4.2 Confidence Scoring

```typescript
function calculateGeneConfidence(gene: Gene): number {
  const dominantFrequency = gene.dominant?.frequency ?? 0;
  const alleleCount = gene.alleles.length;
  const filesCovered = gene.alleles.reduce((sum, a) => sum + a.fileCount, 0);
  
  // High confidence if:
  // - Dominant allele has >80% frequency
  // - Few alternative alleles
  // - Many files analyzed
  
  let confidence = dominantFrequency;
  
  // Penalty for many alternatives
  if (alleleCount > 2) confidence *= 0.9;
  if (alleleCount > 4) confidence *= 0.8;
  
  // Boost for large sample size
  if (filesCovered > 50) confidence = Math.min(1, confidence * 1.1);
  
  return Math.round(confidence * 100) / 100;
}
```

### 4.3 Health Score Calculation

```typescript
function calculateHealthScore(profile: StylingDNAProfile): number {
  const genes = Object.values(profile.genes);
  
  // Average consistency across genes
  const avgConsistency = genes.reduce((sum, g) => sum + g.consistency, 0) / genes.length;
  
  // Mutation penalty
  const mutationPenalty = Math.min(0.3, profile.mutations.length * 0.02);
  
  // Genetic diversity penalty (too many approaches = fragmented)
  const diversityPenalty = profile.summary.geneticDiversity * 0.2;
  
  const score = (avgConsistency - mutationPenalty - diversityPenalty) * 100;
  
  return Math.max(0, Math.min(100, Math.round(score)));
}
```

---

## 5. Playbook Generation

### 5.1 Output Format

Generated file: `STYLING-PLAYBOOK.md` (or configurable path)

```markdown
# Styling Playbook
> Auto-generated by drift DNA analysis. Last updated: {timestamp}

## Quick Reference

| Concern | Our Approach | Confidence |
|---------|--------------|------------|
| Variants | className composition | 94% |
| Responsive | Tailwind mobile-first | 88% |
| States | Tailwind state variants | 96% |
| Theming | Tailwind dark: + CSS vars | 82% |
| Spacing | Tailwind 4px scale | 91% |
| Animation | Tailwind transitions | 78% |

## Health Score: 87/100

---

## Variant Handling

**Our Pattern**: className composition with variant objects

```tsx
// ✅ Do this
const variants = {
  primary: 'bg-blue-500 text-white',
  secondary: 'bg-gray-200 text-gray-800',
};

export function Button({ variant = 'primary' }) {
  return <button className={variants[variant]} />;
}
```

**Exemplar Files**:
- `src/components/Button.tsx`
- `src/components/Badge.tsx`

**Avoid**:
- Inline conditional classes
- Styled-components variants (we don't use styled-components)

---

## Responsive Design

**Our Pattern**: Tailwind mobile-first breakpoints

```tsx
// ✅ Do this (mobile-first: styles go UP)
<div className="flex flex-col md:flex-row lg:gap-8" />

// ❌ Don't do this (desktop-first)
<div className="flex flex-row md:flex-col" />
```

**Breakpoint Order**: `base` → `sm` → `md` → `lg` → `xl` → `2xl`

---

[... continues for each gene ...]
```

### 5.2 AI Context Format

For MCP tool output, a condensed format optimized for AI context windows:

```typescript
interface AIContextOutput {
  summary: string;  // 2-3 sentence overview
  conventions: {
    [gene: string]: {
      approach: string;
      example: string;
      avoid: string[];
    };
  };
  mutations: {
    file: string;
    issue: string;
  }[];
}
```

Example output:
```json
{
  "summary": "This codebase uses Tailwind CSS with className composition for variants, mobile-first responsive design, and Tailwind state variants. Spacing follows the 4px scale. Health score: 87/100.",
  "conventions": {
    "variants": {
      "approach": "className composition with variant objects",
      "example": "const variants = { primary: 'bg-blue-500' }; className={variants[variant]}",
      "avoid": ["inline conditionals", "styled-components"]
    },
    "responsive": {
      "approach": "Tailwind mobile-first",
      "example": "className=\"flex flex-col md:flex-row\"",
      "avoid": ["desktop-first ordering", "JS-based responsive"]
    }
  },
  "mutations": [
    { "file": "src/components/LegacyModal.tsx", "issue": "Uses inline styles for variants" }
  ]
}
```

---

## 6. MCP Integration

### 6.1 New Tools

```typescript
// Tool: drift_dna
{
  name: "drift_dna",
  description: "Get the styling DNA profile for the codebase",
  inputSchema: {
    type: "object",
    properties: {
      gene: {
        type: "string",
        description: "Specific gene to query (optional)",
        enum: ["variantHandling", "responsiveApproach", "stateStyling", "theming", "spacingPhilosophy", "animationApproach"]
      },
      format: {
        type: "string",
        description: "Output format",
        enum: ["full", "summary", "ai-context"],
        default: "ai-context"
      }
    }
  }
}

// Tool: drift_playbook
{
  name: "drift_playbook",
  description: "Generate or retrieve the styling playbook",
  inputSchema: {
    type: "object",
    properties: {
      regenerate: {
        type: "boolean",
        description: "Force regeneration of playbook",
        default: false
      },
      section: {
        type: "string",
        description: "Specific section to retrieve (optional)"
      }
    }
  }
}

// Tool: drift_mutations
{
  name: "drift_mutations",
  description: "Get files that deviate from established styling patterns",
  inputSchema: {
    type: "object",
    properties: {
      gene: {
        type: "string",
        description: "Filter by gene (optional)"
      },
      impact: {
        type: "string",
        enum: ["low", "medium", "high"],
        description: "Filter by impact level (optional)"
      }
    }
  }
}
```

### 6.2 Pack Integration

New pack: `styling-dna`

```typescript
{
  name: "styling-dna",
  description: "Component styling conventions and DNA profile",
  categories: ["styling"],
  includeExamples: true,
  includeDNA: true,  // New flag
  includePlaybook: true  // New flag
}
```

---

## 7. CLI Commands

### 7.1 Command Structure

All DNA commands live under `drift dna` subcommand, following existing CLI patterns.

```bash
# Core Commands
drift dna                     # Alias for 'drift dna status'
drift dna scan                # Analyze codebase and generate DNA profile
drift dna status              # Show DNA health summary
drift dna playbook            # Generate/view styling playbook

# Gene Inspection
drift dna genes               # List all genes with dominant alleles
drift dna gene <gene-id>      # Deep dive into specific gene

# Mutation Management
drift dna mutations           # List all mutations
drift dna mutations --gene <gene-id>  # Filter by gene
drift dna resolve <mutation-id>       # Mark mutation as intentional

# AI/Export
drift dna export              # Export for AI context (default: ai-context format)
drift dna export --format json        # Full JSON export
drift dna export --format playbook    # Markdown playbook

# Comparison
drift dna diff                # Compare current vs last scan
drift dna diff main..feature  # Compare DNA between branches
```

### 7.2 Command Implementations

#### `drift dna scan`

```typescript
// drift/packages/cli/src/commands/dna.ts

interface DNAScanOptions {
  /** Specific component paths to scan */
  paths?: string[];
  /** Force rescan even if cache is valid */
  force?: boolean;
  /** Enable verbose output */
  verbose?: boolean;
  /** Generate playbook after scan */
  playbook?: boolean;
  /** Output format for results */
  format?: 'summary' | 'json' | 'ai-context';
}

export const dnaScanCommand = new Command('scan')
  .description('Analyze codebase and generate styling DNA profile')
  .option('-p, --paths <paths...>', 'Specific component paths to scan')
  .option('--force', 'Force rescan even if cache is valid')
  .option('--verbose', 'Enable verbose output')
  .option('--playbook', 'Generate playbook after scan')
  .option('-f, --format <format>', 'Output format', 'summary')
  .action(async (options: DNAScanOptions) => {
    // Implementation
  });
```

**Output Example:**
```
🧬 Drift DNA - Styling Analysis

Scanning components...
  ✓ Found 47 component files
  ✓ Analyzed 6 styling genes
  ✓ Detected 3 mutations

DNA Profile Generated
─────────────────────────────────────────
Health Score:     87/100
Genetic Diversity: 0.23 (Low - Consistent)
Framework:        Tailwind CSS

Genes:
  ├─ Variant Handling    className composition  94%
  ├─ Responsive          mobile-first           88%
  ├─ State Styling       Tailwind variants      96%
  ├─ Theming             dark: + CSS vars       82%
  ├─ Spacing             4px scale              91%
  └─ Animation           Tailwind transitions   78%

Mutations (3):
  ├─ src/components/LegacyModal.tsx
  │   └─ Uses inline styles (expected: className composition)
  ├─ src/components/DataTable.tsx
  │   └─ Desktop-first responsive (expected: mobile-first)
  └─ src/components/OldButton.tsx
      └─ Uses styled-components (expected: Tailwind)

Run 'drift dna playbook' to generate documentation.
Run 'drift dna mutations' for detailed mutation info.
```

#### `drift dna status`

```typescript
interface DNAStatusOptions {
  /** Show detailed gene breakdown */
  detailed?: boolean;
  /** Output as JSON */
  json?: boolean;
}

export const dnaStatusCommand = new Command('status')
  .description('Show DNA health summary')
  .option('-d, --detailed', 'Show detailed gene breakdown')
  .option('--json', 'Output as JSON')
  .action(async (options: DNAStatusOptions) => {
    // Implementation
  });
```

#### `drift dna gene <gene-id>`

```typescript
export const dnaGeneCommand = new Command('gene')
  .description('Deep dive into a specific gene')
  .argument('<gene-id>', 'Gene ID (variant-handling, responsive-approach, etc.)')
  .option('--examples', 'Show code examples')
  .option('--files', 'List all files for each allele')
  .action(async (geneId: string, options) => {
    // Implementation
  });
```

**Output Example:**
```
🧬 Gene: Variant Handling

Dominant Allele: className composition (94%)
Confidence: High (0.94)
Consistency: 0.91

Alleles Detected:
  ├─ className composition    44 files  (94%)  ← DOMINANT
  ├─ conditional classes       2 files  (4%)
  └─ inline conditionals       1 file   (2%)   ← MUTATION

Exemplar Files:
  ├─ src/components/Button.tsx
  ├─ src/components/Badge.tsx
  └─ src/components/Card.tsx

Pattern:
  const variants = { primary: '...', secondary: '...' };
  <Component className={variants[variant]} />
```

#### `drift dna mutations`

```typescript
interface DNAMutationsOptions {
  /** Filter by gene */
  gene?: string;
  /** Filter by impact level */
  impact?: 'low' | 'medium' | 'high';
  /** Show resolution suggestions */
  suggest?: boolean;
  /** Output as JSON */
  json?: boolean;
}

export const dnaMutationsCommand = new Command('mutations')
  .description('List styling mutations (deviations from DNA)')
  .option('-g, --gene <gene>', 'Filter by gene')
  .option('-i, --impact <level>', 'Filter by impact (low, medium, high)')
  .option('-s, --suggest', 'Show resolution suggestions')
  .option('--json', 'Output as JSON')
  .action(async (options: DNAMutationsOptions) => {
    // Implementation
  });
```

#### `drift dna playbook`

```typescript
interface DNAPlaybookOptions {
  /** Output path (default: STYLING-PLAYBOOK.md) */
  output?: string;
  /** Include code examples */
  examples?: boolean;
  /** Regenerate even if exists */
  force?: boolean;
  /** Output to stdout instead of file */
  stdout?: boolean;
}

export const dnaPlaybookCommand = new Command('playbook')
  .description('Generate styling playbook documentation')
  .option('-o, --output <path>', 'Output path', 'STYLING-PLAYBOOK.md')
  .option('-e, --examples', 'Include code examples')
  .option('--force', 'Regenerate even if exists')
  .option('--stdout', 'Output to stdout')
  .action(async (options: DNAPlaybookOptions) => {
    // Implementation
  });
```

#### `drift dna export`

```typescript
interface DNAExportOptions {
  /** Export format */
  format?: 'ai-context' | 'json' | 'playbook' | 'summary';
  /** Specific genes to export */
  genes?: string[];
  /** Include mutations */
  mutations?: boolean;
  /** Compact output */
  compact?: boolean;
}

export const dnaExportCommand = new Command('export')
  .description('Export DNA for AI context or integration')
  .option('-f, --format <format>', 'Export format', 'ai-context')
  .option('-g, --genes <genes...>', 'Specific genes to export')
  .option('-m, --mutations', 'Include mutations')
  .option('-c, --compact', 'Compact output')
  .action(async (options: DNAExportOptions) => {
    // Implementation
  });
```

#### `drift dna diff`

```typescript
export const dnaDiffCommand = new Command('diff')
  .description('Compare DNA between scans or branches')
  .argument('[ref]', 'Git ref to compare (e.g., main..feature)')
  .option('--baseline <path>', 'Path to baseline DNA file')
  .action(async (ref?: string, options?) => {
    // Implementation
  });
```

**Output Example:**
```
🧬 DNA Diff: main → feature-branch

Health Score: 87 → 82 (-5)

Gene Changes:
  ├─ Variant Handling: No change (94%)
  ├─ Responsive: 88% → 85% (-3%)
  │   └─ 2 new desktop-first files added
  └─ Animation: 78% → 72% (-6%)
      └─ New Framer Motion usage in 3 files

New Mutations: 2
  ├─ src/features/dashboard/Chart.tsx (responsive)
  └─ src/features/dashboard/Modal.tsx (animation)

Resolved Mutations: 0
```

### 7.3 CLI Registration

```typescript
// drift/packages/cli/src/commands/dna/index.ts

import { Command } from 'commander';
import { dnaScanCommand } from './scan.js';
import { dnaStatusCommand } from './status.js';
import { dnaGeneCommand } from './gene.js';
import { dnaMutationsCommand } from './mutations.js';
import { dnaPlaybookCommand } from './playbook.js';
import { dnaExportCommand } from './export.js';
import { dnaDiffCommand } from './diff.js';

export const dnaCommand = new Command('dna')
  .description('Styling DNA analysis and management')
  .addCommand(dnaScanCommand)
  .addCommand(dnaStatusCommand)
  .addCommand(dnaGeneCommand)
  .addCommand(dnaMutationsCommand)
  .addCommand(dnaPlaybookCommand)
  .addCommand(dnaExportCommand)
  .addCommand(dnaDiffCommand);

// Default action (no subcommand = status)
dnaCommand.action(async () => {
  await dnaStatusCommand.parseAsync(['status'], { from: 'user' });
});
```

```typescript
// drift/packages/cli/src/commands/index.ts (updated)

export { initCommand } from './init.js';
export { scanCommand } from './scan.js';
export { checkCommand } from './check.js';
export { statusCommand } from './status.js';
export { approveCommand } from './approve.js';
export { ignoreCommand } from './ignore.js';
export { reportCommand } from './report.js';
export { exportCommand } from './export.js';
export { whereCommand } from './where.js';
export { filesCommand } from './files.js';
export { watchCommandDef as watchCommand } from './watch.js';
export { dashboardCommand } from './dashboard.js';
export { trendsCommand } from './trends.js';
export { dnaCommand } from './dna/index.js';  // NEW
```

---

## 8. NLP/AI Integration

### 8.1 AI Context Building

The DNA system is designed to provide optimal context for AI interactions. The key insight: instead of feeding an AI 50 component files to understand styling conventions, feed it the DNA profile.

#### Context Hierarchy

```
Level 1: Summary (50 tokens)
├─ "Tailwind CSS, className composition, mobile-first, 87/100 health"

Level 2: Quick Reference (200 tokens)
├─ Gene table with dominant alleles and confidence

Level 3: Playbook (500-1000 tokens)
├─ Full conventions with code examples

Level 4: Full DNA (2000+ tokens)
├─ Complete profile with all alleles, mutations, exemplars
```

#### AI Context Format

```typescript
// drift/packages/core/src/dna/ai-context.ts

interface DNAAIContext {
  // Level 1: One-liner summary
  summary: string;
  
  // Level 2: Quick reference table
  quickReference: {
    gene: string;
    approach: string;
    confidence: string;
  }[];
  
  // Level 3: Conventions with examples
  conventions: {
    gene: string;
    approach: string;
    example: string;
    avoid: string[];
  }[];
  
  // Level 4: Full context
  full: {
    profile: StylingDNAProfile;
    playbook: string;
  };
  
  // Mutations for awareness
  mutations: {
    file: string;
    gene: string;
    issue: string;
  }[];
}

export function buildAIContext(
  profile: StylingDNAProfile,
  level: 1 | 2 | 3 | 4 = 3
): string {
  // Implementation
}
```

#### Example AI Context Output (Level 3)

```markdown
# Styling Conventions

This codebase uses **Tailwind CSS** with these conventions:

## Variants
Use className composition with variant objects:
```tsx
const variants = { primary: 'bg-blue-500', secondary: 'bg-gray-500' };
<button className={variants[variant]} />
```
Avoid: inline conditionals, styled-components

## Responsive
Mobile-first with Tailwind prefixes:
```tsx
<div className="flex flex-col md:flex-row lg:gap-8" />
```
Avoid: desktop-first ordering, JS-based responsive

## States
Tailwind state variants:
```tsx
<button className="hover:bg-blue-600 focus:ring-2 disabled:opacity-50" />
```

## Theming
Tailwind dark mode + CSS variables:
```tsx
<div className="bg-white dark:bg-gray-900" />
```

## Spacing
Tailwind 4px scale (p-4 = 16px, m-2 = 8px):
```tsx
<div className="p-4 m-2 gap-6" />
```

## Animation
Tailwind transitions:
```tsx
<button className="transition-colors duration-200 ease-in-out" />
```

---
⚠️ 3 mutations detected - files deviating from conventions:
- LegacyModal.tsx: inline styles
- DataTable.tsx: desktop-first
- OldButton.tsx: styled-components
```

### 8.2 Integration with Existing AI Module

```typescript
// drift/packages/ai/src/context/dna-context.ts

import { StylingDNAProfile, buildAIContext } from 'driftdetect-core';

export interface DNAContextOptions {
  level?: 1 | 2 | 3 | 4;
  includeMutations?: boolean;
  includeExemplars?: boolean;
}

export async function getDNAContext(
  projectRoot: string,
  options: DNAContextOptions = {}
): Promise<string> {
  const profile = await loadDNAProfile(projectRoot);
  
  if (!profile) {
    return 'No styling DNA profile found. Run `drift dna scan` first.';
  }
  
  return buildAIContext(profile, options.level ?? 3);
}

export function injectDNAIntoPrompt(
  basePrompt: string,
  dnaContext: string
): string {
  return `${basePrompt}

## Codebase Styling Conventions

${dnaContext}

When generating or modifying component code, follow these conventions.
`;
}
```

### 8.3 Prompt Templates

```typescript
// drift/packages/ai/src/prompts/dna-prompts.ts

export const DNA_SYSTEM_PROMPT = `
You are a code assistant with knowledge of this codebase's styling conventions.

The codebase has been analyzed and has a "Styling DNA" profile that describes
how components are styled. When generating or reviewing code:

1. Follow the dominant patterns for each styling concern
2. Flag any code that would introduce mutations (deviations)
3. Suggest refactoring for existing mutations when relevant

{DNA_CONTEXT}
`;

export const DNA_REVIEW_PROMPT = `
Review this component for styling consistency with the codebase DNA:

{CODE}

Check for:
- Variant handling approach
- Responsive design approach
- State styling approach
- Theming approach
- Spacing values
- Animation patterns

Report any mutations (deviations from established patterns).
`;

export const DNA_GENERATE_PROMPT = `
Generate a {COMPONENT_TYPE} component following the codebase styling DNA:

Requirements:
{REQUIREMENTS}

Use these conventions:
{DNA_CONTEXT}

The component should match the established patterns exactly.
`;
```

### 8.4 MCP Tool Integration

New MCP tools for DNA (added to existing server):

```typescript
// drift/packages/mcp/src/dna-tools.ts

export const DNA_TOOLS: Tool[] = [
  {
    name: 'drift_dna',
    description: 'Get the styling DNA profile for the codebase. Returns learned conventions for how components are styled (variants, responsive, states, theming, spacing, animation). Use this to understand styling patterns before generating code.',
    inputSchema: {
      type: 'object',
      properties: {
        gene: {
          type: 'string',
          enum: ['variantHandling', 'responsiveApproach', 'stateStyling', 'theming', 'spacingPhilosophy', 'animationApproach'],
          description: 'Specific gene to query (optional, returns all if omitted)',
        },
        format: {
          type: 'string',
          enum: ['full', 'summary', 'ai-context'],
          description: 'Output format (default: ai-context)',
        },
        level: {
          type: 'number',
          enum: [1, 2, 3, 4],
          description: 'Context detail level 1-4 (default: 3)',
        },
      },
      required: [],
    },
  },
  {
    name: 'drift_playbook',
    description: 'Get the auto-generated styling playbook. Returns markdown documentation of styling conventions with code examples. Perfect for understanding how to style new components.',
    inputSchema: {
      type: 'object',
      properties: {
        section: {
          type: 'string',
          enum: ['variants', 'responsive', 'states', 'theming', 'spacing', 'animation', 'all'],
          description: 'Specific section to retrieve (default: all)',
        },
        regenerate: {
          type: 'boolean',
          description: 'Force regeneration of playbook (default: false)',
        },
      },
      required: [],
    },
  },
  {
    name: 'drift_mutations',
    description: 'Get files that deviate from established styling patterns. Use this to identify inconsistencies or legacy code that needs refactoring.',
    inputSchema: {
      type: 'object',
      properties: {
        gene: {
          type: 'string',
          enum: ['variantHandling', 'responsiveApproach', 'stateStyling', 'theming', 'spacingPhilosophy', 'animationApproach'],
          description: 'Filter by gene (optional)',
        },
        impact: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
          description: 'Filter by impact level (optional)',
        },
        suggest: {
          type: 'boolean',
          description: 'Include refactoring suggestions (default: false)',
        },
      },
      required: [],
    },
  },
  {
    name: 'drift_dna_check',
    description: 'Check if code follows the codebase styling DNA. Pass code snippet and get feedback on whether it matches established patterns.',
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'Code snippet to check',
        },
        file: {
          type: 'string',
          description: 'File path (for context)',
        },
      },
      required: ['code'],
    },
  },
];
```

### 8.5 Pack Integration

New DNA-aware pack:

```typescript
// drift/packages/mcp/src/packs.ts (additions)

const DNA_PACK: PackDefinition = {
  name: 'styling-dna',
  description: 'Complete styling DNA profile with conventions, examples, and mutations',
  categories: ['styling'],
  patterns: [],  // Not pattern-based
  includeDNA: true,
  includePlaybook: true,
  includeMutations: true,
};

// In pack generation
if (pack.includeDNA) {
  const dnaContext = await getDNAContext(projectRoot, { level: 3 });
  output += '\n\n## Styling DNA\n\n' + dnaContext;
}

if (pack.includePlaybook) {
  const playbook = await getPlaybook(projectRoot);
  output += '\n\n## Styling Playbook\n\n' + playbook;
}

if (pack.includeMutations) {
  const mutations = await getMutations(projectRoot);
  output += '\n\n## Mutations\n\n' + formatMutations(mutations);
}
```

### 8.6 Automatic Context Injection

When AI tools request styling-related patterns, automatically inject DNA context:

```typescript
// drift/packages/mcp/src/server.ts (enhancement)

async function handleExamples(/* ... */) {
  // ... existing code ...
  
  // If requesting styling examples, prepend DNA context
  if (args.categories?.includes('styling') || args.categories?.includes('components')) {
    const dnaContext = await getDNAContext(projectRoot, { level: 2 });
    output = `## Styling Conventions (from DNA)\n\n${dnaContext}\n\n---\n\n${output}`;
  }
  
  return { content: [{ type: 'text', text: output }] };
}
```

### 8.7 Natural Language Queries

Support natural language queries about styling:

```typescript
// drift/packages/mcp/src/nlp-handler.ts

const DNA_QUERY_PATTERNS = [
  { pattern: /how (do|should) (we|I) (style|handle) variants/i, handler: 'gene:variantHandling' },
  { pattern: /how (do|should) (we|I) (do|handle) responsive/i, handler: 'gene:responsiveApproach' },
  { pattern: /how (do|should) (we|I) (style|handle) (hover|focus|state)/i, handler: 'gene:stateStyling' },
  { pattern: /how (do|should) (we|I) (do|handle) (dark mode|theming|theme)/i, handler: 'gene:theming' },
  { pattern: /what spacing (scale|system)/i, handler: 'gene:spacingPhilosophy' },
  { pattern: /how (do|should) (we|I) (do|handle) animation/i, handler: 'gene:animationApproach' },
  { pattern: /styling (conventions|patterns|dna)/i, handler: 'dna:full' },
  { pattern: /what('s| is) (wrong|inconsistent|different)/i, handler: 'mutations' },
];

export function parseNaturalQuery(query: string): DNAQueryIntent | null {
  for (const { pattern, handler } of DNA_QUERY_PATTERNS) {
    if (pattern.test(query)) {
      return { type: handler.split(':')[0], target: handler.split(':')[1] };
    }
  }
  return null;
}
```

---

## 9. Dashboard Integration

### 8.1 New Tab: "DNA"

**Components**:
- `DNAOverview` - Health score, genetic diversity, framework detection
- `GeneCard` - Individual gene with dominant allele, confidence, exemplars
- `MutationList` - Files deviating from patterns
- `EvolutionTimeline` - How DNA has changed over time
- `PlaybookPreview` - Rendered playbook markdown

### 8.2 Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│  DNA Overview                                    Health: 87 │
├─────────────────────────────────────────────────────────────┤
│  Framework: Tailwind CSS                                    │
│  Diversity: 0.23 (Low - Consistent)                        │
│  Components Analyzed: 47                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ Variants    │ │ Responsive  │ │ States      │           │
│  │ className   │ │ mobile-first│ │ tw variants │           │
│  │ comp. 94%   │ │ 88%         │ │ 96%         │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ Theming     │ │ Spacing     │ │ Animation   │           │
│  │ dark: + var │ │ 4px scale   │ │ tw trans.   │           │
│  │ 82%         │ │ 91%         │ │ 78%         │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Mutations (3)                                              │
│  ├─ LegacyModal.tsx - inline styles (variants)             │
│  ├─ DataTable.tsx - desktop-first (responsive)             │
│  └─ OldButton.tsx - styled-components (variants)           │
├─────────────────────────────────────────────────────────────┤
│  Evolution                                                  │
│  ──●────────●────────●────────●──────────────────> time    │
│    87      89       85       87                             │
│    Jan     Mar      Jun      Now                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 10. File Structure

```
drift/packages/
├── core/src/
│   └── dna/
│       ├── index.ts              # Public exports
│       ├── types.ts              # All DNA interfaces
│       ├── dna-analyzer.ts       # Main analysis engine
│       ├── dna-store.ts          # Storage/persistence
│       ├── ai-context.ts         # AI context builder
│       ├── gene-extractors/
│       │   ├── index.ts
│       │   ├── base-extractor.ts
│       │   ├── variant-handling.ts
│       │   ├── responsive-approach.ts
│       │   ├── state-styling.ts
│       │   ├── theming.ts
│       │   ├── spacing-philosophy.ts
│       │   └── animation-approach.ts
│       ├── playbook-generator.ts
│       ├── mutation-detector.ts
│       └── health-calculator.ts
│
├── cli/src/commands/
│   └── dna/
│       ├── index.ts              # Command registration
│       ├── scan.ts               # drift dna scan
│       ├── status.ts             # drift dna status
│       ├── gene.ts               # drift dna gene <id>
│       ├── mutations.ts          # drift dna mutations
│       ├── playbook.ts           # drift dna playbook
│       ├── export.ts             # drift dna export
│       └── diff.ts               # drift dna diff
│
├── ai/src/
│   ├── context/
│   │   └── dna-context.ts        # DNA context utilities
│   └── prompts/
│       └── dna-prompts.ts        # DNA-aware prompts
│
├── mcp/src/
│   ├── dna-tools.ts              # MCP tool definitions
│   └── server.ts                 # Updated with DNA handlers
│
└── dashboard/src/client/components/
    └── dna/
        ├── DNATab.tsx            # Main tab container
        ├── DNAOverview.tsx       # Health score, summary
        ├── GeneCard.tsx          # Individual gene display
        ├── GeneDetail.tsx        # Gene deep dive modal
        ├── AlleleChart.tsx       # Allele distribution chart
        ├── MutationList.tsx      # Mutation table
        ├── MutationDetail.tsx    # Mutation detail modal
        ├── EvolutionTimeline.tsx # DNA changes over time
        ├── PlaybookPreview.tsx   # Rendered playbook
        └── DNAExport.tsx         # Export options UI
```

---

## 11. Configuration

### 11.1 drift.config.json additions

```json
{
  "dna": {
    "enabled": true,
    "componentPaths": ["src/components", "src/features"],
    "excludePaths": ["**/*.test.*", "**/*.stories.*", "**/index.ts"],
    "playbook": {
      "output": "STYLING-PLAYBOOK.md",
      "autoGenerate": true,
      "includeExamples": true
    },
    "genes": {
      "variantHandling": { "enabled": true },
      "responsiveApproach": { "enabled": true },
      "stateStyling": { "enabled": true },
      "theming": { "enabled": true },
      "spacingPhilosophy": { "enabled": true },
      "animationApproach": { "enabled": true }
    },
    "thresholds": {
      "dominantMinFrequency": 0.6,
      "mutationImpact": {
        "high": 0.1,
        "medium": 0.3
      },
      "healthScoreWarning": 70,
      "healthScoreCritical": 50
    },
    "ai": {
      "autoInjectContext": true,
      "defaultContextLevel": 3,
      "includeMutationsInContext": true
    }
  }
}
```

### 11.2 Environment Variables

```bash
# Enable/disable DNA features
DRIFT_DNA_ENABLED=true

# Auto-generate playbook on scan
DRIFT_DNA_AUTO_PLAYBOOK=true

# AI context level (1-4)
DRIFT_DNA_CONTEXT_LEVEL=3

# Include DNA in all styling-related MCP responses
DRIFT_DNA_AUTO_INJECT=true
```

---

## 12. Integration with Existing Systems

### 12.1 Integration with `drift scan`

DNA analysis runs automatically as part of `drift scan` when enabled:

```typescript
// drift/packages/cli/src/commands/scan.ts (additions)

async function scanAction(options: ScanCommandOptions): Promise<void> {
  // ... existing scan logic ...
  
  // DNA Analysis (if enabled)
  if (config.dna?.enabled !== false) {
    console.log();
    const dnaSpinner = createSpinner('Analyzing styling DNA...');
    dnaSpinner.start();
    
    try {
      const dnaAnalyzer = new DNAAnalyzer({ rootDir });
      await dnaAnalyzer.initialize();
      const profile = await dnaAnalyzer.analyze(files);
      await dnaAnalyzer.save(profile);
      
      dnaSpinner.succeed(
        `DNA analyzed: ${profile.summary.healthScore}/100 health, ` +
        `${profile.mutations.length} mutations`
      );
      
      // Auto-generate playbook if configured
      if (config.dna?.playbook?.autoGenerate) {
        const playbookPath = config.dna.playbook.output ?? 'STYLING-PLAYBOOK.md';
        await generatePlaybook(profile, playbookPath);
        console.log(chalk.gray(`  Playbook: ${playbookPath}`));
      }
      
      // Show mutations if any
      if (profile.mutations.length > 0) {
        console.log();
        console.log(chalk.yellow(`⚠️  ${profile.mutations.length} styling mutations detected`));
        for (const m of profile.mutations.slice(0, 3)) {
          console.log(chalk.gray(`    ${m.file}: ${m.actual} (expected: ${m.expected})`));
        }
        if (profile.mutations.length > 3) {
          console.log(chalk.gray(`    ... and ${profile.mutations.length - 3} more`));
        }
        console.log(chalk.gray('  Run `drift dna mutations` for details'));
      }
    } catch (error) {
      dnaSpinner.fail('DNA analysis failed');
      if (verbose) {
        console.error(chalk.red((error as Error).message));
      }
    }
  }
  
  // ... rest of scan ...
}
```

### 12.2 Integration with History/Trends

DNA snapshots are stored alongside pattern history for trend tracking:

```typescript
// drift/packages/core/src/store/history-store.ts (additions)

interface HistorySnapshot {
  // ... existing fields ...
  dna?: {
    healthScore: number;
    geneticDiversity: number;
    mutationCount: number;
    geneConfidences: Record<string, number>;
  };
}

async function createSnapshot(patterns: Pattern[], dnaProfile?: StylingDNAProfile) {
  const snapshot: HistorySnapshot = {
    // ... existing snapshot creation ...
  };
  
  if (dnaProfile) {
    snapshot.dna = {
      healthScore: dnaProfile.summary.healthScore,
      geneticDiversity: dnaProfile.summary.geneticDiversity,
      mutationCount: dnaProfile.mutations.length,
      geneConfidences: Object.fromEntries(
        Object.entries(dnaProfile.genes).map(([k, v]) => [k, v.confidence])
      ),
    };
  }
  
  // ... save snapshot ...
}
```

### 12.3 Integration with Dashboard

DNA tab is added to the existing dashboard:

```typescript
// drift/packages/dashboard/src/client/App.tsx (additions)

import { DNATab } from './components/dna/DNATab';

const TABS = [
  { id: 'patterns', label: 'Patterns', icon: '📊' },
  { id: 'contracts', label: 'Contracts', icon: '🔗' },
  { id: 'trends', label: 'Trends', icon: '📈' },
  { id: 'dna', label: 'DNA', icon: '🧬' },  // NEW
];

// In render
{activeTab === 'dna' && <DNATab />}
```

### 12.4 Integration with LSP

DNA-aware diagnostics in the editor:

```typescript
// drift/packages/lsp/src/handlers/diagnostics.ts (additions)

async function getDNADiagnostics(
  document: TextDocument,
  dnaProfile: StylingDNAProfile
): Promise<Diagnostic[]> {
  const diagnostics: Diagnostic[] = [];
  
  // Check if this file has mutations
  const fileMutations = dnaProfile.mutations.filter(
    m => m.file === document.uri
  );
  
  for (const mutation of fileMutations) {
    diagnostics.push({
      range: {
        start: { line: mutation.line - 1, character: 0 },
        end: { line: mutation.line - 1, character: 1000 },
      },
      severity: mutation.impact === 'high' 
        ? DiagnosticSeverity.Warning 
        : DiagnosticSeverity.Information,
      source: 'drift-dna',
      message: `Styling mutation: ${mutation.actual} (expected: ${mutation.expected})`,
      code: `dna/${mutation.gene}`,
    });
  }
  
  return diagnostics;
}
```

---

## 13. Implementation Phases with Testing Gates

Each phase has a **GATE** - a set of tests that MUST pass before proceeding. This prevents accumulating errors.

---

### Phase 1: Core DNA Engine (Week 1-2)

**Deliverables:**
- [ ] DNA types and interfaces (`core/src/dna/types.ts`)
- [ ] Base gene extractor class (`core/src/dna/gene-extractors/base-extractor.ts`)
- [ ] 6 gene extractors (variant, responsive, state, theming, spacing, animation)
- [ ] DNA analyzer (`core/src/dna/dna-analyzer.ts`)
- [ ] DNA store (`core/src/dna/dna-store.ts`)
- [ ] Health calculator (`core/src/dna/health-calculator.ts`)
- [ ] Mutation detector (`core/src/dna/mutation-detector.ts`)

**🚦 GATE 1: Core Unit Tests**

```typescript
// drift/packages/core/src/dna/__tests__/types.test.ts
describe('DNA Types', () => {
  it('should validate StylingDNAProfile schema');
  it('should validate Gene schema');
  it('should validate Allele schema');
  it('should validate Mutation schema');
});

// drift/packages/core/src/dna/__tests__/gene-extractors.test.ts
describe('Gene Extractors', () => {
  describe('VariantHandlingExtractor', () => {
    it('should detect className composition pattern');
    it('should detect CVA pattern');
    it('should detect conditional classes pattern');
    it('should calculate correct frequency');
    it('should identify dominant allele');
  });
  
  describe('ResponsiveApproachExtractor', () => {
    it('should detect mobile-first Tailwind');
    it('should detect desktop-first Tailwind');
    it('should detect CSS media queries');
    it('should flag mixed approaches as mutations');
  });
  
  // ... similar for all 6 extractors
});

// drift/packages/core/src/dna/__tests__/dna-analyzer.test.ts
describe('DNAAnalyzer', () => {
  it('should analyze demo project and produce valid profile');
  it('should detect all 6 genes');
  it('should calculate health score between 0-100');
  it('should identify mutations correctly');
  it('should handle empty projects gracefully');
  it('should handle projects with no components');
});

// drift/packages/core/src/dna/__tests__/health-calculator.test.ts
describe('HealthCalculator', () => {
  it('should return 100 for perfectly consistent codebase');
  it('should penalize mutations');
  it('should penalize high genetic diversity');
  it('should return 0 for completely inconsistent codebase');
});
```

**Gate 1 Validation Command:**
```bash
pnpm --filter driftdetect-core test -- --grep "DNA"
# Expected: All tests pass, >80% coverage on dna/ folder
```

**Gate 1 Manual Validation:**
```bash
# Run analyzer on demo project
cd drift/demo
npx ts-node ../packages/core/src/dna/dna-analyzer.ts

# Expected output:
# - Valid JSON profile in .drift/dna/styling.json
# - Health score is reasonable (60-100 for demo)
# - At least 3 genes have dominant alleles
```

---

### Phase 2: CLI Commands (Week 2-3)

**Deliverables:**
- [ ] `drift dna scan` command
- [ ] `drift dna status` command
- [ ] `drift dna gene <id>` command
- [ ] `drift dna mutations` command
- [ ] `drift dna playbook` command
- [ ] `drift dna export` command
- [ ] `drift dna diff` command
- [ ] Integration with `drift scan`

**🚦 GATE 2: CLI Integration Tests**

```typescript
// drift/packages/cli/src/commands/dna/__tests__/scan.test.ts
describe('drift dna scan', () => {
  it('should create .drift/dna/styling.json');
  it('should output health score to console');
  it('should list mutations if any');
  it('should fail gracefully if not initialized');
  it('should respect --paths option');
  it('should respect --force option');
});

// drift/packages/cli/src/commands/dna/__tests__/status.test.ts
describe('drift dna status', () => {
  it('should display health score');
  it('should display all 6 genes');
  it('should show mutation count');
  it('should work with --json flag');
  it('should fail gracefully if no DNA profile exists');
});

// drift/packages/cli/src/commands/dna/__tests__/export.test.ts
describe('drift dna export', () => {
  it('should export ai-context format by default');
  it('should export json format');
  it('should export playbook format');
  it('should filter by --genes option');
});

// drift/packages/cli/src/commands/dna/__tests__/integration.test.ts
describe('drift scan integration', () => {
  it('should run DNA analysis as part of drift scan');
  it('should show DNA summary in scan output');
  it('should auto-generate playbook if configured');
});
```

**Gate 2 Validation Commands:**
```bash
# Unit tests
pnpm --filter driftdetect-cli test -- --grep "dna"

# Manual CLI validation
cd drift/demo
pnpm drift dna scan
# Expected: Completes without error, shows health score

pnpm drift dna status
# Expected: Shows gene table with percentages

pnpm drift dna export --format ai-context
# Expected: Outputs markdown-formatted context

pnpm drift dna mutations
# Expected: Lists mutations or "No mutations found"
```

**Gate 2 Smoke Test Script:**
```bash
#!/bin/bash
# drift/scripts/test-dna-cli.sh

set -e  # Exit on any error

echo "🧪 Testing DNA CLI..."

cd demo

# Test 1: Scan
echo "Test 1: drift dna scan"
pnpm drift dna scan --verbose
[ -f .drift/dna/styling.json ] || (echo "FAIL: No DNA file created" && exit 1)

# Test 2: Status
echo "Test 2: drift dna status"
pnpm drift dna status | grep -q "Health Score" || (echo "FAIL: No health score" && exit 1)

# Test 3: Export
echo "Test 3: drift dna export"
pnpm drift dna export --format json | jq . > /dev/null || (echo "FAIL: Invalid JSON" && exit 1)

# Test 4: Gene detail
echo "Test 4: drift dna gene"
pnpm drift dna gene variant-handling | grep -q "Dominant" || (echo "FAIL: No dominant allele" && exit 1)

# Test 5: Playbook
echo "Test 5: drift dna playbook"
pnpm drift dna playbook --stdout | grep -q "Styling Playbook" || (echo "FAIL: No playbook" && exit 1)

echo "✅ All DNA CLI tests passed!"
```

---

### Phase 3: Playbook & AI Context (Week 3)

**Deliverables:**
- [ ] Playbook generator (`core/src/dna/playbook-generator.ts`)
- [ ] AI context builder (`core/src/dna/ai-context.ts`)
- [ ] Context levels 1-4 implementation
- [ ] AI prompt templates (`ai/src/prompts/dna-prompts.ts`)
- [ ] DNA context utilities (`ai/src/context/dna-context.ts`)

**🚦 GATE 3: AI Context Tests**

```typescript
// drift/packages/core/src/dna/__tests__/playbook-generator.test.ts
describe('PlaybookGenerator', () => {
  it('should generate valid markdown');
  it('should include all 6 gene sections');
  it('should include code examples');
  it('should include "avoid" recommendations');
  it('should handle missing genes gracefully');
});

// drift/packages/core/src/dna/__tests__/ai-context.test.ts
describe('AIContextBuilder', () => {
  it('should generate level 1 context under 100 tokens');
  it('should generate level 2 context under 300 tokens');
  it('should generate level 3 context under 1500 tokens');
  it('should generate level 4 context with full profile');
  it('should include mutations when requested');
});

// drift/packages/ai/src/context/__tests__/dna-context.test.ts
describe('DNA Context Utilities', () => {
  it('should load DNA profile from project');
  it('should inject context into prompts');
  it('should handle missing DNA gracefully');
});
```

**Gate 3 Validation:**
```bash
# Unit tests
pnpm --filter driftdetect-core test -- --grep "Playbook\|AIContext"
pnpm --filter driftdetect-ai test -- --grep "DNA"

# Manual validation
cd drift/demo
pnpm drift dna playbook --output test-playbook.md
cat test-playbook.md | wc -w  # Should be 200-1000 words
rm test-playbook.md

# Context level validation
pnpm drift dna export --format ai-context | wc -c
# Level 3 should be ~2000-5000 characters
```

---

### Phase 4: MCP Integration (Week 3-4)

**Deliverables:**
- [ ] `drift_dna` tool
- [ ] `drift_playbook` tool
- [ ] `drift_mutations` tool
- [ ] `drift_dna_check` tool
- [ ] Pack integration (`styling-dna` pack)
- [ ] Auto-inject DNA context for styling queries

**🚦 GATE 4: MCP Tool Tests**

```typescript
// drift/packages/mcp/src/__tests__/dna-tools.test.ts
describe('MCP DNA Tools', () => {
  describe('drift_dna', () => {
    it('should return DNA profile in ai-context format');
    it('should filter by gene parameter');
    it('should respect level parameter');
    it('should handle missing DNA gracefully');
  });
  
  describe('drift_playbook', () => {
    it('should return playbook markdown');
    it('should filter by section');
    it('should regenerate when requested');
  });
  
  describe('drift_mutations', () => {
    it('should return mutation list');
    it('should filter by gene');
    it('should filter by impact');
    it('should include suggestions when requested');
  });
  
  describe('drift_dna_check', () => {
    it('should validate code against DNA');
    it('should identify mutations in code snippet');
    it('should return compliance score');
  });
});

// drift/packages/mcp/src/__tests__/pack-integration.test.ts
describe('DNA Pack Integration', () => {
  it('should include styling-dna pack in list');
  it('should return DNA context in pack output');
  it('should include playbook in pack output');
  it('should include mutations in pack output');
});
```

**Gate 4 Validation:**
```bash
# Unit tests
pnpm --filter driftdetect-mcp test -- --grep "DNA\|dna"

# Manual MCP validation (requires MCP client)
# Test each tool via MCP inspector or direct call

# Integration test script
cat << 'EOF' > /tmp/test-mcp-dna.js
const { createDriftMCPServer } = require('./dist/server.js');
const server = createDriftMCPServer({ projectRoot: './demo' });

async function test() {
  // Test drift_dna
  const dna = await server.callTool('drift_dna', {});
  console.assert(dna.content[0].text.includes('Health'), 'drift_dna failed');
  
  // Test drift_playbook
  const playbook = await server.callTool('drift_playbook', {});
  console.assert(playbook.content[0].text.includes('Playbook'), 'drift_playbook failed');
  
  // Test drift_mutations
  const mutations = await server.callTool('drift_mutations', {});
  console.assert(!mutations.isError, 'drift_mutations failed');
  
  console.log('✅ All MCP DNA tools working');
}
test();
EOF
node /tmp/test-mcp-dna.js
```

---

### Phase 5: Dashboard (Week 4-5)

**Deliverables:**
- [ ] DNA tab container
- [ ] DNA overview component
- [ ] Gene cards with allele distribution
- [ ] Gene detail modal
- [ ] Mutation list and detail views
- [ ] Evolution timeline chart
- [ ] Playbook preview
- [ ] Export options UI

**🚦 GATE 5: Dashboard Component Tests**

```typescript
// drift/packages/dashboard/src/client/components/dna/__tests__/DNATab.test.tsx
describe('DNATab', () => {
  it('should render without crashing');
  it('should show loading state');
  it('should show error state when no DNA');
  it('should display health score');
  it('should display all 6 gene cards');
});

// drift/packages/dashboard/src/client/components/dna/__tests__/GeneCard.test.tsx
describe('GeneCard', () => {
  it('should display gene name');
  it('should display dominant allele');
  it('should display confidence percentage');
  it('should show allele distribution chart');
  it('should open detail modal on click');
});

// drift/packages/dashboard/src/client/components/dna/__tests__/MutationList.test.tsx
describe('MutationList', () => {
  it('should display mutation count');
  it('should list mutations with file paths');
  it('should filter by gene');
  it('should filter by impact');
  it('should show empty state when no mutations');
});

// drift/packages/dashboard/src/client/components/dna/__tests__/EvolutionTimeline.test.tsx
describe('EvolutionTimeline', () => {
  it('should render timeline chart');
  it('should show health score over time');
  it('should highlight significant changes');
  it('should handle single data point');
});
```

**Gate 5 Validation:**
```bash
# Component tests
pnpm --filter driftdetect-dashboard test -- --grep "DNA\|dna"

# Visual validation
pnpm --filter driftdetect-dashboard dev
# Open http://localhost:3000, navigate to DNA tab
# Verify:
# - [ ] Health score displays correctly
# - [ ] All 6 gene cards render
# - [ ] Clicking gene opens detail modal
# - [ ] Mutation list shows items
# - [ ] Timeline renders (if history exists)
# - [ ] Export button works
```

**Gate 5 E2E Test:**
```typescript
// drift/packages/dashboard/e2e/dna.spec.ts
import { test, expect } from '@playwright/test';

test.describe('DNA Dashboard', () => {
  test('should display DNA tab', async ({ page }) => {
    await page.goto('/');
    await page.click('text=DNA');
    await expect(page.locator('text=Health Score')).toBeVisible();
  });
  
  test('should show gene cards', async ({ page }) => {
    await page.goto('/?tab=dna');
    await expect(page.locator('[data-testid="gene-card"]')).toHaveCount(6);
  });
  
  test('should open gene detail', async ({ page }) => {
    await page.goto('/?tab=dna');
    await page.click('[data-testid="gene-card"]:first-child');
    await expect(page.locator('[data-testid="gene-detail-modal"]')).toBeVisible();
  });
});
```

---

### Phase 6: LSP & Editor Integration (Week 5)

**Deliverables:**
- [ ] DNA-aware diagnostics
- [ ] Mutation warnings in editor
- [ ] Quick fix suggestions
- [ ] Hover information

**🚦 GATE 6: LSP Tests**

```typescript
// drift/packages/lsp/src/__tests__/dna-diagnostics.test.ts
describe('DNA Diagnostics', () => {
  it('should return diagnostics for mutation files');
  it('should set correct severity based on impact');
  it('should include mutation details in message');
  it('should not return diagnostics for compliant files');
});

// drift/packages/lsp/src/__tests__/dna-hover.test.ts
describe('DNA Hover', () => {
  it('should show pattern info on hover');
  it('should show dominant allele for styling patterns');
});
```

**Gate 6 Validation:**
```bash
# Unit tests
pnpm --filter driftdetect-lsp test -- --grep "DNA\|dna"

# Manual validation in VS Code
# 1. Open demo project
# 2. Open a file with known mutation
# 3. Verify warning underline appears
# 4. Verify hover shows mutation info
```

---

### Phase 7: Integration & Polish (Week 5-6)

**Deliverables:**
- [ ] Full integration tests
- [ ] Performance optimization
- [ ] Error handling improvements
- [ ] Documentation updates
- [ ] Demo project updates

**🚦 GATE 7: Full Integration Tests**

```typescript
// drift/packages/core/src/dna/__tests__/integration.test.ts
describe('DNA Full Integration', () => {
  it('should complete full workflow: scan → status → export → playbook');
  it('should persist DNA across sessions');
  it('should update DNA on rescan');
  it('should track evolution over multiple scans');
  it('should handle large codebases (1000+ files)');
  it('should complete scan in under 30 seconds');
});
```

**Gate 7 Full System Test:**
```bash
#!/bin/bash
# drift/scripts/test-dna-full.sh

set -e

echo "🧪 Full DNA System Test"

# 1. Clean state
cd demo
rm -rf .drift/dna

# 2. Initialize and scan
pnpm drift init --force
pnpm drift scan

# 3. Verify DNA was created
[ -f .drift/dna/styling.json ] || (echo "FAIL: No DNA file" && exit 1)

# 4. Test all CLI commands
pnpm drift dna status
pnpm drift dna gene variant-handling
pnpm drift dna mutations
pnpm drift dna playbook --stdout > /dev/null
pnpm drift dna export --format json | jq . > /dev/null

# 5. Test MCP tools (if server running)
# curl -X POST http://localhost:3001/mcp -d '{"tool":"drift_dna"}'

# 6. Test dashboard (if running)
# curl http://localhost:3000/api/dna | jq .

# 7. Performance test
echo "Performance test: scanning 100 files..."
time pnpm drift dna scan --force

echo "✅ Full DNA system test passed!"
```

---

### Testing Summary Table

| Phase | Gate | Test Type | Pass Criteria |
|-------|------|-----------|---------------|
| 1 | Core Unit Tests | Unit | 100% pass, >80% coverage |
| 2 | CLI Integration | Unit + Smoke | All commands work |
| 3 | AI Context | Unit | Context levels valid |
| 4 | MCP Tools | Unit + Integration | All tools respond |
| 5 | Dashboard | Unit + E2E | Components render |
| 6 | LSP | Unit + Manual | Diagnostics appear |
| 7 | Full Integration | E2E + Perf | <30s scan, all features work |

---

### Continuous Integration

```yaml
# .github/workflows/dna-tests.yml
name: DNA Tests

on:
  push:
    paths:
      - 'packages/core/src/dna/**'
      - 'packages/cli/src/commands/dna/**'
      - 'packages/mcp/src/dna-tools.ts'
      - 'packages/dashboard/src/client/components/dna/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Build
        run: pnpm build
      
      - name: Core DNA Tests
        run: pnpm --filter driftdetect-core test -- --grep "DNA"
      
      - name: CLI DNA Tests
        run: pnpm --filter driftdetect-cli test -- --grep "dna"
      
      - name: MCP DNA Tests
        run: pnpm --filter driftdetect-mcp test -- --grep "DNA"
      
      - name: Dashboard DNA Tests
        run: pnpm --filter driftdetect-dashboard test -- --grep "DNA"
      
      - name: Smoke Test
        run: ./scripts/test-dna-cli.sh
```

---

## 14. Success Metrics

1. **Adoption**: DNA scan runs on >50% of drift users' projects
2. **Context Efficiency**: AI interactions require 40% less context explanation
3. **Consistency**: Projects using DNA show 30% fewer styling mutations over time
4. **Playbook Usage**: Playbook is referenced in >20% of AI styling conversations
5. **CLI Usage**: `drift dna` commands used at least weekly by active users
6. **MCP Tool Usage**: `drift_dna` and `drift_playbook` in top 5 most-used tools

---

## 15. Open Questions

1. **Scope Expansion**: Should DNA extend beyond styling to other concerns (API patterns, error handling, etc.)?
2. **Custom Genes**: Should users be able to define custom genes for project-specific patterns?
3. **Team Conventions**: How to handle intentional variations (e.g., "legacy" vs "modern" sections)?
4. **CI Integration**: Should DNA health be a CI gate? What thresholds?
5. **Multi-Framework**: How to handle projects with multiple styling approaches (e.g., Tailwind + CSS Modules)?

---

## Approval Checklist

### Concept & Design
- [ ] Core concept approved
- [ ] Gene definitions approved (6 genes)
- [ ] Schema structures approved

### CLI & Integration
- [ ] CLI commands approved (7 commands)
- [ ] MCP tools approved (4 tools)
- [ ] AI/NLP integration approved

### UI
- [ ] Dashboard design approved

### Testing Strategy
- [ ] Phase 1 Gate: Core unit tests defined
- [ ] Phase 2 Gate: CLI integration tests defined
- [ ] Phase 3 Gate: AI context tests defined
- [ ] Phase 4 Gate: MCP tool tests defined
- [ ] Phase 5 Gate: Dashboard component tests defined
- [ ] Phase 6 Gate: LSP tests defined
- [ ] Phase 7 Gate: Full integration tests defined
- [ ] CI workflow approved

### Implementation
- [ ] Implementation phases approved
- [ ] Testing gates approved
- [ ] Ready to build

---

*Document Version: 1.2.0*
*Author: Kiro + Human Collaboration*
*Date: January 2026*
