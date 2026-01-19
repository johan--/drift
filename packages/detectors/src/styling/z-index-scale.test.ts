/**
 * Z-Index Scale Detector Tests
 *
 * Tests for z-index scale adherence pattern detection.
 *
 * @requirements 9.7 - THE Styling_Detector SHALL detect z-index scale adherence
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ZIndexScaleDetector,
  createZIndexScaleDetector,
  detectTailwindZIndex,
  detectTailwindArbitraryZIndex,
  detectCSSZIndexProperties,
  detectThemeZIndex,
  detectCSSZIndexValues,
  analyzeZIndexScale,
  shouldExcludeFile,
  isAllowedZIndexValue,
  isOnZIndexScale,
  isOnExtendedZIndexScale,
  isMagicNumber,
  isHighMagicNumber,
  findNearestZIndexValue,
  suggestZIndexValue,
} from './z-index-scale.js';
import type { DetectionContext, ProjectContext } from '../base/index.js';

// ============================================================================
// Test Helpers
// ============================================================================

function createMockContext(
  file: string,
  content: string = ''
): DetectionContext {
  const projectContext: ProjectContext = {
    rootDir: '/project',
    files: [file],
    config: {},
  };

  const extension = file.split('.').pop() || 'ts';
  const language = extension === 'css' ? 'css' : 'typescript';

  return {
    file,
    content,
    ast: null,
    imports: [],
    exports: [],
    projectContext,
    language,
    extension: `.${extension}`,
    isTestFile: file.includes('.test.') || file.includes('.spec.'),
    isTypeDefinition: file.endsWith('.d.ts'),
  };
}

// ============================================================================
// Helper Function Tests
// ============================================================================

describe('shouldExcludeFile', () => {
  it('should exclude test files', () => {
    expect(shouldExcludeFile('Modal.test.tsx')).toBe(true);
    expect(shouldExcludeFile('Modal.spec.ts')).toBe(true);
  });

  it('should exclude story files', () => {
    expect(shouldExcludeFile('Modal.stories.tsx')).toBe(true);
  });

  it('should exclude design-tokens directory', () => {
    expect(shouldExcludeFile('design-tokens/z-index.ts')).toBe(true);
    expect(shouldExcludeFile('lib/design-tokens/index.ts')).toBe(true);
  });

  it('should exclude tokens directory', () => {
    expect(shouldExcludeFile('tokens/z-index.ts')).toBe(true);
  });

  it('should exclude theme directory', () => {
    expect(shouldExcludeFile('theme/z-index.ts')).toBe(true);
  });

  it('should exclude config files', () => {
    expect(shouldExcludeFile('tailwind.config.js')).toBe(true);
    expect(shouldExcludeFile('app.config.ts')).toBe(true);
  });

  it('should not exclude regular component files', () => {
    expect(shouldExcludeFile('Modal.tsx')).toBe(false);
    expect(shouldExcludeFile('components/Dropdown.tsx')).toBe(false);
    expect(shouldExcludeFile('styles/global.css')).toBe(false);
  });
});


describe('isAllowedZIndexValue', () => {
  it('should allow CSS keywords', () => {
    expect(isAllowedZIndexValue('auto')).toBe(true);
    expect(isAllowedZIndexValue('inherit')).toBe(true);
    expect(isAllowedZIndexValue('initial')).toBe(true);
    expect(isAllowedZIndexValue('unset')).toBe(true);
    expect(isAllowedZIndexValue('revert')).toBe(true);
  });

  it('should allow common values', () => {
    expect(isAllowedZIndexValue('-1')).toBe(true);
    expect(isAllowedZIndexValue('0')).toBe(true);
    expect(isAllowedZIndexValue('1')).toBe(true);
  });

  it('should be case-insensitive', () => {
    expect(isAllowedZIndexValue('AUTO')).toBe(true);
    expect(isAllowedZIndexValue('INHERIT')).toBe(true);
  });

  it('should not allow arbitrary values', () => {
    expect(isAllowedZIndexValue('9999')).toBe(false);
    expect(isAllowedZIndexValue('100')).toBe(false);
    expect(isAllowedZIndexValue('15')).toBe(false);
  });
});

// ============================================================================
// Scale Detection Tests
// ============================================================================

describe('isOnZIndexScale', () => {
  it('should return true for values on the standard scale', () => {
    expect(isOnZIndexScale(0)).toBe(true);
    expect(isOnZIndexScale(10)).toBe(true);
    expect(isOnZIndexScale(20)).toBe(true);
    expect(isOnZIndexScale(30)).toBe(true);
    expect(isOnZIndexScale(40)).toBe(true);
    expect(isOnZIndexScale(50)).toBe(true);
  });

  it('should return false for values not on the scale', () => {
    expect(isOnZIndexScale(5)).toBe(false);
    expect(isOnZIndexScale(15)).toBe(false);
    expect(isOnZIndexScale(25)).toBe(false);
    expect(isOnZIndexScale(100)).toBe(false);
    expect(isOnZIndexScale(9999)).toBe(false);
  });
});

describe('isOnExtendedZIndexScale', () => {
  it('should return true for values on the extended scale', () => {
    expect(isOnExtendedZIndexScale(0)).toBe(true);
    expect(isOnExtendedZIndexScale(10)).toBe(true);
    expect(isOnExtendedZIndexScale(50)).toBe(true);
    expect(isOnExtendedZIndexScale(60)).toBe(true);
    expect(isOnExtendedZIndexScale(100)).toBe(true);
  });

  it('should return false for values not on the extended scale', () => {
    expect(isOnExtendedZIndexScale(5)).toBe(false);
    expect(isOnExtendedZIndexScale(15)).toBe(false);
    expect(isOnExtendedZIndexScale(9999)).toBe(false);
  });
});

describe('isMagicNumber', () => {
  it('should return true for values above threshold', () => {
    expect(isMagicNumber(101)).toBe(true);
    expect(isMagicNumber(200)).toBe(true);
    expect(isMagicNumber(9999)).toBe(true);
    expect(isMagicNumber(999999)).toBe(true);
  });

  it('should return false for values on extended scale', () => {
    expect(isMagicNumber(0)).toBe(false);
    expect(isMagicNumber(10)).toBe(false);
    expect(isMagicNumber(50)).toBe(false);
    expect(isMagicNumber(100)).toBe(false);
  });

  it('should handle negative values', () => {
    expect(isMagicNumber(-9999)).toBe(true);
    expect(isMagicNumber(-200)).toBe(true);
  });
});

describe('isHighMagicNumber', () => {
  it('should return true for very high values', () => {
    expect(isHighMagicNumber(1000)).toBe(true);
    expect(isHighMagicNumber(9999)).toBe(true);
    expect(isHighMagicNumber(999999)).toBe(true);
  });

  it('should return false for moderate values', () => {
    expect(isHighMagicNumber(100)).toBe(false);
    expect(isHighMagicNumber(500)).toBe(false);
    expect(isHighMagicNumber(999)).toBe(false);
  });

  it('should handle negative values', () => {
    expect(isHighMagicNumber(-9999)).toBe(true);
    expect(isHighMagicNumber(-500)).toBe(false);
  });
});

// ============================================================================
// Nearest Value Tests
// ============================================================================

describe('findNearestZIndexValue', () => {
  it('should find exact matches', () => {
    expect(findNearestZIndexValue(0)).toBe(0);
    expect(findNearestZIndexValue(10)).toBe(10);
    expect(findNearestZIndexValue(50)).toBe(50);
  });

  it('should find nearest value for arbitrary values', () => {
    expect(findNearestZIndexValue(5)).toBe(0);
    expect(findNearestZIndexValue(8)).toBe(10);
    expect(findNearestZIndexValue(15)).toBe(10);
    expect(findNearestZIndexValue(25)).toBe(20);
    expect(findNearestZIndexValue(45)).toBe(40);
  });

  it('should handle negative values', () => {
    expect(findNearestZIndexValue(-5)).toBe(0);
    expect(findNearestZIndexValue(-15)).toBe(-10);
  });

  it('should handle high values', () => {
    expect(findNearestZIndexValue(9999)).toBe(50);
    expect(findNearestZIndexValue(100)).toBe(50);
  });
});

describe('suggestZIndexValue', () => {
  it('should suggest scale values for arbitrary values', () => {
    const suggestion = suggestZIndexValue(15);
    expect(suggestion).toContain('z-10');
  });

  it('should suggest semantic values for high magic numbers', () => {
    const suggestion = suggestZIndexValue(9999);
    expect(suggestion).toContain('semantic');
  });

  it('should handle negative values', () => {
    const suggestion = suggestZIndexValue(-5);
    expect(suggestion).toContain('-1');
  });

  it('should suggest z-0 for zero', () => {
    const suggestion = suggestZIndexValue(0);
    expect(suggestion).toContain('z-0');
  });
});


// ============================================================================
// Tailwind Z-Index Detection Tests
// ============================================================================

describe('detectTailwindZIndex', () => {
  it('should detect standard z-index classes', () => {
    const content = `<div className="z-0 z-10 z-20 z-30 z-40 z-50">`;
    const results = detectTailwindZIndex(content, 'Modal.tsx');

    expect(results.length).toBeGreaterThanOrEqual(6);
    expect(results.some(r => r.matchedText === 'z-0')).toBe(true);
    expect(results.some(r => r.matchedText === 'z-10')).toBe(true);
    expect(results.some(r => r.matchedText === 'z-50')).toBe(true);
  });

  it('should detect z-auto class', () => {
    const content = `<div className="z-auto">`;
    const results = detectTailwindZIndex(content, 'Modal.tsx');

    expect(results).toHaveLength(1);
    expect(results[0]?.matchedText).toBe('z-auto');
    expect(results[0]?.zIndexValue).toBe('auto');
  });

  it('should not detect arbitrary z-index values', () => {
    const content = `<div className="z-[100]">`;
    const results = detectTailwindZIndex(content, 'Modal.tsx');

    // Standard pattern should not match arbitrary values
    expect(results.filter(r => r.matchedText === 'z-[100]')).toHaveLength(0);
  });

  it('should include line and column information', () => {
    const content = `<div className="z-10">`;
    const results = detectTailwindZIndex(content, 'Modal.tsx');

    expect(results).toHaveLength(1);
    expect(results[0]?.line).toBe(1);
    expect(results[0]?.column).toBeGreaterThan(0);
  });

  it('should not detect z-index in comments', () => {
    const content = `
      // z-10
      /* z-20 */
    `;
    const results = detectTailwindZIndex(content, 'Modal.tsx');

    expect(results).toHaveLength(0);
  });
});

// ============================================================================
// Tailwind Arbitrary Z-Index Detection Tests
// ============================================================================

describe('detectTailwindArbitraryZIndex', () => {
  it('should detect arbitrary z-index values', () => {
    const content = `<div className="z-[100] z-[9999]">`;
    const results = detectTailwindArbitraryZIndex(content, 'Modal.tsx');

    expect(results).toHaveLength(2);
    expect(results.some(r => r.value === 'z-[100]')).toBe(true);
    expect(results.some(r => r.value === 'z-[9999]')).toBe(true);
  });

  it('should detect negative arbitrary z-index values', () => {
    const content = `<div className="z-[-1] z-[-10]">`;
    const results = detectTailwindArbitraryZIndex(content, 'Modal.tsx');

    expect(results).toHaveLength(2);
    expect(results.some(r => r.numericValue === -1)).toBe(true);
    expect(results.some(r => r.numericValue === -10)).toBe(true);
  });

  it('should classify magic numbers correctly', () => {
    const content = `<div className="z-[9999]">`;
    const results = detectTailwindArbitraryZIndex(content, 'Modal.tsx');

    expect(results).toHaveLength(1);
    expect(results[0]?.type).toBe('magic-number');
  });

  it('should classify regular arbitrary values correctly', () => {
    const content = `<div className="z-[100]">`;
    const results = detectTailwindArbitraryZIndex(content, 'Modal.tsx');

    expect(results).toHaveLength(1);
    expect(results[0]?.type).toBe('tailwind-arbitrary');
  });

  it('should classify negative arbitrary values correctly', () => {
    const content = `<div className="z-[-5]">`;
    const results = detectTailwindArbitraryZIndex(content, 'Modal.tsx');

    expect(results).toHaveLength(1);
    expect(results[0]?.type).toBe('negative-arbitrary');
  });

  it('should provide suggested values', () => {
    const content = `<div className="z-[15]">`;
    const results = detectTailwindArbitraryZIndex(content, 'Modal.tsx');

    expect(results).toHaveLength(1);
    expect(results[0]?.suggestedValue).toBeDefined();
  });
});

// ============================================================================
// CSS Z-Index Property Detection Tests
// ============================================================================

describe('detectCSSZIndexProperties', () => {
  it('should detect var() usage for z-index', () => {
    const content = `z-index: var(--z-index-modal);`;
    const results = detectCSSZIndexProperties(content, 'styles.css');

    expect(results).toHaveLength(1);
    expect(results[0]?.type).toBe('css-z-index-property');
    expect(results[0]?.zIndexValue).toBe('modal');
  });

  it('should detect var() with fallback', () => {
    const content = `z-index: var(--z-index-dropdown, 10);`;
    const results = detectCSSZIndexProperties(content, 'styles.css');

    expect(results).toHaveLength(1);
    expect(results[0]?.zIndexValue).toBe('dropdown');
  });

  it('should detect multiple CSS z-index properties', () => {
    const content = `
      z-index: var(--z-index-modal);
      z-index: var(--zindex-dropdown);
      z-index: var(--z-tooltip);
    `;
    const results = detectCSSZIndexProperties(content, 'styles.css');

    expect(results).toHaveLength(3);
  });

  it('should handle CSS z-index properties in JS/TS', () => {
    const content = `
      const styles = {
        zIndex: 'var(--z-index-modal)',
      };
    `;
    const results = detectCSSZIndexProperties(content, 'Modal.tsx');

    expect(results).toHaveLength(1);
  });
});

// ============================================================================
// Theme Z-Index Detection Tests
// ============================================================================

describe('detectThemeZIndex', () => {
  it('should detect theme.zIndex usage', () => {
    const content = `zIndex: theme.zIndex.modal;`;
    const results = detectThemeZIndex(content, 'Modal.tsx');

    expect(results).toHaveLength(1);
    expect(results[0]?.type).toBe('theme-z-index');
  });

  it('should detect theme.z usage', () => {
    const content = `zIndex: theme.z.dropdown;`;
    const results = detectThemeZIndex(content, 'Modal.tsx');

    expect(results).toHaveLength(1);
  });

  it('should detect theme z-index in template literals', () => {
    const content = 'const Modal = styled.div`z-index: ${theme.zIndex.modal};`;';
    const results = detectThemeZIndex(content, 'Modal.tsx');

    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.some(r => r.matchedText.includes('theme.zIndex.modal'))).toBe(true);
  });

  it('should detect props.theme.zIndex usage', () => {
    const content = `zIndex: props.theme.zIndex.modal;`;
    const results = detectThemeZIndex(content, 'Modal.tsx');

    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.some(r => r.matchedText.includes('theme.zIndex.modal'))).toBe(true);
  });

  it('should detect multiple theme z-index usages', () => {
    const content = `
      zIndex: theme.zIndex.modal;
      zIndex: theme.z.dropdown;
      zIndex: theme.zIndex.tooltip;
    `;
    const results = detectThemeZIndex(content, 'Modal.tsx');

    expect(results).toHaveLength(3);
  });
});


// ============================================================================
// CSS Z-Index Value Detection Tests
// ============================================================================

describe('detectCSSZIndexValues', () => {
  it('should detect z-index values on scale as patterns', () => {
    const content = `z-index: 10;`;
    const results = detectCSSZIndexValues(content, 'Modal.tsx');

    expect(results.patterns).toHaveLength(1);
    expect(results.patterns[0]?.type).toBe('css-z-index-value');
    expect(results.arbitrary).toHaveLength(0);
  });

  it('should detect arbitrary z-index values as violations', () => {
    const content = `z-index: 15;`;
    const results = detectCSSZIndexValues(content, 'Modal.tsx');

    expect(results.patterns).toHaveLength(0);
    expect(results.arbitrary).toHaveLength(1);
    expect(results.arbitrary[0]?.type).toBe('arbitrary-value');
  });

  it('should detect magic number z-index values', () => {
    const content = `z-index: 9999;`;
    const results = detectCSSZIndexValues(content, 'Modal.tsx');

    expect(results.arbitrary).toHaveLength(1);
    expect(results.arbitrary[0]?.type).toBe('magic-number');
  });

  it('should detect negative arbitrary z-index values', () => {
    const content = `z-index: -5;`;
    const results = detectCSSZIndexValues(content, 'Modal.tsx');

    expect(results.arbitrary).toHaveLength(1);
    expect(results.arbitrary[0]?.type).toBe('negative-arbitrary');
  });

  it('should handle camelCase zIndex property', () => {
    const content = `zIndex: 9999;`;
    const results = detectCSSZIndexValues(content, 'Modal.tsx');

    expect(results.arbitrary).toHaveLength(1);
    expect(results.arbitrary[0]?.type).toBe('magic-number');
  });

  it('should not flag CSS custom property definitions', () => {
    const content = `--z-index-modal: 9999;`;
    const results = detectCSSZIndexValues(content, 'tokens.css');

    expect(results.arbitrary).toHaveLength(0);
  });

  it('should not flag values in comments', () => {
    const content = `
      // z-index: 9999;
      /* zIndex: 9999; */
    `;
    const results = detectCSSZIndexValues(content, 'Modal.tsx');

    expect(results.arbitrary).toHaveLength(0);
  });

  it('should provide suggested values for arbitrary values', () => {
    const content = `z-index: 15;`;
    const results = detectCSSZIndexValues(content, 'Modal.tsx');

    expect(results.arbitrary).toHaveLength(1);
    expect(results.arbitrary[0]?.suggestedValue).toBeDefined();
  });
});

// ============================================================================
// Analysis Function Tests
// ============================================================================

describe('analyzeZIndexScale', () => {
  it('should analyze file with Tailwind z-index', () => {
    const content = `
      <div className="z-10 z-20 z-50">
        Content
      </div>
    `;
    const analysis = analyzeZIndexScale(content, 'Modal.tsx');

    expect(analysis.usesTailwindZIndex).toBe(true);
    expect(analysis.zIndexPatterns.length).toBeGreaterThan(0);
  });

  it('should analyze file with CSS z-index properties', () => {
    const content = `
      .modal {
        z-index: var(--z-index-modal);
      }
    `;
    const analysis = analyzeZIndexScale(content, 'styles.css');

    expect(analysis.usesCSSZIndexProperties).toBe(true);
    expect(analysis.zIndexPatterns.length).toBe(1);
  });

  it('should analyze file with theme z-index', () => {
    const content = `
      const Modal = styled.div\`
        z-index: \${theme.zIndex.modal};
      \`;
    `;
    const analysis = analyzeZIndexScale(content, 'Modal.tsx');

    expect(analysis.usesThemeZIndex).toBe(true);
  });

  it('should detect arbitrary values', () => {
    const content = `
      const Modal = styled.div\`
        z-index: 9999;
      \`;
    `;
    const analysis = analyzeZIndexScale(content, 'Modal.tsx');

    expect(analysis.arbitraryValues.length).toBeGreaterThan(0);
  });

  it('should skip arbitrary detection for excluded files', () => {
    const content = `
      const zIndex = {
        modal: 9999,
        dropdown: 100,
      };
    `;
    const analysis = analyzeZIndexScale(content, 'design-tokens/z-index.ts');

    expect(analysis.arbitraryValues).toHaveLength(0);
  });

  it('should calculate confidence based on scale adherence', () => {
    // File with only scale values
    const scaleContent = `
      <div className="z-10 z-20 z-50">
        Content
      </div>
    `;
    const scaleAnalysis = analyzeZIndexScale(scaleContent, 'Modal.tsx');
    expect(scaleAnalysis.scaleAdherenceConfidence).toBeGreaterThan(0.5);

    // File with only arbitrary values
    const arbitraryContent = `
      z-index: 9999;
      zIndex: 999999;
    `;
    const arbitraryAnalysis = analyzeZIndexScale(arbitraryContent, 'Modal.tsx');
    expect(arbitraryAnalysis.scaleAdherenceConfidence).toBeLessThan(0.5);
  });
});


// ============================================================================
// Detector Class Tests
// ============================================================================

describe('ZIndexScaleDetector', () => {
  let detector: ZIndexScaleDetector;

  beforeEach(() => {
    detector = createZIndexScaleDetector();
  });

  describe('metadata', () => {
    it('should have correct id', () => {
      expect(detector.id).toBe('styling/z-index-scale');
    });

    it('should have correct category', () => {
      expect(detector.category).toBe('styling');
    });

    it('should have correct subcategory', () => {
      expect(detector.subcategory).toBe('z-index-scale');
    });

    it('should support typescript, javascript, and css', () => {
      expect(detector.supportedLanguages).toContain('typescript');
      expect(detector.supportedLanguages).toContain('javascript');
      expect(detector.supportedLanguages).toContain('css');
    });

    it('should use regex detection method', () => {
      expect(detector.detectionMethod).toBe('regex');
    });
  });

  describe('detect', () => {
    it('should handle empty file', async () => {
      const context = createMockContext('empty.tsx', '');
      const result = await detector.detect(context);

      expect(result.patterns).toHaveLength(0);
      expect(result.violations).toHaveLength(0);
    });

    it('should detect Tailwind z-index patterns', async () => {
      const content = `
        <div className="z-10 z-20 z-50">
          Content
        </div>
      `;
      const context = createMockContext('Modal.tsx', content);
      const result = await detector.detect(context);

      expect(result.patterns.length).toBeGreaterThan(0);
      expect(result.patterns.some(p => p.patternId.includes('tailwind'))).toBe(true);
    });

    it('should detect CSS z-index property patterns', async () => {
      const content = `
        .modal {
          z-index: var(--z-index-modal);
        }
      `;
      const context = createMockContext('styles.css', content);
      const result = await detector.detect(context);

      expect(result.patterns.length).toBeGreaterThan(0);
      expect(result.patterns.some(p => p.patternId.includes('css-property'))).toBe(true);
    });

    it('should detect theme z-index patterns', async () => {
      const content = `
        const Modal = styled.div\`
          z-index: \${theme.zIndex.modal};
        \`;
      `;
      const context = createMockContext('Modal.tsx', content);
      const result = await detector.detect(context);

      expect(result.patterns.length).toBeGreaterThan(0);
      expect(result.patterns.some(p => p.patternId.includes('theme'))).toBe(true);
    });

    it('should create violations for magic number z-index values', async () => {
      const content = `
        const Modal = styled.div\`
          z-index: 9999;
        \`;
      `;
      const context = createMockContext('Modal.tsx', content);
      const result = await detector.detect(context);

      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.violations.some(v => v.message.toLowerCase().includes('magic number'))).toBe(true);
      expect(result.violations.some(v => v.severity === 'error')).toBe(true);
    });

    it('should create violations for arbitrary z-index values', async () => {
      const content = `
        const Modal = styled.div\`
          z-index: 15;
        \`;
      `;
      const context = createMockContext('Modal.tsx', content);
      const result = await detector.detect(context);

      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.violations.some(v => v.message.includes('z-index'))).toBe(true);
    });

    it('should create violations for Tailwind arbitrary z-index values', async () => {
      const content = `
        <div className="z-[100] z-[9999]">
          Content
        </div>
      `;
      const context = createMockContext('Modal.tsx', content);
      const result = await detector.detect(context);

      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.violations.some(v => v.message.includes('Tailwind arbitrary'))).toBe(true);
    });

    it('should not create violations for test files', async () => {
      const content = `
        const mockStyles = {
          zIndex: 9999,
        };
      `;
      const context = createMockContext('Modal.test.tsx', content);
      const result = await detector.detect(context);

      expect(result.violations).toHaveLength(0);
    });

    it('should include quick fix in violations', async () => {
      const content = `z-index: 15;`;
      const context = createMockContext('Modal.tsx', content);
      const result = await detector.detect(context);

      expect(result.violations.length).toBeGreaterThan(0);
      const violation = result.violations[0];
      expect(violation?.quickFix).toBeDefined();
      expect(violation?.quickFix?.title).toContain('scale value');
    });

    it('should set error severity for magic numbers', async () => {
      const content = `z-index: 9999;`;
      const context = createMockContext('Modal.tsx', content);
      const result = await detector.detect(context);

      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.violations[0]?.severity).toBe('error');
    });

    it('should set warning severity for regular arbitrary values', async () => {
      const content = `z-index: 15;`;
      const context = createMockContext('Modal.tsx', content);
      const result = await detector.detect(context);

      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.violations[0]?.severity).toBe('warning');
    });
  });

  describe('generateQuickFix', () => {
    it('should generate quick fix for arbitrary z-index violation', () => {
      const violation = {
        id: 'test-violation',
        patternId: 'styling/z-index-scale',
        severity: 'warning' as const,
        file: 'Modal.tsx',
        range: { start: { line: 1, character: 9 }, end: { line: 1, character: 13 } },
        message: "Arbitrary z-index value 'z-index: 15' doesn't follow the z-index scale",
        expected: 'A z-index scale value',
        actual: 'z-index: 15',
        aiExplainAvailable: true,
        aiFixAvailable: true,
        firstSeen: new Date(),
        occurrences: 1,
      };

      const fix = detector.generateQuickFix(violation);

      expect(fix).not.toBeNull();
      expect(fix?.title).toContain('scale value');
      expect(fix?.kind).toBe('quickfix');
    });

    it('should generate quick fix for Tailwind arbitrary z-index violation', () => {
      const violation = {
        id: 'test-violation',
        patternId: 'styling/z-index-scale',
        severity: 'warning' as const,
        file: 'Modal.tsx',
        range: { start: { line: 1, character: 16 }, end: { line: 1, character: 23 } },
        message: "Tailwind arbitrary z-index 'z-[100]' doesn't follow the z-index scale",
        expected: 'A z-index scale value',
        actual: 'z-[100]',
        aiExplainAvailable: true,
        aiFixAvailable: true,
        firstSeen: new Date(),
        occurrences: 1,
      };

      const fix = detector.generateQuickFix(violation);

      expect(fix).not.toBeNull();
      expect(fix?.title).toContain('scale value');
    });

    it('should return null for non-z-index violations', () => {
      const violation = {
        id: 'test-violation',
        patternId: 'styling/spacing-scale',
        severity: 'warning' as const,
        file: 'Button.tsx',
        range: { start: { line: 1, character: 9 }, end: { line: 1, character: 13 } },
        message: "Arbitrary spacing '13px' doesn't follow the spacing scale",
        expected: 'A spacing scale value',
        actual: '13px',
        aiExplainAvailable: true,
        aiFixAvailable: true,
        firstSeen: new Date(),
        occurrences: 1,
      };

      const fix = detector.generateQuickFix(violation);

      expect(fix).toBeNull();
    });
  });
});
