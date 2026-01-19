/**
 * Setup/Teardown Detector Tests
 *
 * Tests for test setup and teardown pattern detection.
 *
 * @requirements 14.7 - Setup/teardown patterns
 */

import { describe, it, expect } from 'vitest';
import {
  SetupTeardownDetector,
  createSetupTeardownDetector,
  shouldExcludeFile,
  detectBeforeEach,
  detectAfterEach,
  detectBeforeAll,
  detectAfterAll,
  detectSetupFunctions,
  detectCleanupFunctions,
  analyzeSetupTeardown,
  BEFORE_EACH_PATTERNS,
  AFTER_EACH_PATTERNS,
  BEFORE_ALL_PATTERNS,
  AFTER_ALL_PATTERNS,
  SETUP_FUNCTION_PATTERNS,
  CLEANUP_FUNCTION_PATTERNS,
} from './setup-teardown.js';
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

// ============================================================================
// shouldExcludeFile Tests
// ============================================================================

describe('shouldExcludeFile', () => {
  it('should not exclude .test.ts files', () => {
    expect(shouldExcludeFile('component.test.ts')).toBe(false);
  });

  it('should not exclude .spec.ts files', () => {
    expect(shouldExcludeFile('component.spec.ts')).toBe(false);
  });

  it('should not exclude __tests__ files', () => {
    expect(shouldExcludeFile('__tests__/component.ts')).toBe(false);
  });

  it('should exclude regular source files', () => {
    expect(shouldExcludeFile('component.ts')).toBe(true);
  });

  it('should exclude utility files', () => {
    expect(shouldExcludeFile('src/utils/helpers.ts')).toBe(true);
  });
});

// ============================================================================
// detectBeforeEach Tests
// ============================================================================

describe('detectBeforeEach', () => {
  it('should detect beforeEach()', () => {
    const content = `beforeEach(() => { setup(); });`;
    const results = detectBeforeEach(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('before-each');
  });

  it('should detect beforeEach with async', () => {
    const content = `beforeEach(async () => { await setup(); });`;
    const results = detectBeforeEach(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect before() hook', () => {
    const content = `before(() => { setup(); });`;
    const results = detectBeforeEach(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect before with async', () => {
    const content = `before(async () => { await setup(); });`;
    const results = detectBeforeEach(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should count multiple beforeEach hooks', () => {
    const content = `
      beforeEach(() => { setup1(); });
      beforeEach(() => { setup2(); });
    `;
    const results = detectBeforeEach(content);
    
    expect(results.length).toBe(2);
  });
});

// ============================================================================
// detectAfterEach Tests
// ============================================================================

describe('detectAfterEach', () => {
  it('should detect afterEach()', () => {
    const content = `afterEach(() => { cleanup(); });`;
    const results = detectAfterEach(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('after-each');
  });

  it('should detect afterEach with async', () => {
    const content = `afterEach(async () => { await cleanup(); });`;
    const results = detectAfterEach(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect after() hook', () => {
    const content = `after(() => { cleanup(); });`;
    const results = detectAfterEach(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect after with async', () => {
    const content = `after(async () => { await cleanup(); });`;
    const results = detectAfterEach(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should count multiple afterEach hooks', () => {
    const content = `
      afterEach(() => { cleanup1(); });
      afterEach(() => { cleanup2(); });
    `;
    const results = detectAfterEach(content);
    
    expect(results.length).toBe(2);
  });
});

// ============================================================================
// detectBeforeAll Tests
// ============================================================================

describe('detectBeforeAll', () => {
  it('should detect beforeAll()', () => {
    const content = `beforeAll(() => { globalSetup(); });`;
    const results = detectBeforeAll(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('before-all');
  });

  it('should detect beforeAll with async', () => {
    const content = `beforeAll(async () => { await globalSetup(); });`;
    const results = detectBeforeAll(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect before("all") hook', () => {
    const content = `before('all', () => { globalSetup(); });`;
    const results = detectBeforeAll(content);
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// detectAfterAll Tests
// ============================================================================

describe('detectAfterAll', () => {
  it('should detect afterAll()', () => {
    const content = `afterAll(() => { globalCleanup(); });`;
    const results = detectAfterAll(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('after-all');
  });

  it('should detect afterAll with async', () => {
    const content = `afterAll(async () => { await globalCleanup(); });`;
    const results = detectAfterAll(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect after("all") hook', () => {
    const content = `after('all', () => { globalCleanup(); });`;
    const results = detectAfterAll(content);
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// detectSetupFunctions Tests
// ============================================================================

describe('detectSetupFunctions', () => {
  it('should detect const setup = ...', () => {
    const content = `const setup = () => { /* setup */ };`;
    const results = detectSetupFunctions(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('setup-function');
  });

  it('should detect const setupTest = ...', () => {
    const content = `const setupTest = () => { /* setup */ };`;
    const results = detectSetupFunctions(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect const init = ...', () => {
    const content = `const init = () => { /* init */ };`;
    const results = detectSetupFunctions(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect const initTest = ...', () => {
    const content = `const initTest = () => { /* init */ };`;
    const results = detectSetupFunctions(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect const prepare = ...', () => {
    const content = `const prepare = () => { /* prepare */ };`;
    const results = detectSetupFunctions(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect const prepareTest = ...', () => {
    const content = `const prepareTest = () => { /* prepare */ };`;
    const results = detectSetupFunctions(content);
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// detectCleanupFunctions Tests
// ============================================================================

describe('detectCleanupFunctions', () => {
  it('should detect const cleanup = ...', () => {
    const content = `const cleanup = () => { /* cleanup */ };`;
    const results = detectCleanupFunctions(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('cleanup-function');
  });

  it('should detect const cleanupTest = ...', () => {
    const content = `const cleanupTest = () => { /* cleanup */ };`;
    const results = detectCleanupFunctions(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect const teardown = ...', () => {
    const content = `const teardown = () => { /* teardown */ };`;
    const results = detectCleanupFunctions(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect const teardownTest = ...', () => {
    const content = `const teardownTest = () => { /* teardown */ };`;
    const results = detectCleanupFunctions(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect const reset = ...', () => {
    const content = `const reset = () => { /* reset */ };`;
    const results = detectCleanupFunctions(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect const resetState = ...', () => {
    const content = `const resetState = () => { /* reset */ };`;
    const results = detectCleanupFunctions(content);
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// analyzeSetupTeardown Tests
// ============================================================================

describe('analyzeSetupTeardown', () => {
  it('should return empty analysis for non-test files', () => {
    const content = `beforeEach(() => {});`;
    const analysis = analyzeSetupTeardown(content, 'component.ts');
    
    expect(analysis.patterns.length).toBe(0);
    expect(analysis.hasBeforeEach).toBe(false);
    expect(analysis.hasAfterEach).toBe(false);
    expect(analysis.hasBeforeAll).toBe(false);
    expect(analysis.hasAfterAll).toBe(false);
    expect(analysis.isBalanced).toBe(true);
  });

  it('should detect beforeEach', () => {
    const content = `beforeEach(() => { setup(); });`;
    const analysis = analyzeSetupTeardown(content, 'component.test.ts');
    
    expect(analysis.hasBeforeEach).toBe(true);
  });

  it('should detect afterEach', () => {
    const content = `afterEach(() => { cleanup(); });`;
    const analysis = analyzeSetupTeardown(content, 'component.test.ts');
    
    expect(analysis.hasAfterEach).toBe(true);
  });

  it('should detect beforeAll', () => {
    const content = `beforeAll(() => { globalSetup(); });`;
    const analysis = analyzeSetupTeardown(content, 'component.test.ts');
    
    expect(analysis.hasBeforeAll).toBe(true);
  });

  it('should detect afterAll', () => {
    const content = `afterAll(() => { globalCleanup(); });`;
    const analysis = analyzeSetupTeardown(content, 'component.test.ts');
    
    expect(analysis.hasAfterAll).toBe(true);
  });

  it('should detect balanced setup/teardown', () => {
    const content = `
      beforeAll(() => { globalSetup(); });
      afterAll(() => { globalCleanup(); });
      beforeEach(() => { setup(); });
      afterEach(() => { cleanup(); });
    `;
    const analysis = analyzeSetupTeardown(content, 'component.test.ts');
    
    expect(analysis.hasBeforeAll).toBe(true);
    expect(analysis.hasAfterAll).toBe(true);
    expect(analysis.hasBeforeEach).toBe(true);
    expect(analysis.hasAfterEach).toBe(true);
    expect(analysis.isBalanced).toBe(true);
  });

  it('should detect unbalanced beforeAll without afterAll', () => {
    const content = `
      beforeAll(() => { globalSetup(); });
    `;
    const analysis = analyzeSetupTeardown(content, 'component.test.ts');
    
    expect(analysis.hasBeforeAll).toBe(true);
    expect(analysis.hasAfterAll).toBe(false);
    expect(analysis.isBalanced).toBe(false);
  });

  it('should detect setup functions', () => {
    const content = `
      const setup = () => { /* setup */ };
      beforeEach(() => { setup(); });
    `;
    const analysis = analyzeSetupTeardown(content, 'component.test.ts');
    
    expect(analysis.patterns.some(p => p.type === 'setup-function')).toBe(true);
  });

  it('should detect cleanup functions', () => {
    const content = `
      const cleanup = () => { /* cleanup */ };
      afterEach(() => { cleanup(); });
    `;
    const analysis = analyzeSetupTeardown(content, 'component.test.ts');
    
    expect(analysis.patterns.some(p => p.type === 'cleanup-function')).toBe(true);
  });

  it('should analyze __tests__ directory files', () => {
    const content = `
      beforeEach(() => { setup(); });
      afterEach(() => { cleanup(); });
    `;
    const analysis = analyzeSetupTeardown(content, '__tests__/component.ts');
    
    expect(analysis.hasBeforeEach).toBe(true);
    expect(analysis.hasAfterEach).toBe(true);
  });
});

// ============================================================================
// Detector Class Tests
// ============================================================================

describe('SetupTeardownDetector', () => {
  it('should create detector with correct properties', () => {
    const detector = createSetupTeardownDetector();
    
    expect(detector.id).toBe('testing/setup-teardown');
    expect(detector.category).toBe('testing');
    expect(detector.subcategory).toBe('setup-teardown');
    expect(detector.supportedLanguages).toContain('typescript');
    expect(detector.supportedLanguages).toContain('javascript');
  });

  it('should return empty result for unsupported languages', async () => {
    const detector = new SetupTeardownDetector();
    const context = createMockContext('styles.css', 'body { color: red; }');
    context.language = 'css';
    
    const result = await detector.detect(context);
    
    expect(result.patterns.length).toBe(0);
    expect(result.violations.length).toBe(0);
  });

  it('should detect setup/teardown patterns', async () => {
    const detector = new SetupTeardownDetector();
    const content = `
      beforeEach(() => { setup(); });
      afterEach(() => { cleanup(); });
    `;
    const context = createMockContext('component.test.ts', content);
    
    const result = await detector.detect(context);
    
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.metadata?.custom?.hasBeforeEach).toBe(true);
    expect(result.metadata?.custom?.hasAfterEach).toBe(true);
  });

  it('should have higher confidence for balanced setup/teardown', async () => {
    const detector = new SetupTeardownDetector();
    const content = `
      beforeAll(() => { globalSetup(); });
      afterAll(() => { globalCleanup(); });
    `;
    const context = createMockContext('component.test.ts', content);
    
    const result = await detector.detect(context);
    
    expect(result.confidence).toBe(0.95);
    expect(result.metadata?.custom?.isBalanced).toBe(true);
  });

  it('should have lower confidence for unbalanced setup/teardown', async () => {
    const detector = new SetupTeardownDetector();
    const content = `
      beforeAll(() => { globalSetup(); });
    `;
    const context = createMockContext('component.test.ts', content);
    
    const result = await detector.detect(context);
    
    expect(result.confidence).toBe(0.8);
    expect(result.metadata?.custom?.isBalanced).toBe(false);
  });

  it('should return empty result for non-test files', async () => {
    const detector = new SetupTeardownDetector();
    const content = `const x = 1;`;
    const context = createMockContext('utils.ts', content);
    
    const result = await detector.detect(context);
    
    expect(result.patterns.length).toBe(0);
  });

  it('should return empty result for test files without setup/teardown', async () => {
    const detector = new SetupTeardownDetector();
    const content = `
      describe('test', () => {
        it('should work', () => {
          expect(true).toBe(true);
        });
      });
    `;
    const context = createMockContext('component.test.ts', content);
    
    const result = await detector.detect(context);
    
    expect(result.patterns.length).toBe(0);
  });

  it('should return null for generateQuickFix', () => {
    const detector = new SetupTeardownDetector();
    const violation = {
      id: 'test-violation',
      patternId: 'testing/setup-teardown',
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
