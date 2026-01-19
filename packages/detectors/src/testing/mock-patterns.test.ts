/**
 * Mock Patterns Detector Tests
 *
 * Tests for test mocking pattern detection.
 *
 * @requirements 14.4 - Mock patterns
 */

import { describe, it, expect } from 'vitest';
import {
  MockPatternsDetector,
  createMockPatternsDetector,
  shouldExcludeFile,
  detectJestMocks,
  detectVitestMocks,
  detectSinonStubs,
  detectSinonSpies,
  detectManualMocks,
  analyzeMockPatterns,
  JEST_MOCK_PATTERNS,
  VITEST_MOCK_PATTERNS,
  SINON_STUB_PATTERNS,
  SINON_SPY_PATTERNS,
} from './mock-patterns.js';
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
});

// ============================================================================
// detectJestMocks Tests
// ============================================================================

describe('detectJestMocks', () => {
  it('should detect jest.mock()', () => {
    const content = `jest.mock('./module');`;
    const results = detectJestMocks(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('jest-mock');
    expect(results[0]?.library).toBe('jest');
  });

  it('should detect jest.fn()', () => {
    const content = `const mockFn = jest.fn();`;
    const results = detectJestMocks(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('jest-mock');
  });

  it('should detect jest.spyOn()', () => {
    const content = `jest.spyOn(object, 'method');`;
    const results = detectJestMocks(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect .mockReturnValue()', () => {
    const content = `mockFn.mockReturnValue('value');`;
    const results = detectJestMocks(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect .mockResolvedValue()', () => {
    const content = `mockFn.mockResolvedValue(data);`;
    const results = detectJestMocks(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect .mockRejectedValue()', () => {
    const content = `mockFn.mockRejectedValue(new Error('error'));`;
    const results = detectJestMocks(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect .mockImplementation()', () => {
    const content = `mockFn.mockImplementation(() => 'value');`;
    const results = detectJestMocks(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should count multiple jest mocks', () => {
    const content = `
      jest.mock('./module1');
      jest.mock('./module2');
      const fn = jest.fn();
    `;
    const results = detectJestMocks(content);
    
    expect(results.length).toBe(3);
  });
});

// ============================================================================
// detectVitestMocks Tests
// ============================================================================

describe('detectVitestMocks', () => {
  it('should detect vi.mock()', () => {
    const content = `vi.mock('./module');`;
    const results = detectVitestMocks(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('vitest-mock');
    expect(results[0]?.library).toBe('vitest');
  });

  it('should detect vi.fn()', () => {
    const content = `const mockFn = vi.fn();`;
    const results = detectVitestMocks(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect vi.spyOn()', () => {
    const content = `vi.spyOn(object, 'method');`;
    const results = detectVitestMocks(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect vi.stubGlobal()', () => {
    const content = `vi.stubGlobal('fetch', mockFetch);`;
    const results = detectVitestMocks(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should count multiple vitest mocks', () => {
    const content = `
      vi.mock('./module');
      const fn1 = vi.fn();
      const fn2 = vi.fn();
    `;
    const results = detectVitestMocks(content);
    
    expect(results.length).toBe(3);
  });
});

// ============================================================================
// detectSinonStubs Tests
// ============================================================================

describe('detectSinonStubs', () => {
  it('should detect sinon.stub()', () => {
    const content = `const stub = sinon.stub(object, 'method');`;
    const results = detectSinonStubs(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('sinon-stub');
    expect(results[0]?.library).toBe('sinon');
  });

  it('should detect .stub() method', () => {
    const content = `sandbox.stub(object, 'method');`;
    const results = detectSinonStubs(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect .returns()', () => {
    const content = `stub.returns('value');`;
    const results = detectSinonStubs(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect .resolves()', () => {
    const content = `stub.resolves(data);`;
    const results = detectSinonStubs(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect .rejects()', () => {
    const content = `stub.rejects(new Error('error'));`;
    const results = detectSinonStubs(content);
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// detectSinonSpies Tests
// ============================================================================

describe('detectSinonSpies', () => {
  it('should detect sinon.spy()', () => {
    const content = `const spy = sinon.spy(object, 'method');`;
    const results = detectSinonSpies(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('sinon-spy');
    expect(results[0]?.library).toBe('sinon');
  });

  it('should detect .spy() method', () => {
    const content = `sandbox.spy(object, 'method');`;
    const results = detectSinonSpies(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect .calledWith()', () => {
    const content = `expect(spy.calledWith('arg')).toBe(true);`;
    const results = detectSinonSpies(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect .calledOnce', () => {
    const content = `expect(spy.calledOnce).toBe(true);`;
    const results = detectSinonSpies(content);
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// detectManualMocks Tests
// ============================================================================

describe('detectManualMocks', () => {
  it('should detect __mocks__ directory files', () => {
    const results = detectManualMocks('', '__mocks__/module.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('manual-mock');
  });

  it('should detect .mock.ts files', () => {
    const results = detectManualMocks('', 'module.mock.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('manual-mock');
  });

  it('should detect createMock() function', () => {
    const content = `const mock = createMock(userSchema);`;
    const results = detectManualMocks(content, 'test.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('manual-mock');
  });

  it('should detect mockFactory() function', () => {
    const content = `const user = mockFactory('user');`;
    const results = detectManualMocks(content, 'test.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should not detect manual mocks in regular files', () => {
    const content = `const x = 1;`;
    const results = detectManualMocks(content, 'utils.ts');
    
    expect(results.length).toBe(0);
  });
});

// ============================================================================
// analyzeMockPatterns Tests
// ============================================================================

describe('analyzeMockPatterns', () => {
  it('should return empty analysis for non-test files', () => {
    const content = `const x = 1;`;
    const analysis = analyzeMockPatterns(content, 'utils.ts');
    
    expect(analysis.patterns.length).toBe(0);
    expect(analysis.dominantLibrary).toBeNull();
    expect(analysis.mockCount).toBe(0);
    expect(analysis.hasManualMocks).toBe(false);
  });

  it('should detect Jest as dominant library', () => {
    const content = `
      jest.mock('./module');
      const fn1 = jest.fn();
      const fn2 = jest.fn();
    `;
    const analysis = analyzeMockPatterns(content, 'component.test.ts');
    
    expect(analysis.dominantLibrary).toBe('jest');
    expect(analysis.mockCount).toBe(3);
  });

  it('should detect Vitest as dominant library', () => {
    const content = `
      vi.mock('./module');
      const fn1 = vi.fn();
      const fn2 = vi.fn();
    `;
    const analysis = analyzeMockPatterns(content, 'component.test.ts');
    
    expect(analysis.dominantLibrary).toBe('vitest');
    expect(analysis.mockCount).toBe(3);
  });

  it('should detect Sinon as dominant library', () => {
    const content = `
      const stub1 = sinon.stub(obj, 'method1');
      const stub2 = sinon.stub(obj, 'method2');
      const spy = sinon.spy(obj, 'method3');
    `;
    const analysis = analyzeMockPatterns(content, 'component.test.ts');
    
    expect(analysis.dominantLibrary).toBe('sinon');
  });

  it('should detect manual mocks', () => {
    const content = `const mock = mockFactory('user');`;
    const analysis = analyzeMockPatterns(content, 'component.test.ts');
    
    expect(analysis.hasManualMocks).toBe(true);
  });

  it('should analyze __tests__ directory files', () => {
    const content = `
      vi.mock('./module');
      const fn = vi.fn();
    `;
    const analysis = analyzeMockPatterns(content, '__tests__/component.ts');
    
    expect(analysis.dominantLibrary).toBe('vitest');
    expect(analysis.mockCount).toBe(2);
  });
});

// ============================================================================
// Detector Class Tests
// ============================================================================

describe('MockPatternsDetector', () => {
  it('should create detector with correct properties', () => {
    const detector = createMockPatternsDetector();
    
    expect(detector.id).toBe('testing/mock-patterns');
    expect(detector.category).toBe('testing');
    expect(detector.subcategory).toBe('mock-patterns');
    expect(detector.supportedLanguages).toContain('typescript');
    expect(detector.supportedLanguages).toContain('javascript');
  });

  it('should return empty result for unsupported languages', async () => {
    const detector = new MockPatternsDetector();
    const context = createMockContext('styles.css', 'body { color: red; }');
    context.language = 'css';
    
    const result = await detector.detect(context);
    
    expect(result.patterns.length).toBe(0);
    expect(result.violations.length).toBe(0);
  });

  it('should detect mock patterns in test files', async () => {
    const detector = new MockPatternsDetector();
    const content = `
      vi.mock('./module');
      const mockFn = vi.fn();
    `;
    const context = createMockContext('component.test.ts', content);
    
    const result = await detector.detect(context);
    
    expect(result.confidence).toBe(0.9);
    expect(result.metadata?.custom?.dominantLibrary).toBe('vitest');
    expect(result.metadata?.custom?.mockCount).toBe(2);
  });

  it('should return empty result for test files without mocks', async () => {
    const detector = new MockPatternsDetector();
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

  it('should return empty result for non-test files', async () => {
    const detector = new MockPatternsDetector();
    const content = `const x = 1;`;
    const context = createMockContext('utils.ts', content);
    
    const result = await detector.detect(context);
    
    expect(result.patterns.length).toBe(0);
  });

  it('should return null for generateQuickFix', () => {
    const detector = new MockPatternsDetector();
    const violation = {
      id: 'test-violation',
      patternId: 'testing/mock-patterns',
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
