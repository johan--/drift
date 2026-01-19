/**
 * Test Structure Detector Tests
 *
 * Tests for test structure pattern detection (AAA, Given-When-Then, etc.).
 *
 * @requirements 14.3 - Test structure patterns
 */

import { describe, it, expect } from 'vitest';
import {
  TestStructureDetector,
  createTestStructureDetector,
  shouldExcludeFile,
  detectAAAPattern,
  detectGivenWhenThen,
  detectItShould,
  detectTestFunctions,
  detectDescribeBlocks,
  analyzeTestStructure,
  AAA_COMMENT_PATTERNS,
  GIVEN_WHEN_THEN_PATTERNS,
  IT_SHOULD_PATTERNS,
  TEST_FUNCTION_PATTERNS,
  DESCRIBE_BLOCK_PATTERNS,
} from './test-structure.js';
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
// detectAAAPattern Tests
// ============================================================================

describe('detectAAAPattern', () => {
  it('should detect // Arrange comment', () => {
    const content = `
      it('should test something', () => {
        // Arrange
        const input = 'test';
      });
    `;
    const results = detectAAAPattern(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('aaa-pattern');
    expect(results[0]?.match).toContain('Arrange');
  });

  it('should detect // Act comment', () => {
    const content = `
      it('should test something', () => {
        // Act
        const result = doSomething();
      });
    `;
    const results = detectAAAPattern(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(r => r.match.includes('Act'))).toBe(true);
  });

  it('should detect // Assert comment', () => {
    const content = `
      it('should test something', () => {
        // Assert
        expect(result).toBe(expected);
      });
    `;
    const results = detectAAAPattern(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(r => r.match.includes('Assert'))).toBe(true);
  });

  it('should detect /* Arrange */ block comment', () => {
    const content = `
      it('should test something', () => {
        /* Arrange */
        const input = 'test';
      });
    `;
    const results = detectAAAPattern(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect all three AAA comments', () => {
    const content = `
      it('should test something', () => {
        // Arrange
        const input = 'test';
        
        // Act
        const result = process(input);
        
        // Assert
        expect(result).toBe('expected');
      });
    `;
    const results = detectAAAPattern(content);
    
    expect(results.length).toBe(3);
  });

  it('should return empty for content without AAA comments', () => {
    const content = `
      it('should test something', () => {
        const result = doSomething();
        expect(result).toBe(true);
      });
    `;
    const results = detectAAAPattern(content);
    
    expect(results.length).toBe(0);
  });
});

// ============================================================================
// detectGivenWhenThen Tests
// ============================================================================

describe('detectGivenWhenThen', () => {
  it('should detect // Given comment', () => {
    const content = `
      it('should test something', () => {
        // Given
        const input = 'test';
      });
    `;
    const results = detectGivenWhenThen(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('given-when-then');
  });

  it('should detect // When comment', () => {
    const content = `
      it('should test something', () => {
        // When
        const result = doSomething();
      });
    `;
    const results = detectGivenWhenThen(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect // Then comment', () => {
    const content = `
      it('should test something', () => {
        // Then
        expect(result).toBe(expected);
      });
    `;
    const results = detectGivenWhenThen(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect given() function call', () => {
    const content = `
      given('a user is logged in', () => {
        // setup
      });
    `;
    const results = detectGivenWhenThen(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect when() function call', () => {
    const content = `
      when('the user clicks submit', () => {
        // action
      });
    `;
    const results = detectGivenWhenThen(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect then() function call', () => {
    const content = `
      then('the form is submitted', () => {
        // assertion
      });
    `;
    const results = detectGivenWhenThen(content);
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// detectItShould Tests
// ============================================================================

describe('detectItShould', () => {
  it('should detect it("should ...")', () => {
    const content = `it('should return true', () => {});`;
    const results = detectItShould(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('it-should');
  });

  it('should detect it("returns ...")', () => {
    const content = `it('returns the correct value', () => {});`;
    const results = detectItShould(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect it("throws ...")', () => {
    const content = `it('throws an error', () => {});`;
    const results = detectItShould(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect it("creates ...")', () => {
    const content = `it('creates a new user', () => {});`;
    const results = detectItShould(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect it("updates ...")', () => {
    const content = `it('updates the record', () => {});`;
    const results = detectItShould(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect it("deletes ...")', () => {
    const content = `it('deletes the item', () => {});`;
    const results = detectItShould(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should handle double quotes', () => {
    const content = `it("should work", () => {});`;
    const results = detectItShould(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should handle backticks', () => {
    const content = 'it(`should work`, () => {});';
    const results = detectItShould(content);
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// detectTestFunctions Tests
// ============================================================================

describe('detectTestFunctions', () => {
  it('should detect test() function', () => {
    const content = `test('my test', () => {});`;
    const results = detectTestFunctions(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('test-function');
  });

  it('should detect it() function', () => {
    const content = `it('my test', () => {});`;
    const results = detectTestFunctions(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect it.only()', () => {
    const content = `it.only('focused test', () => {});`;
    const results = detectTestFunctions(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect it.skip()', () => {
    const content = `it.skip('skipped test', () => {});`;
    const results = detectTestFunctions(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect it.todo()', () => {
    const content = `it.todo('todo test', () => {});`;
    const results = detectTestFunctions(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect test.only()', () => {
    const content = `test.only('focused test', () => {});`;
    const results = detectTestFunctions(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect test.skip()', () => {
    const content = `test.skip('skipped test', () => {});`;
    const results = detectTestFunctions(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should count multiple test functions', () => {
    const content = `
      test('test 1', () => {});
      test('test 2', () => {});
      it('test 3', () => {});
    `;
    const results = detectTestFunctions(content);
    
    expect(results.length).toBe(3);
  });
});

// ============================================================================
// detectDescribeBlocks Tests
// ============================================================================

describe('detectDescribeBlocks', () => {
  it('should detect describe() block', () => {
    const content = `describe('MyComponent', () => {});`;
    const results = detectDescribeBlocks(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('describe-block');
  });

  it('should detect describe.only()', () => {
    const content = `describe.only('focused suite', () => {});`;
    const results = detectDescribeBlocks(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect describe.skip()', () => {
    const content = `describe.skip('skipped suite', () => {});`;
    const results = detectDescribeBlocks(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect context() block', () => {
    const content = `context('when user is logged in', () => {});`;
    const results = detectDescribeBlocks(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should count nested describe blocks', () => {
    const content = `
      describe('MyComponent', () => {
        describe('render', () => {
          describe('with props', () => {});
        });
      });
    `;
    const results = detectDescribeBlocks(content);
    
    expect(results.length).toBe(3);
  });
});

// ============================================================================
// analyzeTestStructure Tests
// ============================================================================

describe('analyzeTestStructure', () => {
  it('should return empty analysis for non-test files', () => {
    const content = `const x = 1;`;
    const analysis = analyzeTestStructure(content, 'utils.ts');
    
    expect(analysis.patterns.length).toBe(0);
    expect(analysis.hasAAAPattern).toBe(false);
    expect(analysis.hasGivenWhenThen).toBe(false);
    expect(analysis.testCount).toBe(0);
    expect(analysis.describeCount).toBe(0);
  });

  it('should detect AAA pattern in test files', () => {
    const content = `
      it('should test', () => {
        // Arrange
        const input = 'test';
        // Act
        const result = process(input);
        // Assert
        expect(result).toBe('expected');
      });
    `;
    const analysis = analyzeTestStructure(content, 'component.test.ts');
    
    expect(analysis.hasAAAPattern).toBe(true);
  });

  it('should detect Given-When-Then pattern', () => {
    const content = `
      it('should test', () => {
        // Given
        const input = 'test';
        // When
        const result = process(input);
        // Then
        expect(result).toBe('expected');
      });
    `;
    const analysis = analyzeTestStructure(content, 'component.test.ts');
    
    expect(analysis.hasGivenWhenThen).toBe(true);
  });

  it('should count test functions', () => {
    const content = `
      test('test 1', () => {});
      test('test 2', () => {});
      it('test 3', () => {});
    `;
    const analysis = analyzeTestStructure(content, 'component.test.ts');
    
    expect(analysis.testCount).toBe(3);
  });

  it('should count describe blocks', () => {
    const content = `
      describe('Suite 1', () => {
        describe('Nested', () => {});
      });
      describe('Suite 2', () => {});
    `;
    const analysis = analyzeTestStructure(content, 'component.test.ts');
    
    expect(analysis.describeCount).toBe(3);
  });

  it('should analyze __tests__ directory files', () => {
    const content = `
      describe('Component', () => {
        it('should work', () => {});
      });
    `;
    const analysis = analyzeTestStructure(content, '__tests__/component.ts');
    
    expect(analysis.testCount).toBe(1);
    expect(analysis.describeCount).toBe(1);
  });
});

// ============================================================================
// Detector Class Tests
// ============================================================================

describe('TestStructureDetector', () => {
  it('should create detector with correct properties', () => {
    const detector = createTestStructureDetector();
    
    expect(detector.id).toBe('testing/test-structure');
    expect(detector.category).toBe('testing');
    expect(detector.subcategory).toBe('test-structure');
    expect(detector.supportedLanguages).toContain('typescript');
    expect(detector.supportedLanguages).toContain('javascript');
  });

  it('should return empty result for unsupported languages', async () => {
    const detector = new TestStructureDetector();
    const context = createMockContext('styles.css', 'body { color: red; }');
    context.language = 'css';
    
    const result = await detector.detect(context);
    
    expect(result.patterns.length).toBe(0);
    expect(result.violations.length).toBe(0);
  });

  it('should detect patterns in test files', async () => {
    const detector = new TestStructureDetector();
    const content = `
      describe('MyComponent', () => {
        it('should render', () => {
          // Arrange
          const props = {};
          // Act
          render(<MyComponent {...props} />);
          // Assert
          expect(screen.getByText('Hello')).toBeInTheDocument();
        });
      });
    `;
    const context = createMockContext('component.test.ts', content);
    
    const result = await detector.detect(context);
    
    expect(result.confidence).toBe(0.9);
    expect(result.metadata?.custom?.hasAAAPattern).toBe(true);
    expect(result.metadata?.custom?.testCount).toBe(1);
    expect(result.metadata?.custom?.describeCount).toBe(1);
  });

  it('should return empty result for non-test files', async () => {
    const detector = new TestStructureDetector();
    const content = `const x = 1;`;
    const context = createMockContext('utils.ts', content);
    
    const result = await detector.detect(context);
    
    expect(result.patterns.length).toBe(0);
  });

  it('should return null for generateQuickFix', () => {
    const detector = new TestStructureDetector();
    const violation = {
      id: 'test-violation',
      patternId: 'testing/test-structure',
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
