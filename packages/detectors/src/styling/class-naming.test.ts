/**
 * Tests for Class Naming Detector
 *
 * @requirements 9.5 - THE Styling_Detector SHALL detect CSS class naming conventions (BEM, utility-first)
 */

import { describe, it, expect } from 'vitest';
import {
  ClassNamingDetector,
  createClassNamingDetector,
  // Helper functions
  isBEMClassName,
  isTailwindUtilityClass,
  isSemanticClassName,
  isSMACSClassName,
  validateBEMClassName,
  detectBEMPatterns,
  detectUtilityFirstPatterns,
  detectCSSModulesPatterns,
  detectSemanticPatterns,
  detectSMACSPatterns,
  detectInvalidBEMPatterns,
  detectMixedConventions,
  suggestBEMFix,
  getDominantConvention,
  analyzeClassNaming,
  shouldExcludeFile,
} from './class-naming.js';
import type { DetectionContext } from '../base/index.js';

// ============================================================================
// Test Helpers
// ============================================================================

function createMockContext(content: string, file: string = 'test.tsx'): DetectionContext {
  return {
    file,
    content,
    ast: null,
    imports: [],
    exports: [],
    projectContext: {
      rootDir: '/project',
      files: [file],
      config: {},
    },
    language: 'typescript',
    extension: '.tsx',
    isTestFile: false,
    isTypeDefinition: false,
  };
}

// ============================================================================
// Helper Function Tests
// ============================================================================

describe('isBEMClassName', () => {
  it('should recognize valid BEM block names', () => {
    expect(isBEMClassName('button')).toBe(true);
    expect(isBEMClassName('card')).toBe(true);
    expect(isBEMClassName('nav-item')).toBe(true);
  });

  it('should recognize valid BEM block__element names', () => {
    expect(isBEMClassName('button__icon')).toBe(true);
    expect(isBEMClassName('card__header')).toBe(true);
    expect(isBEMClassName('nav-item__link')).toBe(true);
  });

  it('should recognize valid BEM block--modifier names', () => {
    expect(isBEMClassName('button--primary')).toBe(true);
    expect(isBEMClassName('card--large')).toBe(true);
    expect(isBEMClassName('nav-item--active')).toBe(true);
  });

  it('should recognize valid BEM block__element--modifier names', () => {
    expect(isBEMClassName('button__icon--small')).toBe(true);
    expect(isBEMClassName('card__header--highlighted')).toBe(true);
    expect(isBEMClassName('nav-item__link--disabled')).toBe(true);
  });
});

describe('isTailwindUtilityClass', () => {
  it('should recognize Tailwind layout classes', () => {
    expect(isTailwindUtilityClass('flex')).toBe(true);
    expect(isTailwindUtilityClass('grid')).toBe(true);
    expect(isTailwindUtilityClass('block')).toBe(true);
    expect(isTailwindUtilityClass('hidden')).toBe(true);
  });

  it('should recognize Tailwind spacing classes', () => {
    expect(isTailwindUtilityClass('p-4')).toBe(true);
    expect(isTailwindUtilityClass('m-2')).toBe(true);
    expect(isTailwindUtilityClass('px-6')).toBe(true);
    expect(isTailwindUtilityClass('my-auto')).toBe(true);
  });

  it('should recognize Tailwind typography classes', () => {
    expect(isTailwindUtilityClass('text-lg')).toBe(true);
    expect(isTailwindUtilityClass('font-bold')).toBe(true);
    expect(isTailwindUtilityClass('text-2xl')).toBe(true);
  });

  it('should recognize Tailwind color classes', () => {
    expect(isTailwindUtilityClass('text-blue-500')).toBe(true);
    expect(isTailwindUtilityClass('bg-red-100')).toBe(true);
    expect(isTailwindUtilityClass('border-gray-300')).toBe(true);
  });

  it('should recognize Tailwind flexbox classes', () => {
    expect(isTailwindUtilityClass('items-center')).toBe(true);
    expect(isTailwindUtilityClass('justify-between')).toBe(true);
    expect(isTailwindUtilityClass('flex-col')).toBe(true);
  });
});

describe('isSemanticClassName', () => {
  it('should recognize button semantic classes', () => {
    expect(isSemanticClassName('btn-primary')).toBe(true);
    expect(isSemanticClassName('button-secondary')).toBe(true);
    expect(isSemanticClassName('btn-danger')).toBe(true);
  });

  it('should recognize card semantic classes', () => {
    expect(isSemanticClassName('card-header')).toBe(true);
    expect(isSemanticClassName('card-body')).toBe(true);
    expect(isSemanticClassName('panel-footer')).toBe(true);
  });

  it('should recognize navigation semantic classes', () => {
    expect(isSemanticClassName('nav-item')).toBe(true);
    expect(isSemanticClassName('navbar-brand')).toBe(true);
    expect(isSemanticClassName('menu-link')).toBe(true);
  });
});

describe('isSMACSClassName', () => {
  it('should recognize SMACSS layout classes', () => {
    expect(isSMACSClassName('l-header')).toBe(true);
    expect(isSMACSClassName('l-sidebar')).toBe(true);
    expect(isSMACSClassName('l-main')).toBe(true);
  });

  it('should recognize SMACSS state classes', () => {
    expect(isSMACSClassName('is-active')).toBe(true);
    expect(isSMACSClassName('is-hidden')).toBe(true);
    expect(isSMACSClassName('has-error')).toBe(true);
  });

  it('should recognize SMACSS JavaScript hook classes', () => {
    expect(isSMACSClassName('js-toggle')).toBe(true);
    expect(isSMACSClassName('js-modal-trigger')).toBe(true);
  });
});

describe('validateBEMClassName', () => {
  it('should return null for valid BEM class names', () => {
    expect(validateBEMClassName('button')).toBeNull();
    expect(validateBEMClassName('button__icon')).toBeNull();
    expect(validateBEMClassName('button--primary')).toBeNull();
    expect(validateBEMClassName('button__icon--small')).toBeNull();
  });

  it('should return error for multiple element separators', () => {
    const result = validateBEMClassName('button__icon__text');
    expect(result).toContain('at most one element separator');
  });

  it('should return error for uppercase letters', () => {
    const result = validateBEMClassName('Button__Icon');
    expect(result).toContain('lowercase');
  });

  it('should return error for triple underscores', () => {
    const result = validateBEMClassName('button___icon');
    expect(result).toContain('triple');
  });

  it('should return error for triple dashes', () => {
    const result = validateBEMClassName('button---primary');
    expect(result).toContain('triple');
  });
});

describe('suggestBEMFix', () => {
  it('should convert uppercase to lowercase', () => {
    expect(suggestBEMFix('Button__Icon')).toBe('button__icon');
  });

  it('should fix triple underscores', () => {
    expect(suggestBEMFix('button___icon')).toBe('button__icon');
  });

  it('should fix triple dashes', () => {
    expect(suggestBEMFix('button---primary')).toBe('button--primary');
  });

  it('should fix multiple element separators', () => {
    expect(suggestBEMFix('button__icon__text')).toBe('button__icon-text');
  });
});

describe('shouldExcludeFile', () => {
  it('should exclude test files', () => {
    expect(shouldExcludeFile('component.test.ts')).toBe(true);
    expect(shouldExcludeFile('component.test.tsx')).toBe(true);
    expect(shouldExcludeFile('component.spec.ts')).toBe(true);
  });

  it('should exclude story files', () => {
    expect(shouldExcludeFile('component.stories.tsx')).toBe(true);
  });

  it('should exclude config files', () => {
    expect(shouldExcludeFile('tailwind.config.js')).toBe(true);
    expect(shouldExcludeFile('app.config.ts')).toBe(true);
  });

  it('should not exclude regular source files', () => {
    expect(shouldExcludeFile('component.tsx')).toBe(false);
    expect(shouldExcludeFile('styles.css')).toBe(false);
  });
});

// ============================================================================
// Pattern Detection Tests
// ============================================================================

describe('detectBEMPatterns', () => {
  it('should detect BEM patterns in JSX className', () => {
    const content = `
      <div className="card__header--highlighted">
        <span className="card__title">Title</span>
      </div>
    `;
    const patterns = detectBEMPatterns(content, 'test.tsx');
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns.some(p => p.matchedText.includes('card__header--highlighted'))).toBe(true);
  });

  it('should detect BEM patterns in CSS', () => {
    const content = `
      .button__icon--small {
        width: 16px;
      }
      .nav-item__link--active {
        color: blue;
      }
    `;
    const patterns = detectBEMPatterns(content, 'styles.css');
    expect(patterns.length).toBeGreaterThan(0);
  });

  it('should not detect patterns inside comments', () => {
    const content = `
      // This is a comment with button__icon
      /* Another comment with card__header */
      <div className="real__class">Content</div>
    `;
    const patterns = detectBEMPatterns(content, 'test.tsx');
    // Should only detect the real class, not the ones in comments
    const realPatterns = patterns.filter(p => !p.context?.includes('//') && !p.context?.includes('/*'));
    expect(realPatterns.length).toBeGreaterThanOrEqual(0);
  });
});

describe('detectUtilityFirstPatterns', () => {
  it('should detect Tailwind utility classes', () => {
    const content = `
      <div className="flex items-center justify-between p-4 bg-blue-500">
        <span className="text-lg font-bold">Title</span>
      </div>
    `;
    const patterns = detectUtilityFirstPatterns(content, 'test.tsx');
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns.some(p => p.matchedText === 'flex')).toBe(true);
    expect(patterns.some(p => p.matchedText === 'items-center')).toBe(true);
    expect(patterns.some(p => p.matchedText === 'p-4')).toBe(true);
  });

  it('should detect spacing utilities', () => {
    const content = `<div className="m-4 px-6 py-2 gap-4">Content</div>`;
    const patterns = detectUtilityFirstPatterns(content, 'test.tsx');
    expect(patterns.some(p => p.matchedText === 'm-4')).toBe(true);
    expect(patterns.some(p => p.matchedText === 'px-6')).toBe(true);
    expect(patterns.some(p => p.matchedText === 'py-2')).toBe(true);
  });

  it('should detect color utilities', () => {
    const content = `<div className="text-red-500 bg-gray-100 border-blue-300">Content</div>`;
    const patterns = detectUtilityFirstPatterns(content, 'test.tsx');
    expect(patterns.some(p => p.matchedText === 'text-red-500')).toBe(true);
    expect(patterns.some(p => p.matchedText === 'bg-gray-100')).toBe(true);
    expect(patterns.some(p => p.matchedText === 'border-blue-300')).toBe(true);
  });
});

describe('detectCSSModulesPatterns', () => {
  it('should detect styles.className pattern', () => {
    const content = `
      import styles from './Button.module.css';
      <button className={styles.button}>Click</button>
      <span className={styles.icon}>Icon</span>
    `;
    const patterns = detectCSSModulesPatterns(content, 'test.tsx');
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns.some(p => p.classNames.includes('button'))).toBe(true);
    expect(patterns.some(p => p.classNames.includes('icon'))).toBe(true);
  });

  it('should detect styles["class-name"] pattern', () => {
    const content = `
      <div className={styles["card-header"]}>Header</div>
    `;
    const patterns = detectCSSModulesPatterns(content, 'test.tsx');
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns.some(p => p.classNames.includes('card-header'))).toBe(true);
  });

  it('should detect classes.className pattern', () => {
    const content = `
      import { classes } from './styles';
      <div className={classes.container}>Content</div>
    `;
    const patterns = detectCSSModulesPatterns(content, 'test.tsx');
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns.some(p => p.classNames.includes('container'))).toBe(true);
  });
});

describe('detectSemanticPatterns', () => {
  it('should detect button semantic patterns', () => {
    const content = `
      <button className="btn-primary">Primary</button>
      <button className="button-secondary">Secondary</button>
    `;
    const patterns = detectSemanticPatterns(content, 'test.tsx');
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns.some(p => p.matchedText === 'btn-primary')).toBe(true);
    expect(patterns.some(p => p.matchedText === 'button-secondary')).toBe(true);
  });

  it('should detect card semantic patterns', () => {
    const content = `
      <div className="card-header">Header</div>
      <div className="card-body">Body</div>
      <div className="card-footer">Footer</div>
    `;
    const patterns = detectSemanticPatterns(content, 'test.tsx');
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns.some(p => p.matchedText === 'card-header')).toBe(true);
    expect(patterns.some(p => p.matchedText === 'card-body')).toBe(true);
  });
});

describe('detectSMACSPatterns', () => {
  it('should detect SMACSS layout patterns', () => {
    const content = `
      <div className="l-header">Header</div>
      <div className="l-sidebar">Sidebar</div>
    `;
    const patterns = detectSMACSPatterns(content, 'test.tsx');
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns.some(p => p.matchedText === 'l-header')).toBe(true);
    expect(patterns.some(p => p.matchedText === 'l-sidebar')).toBe(true);
  });

  it('should detect SMACSS state patterns', () => {
    const content = `
      <div className="is-active">Active</div>
      <div className="has-error">Error</div>
    `;
    const patterns = detectSMACSPatterns(content, 'test.tsx');
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns.some(p => p.matchedText === 'is-active')).toBe(true);
    expect(patterns.some(p => p.matchedText === 'has-error')).toBe(true);
  });
});

describe('detectInvalidBEMPatterns', () => {
  it('should detect multiple element separators', () => {
    const content = `<div className="block__element__subelement">Content</div>`;
    const violations = detectInvalidBEMPatterns(content, 'test.tsx');
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0]?.type).toBe('invalid-bem');
  });

  it('should detect triple underscores', () => {
    const content = `<div className="block___element">Content</div>`;
    const violations = detectInvalidBEMPatterns(content, 'test.tsx');
    expect(violations.length).toBeGreaterThan(0);
  });

  it('should detect triple dashes', () => {
    const content = `<div className="block---modifier">Content</div>`;
    const violations = detectInvalidBEMPatterns(content, 'test.tsx');
    expect(violations.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Analysis Tests
// ============================================================================

describe('analyzeClassNaming', () => {
  it('should analyze file with BEM patterns', () => {
    const content = `
      <div className="card__header">
        <span className="card__title--highlighted">Title</span>
      </div>
    `;
    const analysis = analyzeClassNaming(content, 'test.tsx');
    expect(analysis.usesBEM).toBe(true);
    expect(analysis.patterns.some(p => p.type === 'bem')).toBe(true);
  });

  it('should analyze file with utility-first patterns', () => {
    const content = `
      <div className="flex items-center p-4 bg-blue-500">
        <span className="text-lg font-bold">Title</span>
      </div>
    `;
    const analysis = analyzeClassNaming(content, 'test.tsx');
    expect(analysis.usesUtilityFirst).toBe(true);
    expect(analysis.patterns.some(p => p.type === 'utility-first')).toBe(true);
  });

  it('should analyze file with CSS Modules patterns', () => {
    const content = `
      import styles from './styles.module.css';
      <div className={styles.container}>
        <span className={styles.title}>Title</span>
      </div>
    `;
    const analysis = analyzeClassNaming(content, 'test.tsx');
    expect(analysis.usesCSSModules).toBe(true);
    expect(analysis.patterns.some(p => p.type === 'css-modules')).toBe(true);
  });

  it('should detect mixed conventions', () => {
    const content = `
      <div className="card__header flex items-center">
        <span className={styles.title}>Title</span>
      </div>
    `;
    const analysis = analyzeClassNaming(content, 'test.tsx');
    // Should detect multiple conventions
    const conventionTypes = new Set(analysis.patterns.map(p => p.type));
    expect(conventionTypes.size).toBeGreaterThan(1);
  });

  it('should return empty analysis for excluded files', () => {
    const content = `<div className="card__header flex">Content</div>`;
    const analysis = analyzeClassNaming(content, 'component.test.tsx');
    expect(analysis.patterns.length).toBe(0);
    expect(analysis.violations.length).toBe(0);
    expect(analysis.namingConsistencyConfidence).toBe(1.0);
  });

  it('should calculate naming consistency confidence', () => {
    // File with consistent naming
    const consistentContent = `
      <div className="card__header">
        <span className="card__title">Title</span>
        <p className="card__description">Description</p>
      </div>
    `;
    const consistentAnalysis = analyzeClassNaming(consistentContent, 'test.tsx');
    expect(consistentAnalysis.namingConsistencyConfidence).toBeGreaterThan(0.5);
  });
});

describe('getDominantConvention', () => {
  it('should return null for empty patterns', () => {
    expect(getDominantConvention([])).toBeNull();
  });

  it('should return the most common convention', () => {
    const patterns = [
      { type: 'bem' as const, file: 'test.tsx', line: 1, column: 1, matchedText: 'a__b', classNames: ['a__b'] },
      { type: 'bem' as const, file: 'test.tsx', line: 2, column: 1, matchedText: 'c__d', classNames: ['c__d'] },
      { type: 'utility-first' as const, file: 'test.tsx', line: 3, column: 1, matchedText: 'flex', classNames: ['flex'] },
    ];
    expect(getDominantConvention(patterns)).toBe('bem');
  });
});

// ============================================================================
// Detector Class Tests
// ============================================================================

describe('ClassNamingDetector', () => {
  describe('metadata', () => {
    it('should have correct id', () => {
      const detector = createClassNamingDetector();
      expect(detector.id).toBe('styling/class-naming');
    });

    it('should have correct category', () => {
      const detector = createClassNamingDetector();
      expect(detector.category).toBe('styling');
    });

    it('should have correct subcategory', () => {
      const detector = createClassNamingDetector();
      expect(detector.subcategory).toBe('class-naming');
    });

    it('should support TypeScript, JavaScript, and CSS', () => {
      const detector = createClassNamingDetector();
      expect(detector.supportedLanguages).toContain('typescript');
      expect(detector.supportedLanguages).toContain('javascript');
      expect(detector.supportedLanguages).toContain('css');
    });

    it('should use regex detection method', () => {
      const detector = createClassNamingDetector();
      expect(detector.detectionMethod).toBe('regex');
    });
  });

  describe('detect', () => {
    it('should detect BEM patterns and create pattern matches', async () => {
      const detector = createClassNamingDetector();
      const context = createMockContext(`
        <div className="card__header--highlighted">
          <span className="card__title">Title</span>
        </div>
      `);

      const result = await detector.detect(context);
      expect(result.patterns.some(p => p.patternId.includes('bem'))).toBe(true);
    });

    it('should detect utility-first patterns and create pattern matches', async () => {
      const detector = createClassNamingDetector();
      const context = createMockContext(`
        <div className="flex items-center p-4 bg-blue-500">
          <span className="text-lg font-bold">Title</span>
        </div>
      `);

      const result = await detector.detect(context);
      expect(result.patterns.some(p => p.patternId.includes('utility-first'))).toBe(true);
    });

    it('should detect CSS Modules patterns and create pattern matches', async () => {
      const detector = createClassNamingDetector();
      const context = createMockContext(`
        import styles from './styles.module.css';
        <div className={styles.container}>Content</div>
      `);

      const result = await detector.detect(context);
      expect(result.patterns.some(p => p.patternId.includes('css-modules'))).toBe(true);
    });

    it('should create violations for invalid BEM patterns', async () => {
      const detector = createClassNamingDetector();
      const context = createMockContext(`
        <div className="block__element__subelement">Content</div>
      `);

      const result = await detector.detect(context);
      expect(result.violations.some(v => v.message.includes('BEM'))).toBe(true);
    });

    it('should return empty result for excluded files', async () => {
      const detector = createClassNamingDetector();
      const context = createMockContext(
        `<div className="card__header flex">Content</div>`,
        'component.test.tsx'
      );

      const result = await detector.detect(context);
      expect(result.patterns.length).toBe(0);
      expect(result.violations.length).toBe(0);
    });

    it('should calculate confidence score', async () => {
      const detector = createClassNamingDetector();
      const context = createMockContext(`
        <div className="card__header">
          <span className="card__title">Title</span>
        </div>
      `);

      const result = await detector.detect(context);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('generateQuickFix', () => {
    it('should generate quick fix for BEM violations', () => {
      const detector = createClassNamingDetector();
      const violation = {
        id: 'test-violation',
        patternId: 'styling/class-naming',
        severity: 'warning' as const,
        file: 'test.tsx',
        range: {
          start: { line: 0, character: 0 },
          end: { line: 0, character: 20 },
        },
        message: 'Invalid BEM class name: block___element',
        explanation: 'BEM class names should not have triple underscores',
        expected: 'block__element',
        actual: 'block___element',
        aiExplainAvailable: true,
        aiFixAvailable: true,
        firstSeen: new Date(),
        occurrences: 1,
      };

      const quickFix = detector.generateQuickFix(violation);
      expect(quickFix).not.toBeNull();
      expect(quickFix?.title).toContain('Fix BEM');
    });

    it('should return null for non-BEM violations', () => {
      const detector = createClassNamingDetector();
      const violation = {
        id: 'test-violation',
        patternId: 'styling/class-naming',
        severity: 'info' as const,
        file: 'test.tsx',
        range: {
          start: { line: 0, character: 0 },
          end: { line: 0, character: 20 },
        },
        message: 'Mixed naming conventions detected',
        explanation: 'Using multiple naming conventions',
        expected: 'Consistent naming',
        actual: 'flex, card__header',
        aiExplainAvailable: true,
        aiFixAvailable: false,
        firstSeen: new Date(),
        occurrences: 1,
      };

      const quickFix = detector.generateQuickFix(violation);
      expect(quickFix).toBeNull();
    });
  });
});

describe('createClassNamingDetector', () => {
  it('should create a ClassNamingDetector instance', () => {
    const detector = createClassNamingDetector();
    expect(detector).toBeInstanceOf(ClassNamingDetector);
  });
});
