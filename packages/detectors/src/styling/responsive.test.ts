/**
 * Responsive Detector Tests
 *
 * Tests for responsive breakpoint usage pattern detection.
 *
 * @requirements 9.8 - THE Styling_Detector SHALL detect responsive breakpoint usage patterns
 */

import { describe, it, expect } from 'vitest';
import {
  ResponsiveDetector,
  createResponsiveDetector,
  // Helper functions
  shouldExcludeFile,
  isStandardBreakpoint,
  isAllowedBreakpointValue,
  getBreakpointOrderIndex,
  findNearestBreakpoint,
  suggestBreakpoint,
  convertToPixels,
  detectTailwindResponsive,
  detectCSSMediaQueriesMinWidth,
  detectCSSMediaQueriesMaxWidth,
  detectCSSContainerQueries,
  detectThemeBreakpoints,
  detectCSSBreakpointProperties,
  detectInconsistentBreakpointOrder,
  detectMixedApproach,
  detectArbitraryBreakpoints,
  analyzeResponsive,
  // Constants
  TAILWIND_BREAKPOINTS,
  TAILWIND_BREAKPOINT_ORDER,
} from './responsive.js';

// ============================================================================
// Helper Function Tests
// ============================================================================

describe('shouldExcludeFile', () => {
  it('should exclude test files', () => {
    expect(shouldExcludeFile('component.test.ts')).toBe(true);
    expect(shouldExcludeFile('component.test.tsx')).toBe(true);
    expect(shouldExcludeFile('component.spec.ts')).toBe(true);
    expect(shouldExcludeFile('component.spec.tsx')).toBe(true);
  });

  it('should exclude story files', () => {
    expect(shouldExcludeFile('Button.stories.tsx')).toBe(true);
    expect(shouldExcludeFile('Card.stories.ts')).toBe(true);
  });

  it('should exclude config files', () => {
    expect(shouldExcludeFile('tailwind.config.ts')).toBe(true);
    expect(shouldExcludeFile('tailwind.config.js')).toBe(true);
    expect(shouldExcludeFile('postcss.config.ts')).toBe(true);
    expect(shouldExcludeFile('postcss.config.js')).toBe(true);
  });

  it('should not exclude regular source files', () => {
    expect(shouldExcludeFile('component.tsx')).toBe(false);
    expect(shouldExcludeFile('styles.css')).toBe(false);
    expect(shouldExcludeFile('utils.ts')).toBe(false);
  });
});

describe('isStandardBreakpoint', () => {
  it('should return true for standard Tailwind breakpoints', () => {
    expect(isStandardBreakpoint(640)).toBe(true);
    expect(isStandardBreakpoint(768)).toBe(true);
    expect(isStandardBreakpoint(1024)).toBe(true);
    expect(isStandardBreakpoint(1280)).toBe(true);
    expect(isStandardBreakpoint(1536)).toBe(true);
  });

  it('should return false for non-standard values', () => {
    expect(isStandardBreakpoint(500)).toBe(false);
    expect(isStandardBreakpoint(900)).toBe(false);
    expect(isStandardBreakpoint(1100)).toBe(false);
  });
});

describe('isAllowedBreakpointValue', () => {
  it('should return true for standard breakpoints', () => {
    expect(isAllowedBreakpointValue(640)).toBe(true);
    expect(isAllowedBreakpointValue(768)).toBe(true);
    expect(isAllowedBreakpointValue(1024)).toBe(true);
  });

  it('should return true for common mobile sizes', () => {
    expect(isAllowedBreakpointValue(320)).toBe(true);
    expect(isAllowedBreakpointValue(375)).toBe(true);
    expect(isAllowedBreakpointValue(414)).toBe(true);
  });

  it('should return false for arbitrary values', () => {
    expect(isAllowedBreakpointValue(500)).toBe(false);
    expect(isAllowedBreakpointValue(850)).toBe(false);
    expect(isAllowedBreakpointValue(1100)).toBe(false);
  });
});


describe('getBreakpointOrderIndex', () => {
  it('should return correct index for each breakpoint', () => {
    expect(getBreakpointOrderIndex('sm')).toBe(0);
    expect(getBreakpointOrderIndex('md')).toBe(1);
    expect(getBreakpointOrderIndex('lg')).toBe(2);
    expect(getBreakpointOrderIndex('xl')).toBe(3);
    expect(getBreakpointOrderIndex('2xl')).toBe(4);
  });

  it('should return -1 for unknown breakpoints', () => {
    expect(getBreakpointOrderIndex('xs')).toBe(-1);
    expect(getBreakpointOrderIndex('3xl')).toBe(-1);
    expect(getBreakpointOrderIndex('unknown')).toBe(-1);
  });
});

describe('findNearestBreakpoint', () => {
  it('should find exact matches', () => {
    expect(findNearestBreakpoint(640)).toEqual({ name: 'sm', value: 640 });
    expect(findNearestBreakpoint(768)).toEqual({ name: 'md', value: 768 });
    expect(findNearestBreakpoint(1024)).toEqual({ name: 'lg', value: 1024 });
  });

  it('should find nearest breakpoint for arbitrary values', () => {
    expect(findNearestBreakpoint(700)).toEqual({ name: 'sm', value: 640 });
    expect(findNearestBreakpoint(800)).toEqual({ name: 'md', value: 768 });
    expect(findNearestBreakpoint(1000)).toEqual({ name: 'lg', value: 1024 });
    expect(findNearestBreakpoint(1400)).toEqual({ name: 'xl', value: 1280 });
  });
});

describe('suggestBreakpoint', () => {
  it('should suggest nearest standard breakpoint', () => {
    const suggestion = suggestBreakpoint(700);
    expect(suggestion).toContain('sm');
    expect(suggestion).toContain('640px');
    expect(suggestion).toContain('700px');
  });
});

describe('convertToPixels', () => {
  it('should return px values unchanged', () => {
    expect(convertToPixels(768, 'px')).toBe(768);
    expect(convertToPixels(1024, 'px')).toBe(1024);
  });

  it('should convert em to pixels (16px base)', () => {
    expect(convertToPixels(48, 'em')).toBe(768);
    expect(convertToPixels(64, 'em')).toBe(1024);
  });

  it('should convert rem to pixels (16px base)', () => {
    expect(convertToPixels(48, 'rem')).toBe(768);
    expect(convertToPixels(64, 'rem')).toBe(1024);
  });
});

// ============================================================================
// Detection Function Tests
// ============================================================================

describe('detectTailwindResponsive', () => {
  it('should detect Tailwind responsive prefixes', () => {
    const content = `
      <div className="sm:flex md:hidden lg:grid xl:block 2xl:inline">
        Content
      </div>
    `;
    const results = detectTailwindResponsive(content, 'test.tsx');
    
    expect(results.length).toBe(5);
    expect(results.map(r => r.breakpoint)).toEqual(['sm', 'md', 'lg', 'xl', '2xl']);
  });

  it('should detect responsive prefixes with complex classes', () => {
    const content = `
      <div className="sm:grid-cols-2 md:p-4 lg:text-lg">
        Content
      </div>
    `;
    const results = detectTailwindResponsive(content, 'test.tsx');
    
    expect(results.length).toBe(3);
    expect(results[0]?.matchedText).toBe('sm:grid-cols-2');
    expect(results[1]?.matchedText).toBe('md:p-4');
    expect(results[2]?.matchedText).toBe('lg:text-lg');
  });

  it('should include breakpoint values', () => {
    const content = `<div className="sm:flex md:hidden">Content</div>`;
    const results = detectTailwindResponsive(content, 'test.tsx');
    
    expect(results[0]?.breakpointValue).toBe(TAILWIND_BREAKPOINTS.sm);
    expect(results[1]?.breakpointValue).toBe(TAILWIND_BREAKPOINTS.md);
  });

  it('should skip patterns inside comments', () => {
    const content = `
      // sm:flex is a responsive class
      <div className="md:hidden">Content</div>
    `;
    const results = detectTailwindResponsive(content, 'test.tsx');
    
    expect(results.length).toBe(1);
    expect(results[0]?.breakpoint).toBe('md');
  });
});


describe('detectCSSMediaQueriesMinWidth', () => {
  it('should detect min-width media queries', () => {
    const content = `
      @media (min-width: 768px) {
        .container { width: 100%; }
      }
      @media (min-width: 1024px) {
        .container { width: 960px; }
      }
    `;
    const results = detectCSSMediaQueriesMinWidth(content, 'styles.css');
    
    expect(results.length).toBe(2);
    expect(results[0]?.type).toBe('mobile-first');
    expect(results[0]?.breakpointValue).toBe(768);
    expect(results[1]?.breakpointValue).toBe(1024);
  });

  it('should detect media queries with screen keyword', () => {
    const content = `
      @media screen and (min-width: 640px) {
        .container { display: flex; }
      }
    `;
    const results = detectCSSMediaQueriesMinWidth(content, 'styles.css');
    
    expect(results.length).toBe(1);
    expect(results[0]?.breakpointValue).toBe(640);
  });

  it('should handle em/rem units', () => {
    const content = `
      @media (min-width: 48em) {
        .container { width: 100%; }
      }
    `;
    const results = detectCSSMediaQueriesMinWidth(content, 'styles.css');
    
    expect(results.length).toBe(1);
    expect(results[0]?.breakpointValue).toBe(768); // 48 * 16 = 768
  });
});

describe('detectCSSMediaQueriesMaxWidth', () => {
  it('should detect max-width media queries', () => {
    const content = `
      @media (max-width: 767px) {
        .container { width: 100%; }
      }
      @media (max-width: 1023px) {
        .container { width: 720px; }
      }
    `;
    const results = detectCSSMediaQueriesMaxWidth(content, 'styles.css');
    
    expect(results.length).toBe(2);
    expect(results[0]?.type).toBe('desktop-first');
    expect(results[0]?.breakpointValue).toBe(767);
    expect(results[1]?.breakpointValue).toBe(1023);
  });
});

describe('detectCSSContainerQueries', () => {
  it('should detect container queries', () => {
    const content = `
      @container (min-width: 400px) {
        .card { display: grid; }
      }
      @container sidebar (min-width: 300px) {
        .nav { flex-direction: column; }
      }
    `;
    const results = detectCSSContainerQueries(content, 'styles.css');
    
    expect(results.length).toBe(2);
    expect(results[0]?.type).toBe('css-container-query');
    expect(results[0]?.breakpointValue).toBe(400);
    expect(results[1]?.breakpointValue).toBe(300);
  });
});

describe('detectThemeBreakpoints', () => {
  it('should detect theme.breakpoints usage', () => {
    const content = `
      const styles = {
        container: {
          width: theme.breakpoints.md,
          maxWidth: theme.breakpoints.lg,
        }
      };
    `;
    const results = detectThemeBreakpoints(content, 'styles.ts');
    
    expect(results.length).toBe(2);
    expect(results[0]?.type).toBe('theme-breakpoint');
    expect(results[0]?.breakpoint).toBe('md');
    expect(results[1]?.breakpoint).toBe('lg');
  });

  it('should detect theme.screens usage', () => {
    const content = `
      const breakpoint = theme.screens.sm;
    `;
    const results = detectThemeBreakpoints(content, 'styles.ts');
    
    expect(results.length).toBe(1);
    expect(results[0]?.breakpoint).toBe('sm');
  });

  it('should detect template literal usage', () => {
    const content = `
      const query = \`@media (min-width: \${theme.breakpoints.md})\`;
    `;
    const results = detectThemeBreakpoints(content, 'styles.ts');
    
    // Both patterns match: theme.breakpoints.md and ${theme.breakpoints.md}
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.some(r => r.breakpoint === 'md')).toBe(true);
  });
});


describe('detectCSSBreakpointProperties', () => {
  it('should detect CSS custom property breakpoints', () => {
    const content = `
      @media (min-width: var(--breakpoint-md)) {
        .container { width: 100%; }
      }
      @media (min-width: var(--screen-lg)) {
        .container { width: 960px; }
      }
    `;
    const results = detectCSSBreakpointProperties(content, 'styles.css');
    
    expect(results.length).toBe(2);
    expect(results[0]?.type).toBe('css-breakpoint-property');
    expect(results[0]?.breakpoint).toBe('md');
    expect(results[1]?.breakpoint).toBe('lg');
  });

  it('should detect breakpoint properties with fallback values', () => {
    const content = `
      @media (min-width: var(--bp-sm, 640px)) {
        .container { display: flex; }
      }
    `;
    const results = detectCSSBreakpointProperties(content, 'styles.css');
    
    expect(results.length).toBe(1);
    expect(results[0]?.breakpoint).toBe('sm');
  });
});

// ============================================================================
// Violation Detection Tests
// ============================================================================

describe('detectInconsistentBreakpointOrder', () => {
  it('should detect incorrect breakpoint ordering for same property', () => {
    const content = `
      <div className="lg:p-4 md:p-2 sm:p-1">Content</div>
    `;
    const results = detectInconsistentBreakpointOrder(content, 'test.tsx');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('inconsistent-breakpoint-order');
  });

  it('should not flag different properties with different breakpoint order', () => {
    // Different properties (flex, hidden, block) can have any order
    const content = `
      <div className="lg:flex md:hidden sm:block">Content</div>
    `;
    const results = detectInconsistentBreakpointOrder(content, 'test.tsx');
    
    expect(results.length).toBe(0);
  });

  it('should not flag correct breakpoint ordering', () => {
    const content = `
      <div className="sm:block md:hidden lg:flex xl:grid 2xl:inline">Content</div>
    `;
    const results = detectInconsistentBreakpointOrder(content, 'test.tsx');
    
    expect(results.length).toBe(0);
  });

  it('should handle multiple groups of responsive classes', () => {
    const content = `
      <div className="sm:p-2 md:p-4 lg:p-6 sm:text-sm md:text-base lg:text-lg">Content</div>
    `;
    const results = detectInconsistentBreakpointOrder(content, 'test.tsx');
    
    expect(results.length).toBe(0);
  });
});

describe('detectMixedApproach', () => {
  it('should detect mixed mobile-first and desktop-first approaches', () => {
    const mobileFirst = [
      { type: 'mobile-first' as const, file: 'test.css', line: 1, column: 1, matchedText: '@media (min-width: 768px)', breakpoint: '768px', context: '' },
      { type: 'mobile-first' as const, file: 'test.css', line: 5, column: 1, matchedText: '@media (min-width: 1024px)', breakpoint: '1024px', context: '' },
    ];
    const desktopFirst = [
      { type: 'desktop-first' as const, file: 'test.css', line: 10, column: 1, matchedText: '@media (max-width: 767px)', breakpoint: '767px', context: '' },
    ];
    
    const results = detectMixedApproach(mobileFirst, desktopFirst, 'test.css');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('mixed-approach');
  });

  it('should not flag when only one approach is used', () => {
    const mobileFirst = [
      { type: 'mobile-first' as const, file: 'test.css', line: 1, column: 1, matchedText: '@media (min-width: 768px)', breakpoint: '768px', context: '' },
      { type: 'mobile-first' as const, file: 'test.css', line: 5, column: 1, matchedText: '@media (min-width: 1024px)', breakpoint: '1024px', context: '' },
    ];
    
    const results = detectMixedApproach(mobileFirst, [], 'test.css');
    
    expect(results.length).toBe(0);
  });
});

describe('detectArbitraryBreakpoints', () => {
  it('should detect arbitrary breakpoint values', () => {
    const content = `
      @media (min-width: 850px) {
        .container { width: 100%; }
      }
      @media (max-width: 1100px) {
        .container { width: 960px; }
      }
    `;
    const results = detectArbitraryBreakpoints(content, 'styles.css');
    
    expect(results.length).toBe(2);
    expect(results[0]?.type).toBe('arbitrary-breakpoint');
    expect(results[0]?.breakpoints).toContain('850px');
    expect(results[1]?.breakpoints).toContain('1100px');
  });

  it('should not flag standard breakpoint values', () => {
    const content = `
      @media (min-width: 768px) {
        .container { width: 100%; }
      }
      @media (min-width: 1024px) {
        .container { width: 960px; }
      }
    `;
    const results = detectArbitraryBreakpoints(content, 'styles.css');
    
    expect(results.length).toBe(0);
  });

  it('should not flag common mobile sizes', () => {
    const content = `
      @media (max-width: 375px) {
        .container { padding: 8px; }
      }
    `;
    const results = detectArbitraryBreakpoints(content, 'styles.css');
    
    expect(results.length).toBe(0);
  });
});


// ============================================================================
// Analysis Function Tests
// ============================================================================

describe('analyzeResponsive', () => {
  it('should analyze Tailwind responsive patterns', () => {
    const content = `
      <div className="sm:flex md:hidden lg:grid">Content</div>
    `;
    const analysis = analyzeResponsive(content, 'test.tsx');
    
    expect(analysis.usesTailwindResponsive).toBe(true);
    expect(analysis.patterns.length).toBe(3);
    expect(analysis.responsiveConsistencyConfidence).toBeGreaterThan(0);
  });

  it('should analyze CSS media queries', () => {
    const content = `
      @media (min-width: 768px) {
        .container { width: 100%; }
      }
    `;
    const analysis = analyzeResponsive(content, 'styles.css');
    
    expect(analysis.usesCSSMediaQueries).toBe(true);
    expect(analysis.usesMobileFirst).toBe(true);
    expect(analysis.usesDesktopFirst).toBe(false);
  });

  it('should detect mixed approaches', () => {
    const content = `
      @media (min-width: 768px) {
        .container { width: 100%; }
      }
      @media (min-width: 1024px) {
        .container { width: 960px; }
      }
      @media (max-width: 767px) {
        .container { padding: 16px; }
      }
    `;
    const analysis = analyzeResponsive(content, 'styles.css');
    
    expect(analysis.usesMobileFirst).toBe(true);
    expect(analysis.usesDesktopFirst).toBe(true);
    expect(analysis.violations.some(v => v.type === 'mixed-approach')).toBe(true);
  });

  it('should skip excluded files', () => {
    const content = `
      <div className="sm:flex md:hidden lg:grid">Content</div>
    `;
    const analysis = analyzeResponsive(content, 'component.test.tsx');
    
    expect(analysis.patterns.length).toBe(0);
    expect(analysis.violations.length).toBe(0);
    expect(analysis.responsiveConsistencyConfidence).toBe(1.0);
  });

  it('should calculate confidence based on violations', () => {
    const contentWithViolations = `
      @media (min-width: 850px) {
        .container { width: 100%; }
      }
    `;
    const analysisWithViolations = analyzeResponsive(contentWithViolations, 'styles.css');
    
    const contentWithoutViolations = `
      @media (min-width: 768px) {
        .container { width: 100%; }
      }
    `;
    const analysisWithoutViolations = analyzeResponsive(contentWithoutViolations, 'styles.css');
    
    expect(analysisWithViolations.responsiveConsistencyConfidence).toBeLessThan(
      analysisWithoutViolations.responsiveConsistencyConfidence
    );
  });
});

// ============================================================================
// Detector Class Tests
// ============================================================================

describe('ResponsiveDetector', () => {
  it('should create detector instance', () => {
    const detector = createResponsiveDetector();
    
    expect(detector).toBeInstanceOf(ResponsiveDetector);
    expect(detector.id).toBe('styling/responsive');
    expect(detector.category).toBe('styling');
    expect(detector.subcategory).toBe('responsive');
  });

  it('should detect patterns and violations', async () => {
    const detector = createResponsiveDetector();
    const context = {
      file: 'test.tsx',
      content: `
        <div className="lg:flex md:hidden sm:block">Content</div>
        @media (min-width: 850px) {
          .container { width: 100%; }
        }
      `,
      ast: null,
      imports: [],
      exports: [],
      projectContext: {
        rootDir: '/project',
        files: [],
        config: {},
      },
    };
    
    const result = await detector.detect(context);
    
    expect(result.patterns.length).toBeGreaterThan(0);
    expect(result.violations.length).toBeGreaterThan(0);
  });

  it('should generate quick fixes for arbitrary breakpoints', () => {
    const detector = createResponsiveDetector();
    const violation = {
      id: 'test-violation',
      patternId: 'styling/responsive',
      severity: 'warning' as const,
      file: 'styles.css',
      range: {
        start: { line: 0, character: 0 },
        end: { line: 0, character: 30 },
      },
      message: 'Arbitrary breakpoint value',
      expected: 'Standard breakpoint',
      actual: '850px',
      aiExplainAvailable: true,
      aiFixAvailable: true,
      firstSeen: new Date(),
      occurrences: 1,
    };
    
    const quickFix = detector.generateQuickFix(violation);
    
    expect(quickFix).not.toBeNull();
    expect(quickFix?.title).toContain('md');
    expect(quickFix?.title).toContain('768px');
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('Edge Cases', () => {
  it('should handle empty content', () => {
    const analysis = analyzeResponsive('', 'test.tsx');
    
    expect(analysis.patterns.length).toBe(0);
    expect(analysis.violations.length).toBe(0);
    expect(analysis.responsiveConsistencyConfidence).toBe(0.5);
  });

  it('should handle content with no responsive patterns', () => {
    const content = `
      <div className="flex items-center p-4">
        <span>No responsive classes</span>
      </div>
    `;
    const analysis = analyzeResponsive(content, 'test.tsx');
    
    expect(analysis.usesTailwindResponsive).toBe(false);
    expect(analysis.usesCSSMediaQueries).toBe(false);
    expect(analysis.responsiveConsistencyConfidence).toBe(0.5);
  });

  it('should handle malformed media queries gracefully', () => {
    const content = `
      @media (min-width: ) {
        .container { width: 100%; }
      }
      @media (min-width: abc) {
        .container { width: 100%; }
      }
    `;
    // Should not throw
    expect(() => analyzeResponsive(content, 'styles.css')).not.toThrow();
  });

  it('should handle nested responsive classes', () => {
    const content = `
      <div className="sm:hover:bg-blue-500 md:focus:ring-2">Content</div>
    `;
    const results = detectTailwindResponsive(content, 'test.tsx');
    
    // Should detect the responsive prefix even with state variants
    expect(results.length).toBe(2);
  });
});
