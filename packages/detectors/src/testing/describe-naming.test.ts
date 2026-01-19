/**
 * Describe Naming Detector Tests
 *
 * Tests for describe block naming pattern detection.
 *
 * @requirements 14.6 - Describe naming patterns
 */

import { describe, it, expect } from 'vitest';
import {
  DescribeNamingDetector,
  createDescribeNamingDetector,
  shouldExcludeFile,
  extractDescribeBlocks,
  analyzeDescribeNaming,
  COMPONENT_NAME_PATTERNS,
  FUNCTION_NAME_PATTERNS,
  METHOD_GROUP_PATTERNS,
  FEATURE_GROUP_PATTERNS,
} from './describe-naming.js';
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
// extractDescribeBlocks Tests
// ============================================================================

describe('extractDescribeBlocks', () => {
  it('should extract simple describe block', () => {
    const content = `describe('MyComponent', () => {});`;
    const results = extractDescribeBlocks(content);
    
    expect(results.length).toBe(1);
    expect(results[0]?.name).toBe('MyComponent');
    expect(results[0]?.depth).toBe(0);
  });

  it('should detect component name pattern', () => {
    const content = `describe('MyComponent', () => {});`;
    const results = extractDescribeBlocks(content);
    
    expect(results[0]?.type).toBe('component-name');
  });

  it('should detect component name with Component suffix', () => {
    const content = `describe('UserComponent', () => {});`;
    const results = extractDescribeBlocks(content);
    
    expect(results[0]?.type).toBe('component-name');
  });

  it('should detect JSX-style component name', () => {
    const content = `describe('<Button>', () => {});`;
    const results = extractDescribeBlocks(content);
    
    expect(results[0]?.type).toBe('component-name');
  });

  it('should detect function name pattern with ()', () => {
    const content = `describe('calculateTotal()', () => {});`;
    const results = extractDescribeBlocks(content);
    
    expect(results[0]?.type).toBe('function-name');
  });

  it('should detect function name pattern with #', () => {
    const content = `describe('#calculateTotal', () => {});`;
    const results = extractDescribeBlocks(content);
    
    expect(results[0]?.type).toBe('function-name');
  });

  it('should detect method group pattern with "when"', () => {
    const content = `describe('when user is logged in', () => {});`;
    const results = extractDescribeBlocks(content);
    
    expect(results[0]?.type).toBe('method-group');
  });

  it('should detect method group pattern with "with"', () => {
    const content = `describe('with valid input', () => {});`;
    const results = extractDescribeBlocks(content);
    
    expect(results[0]?.type).toBe('method-group');
  });

  it('should detect method group pattern with "given"', () => {
    const content = `describe('given a user exists', () => {});`;
    const results = extractDescribeBlocks(content);
    
    expect(results[0]?.type).toBe('method-group');
  });

  it('should detect method group pattern with "if"', () => {
    const content = `describe('if the user is admin', () => {});`;
    const results = extractDescribeBlocks(content);
    
    expect(results[0]?.type).toBe('method-group');
  });

  it('should detect feature group pattern', () => {
    const content = `describe('Feature: User Authentication', () => {});`;
    const results = extractDescribeBlocks(content);
    
    expect(results[0]?.type).toBe('feature-group');
  });

  it('should detect scenario pattern', () => {
    const content = `describe('Scenario: User logs in', () => {});`;
    const results = extractDescribeBlocks(content);
    
    expect(results[0]?.type).toBe('feature-group');
  });

  it('should extract nested describe blocks', () => {
    const content = `
      describe('MyComponent', () => {
        describe('render', () => {
          describe('with props', () => {});
        });
      });
    `;
    const results = extractDescribeBlocks(content);
    
    expect(results.length).toBe(3);
    expect(results[0]?.depth).toBe(0);
    expect(results[1]?.depth).toBeGreaterThan(0);
    expect(results[2]?.depth).toBeGreaterThan(results[1]?.depth ?? 0);
  });

  it('should mark nested describes as nested-describe type', () => {
    const content = `
      describe('MyComponent', () => {
        describe('render', () => {});
      });
    `;
    const results = extractDescribeBlocks(content);
    
    expect(results[1]?.type).toBe('nested-describe');
  });

  it('should handle double quotes', () => {
    const content = `describe("MyComponent", () => {});`;
    const results = extractDescribeBlocks(content);
    
    expect(results.length).toBe(1);
    expect(results[0]?.name).toBe('MyComponent');
  });

  it('should handle backticks', () => {
    const content = 'describe(`MyComponent`, () => {});';
    const results = extractDescribeBlocks(content);
    
    expect(results.length).toBe(1);
    expect(results[0]?.name).toBe('MyComponent');
  });

  it('should capture line and column information', () => {
    const content = `describe('MyComponent', () => {});`;
    const results = extractDescribeBlocks(content);
    
    expect(results[0]?.line).toBe(1);
    expect(results[0]?.column).toBeGreaterThan(0);
  });
});

// ============================================================================
// analyzeDescribeNaming Tests
// ============================================================================

describe('analyzeDescribeNaming', () => {
  it('should return empty analysis for non-test files', () => {
    const content = `describe('MyComponent', () => {});`;
    const analysis = analyzeDescribeNaming(content, 'component.ts');
    
    expect(analysis.patterns.length).toBe(0);
    expect(analysis.maxDepth).toBe(0);
    expect(analysis.hasConsistentNaming).toBe(true);
    expect(analysis.describeCount).toBe(0);
  });

  it('should analyze test files', () => {
    const content = `
      describe('MyComponent', () => {
        it('should render', () => {});
      });
    `;
    const analysis = analyzeDescribeNaming(content, 'component.test.ts');
    
    expect(analysis.patterns.length).toBe(1);
    expect(analysis.describeCount).toBe(1);
  });

  it('should calculate max depth', () => {
    const content = `
      describe('Level 0', () => {
        describe('Level 1', () => {
          describe('Level 2', () => {});
        });
      });
    `;
    const analysis = analyzeDescribeNaming(content, 'component.test.ts');
    
    expect(analysis.maxDepth).toBeGreaterThan(0);
  });

  it('should detect consistent naming', () => {
    const content = `
      describe('ComponentA', () => {});
      describe('ComponentB', () => {});
    `;
    const analysis = analyzeDescribeNaming(content, 'component.test.ts');
    
    expect(analysis.hasConsistentNaming).toBe(true);
  });

  it('should detect inconsistent naming', () => {
    const content = `
      describe('MyComponent', () => {});
      describe('calculateTotal()', () => {});
    `;
    const analysis = analyzeDescribeNaming(content, 'component.test.ts');
    
    expect(analysis.hasConsistentNaming).toBe(false);
  });

  it('should count describe blocks', () => {
    const content = `
      describe('Suite 1', () => {});
      describe('Suite 2', () => {});
      describe('Suite 3', () => {});
    `;
    const analysis = analyzeDescribeNaming(content, 'component.test.ts');
    
    expect(analysis.describeCount).toBe(3);
  });

  it('should analyze __tests__ directory files', () => {
    const content = `describe('MyComponent', () => {});`;
    const analysis = analyzeDescribeNaming(content, '__tests__/component.ts');
    
    expect(analysis.patterns.length).toBe(1);
  });
});

// ============================================================================
// Detector Class Tests
// ============================================================================

describe('DescribeNamingDetector', () => {
  it('should create detector with correct properties', () => {
    const detector = createDescribeNamingDetector();
    
    expect(detector.id).toBe('testing/describe-naming');
    expect(detector.category).toBe('testing');
    expect(detector.subcategory).toBe('describe-naming');
    expect(detector.supportedLanguages).toContain('typescript');
    expect(detector.supportedLanguages).toContain('javascript');
  });

  it('should return empty result for unsupported languages', async () => {
    const detector = new DescribeNamingDetector();
    const context = createMockContext('styles.css', 'body { color: red; }');
    context.language = 'css';
    
    const result = await detector.detect(context);
    
    expect(result.patterns.length).toBe(0);
    expect(result.violations.length).toBe(0);
  });

  it('should detect describe naming patterns', async () => {
    const detector = new DescribeNamingDetector();
    const content = `
      describe('MyComponent', () => {
        describe('render', () => {
          it('should render correctly', () => {});
        });
      });
    `;
    const context = createMockContext('component.test.ts', content);
    
    const result = await detector.detect(context);
    
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.metadata?.custom?.describeCount).toBe(2);
  });

  it('should have higher confidence for consistent naming', async () => {
    const detector = new DescribeNamingDetector();
    const content = `
      describe('ComponentA', () => {});
      describe('ComponentB', () => {});
    `;
    const context = createMockContext('component.test.ts', content);
    
    const result = await detector.detect(context);
    
    expect(result.confidence).toBe(0.95);
    expect(result.metadata?.custom?.hasConsistentNaming).toBe(true);
  });

  it('should have lower confidence for inconsistent naming', async () => {
    const detector = new DescribeNamingDetector();
    const content = `
      describe('MyComponent', () => {});
      describe('calculateTotal()', () => {});
    `;
    const context = createMockContext('component.test.ts', content);
    
    const result = await detector.detect(context);
    
    expect(result.confidence).toBe(0.8);
    expect(result.metadata?.custom?.hasConsistentNaming).toBe(false);
  });

  it('should return empty result for non-test files', async () => {
    const detector = new DescribeNamingDetector();
    const content = `const x = 1;`;
    const context = createMockContext('utils.ts', content);
    
    const result = await detector.detect(context);
    
    expect(result.patterns.length).toBe(0);
  });

  it('should return empty result for test files without describe blocks', async () => {
    const detector = new DescribeNamingDetector();
    const content = `
      test('should work', () => {
        expect(true).toBe(true);
      });
    `;
    const context = createMockContext('component.test.ts', content);
    
    const result = await detector.detect(context);
    
    expect(result.patterns.length).toBe(0);
  });

  it('should return null for generateQuickFix', () => {
    const detector = new DescribeNamingDetector();
    const violation = {
      id: 'test-violation',
      patternId: 'testing/describe-naming',
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
