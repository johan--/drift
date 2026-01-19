/**
 * Test Co-location Detector Tests
 *
 * Tests for test file co-location pattern detection.
 *
 * @requirements 14.2 - Test co-location patterns
 */

import { describe, it, expect } from 'vitest';
import {
  TestCoLocationDetector,
  createTestCoLocationDetector,
  isTestFile,
  getSourceFileForTest,
  detectCoLocationPattern,
  analyzeCoLocation,
} from './co-location.js';
import type { DetectionContext, ProjectContext } from '../base/index.js';

// ============================================================================
// Test Helpers
// ============================================================================

function createMockContext(file: string, content: string = ''): DetectionContext {
  const projectContext: ProjectContext = {
    rootDir: '/project',
    files: [file],
    config: {},
  };

  return {
    file,
    content,
    ast: null,
    imports: [],
    exports: [],
    projectContext,
    language: 'typescript',
    extension: '.ts',
    isTestFile: file.includes('.test.') || file.includes('.spec.'),
    isTypeDefinition: file.endsWith('.d.ts'),
  };
}

function createMockContextWithFiles(file: string, projectFiles: string[]): DetectionContext {
  const projectContext: ProjectContext = {
    rootDir: '/project',
    files: projectFiles,
    config: {},
  };

  return {
    file,
    content: '',
    ast: null,
    imports: [],
    exports: [],
    projectContext,
    language: 'typescript',
    extension: '.ts',
    isTestFile: file.includes('.test.') || file.includes('.spec.'),
    isTypeDefinition: file.endsWith('.d.ts'),
  };
}

// ============================================================================
// isTestFile Tests
// ============================================================================

describe('isTestFile', () => {
  it('should identify .test.ts files', () => {
    expect(isTestFile('component.test.ts')).toBe(true);
  });

  it('should identify .test.tsx files', () => {
    expect(isTestFile('component.test.tsx')).toBe(true);
  });

  it('should identify .spec.ts files', () => {
    expect(isTestFile('component.spec.ts')).toBe(true);
  });

  it('should identify .spec.tsx files', () => {
    expect(isTestFile('component.spec.tsx')).toBe(true);
  });

  it('should identify .test.js files', () => {
    expect(isTestFile('utils.test.js')).toBe(true);
  });

  it('should identify .spec.js files', () => {
    expect(isTestFile('utils.spec.js')).toBe(true);
  });

  it('should identify files in __tests__ directory', () => {
    expect(isTestFile('__tests__/component.ts')).toBe(true);
  });

  it('should identify files in nested __tests__ directory', () => {
    expect(isTestFile('src/__tests__/utils.ts')).toBe(true);
  });

  it('should not identify regular source files', () => {
    expect(isTestFile('component.ts')).toBe(false);
  });

  it('should not identify files in tests directory without suffix', () => {
    expect(isTestFile('tests/component.ts')).toBe(false);
  });
});

// ============================================================================
// getSourceFileForTest Tests
// ============================================================================

describe('getSourceFileForTest', () => {
  it('should convert .test.ts to .ts', () => {
    const result = getSourceFileForTest('component.test.ts');
    expect(result).toBe('component.ts');
  });

  it('should convert .test.tsx to .tsx', () => {
    const result = getSourceFileForTest('component.test.tsx');
    expect(result).toBe('component.tsx');
  });

  it('should convert .spec.ts to .ts', () => {
    const result = getSourceFileForTest('component.spec.ts');
    expect(result).toBe('component.ts');
  });

  it('should convert .spec.js to .js', () => {
    const result = getSourceFileForTest('utils.spec.js');
    expect(result).toBe('utils.js');
  });

  it('should remove __tests__ directory', () => {
    const result = getSourceFileForTest('__tests__/component.ts');
    expect(result).toBe('component.ts');
  });

  it('should handle nested __tests__ directory', () => {
    const result = getSourceFileForTest('src/__tests__/utils.ts');
    expect(result).toBe('src/utils.ts');
  });

  it('should return null for non-test files', () => {
    const result = getSourceFileForTest('component.ts');
    expect(result).toBeNull();
  });
});

// ============================================================================
// detectCoLocationPattern Tests
// ============================================================================

describe('detectCoLocationPattern', () => {
  it('should detect co-located test files', () => {
    const projectFiles = ['component.ts', 'component.test.ts'];
    const result = detectCoLocationPattern('component.test.ts', projectFiles);
    
    expect(result).not.toBeNull();
    expect(result?.type).toBe('co-located');
    expect(result?.sourceFile).toBe('component.ts');
  });

  it('should detect __tests__ folder pattern', () => {
    const projectFiles = ['src/component.ts', 'src/__tests__/component.ts'];
    const result = detectCoLocationPattern('src/__tests__/component.ts', projectFiles);
    
    expect(result).not.toBeNull();
    expect(result?.type).toBe('tests-folder');
  });

  it('should detect separate tests directory pattern', () => {
    const projectFiles = ['src/component.ts', 'src/tests/component.test.ts'];
    const result = detectCoLocationPattern('src/tests/component.test.ts', projectFiles);
    
    expect(result).not.toBeNull();
    expect(result?.type).toBe('separate-directory');
  });

  it('should detect test directory pattern', () => {
    const projectFiles = ['src/component.ts', 'src/test/component.test.ts'];
    const result = detectCoLocationPattern('src/test/component.test.ts', projectFiles);
    
    expect(result).not.toBeNull();
    expect(result?.type).toBe('separate-directory');
  });

  it('should return null for non-test files', () => {
    const projectFiles = ['component.ts'];
    const result = detectCoLocationPattern('component.ts', projectFiles);
    
    expect(result).toBeNull();
  });

  it('should handle co-located test without source file', () => {
    const projectFiles = ['component.test.ts'];
    const result = detectCoLocationPattern('component.test.ts', projectFiles);
    
    expect(result).not.toBeNull();
    expect(result?.type).toBe('co-located');
    expect(result?.sourceFile).toBeUndefined();
  });
});

// ============================================================================
// analyzeCoLocation Tests
// ============================================================================

describe('analyzeCoLocation', () => {
  it('should analyze co-located test files', () => {
    const projectFiles = [
      'component.ts',
      'component.test.ts',
      'utils.ts',
      'utils.test.ts',
    ];
    const analysis = analyzeCoLocation('component.test.ts', projectFiles);
    
    expect(analysis.patterns.length).toBe(2);
    expect(analysis.dominantPattern).toBe('co-located');
    expect(analysis.isConsistent).toBe(true);
    expect(analysis.coLocatedCount).toBe(2);
    expect(analysis.separateCount).toBe(0);
  });

  it('should analyze __tests__ folder pattern', () => {
    const projectFiles = [
      'src/component.ts',
      'src/__tests__/component.ts',
      'src/utils.ts',
      'src/__tests__/utils.ts',
    ];
    const analysis = analyzeCoLocation('src/__tests__/component.ts', projectFiles);
    
    expect(analysis.dominantPattern).toBe('tests-folder');
    expect(analysis.isConsistent).toBe(true);
    expect(analysis.separateCount).toBe(2);
  });

  it('should detect mixed co-location patterns', () => {
    const projectFiles = [
      'component.ts',
      'component.test.ts',
      'src/__tests__/utils.ts',
    ];
    const analysis = analyzeCoLocation('component.test.ts', projectFiles);
    
    expect(analysis.isConsistent).toBe(false);
    expect(analysis.coLocatedCount).toBeGreaterThan(0);
    expect(analysis.separateCount).toBeGreaterThan(0);
  });

  it('should return empty patterns for non-test project', () => {
    const projectFiles = ['component.ts', 'utils.ts'];
    const analysis = analyzeCoLocation('component.ts', projectFiles);
    
    expect(analysis.patterns.length).toBe(0);
    expect(analysis.dominantPattern).toBeNull();
  });

  it('should identify dominant pattern when mixed', () => {
    const projectFiles = [
      'a.test.ts',
      'b.test.ts',
      'c.test.ts',
      '__tests__/d.ts',
    ];
    const analysis = analyzeCoLocation('a.test.ts', projectFiles);
    
    expect(analysis.dominantPattern).toBe('co-located');
  });
});

// ============================================================================
// Detector Class Tests
// ============================================================================

describe('TestCoLocationDetector', () => {
  it('should create detector with correct properties', () => {
    const detector = createTestCoLocationDetector();
    
    expect(detector.id).toBe('testing/co-location');
    expect(detector.category).toBe('testing');
    expect(detector.subcategory).toBe('co-location');
    expect(detector.supportedLanguages).toContain('typescript');
    expect(detector.supportedLanguages).toContain('javascript');
  });

  it('should return empty result for unsupported languages', async () => {
    const detector = new TestCoLocationDetector();
    const context = createMockContext('styles.css', 'body { color: red; }');
    context.language = 'css';
    
    const result = await detector.detect(context);
    
    expect(result.patterns.length).toBe(0);
    expect(result.violations.length).toBe(0);
  });

  it('should detect co-location patterns', async () => {
    const detector = new TestCoLocationDetector();
    const context = createMockContextWithFiles('component.test.ts', [
      'component.ts',
      'component.test.ts',
    ]);
    
    const result = await detector.detect(context);
    
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.metadata?.custom?.dominantPattern).toBe('co-located');
  });

  it('should have higher confidence for consistent patterns', async () => {
    const detector = new TestCoLocationDetector();
    const context = createMockContextWithFiles('component.test.ts', [
      'component.ts',
      'component.test.ts',
      'utils.ts',
      'utils.test.ts',
    ]);
    
    const result = await detector.detect(context);
    
    expect(result.confidence).toBe(0.95);
    expect(result.metadata?.custom?.isConsistent).toBe(true);
  });

  it('should have lower confidence for inconsistent patterns', async () => {
    const detector = new TestCoLocationDetector();
    const context = createMockContextWithFiles('component.test.ts', [
      'component.test.ts',
      '__tests__/utils.ts',
    ]);
    
    const result = await detector.detect(context);
    
    expect(result.confidence).toBe(0.75);
    expect(result.metadata?.custom?.isConsistent).toBe(false);
  });

  it('should return empty result for projects without tests', async () => {
    const detector = new TestCoLocationDetector();
    const context = createMockContextWithFiles('component.ts', ['component.ts', 'utils.ts']);
    
    const result = await detector.detect(context);
    
    expect(result.patterns.length).toBe(0);
  });

  it('should return null for generateQuickFix', () => {
    const detector = new TestCoLocationDetector();
    const violation = {
      id: 'test-violation',
      patternId: 'testing/co-location',
      severity: 'warning' as const,
      file: 'test.ts',
      range: { start: { line: 1, column: 1 }, end: { line: 1, column: 10 } },
      message: 'Test violation',
      expected: 'expected',
      actual: 'actual',
      aiExplainAvailable: false,
      aiFixAvailable: false,
      firstSeen: new Date(),
      occurrences: 1,
    };
    
    const quickFix = detector.generateQuickFix(violation);
    
    expect(quickFix).toBeNull();
  });
});
