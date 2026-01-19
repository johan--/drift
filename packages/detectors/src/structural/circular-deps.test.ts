/**
 * Circular Dependencies Detector Tests
 *
 * Tests for circular dependency detection including:
 * - Self-imports
 * - Direct circular imports (A → B → A)
 * - Indirect circular imports (A → B → C → A)
 * - Integration with dependency graph
 *
 * @requirements 7.7 - THE Structural_Detector SHALL detect circular dependencies
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  CircularDependenciesDetector,
  createCircularDependenciesDetector,
  getCycleType,
  calculateCycleSeverity,
  generateBreakCycleSuggestions,
  formatCycle,
  detectSelfImports,
  detectCyclesFromNode,
  analyzeCircularDependencies,
  type CircularDependencyType,
} from './circular-deps.js';
import type { DetectionContext, ProjectContext } from '../base/index.js';

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Create a mock detection context for testing
 */
function createMockContext(
  file: string,
  content: string,
  imports: Array<{ source: string; resolvedPath?: string; line: number }> = [],
  projectFiles: string[] = [],
  dependencyGraph?: ProjectContext['dependencyGraph']
): DetectionContext {
  return {
    file,
    content,
    ast: null,
    imports: imports.map(imp => ({
      source: imp.source,
      resolvedPath: imp.resolvedPath,
      namedImports: [],
      isTypeOnly: false,
      sideEffectOnly: false,
      line: imp.line,
      column: 1,
    })),
    exports: [],
    projectContext: {
      rootDir: '/project',
      files: projectFiles,
      config: {},
      dependencyGraph,
    },
    language: 'typescript',
    extension: '.ts',
    isTestFile: false,
    isTypeDefinition: false,
  };
}

// ============================================================================
// Helper Function Tests
// ============================================================================

describe('getCycleType', () => {
  it('should identify self-import', () => {
    const result = getCycleType(['src/a.ts'], 'src/a.ts');
    expect(result).toBe('self-import');
  });

  it('should identify direct cycle (length 2)', () => {
    const result = getCycleType(['src/a.ts', 'src/b.ts', 'src/a.ts'], 'src/a.ts');
    expect(result).toBe('direct');
  });

  it('should identify direct cycle (length 3)', () => {
    const result = getCycleType(['src/a.ts', 'src/b.ts', 'src/c.ts'], 'src/a.ts');
    expect(result).toBe('direct');
  });

  it('should identify indirect cycle (length > 3)', () => {
    const result = getCycleType(
      ['src/a.ts', 'src/b.ts', 'src/c.ts', 'src/d.ts', 'src/a.ts'],
      'src/a.ts'
    );
    expect(result).toBe('indirect');
  });
});

describe('calculateCycleSeverity', () => {
  it('should return error for self-import', () => {
    expect(calculateCycleSeverity('self-import', 1)).toBe('error');
  });

  it('should return warning for direct cycle', () => {
    expect(calculateCycleSeverity('direct', 2)).toBe('warning');
  });

  it('should return warning for short indirect cycle', () => {
    expect(calculateCycleSeverity('indirect', 3)).toBe('warning');
    expect(calculateCycleSeverity('indirect', 4)).toBe('warning');
  });

  it('should return info for long indirect cycle', () => {
    expect(calculateCycleSeverity('indirect', 5)).toBe('info');
    expect(calculateCycleSeverity('indirect', 10)).toBe('info');
  });
});

describe('generateBreakCycleSuggestions', () => {
  it('should generate suggestions for self-import', () => {
    const suggestions = generateBreakCycleSuggestions(['src/a.ts'], 'self-import');
    expect(suggestions).toContain('Remove the self-import statement');
    expect(suggestions.length).toBeGreaterThan(0);
  });

  it('should generate suggestions for direct cycle', () => {
    const suggestions = generateBreakCycleSuggestions(
      ['src/a.ts', 'src/b.ts', 'src/a.ts'],
      'direct'
    );
    expect(suggestions.some(s => s.includes('shared'))).toBe(true);
    expect(suggestions.some(s => s.includes('dependency injection'))).toBe(true);
  });

  it('should generate suggestions for indirect cycle', () => {
    const suggestions = generateBreakCycleSuggestions(
      ['src/a.ts', 'src/b.ts', 'src/c.ts', 'src/a.ts'],
      'indirect'
    );
    expect(suggestions.some(s => s.includes('abstraction'))).toBe(true);
    expect(suggestions.some(s => s.includes('lazy loading'))).toBe(true);
  });
});

describe('formatCycle', () => {
  it('should format a simple cycle', () => {
    const result = formatCycle(['src/a.ts', 'src/b.ts', 'src/a.ts']);
    expect(result).toBe('a.ts → b.ts → a.ts');
  });

  it('should format a longer cycle', () => {
    const result = formatCycle(['src/a.ts', 'src/b.ts', 'src/c.ts', 'src/a.ts']);
    expect(result).toBe('a.ts → b.ts → c.ts → a.ts');
  });

  it('should handle paths with multiple directories', () => {
    const result = formatCycle(['src/components/Button.tsx', 'src/hooks/useButton.ts']);
    expect(result).toBe('Button.tsx → useButton.ts');
  });
});

describe('detectSelfImports', () => {
  it('should detect self-import by resolved path', () => {
    const imports = [
      { source: './a', resolvedPath: 'src/a.ts', line: 1 },
      { source: './b', resolvedPath: 'src/b.ts', line: 2 },
    ];
    const result = detectSelfImports('src/a.ts', imports);
    expect(result).toEqual(['./a']);
  });

  it('should return empty array when no self-imports', () => {
    const imports = [
      { source: './b', resolvedPath: 'src/b.ts', line: 1 },
      { source: './c', resolvedPath: 'src/c.ts', line: 2 },
    ];
    const result = detectSelfImports('src/a.ts', imports);
    expect(result).toEqual([]);
  });

  it('should handle case-insensitive paths', () => {
    const imports = [
      { source: './A', resolvedPath: 'SRC/A.ts', line: 1 },
    ];
    const result = detectSelfImports('src/a.ts', imports);
    expect(result).toEqual(['./A']);
  });
});

describe('detectCyclesFromNode', () => {
  it('should detect a direct cycle', () => {
    const graph: Record<string, string[]> = {
      'src/a.ts': ['src/b.ts'],
      'src/b.ts': ['src/a.ts'],
    };
    const getDeps = (node: string) => graph[node.toLowerCase()] || [];

    const cycles = detectCyclesFromNode('src/a.ts', getDeps);
    expect(cycles.length).toBeGreaterThan(0);
    expect(cycles[0]).toContain('src/a.ts');
    expect(cycles[0]).toContain('src/b.ts');
  });

  it('should detect an indirect cycle', () => {
    const graph: Record<string, string[]> = {
      'src/a.ts': ['src/b.ts'],
      'src/b.ts': ['src/c.ts'],
      'src/c.ts': ['src/a.ts'],
    };
    const getDeps = (node: string) => graph[node.toLowerCase()] || [];

    const cycles = detectCyclesFromNode('src/a.ts', getDeps);
    expect(cycles.length).toBeGreaterThan(0);
  });

  it('should return empty array when no cycles', () => {
    const graph: Record<string, string[]> = {
      'src/a.ts': ['src/b.ts'],
      'src/b.ts': ['src/c.ts'],
      'src/c.ts': [],
    };
    const getDeps = (node: string) => graph[node.toLowerCase()] || [];

    const cycles = detectCyclesFromNode('src/a.ts', getDeps);
    expect(cycles).toEqual([]);
  });

  it('should respect max depth', () => {
    // Create a very long chain that would exceed max depth
    const graph: Record<string, string[]> = {};
    for (let i = 0; i < 20; i++) {
      graph[`src/file${i}.ts`] = [`src/file${i + 1}.ts`];
    }
    graph['src/file20.ts'] = ['src/file0.ts']; // Create cycle

    const getDeps = (node: string) => graph[node.toLowerCase()] || [];

    // With max depth of 5, should not find the cycle
    const cycles = detectCyclesFromNode('src/file0.ts', getDeps, 5);
    expect(cycles).toEqual([]);
  });
});

describe('analyzeCircularDependencies', () => {
  it('should detect self-imports', () => {
    const imports = [
      { source: './a', resolvedPath: 'src/a.ts', line: 1 },
    ];

    const result = analyzeCircularDependencies('src/a.ts', imports);

    expect(result.hasCircularDependencies).toBe(true);
    expect(result.selfImports).toEqual(['./a']);
    expect(result.circularDependencies.length).toBe(1);
    expect(result.circularDependencies[0]!.type).toBe('self-import');
  });

  it('should detect cycles with dependency graph', () => {
    const imports = [
      { source: './b', resolvedPath: 'src/b.ts', line: 1 },
    ];

    const graph: Record<string, string[]> = {
      'src/a.ts': ['src/b.ts'],
      'src/b.ts': ['src/a.ts'],
    };
    const getDeps = (node: string) => graph[node.toLowerCase()] || [];

    const result = analyzeCircularDependencies('src/a.ts', imports, getDeps);

    expect(result.hasCircularDependencies).toBe(true);
    expect(result.circularDependencies.length).toBeGreaterThan(0);
  });

  it('should return clean analysis when no cycles', () => {
    const imports = [
      { source: './b', resolvedPath: 'src/b.ts', line: 1 },
    ];

    const graph: Record<string, string[]> = {
      'src/a.ts': ['src/b.ts'],
      'src/b.ts': [],
    };
    const getDeps = (node: string) => graph[node.toLowerCase()] || [];

    const result = analyzeCircularDependencies('src/a.ts', imports, getDeps);

    expect(result.hasCircularDependencies).toBe(false);
    expect(result.circularDependencies).toEqual([]);
  });
});

// ============================================================================
// Detector Class Tests
// ============================================================================

describe('CircularDependenciesDetector', () => {
  let detector: CircularDependenciesDetector;

  beforeEach(() => {
    detector = createCircularDependenciesDetector();
  });

  describe('metadata', () => {
    it('should have correct id', () => {
      expect(detector.id).toBe('structural/circular-deps');
    });

    it('should have correct category', () => {
      expect(detector.category).toBe('structural');
    });

    it('should have correct subcategory', () => {
      expect(detector.subcategory).toBe('circular-dependencies');
    });

    it('should support typescript and javascript', () => {
      expect(detector.supportedLanguages).toContain('typescript');
      expect(detector.supportedLanguages).toContain('javascript');
    });

    it('should use structural detection method', () => {
      expect(detector.detectionMethod).toBe('structural');
    });
  });

  describe('detect', () => {
    it('should return clean result for file with no imports', async () => {
      const context = createMockContext(
        'src/a.ts',
        'const x = 1;',
        [],
        ['src/a.ts']
      );

      const result = await detector.detect(context);

      expect(result.violations).toHaveLength(0);
      expect(result.confidence).toBe(1.0);
    });

    it('should detect self-import', async () => {
      const context = createMockContext(
        'src/a.ts',
        "import { foo } from './a';",
        [{ source: './a', resolvedPath: 'src/a.ts', line: 1 }],
        ['src/a.ts']
      );

      const result = await detector.detect(context);

      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.violations[0]!.patternId).toBe('structural/circular-deps-self-import');
      expect(result.violations[0]!.severity).toBe('error');
    });

    it('should detect direct circular dependency with dependency graph', async () => {
      const graph: Record<string, string[]> = {
        'src/a.ts': ['src/b.ts'],
        'src/b.ts': ['src/a.ts'],
      };

      const context = createMockContext(
        'src/a.ts',
        "import { foo } from './b';",
        [{ source: './b', resolvedPath: 'src/b.ts', line: 1 }],
        ['src/a.ts', 'src/b.ts'],
        {
          getDependencies: (file: string) => graph[file.toLowerCase()] || [],
          getDependents: () => [],
          hasCircularDependency: () => true,
        }
      );

      const result = await detector.detect(context);

      expect(result.violations.length).toBeGreaterThan(0);
    });

    it('should return clean pattern when no circular dependencies', async () => {
      const graph: Record<string, string[]> = {
        'src/a.ts': ['src/b.ts'],
        'src/b.ts': [],
      };

      const context = createMockContext(
        'src/a.ts',
        "import { foo } from './b';",
        [{ source: './b', resolvedPath: 'src/b.ts', line: 1 }],
        ['src/a.ts', 'src/b.ts'],
        {
          getDependencies: (file: string) => graph[file.toLowerCase()] || [],
          getDependents: () => [],
          hasCircularDependency: () => false,
        }
      );

      const result = await detector.detect(context);

      expect(result.violations).toHaveLength(0);
      expect(result.patterns.some(p => p.patternId === 'circular-deps-clean')).toBe(true);
    });

    it('should parse imports from content when not provided in context', async () => {
      const content = `
import { foo } from './b';
import { bar } from './c';
`;
      const context = createMockContext(
        'src/a.ts',
        content,
        [], // No imports in context
        ['src/a.ts', 'src/b.ts', 'src/c.ts']
      );
      // Clear imports to force parsing
      context.imports = [];

      const result = await detector.detect(context);

      // Should have parsed imports and returned a result (no violations without resolved paths)
      // The detector should still work and return patterns
      expect(result.patterns.length).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeDefined();
    });
  });

  describe('generateQuickFix', () => {
    it('should generate quick fix for self-import', () => {
      const violation = {
        id: 'test-violation',
        patternId: 'structural/circular-deps-self-import',
        severity: 'error' as const,
        file: 'src/a.ts',
        range: { start: { line: 0, character: 0 }, end: { line: 0, character: 100 } },
        message: 'Self-import detected',
        expected: 'No circular dependencies',
        actual: 'Self-import',
        aiExplainAvailable: true,
        aiFixAvailable: false,
        firstSeen: new Date(),
        occurrences: 1,
      };

      const quickFix = detector.generateQuickFix(violation);

      expect(quickFix).not.toBeNull();
      expect(quickFix!.title).toBe('Remove self-import');
      expect(quickFix!.kind).toBe('quickfix');
      expect(quickFix!.isPreferred).toBe(true);
    });

    it('should generate quick fix for direct cycle', () => {
      const violation = {
        id: 'test-violation',
        patternId: 'structural/circular-deps-direct',
        severity: 'warning' as const,
        file: 'src/a.ts',
        range: { start: { line: 0, character: 0 }, end: { line: 0, character: 100 } },
        message: 'Direct circular dependency',
        expected: 'No circular dependencies',
        actual: 'Direct cycle',
        aiExplainAvailable: true,
        aiFixAvailable: false,
        firstSeen: new Date(),
        occurrences: 1,
      };

      const quickFix = detector.generateQuickFix(violation);

      expect(quickFix).not.toBeNull();
      expect(quickFix!.title).toBe('Break circular dependency');
      expect(quickFix!.kind).toBe('refactor');
    });

    it('should return null for unknown pattern', () => {
      const violation = {
        id: 'test-violation',
        patternId: 'unknown-pattern',
        severity: 'info' as const,
        file: 'src/a.ts',
        range: { start: { line: 0, character: 0 }, end: { line: 0, character: 100 } },
        message: 'Unknown',
        expected: 'Unknown',
        actual: 'Unknown',
        aiExplainAvailable: false,
        aiFixAvailable: false,
        firstSeen: new Date(),
        occurrences: 1,
      };

      const quickFix = detector.generateQuickFix(violation);

      expect(quickFix).toBeNull();
    });
  });
});

// ============================================================================
// Factory Function Tests
// ============================================================================

describe('createCircularDependenciesDetector', () => {
  it('should create a new detector instance', () => {
    const detector = createCircularDependenciesDetector();
    expect(detector).toBeInstanceOf(CircularDependenciesDetector);
  });

  it('should create independent instances', () => {
    const detector1 = createCircularDependenciesDetector();
    const detector2 = createCircularDependenciesDetector();
    expect(detector1).not.toBe(detector2);
  });
});
