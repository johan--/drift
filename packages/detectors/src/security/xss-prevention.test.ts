/**
 * XSS Prevention Detector Tests
 *
 * Tests for XSS prevention pattern detection.
 *
 * @requirements 16.3 - XSS prevention patterns
 */

import { describe, it, expect } from 'vitest';
import {
  XSSPreventionDetector,
  createXSSPreventionDetector,
  detectHTMLEscape,
  detectDOMPurifySanitize,
  detectSanitizeHTML,
  detectCSPNonce,
  detectEncodeURI,
  detectTextContent,
  detectDangerousInnerHTMLViolations,
  detectDocumentWriteViolations,
  detectEvalViolations,
  detectInnerHTMLViolations,
  analyzeXSSPrevention,
  shouldExcludeFile,
} from './xss-prevention.js';
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
    expect(shouldExcludeFile('xss.test.ts')).toBe(true);
    expect(shouldExcludeFile('security.spec.ts')).toBe(true);
  });

  it('should exclude minified files', () => {
    expect(shouldExcludeFile('bundle.min.js')).toBe(true);
  });

  it('should not exclude regular source files', () => {
    expect(shouldExcludeFile('src/utils/sanitize.ts')).toBe(false);
    expect(shouldExcludeFile('lib/security/xss.ts')).toBe(false);
  });
});

// ============================================================================
// HTML Escape Detection Tests
// ============================================================================

describe('detectHTMLEscape', () => {
  it('should detect escapeHtml function calls', () => {
    const content = `const safe = escapeHtml(userInput);`;
    const results = detectHTMLEscape(content, 'sanitizer.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('html-escape');
  });

  it('should detect he.encode calls', () => {
    const content = `const encoded = he.encode(text);`;
    const results = detectHTMLEscape(content, 'sanitizer.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect htmlEncode calls', () => {
    const content = `const encoded = htmlEncode(text);`;
    const results = detectHTMLEscape(content, 'sanitizer.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// DOMPurify Detection Tests
// ============================================================================

describe('detectDOMPurifySanitize', () => {
  it('should detect DOMPurify.sanitize calls', () => {
    const content = `const clean = DOMPurify.sanitize(dirty);`;
    const results = detectDOMPurifySanitize(content, 'sanitizer.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('dompurify-sanitize');
    expect(results[0]?.library).toBe('dompurify');
  });

  it('should detect DOMPurify imports', () => {
    const content = `import DOMPurify from 'dompurify';`;
    const results = detectDOMPurifySanitize(content, 'sanitizer.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Sanitize-HTML Detection Tests
// ============================================================================

describe('detectSanitizeHTML', () => {
  it('should detect sanitizeHtml calls', () => {
    const content = `const clean = sanitizeHtml(dirty);`;
    const results = detectSanitizeHTML(content, 'sanitizer.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('sanitize-html');
  });

  it('should detect filterXSS calls', () => {
    const content = `const clean = filterXSS(input);`;
    const results = detectSanitizeHTML(content, 'sanitizer.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// CSP Nonce Detection Tests
// ============================================================================

describe('detectCSPNonce', () => {
  it('should detect nonce attributes', () => {
    const content = `<script nonce="abc123">`;
    const results = detectCSPNonce(content, 'page.tsx');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('csp-nonce');
  });

  it('should detect nonce in CSP header', () => {
    const content = `script-src 'nonce-abc123'`;
    const results = detectCSPNonce(content, 'security.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// URI Encoding Detection Tests
// ============================================================================

describe('detectEncodeURI', () => {
  it('should detect encodeURIComponent calls', () => {
    const content = `const safe = encodeURIComponent(userInput);`;
    const results = detectEncodeURI(content, 'utils.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('encode-uri');
  });

  it('should detect encodeURI calls', () => {
    const content = `const safe = encodeURI(url);`;
    const results = detectEncodeURI(content, 'utils.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Text Content Detection Tests
// ============================================================================

describe('detectTextContent', () => {
  it('should detect textContent assignment', () => {
    const content = `element.textContent = userInput;`;
    const results = detectTextContent(content, 'component.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('text-content');
  });

  it('should detect createTextNode calls', () => {
    const content = `const node = document.createTextNode(text);`;
    const results = detectTextContent(content, 'component.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Violation Detection Tests
// ============================================================================

describe('detectDangerousInnerHTMLViolations', () => {
  it('should detect dangerouslySetInnerHTML usage', () => {
    const content = `<div dangerouslySetInnerHTML={{ __html: content }} />`;
    const results = detectDangerousInnerHTMLViolations(content, 'component.tsx');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('dangerous-inner-html');
    expect(results[0]?.severity).toBe('high');
  });
});

describe('detectDocumentWriteViolations', () => {
  it('should detect document.write usage', () => {
    const content = `document.write(content);`;
    const results = detectDocumentWriteViolations(content, 'script.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('document-write');
    expect(results[0]?.severity).toBe('high');
  });

  it('should detect document.writeln usage', () => {
    const content = `document.writeln(content);`;
    const results = detectDocumentWriteViolations(content, 'script.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });
});

describe('detectEvalViolations', () => {
  it('should detect eval usage', () => {
    const content = `eval(userCode);`;
    const results = detectEvalViolations(content, 'script.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('eval-usage');
    expect(results[0]?.severity).toBe('high');
  });

  it('should detect new Function usage', () => {
    const content = `const fn = new Function(code);`;
    const results = detectEvalViolations(content, 'script.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect setTimeout with string', () => {
    const content = `setTimeout("alert('hi')", 1000);`;
    const results = detectEvalViolations(content, 'script.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });
});

describe('detectInnerHTMLViolations', () => {
  it('should detect innerHTML assignment', () => {
    const content = `element.innerHTML = content;`;
    const results = detectInnerHTMLViolations(content, 'component.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('inner-html-assignment');
    expect(results[0]?.severity).toBe('medium');
  });

  it('should detect innerHTML concatenation', () => {
    const content = `element.innerHTML += moreContent;`;
    const results = detectInnerHTMLViolations(content, 'component.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Full Analysis Tests
// ============================================================================

describe('analyzeXSSPrevention', () => {
  it('should return empty analysis for excluded files', () => {
    const content = `const clean = DOMPurify.sanitize(dirty);`;
    const analysis = analyzeXSSPrevention(content, 'sanitizer.test.ts');
    
    expect(analysis.patterns.length).toBe(0);
    expect(analysis.violations.length).toBe(0);
    expect(analysis.confidence).toBe(1.0);
  });

  it('should detect XSS prevention patterns', () => {
    const content = `
      import DOMPurify from 'dompurify';
      const clean = DOMPurify.sanitize(dirty);
      element.textContent = userInput;
    `;
    const analysis = analyzeXSSPrevention(content, 'sanitizer.ts');
    
    expect(analysis.hasXSSPrevention).toBe(true);
    expect(analysis.patterns.length).toBeGreaterThan(0);
    expect(analysis.confidence).toBeGreaterThan(0.9);
  });

  it('should have lower confidence when violations exist', () => {
    const content = `element.innerHTML = userInput;`;
    const analysis = analyzeXSSPrevention(content, 'component.ts');
    
    expect(analysis.hasViolations).toBe(true);
    expect(analysis.confidence).toBeLessThan(0.8);
  });
});

// ============================================================================
// Detector Class Tests
// ============================================================================

describe('XSSPreventionDetector', () => {
  it('should create detector with correct properties', () => {
    const detector = createXSSPreventionDetector();
    
    expect(detector.id).toBe('security/xss-prevention');
    expect(detector.category).toBe('security');
    expect(detector.supportedLanguages).toContain('typescript');
    expect(detector.supportedLanguages).toContain('javascript');
  });

  it('should return empty result for unsupported languages', async () => {
    const detector = new XSSPreventionDetector();
    const context = createMockContext('styles.css', 'body { color: red; }');
    context.language = 'css';
    
    const result = await detector.detect(context);
    
    expect(result.patterns.length).toBe(0);
    expect(result.violations.length).toBe(0);
  });

  it('should detect patterns in TypeScript files', async () => {
    const detector = new XSSPreventionDetector();
    const content = `const clean = DOMPurify.sanitize(dirty);`;
    const context = createMockContext('sanitizer.ts', content);
    
    const result = await detector.detect(context);
    
    expect(result.confidence).toBeGreaterThan(0);
  });
});
