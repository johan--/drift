/**
 * Input Sanitization Detector Tests
 *
 * Tests for input sanitization pattern detection.
 *
 * @requirements 16.1 - Input sanitization patterns
 */

import { describe, it, expect } from 'vitest';
import {
  InputSanitizationDetector,
  createInputSanitizationDetector,
  detectDOMPurifySanitization,
  detectSanitizeHtmlLib,
  detectValidatorJS,
  detectEscapeHTML,
  detectEscapeSQL,
  detectCustomSanitization,
  detectTrimNormalize,
  detectUnsanitizedInputViolations,
  analyzeInputSanitization,
  shouldExcludeFile,
} from './input-sanitization.js';
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
  it('should exclude test files', () => {
    expect(shouldExcludeFile('sanitizer.test.ts')).toBe(true);
    expect(shouldExcludeFile('sanitizer.spec.ts')).toBe(true);
  });

  it('should exclude __tests__ directory', () => {
    expect(shouldExcludeFile('__tests__/sanitizer.ts')).toBe(true);
  });

  it('should exclude type definition files', () => {
    expect(shouldExcludeFile('sanitizer.d.ts')).toBe(true);
  });

  it('should exclude node_modules', () => {
    expect(shouldExcludeFile('node_modules/dompurify/index.js')).toBe(true);
  });

  it('should not exclude regular source files', () => {
    expect(shouldExcludeFile('src/utils/sanitizer.ts')).toBe(false);
    expect(shouldExcludeFile('lib/security/input.ts')).toBe(false);
  });
});

// ============================================================================
// DOMPurify Detection Tests
// ============================================================================

describe('detectDOMPurifySanitization', () => {
  it('should detect DOMPurify.sanitize calls', () => {
    const content = `const clean = DOMPurify.sanitize(dirty);`;
    const results = detectDOMPurifySanitization(content, 'sanitizer.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('dompurify-sanitize');
    expect(results[0]?.library).toBe('dompurify');
  });

  it('should detect DOMPurify imports', () => {
    const content = `import DOMPurify from 'dompurify';`;
    const results = detectDOMPurifySanitization(content, 'sanitizer.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect require dompurify', () => {
    const content = `const DOMPurify = require('dompurify');`;
    const results = detectDOMPurifySanitization(content, 'sanitizer.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Sanitize-HTML Detection Tests
// ============================================================================

describe('detectSanitizeHtmlLib', () => {
  it('should detect sanitizeHtml calls', () => {
    const content = `const clean = sanitizeHtml(dirty);`;
    const results = detectSanitizeHtmlLib(content, 'sanitizer.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('sanitize-html-lib');
  });

  it('should detect xss filter calls', () => {
    const content = `const clean = filterXSS(input);`;
    const results = detectSanitizeHtmlLib(content, 'sanitizer.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Validator.js Detection Tests
// ============================================================================

describe('detectValidatorJS', () => {
  it('should detect validator.escape calls', () => {
    const content = `const escaped = validator.escape(input);`;
    const results = detectValidatorJS(content, 'sanitizer.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('validator-js');
    expect(results[0]?.library).toBe('validator');
  });

  it('should detect validator.isEmail calls', () => {
    const content = `if (validator.isEmail(email)) { }`;
    const results = detectValidatorJS(content, 'sanitizer.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect validator.trim calls', () => {
    const content = `const trimmed = validator.trim(input);`;
    const results = detectValidatorJS(content, 'sanitizer.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// HTML Escape Detection Tests
// ============================================================================

describe('detectEscapeHTML', () => {
  it('should detect escapeHtml function calls', () => {
    const content = `const safe = escapeHtml(userInput);`;
    const results = detectEscapeHTML(content, 'sanitizer.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('escape-html');
  });

  it('should detect htmlEncode function calls', () => {
    const content = `const encoded = htmlEncode(text);`;
    const results = detectEscapeHTML(content, 'sanitizer.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// SQL Escape Detection Tests
// ============================================================================

describe('detectEscapeSQL', () => {
  it('should detect mysql.escape calls', () => {
    const content = `const safe = mysql.escape(value);`;
    const results = detectEscapeSQL(content, 'sanitizer.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('escape-sql');
  });

  it('should detect pg.escapeLiteral calls', () => {
    const content = `const safe = pg.escapeLiteral(value);`;
    const results = detectEscapeSQL(content, 'sanitizer.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Custom Sanitization Detection Tests
// ============================================================================

describe('detectCustomSanitization', () => {
  it('should detect custom sanitize functions', () => {
    const content = `const clean = sanitizeUserInput(input);`;
    const results = detectCustomSanitization(content, 'sanitizer.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('custom-sanitize');
  });

  it('should detect cleanInput functions', () => {
    const content = `const clean = cleanUserInput(data);`;
    const results = detectCustomSanitization(content, 'sanitizer.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Trim/Normalize Detection Tests
// ============================================================================

describe('detectTrimNormalize', () => {
  it('should detect .trim() calls', () => {
    const content = `const trimmed = input.trim();`;
    const results = detectTrimNormalize(content, 'sanitizer.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('trim-normalize');
  });

  it('should detect .toLowerCase() calls', () => {
    const content = `const lower = email.toLowerCase();`;
    const results = detectTrimNormalize(content, 'sanitizer.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Violation Detection Tests
// ============================================================================

describe('detectUnsanitizedInputViolations', () => {
  it('should detect innerHTML with user input', () => {
    const content = `element.innerHTML = req.body.content;`;
    const results = detectUnsanitizedInputViolations(content, 'handler.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('raw-user-input');
  });

  it('should detect document.write with user input', () => {
    const content = `document.write(req.query.data);`;
    const results = detectUnsanitizedInputViolations(content, 'handler.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Full Analysis Tests
// ============================================================================

describe('analyzeInputSanitization', () => {
  it('should return empty analysis for excluded files', () => {
    const content = `const clean = DOMPurify.sanitize(dirty);`;
    const analysis = analyzeInputSanitization(content, 'sanitizer.test.ts');
    
    expect(analysis.patterns.length).toBe(0);
    expect(analysis.violations.length).toBe(0);
    expect(analysis.confidence).toBe(1.0);
  });

  it('should detect multiple sanitization patterns', () => {
    const content = `
      import DOMPurify from 'dompurify';
      const clean = DOMPurify.sanitize(dirty);
      const trimmed = input.trim();
    `;
    const analysis = analyzeInputSanitization(content, 'sanitizer.ts');
    
    expect(analysis.hasSanitization).toBe(true);
    expect(analysis.patterns.length).toBeGreaterThan(0);
    expect(analysis.sanitizationLibraries).toContain('dompurify');
  });

  it('should have lower confidence when violations exist', () => {
    const content = `element.innerHTML = req.body.content;`;
    const analysis = analyzeInputSanitization(content, 'handler.ts');
    
    expect(analysis.violations.length).toBeGreaterThan(0);
    expect(analysis.confidence).toBeLessThan(0.9);
  });
});

// ============================================================================
// Detector Class Tests
// ============================================================================

describe('InputSanitizationDetector', () => {
  it('should create detector with correct properties', () => {
    const detector = createInputSanitizationDetector();
    
    expect(detector.id).toBe('security/input-sanitization');
    expect(detector.category).toBe('security');
    expect(detector.supportedLanguages).toContain('typescript');
    expect(detector.supportedLanguages).toContain('javascript');
  });

  it('should return empty result for unsupported languages', async () => {
    const detector = new InputSanitizationDetector();
    const context = createMockContext('styles.css', 'body { color: red; }');
    context.language = 'css';
    
    const result = await detector.detect(context);
    
    expect(result.patterns.length).toBe(0);
    expect(result.violations.length).toBe(0);
  });

  it('should detect patterns in TypeScript files', async () => {
    const detector = new InputSanitizationDetector();
    const content = `const clean = DOMPurify.sanitize(dirty);`;
    const context = createMockContext('sanitizer.ts', content);
    
    const result = await detector.detect(context);
    
    expect(result.confidence).toBeGreaterThan(0);
  });
});
