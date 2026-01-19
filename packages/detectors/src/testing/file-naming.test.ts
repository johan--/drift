/**
 * Test File Naming Detector Tests
 *
 * Tests for test file naming convention detection.
 *
 * @requirements 14.1 - Test file naming patterns
 */

import { describe, it, expect } from 'vitest';
import {
  TestFileNamingDetector,
  createTestFileNamingDetector,
  detectTestFileNaming,
  analyzeTestFileNaming,
  TEST_SUFFIX_PATTERN,
  SPEC_SUFFIX_PATTERN,
  TESTS_DIRECTORY_PATTERN,
  TEST_DIRECTORY_PATTERN,
} from './file-naming.js';
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
// Pattern Regex Tests
// ============================================================================

describe('Test File Naming Patterns', () => {
  describe('TEST_SUFFIX_PATTERN', () => {
    it('should match .test.ts files', () => {
      expect(TEST_SUFFIX_PATTERN.test('component.test.ts')).toBe(true);
    });

    it('should match .test.tsx files', () => {
      expect(TEST_SUFFIX_PATTERN.test('component.test.tsx')).toBe(true);
    });

    it('should match .test.js files', () => {
      expect(TEST_SUFFIX_PATTERN.test('utils.test.js')).toBe(true);
    });

    it('should match .test.jsx files', () => {
      expect(TEST_SUFFIX_PATTERN.test('component.test.jsx')).toBe(true);
    });

    it('should not match .spec.ts files', () => {
      expect(TEST_SUFFIX_PATTERN.test('component.spec.ts')).toBe(false);
    });

    it('should not match regular source files', () => {
      expect(TEST_SUFFIX_PATTERN.test('component.ts')).toBe(false);
    });
  });

  describe('SPEC_SUFFIX_PATTERN', () => {
    it('should match .spec.ts files', () => {
      expect(SPEC_SUFFIX_PATTERN.test('component.spec.ts')).toBe(true);
    });

    it('should match .spec.tsx files', () => {
      expect(SPEC_SUFFIX_PATTERN.test('component.spec.tsx')).toBe(true);
    });

    it('should match .spec.js files', () => {
      expect(SPEC_SUFFIX_PATTERN.test('utils.spec.js')).toBe(true);
    });

    it('should match .spec.jsx files', () => {
      expect(SPEC_SUFFIX_PATTERN.test('component.spec.jsx')).toBe(true);
    });

    it('should not match .test.ts files', () => {
      expect(SPEC_SUFFIX_PATTERN.test('component.test.ts')).toBe(false);
    });
  });

  describe('TESTS_DIRECTORY_PATTERN', () => {
    it('should match __tests__ directory', () => {
      expect(TESTS_DIRECTORY_PATTERN.test('__tests__/component.ts')).toBe(true);
    });

    it('should match nested __tests__ directory', () => {
      expect(TESTS_DIRECTORY_PATTERN.test('src/__tests__/utils.ts')).toBe(true);
    });

    it('should not match tests directory without underscores', () => {
      expect(TESTS_DIRECTORY_PATTERN.test('tests/component.ts')).toBe(false);
    });
  });

  describe('TEST_DIRECTORY_PATTERN', () => {
    it('should match tests directory', () => {
      expect(TEST_DIRECTORY_PATTERN.test('/tests/component.ts')).toBe(true);
    });

    it('should match test directory', () => {
      expect(TEST_DIRECTORY_PATTERN.test('/test/component.ts')).toBe(true);
    });

    it('should match nested tests directory', () => {
      expect(TEST_DIRECTORY_PATTERN.test('src/tests/utils.ts')).toBe(true);
    });
  });
});

// ============================================================================
// detectTestFileNaming Tests
// ============================================================================

describe('detectTestFileNaming', () => {
  it('should detect .test.ts convention', () => {
    const result = detectTestFileNaming('component.test.ts');
    
    expect(result).not.toBeNull();
    expect(result?.type).toBe('test-suffix');
    expect(result?.convention).toBe('.test.ts');
  });

  it('should detect .spec.ts convention', () => {
    const result = detectTestFileNaming('component.spec.ts');
    
    expect(result).not.toBeNull();
    expect(result?.type).toBe('spec-suffix');
    expect(result?.convention).toBe('.spec.ts');
  });

  it('should detect __tests__ directory convention', () => {
    const result = detectTestFileNaming('__tests__/component.ts');
    
    expect(result).not.toBeNull();
    expect(result?.type).toBe('tests-directory');
    expect(result?.convention).toBe('__tests__/');
  });

  it('should detect tests/ directory convention', () => {
    const result = detectTestFileNaming('src/tests/component.ts');
    
    expect(result).not.toBeNull();
    expect(result?.type).toBe('test-directory');
    expect(result?.convention).toBe('tests/');
  });

  it('should return null for non-test files', () => {
    const result = detectTestFileNaming('component.ts');
    
    expect(result).toBeNull();
  });

  it('should return null for regular source files', () => {
    const result = detectTestFileNaming('src/utils/helpers.ts');
    
    expect(result).toBeNull();
  });

  it('should prioritize .test.ts over directory patterns', () => {
    const result = detectTestFileNaming('tests/component.test.ts');
    
    expect(result).not.toBeNull();
    expect(result?.type).toBe('test-suffix');
  });
});

// ============================================================================
// analyzeTestFileNaming Tests
// ============================================================================

describe('analyzeTestFileNaming', () => {
  it('should analyze single test file', () => {
    const analysis = analyzeTestFileNaming('component.test.ts', ['component.test.ts']);
    
    expect(analysis.patterns.length).toBe(1);
    expect(analysis.dominantConvention).toBe('.test.ts');
    expect(analysis.isConsistent).toBe(true);
  });

  it('should detect consistent .test.ts convention', () => {
    const projectFiles = [
      'component.test.ts',
      'utils.test.ts',
      'service.test.ts',
    ];
    const analysis = analyzeTestFileNaming('component.test.ts', projectFiles);
    
    expect(analysis.dominantConvention).toBe('.test.ts');
    expect(analysis.isConsistent).toBe(true);
  });

  it('should detect consistent .spec.ts convention', () => {
    const projectFiles = [
      'component.spec.ts',
      'utils.spec.ts',
      'service.spec.ts',
    ];
    const analysis = analyzeTestFileNaming('component.spec.ts', projectFiles);
    
    expect(analysis.dominantConvention).toBe('.spec.ts');
    expect(analysis.isConsistent).toBe(true);
  });

  it('should detect inconsistent conventions', () => {
    const projectFiles = [
      'component.test.ts',
      'utils.spec.ts',
      'service.test.ts',
    ];
    const analysis = analyzeTestFileNaming('component.test.ts', projectFiles);
    
    expect(analysis.isConsistent).toBe(false);
  });

  it('should identify dominant convention when mixed', () => {
    const projectFiles = [
      'component.test.ts',
      'utils.test.ts',
      'service.test.ts',
      'helper.spec.ts',
    ];
    const analysis = analyzeTestFileNaming('component.test.ts', projectFiles);
    
    expect(analysis.dominantConvention).toBe('.test.ts');
    expect(analysis.isConsistent).toBe(false);
  });

  it('should return empty patterns for non-test files', () => {
    const analysis = analyzeTestFileNaming('component.ts', ['component.ts']);
    
    expect(analysis.patterns.length).toBe(0);
    expect(analysis.dominantConvention).toBeNull();
  });
});

// ============================================================================
// Detector Class Tests
// ============================================================================

describe('TestFileNamingDetector', () => {
  it('should create detector with correct properties', () => {
    const detector = createTestFileNamingDetector();
    
    expect(detector.id).toBe('testing/file-naming');
    expect(detector.category).toBe('testing');
    expect(detector.subcategory).toBe('file-naming');
    expect(detector.supportedLanguages).toContain('typescript');
    expect(detector.supportedLanguages).toContain('javascript');
  });

  it('should return empty result for unsupported languages', async () => {
    const detector = new TestFileNamingDetector();
    const context = createMockContext('styles.css', 'body { color: red; }');
    context.language = 'css';
    
    const result = await detector.detect(context);
    
    expect(result.patterns.length).toBe(0);
    expect(result.violations.length).toBe(0);
  });

  it('should detect patterns in test files', async () => {
    const detector = new TestFileNamingDetector();
    const context = createMockContextWithFiles('component.test.ts', [
      'component.test.ts',
      'utils.test.ts',
    ]);
    
    const result = await detector.detect(context);
    
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.metadata?.custom?.dominantConvention).toBe('.test.ts');
  });

  it('should have higher confidence for consistent naming', async () => {
    const detector = new TestFileNamingDetector();
    const context = createMockContextWithFiles('component.test.ts', [
      'component.test.ts',
      'utils.test.ts',
      'service.test.ts',
    ]);
    
    const result = await detector.detect(context);
    
    expect(result.confidence).toBe(0.95);
    expect(result.metadata?.custom?.isConsistent).toBe(true);
  });

  it('should have lower confidence for inconsistent naming', async () => {
    const detector = new TestFileNamingDetector();
    const context = createMockContextWithFiles('component.test.ts', [
      'component.test.ts',
      'utils.spec.ts',
    ]);
    
    const result = await detector.detect(context);
    
    expect(result.confidence).toBe(0.8);
    expect(result.metadata?.custom?.isConsistent).toBe(false);
  });

  it('should return empty result for non-test files', async () => {
    const detector = new TestFileNamingDetector();
    const context = createMockContextWithFiles('component.ts', ['component.ts']);
    
    const result = await detector.detect(context);
    
    expect(result.patterns.length).toBe(0);
  });

  it('should return null for generateQuickFix', () => {
    const detector = new TestFileNamingDetector();
    const violation = {
      id: 'test-violation',
      patternId: 'testing/file-naming',
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
