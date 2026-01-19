/**
 * CSP Headers Detector Tests
 *
 * Tests for Content Security Policy pattern detection.
 *
 * @requirements 16.5 - CSP header patterns
 */

import { describe, it, expect } from 'vitest';
import {
  CSPHeadersDetector,
  createCSPHeadersDetector,
  detectCSPHeaders,
  detectCSPMeta,
  detectHelmetCSP,
  detectCSPNonce,
  detectCSPHash,
  detectCSPDirectives,
  detectReportURI,
  detectUnsafeInlineViolations,
  detectUnsafeEvalViolations,
  detectWildcardSourceViolations,
  analyzeCSPHeaders,
  shouldExcludeFile,
} from './csp-headers.js';
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
    expect(shouldExcludeFile('csp.test.ts')).toBe(true);
    expect(shouldExcludeFile('security.spec.ts')).toBe(true);
  });

  it('should exclude minified files', () => {
    expect(shouldExcludeFile('bundle.min.js')).toBe(true);
  });

  it('should not exclude regular source files', () => {
    expect(shouldExcludeFile('src/middleware/csp.ts')).toBe(false);
    expect(shouldExcludeFile('lib/security/headers.ts')).toBe(false);
  });
});

// ============================================================================
// CSP Header Detection Tests
// ============================================================================

describe('detectCSPHeaders', () => {
  it('should detect Content-Security-Policy header', () => {
    const content = `res.setHeader('Content-Security-Policy', policy);`;
    const results = detectCSPHeaders(content, 'security.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('csp-header');
  });

  it('should detect contentSecurityPolicy property', () => {
    const content = `const contentSecurityPolicy = "default-src 'self'";`;
    const results = detectCSPHeaders(content, 'security.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// CSP Meta Tag Detection Tests
// ============================================================================

describe('detectCSPMeta', () => {
  it('should detect CSP meta tag', () => {
    const content = `<meta http-equiv="Content-Security-Policy" content="default-src 'self'">`;
    const results = detectCSPMeta(content, 'index.html');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('csp-meta');
  });

  it('should detect httpEquiv property', () => {
    const content = `<meta httpEquiv="Content-Security-Policy" content={csp} />`;
    const results = detectCSPMeta(content, 'document.tsx');
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Helmet CSP Detection Tests
// ============================================================================

describe('detectHelmetCSP', () => {
  it('should detect helmet.contentSecurityPolicy', () => {
    const content = `app.use(helmet.contentSecurityPolicy({ directives: {} }));`;
    const results = detectHelmetCSP(content, 'app.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('helmet-csp');
  });

  it('should detect helmet import', () => {
    const content = `import helmet from 'helmet';`;
    const results = detectHelmetCSP(content, 'app.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect contentSecurityPolicy in helmet config', () => {
    const content = `app.use(helmet({ contentSecurityPolicy: { directives: {} } }));`;
    const results = detectHelmetCSP(content, 'app.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// CSP Nonce Detection Tests
// ============================================================================

describe('detectCSPNonce', () => {
  it('should detect nonce in CSP', () => {
    const content = `script-src 'nonce-abc123'`;
    const results = detectCSPNonce(content, 'security.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('csp-nonce');
  });

  it('should detect nonce attribute', () => {
    const content = `<script nonce="abc123">`;
    const results = detectCSPNonce(content, 'page.tsx');
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect generateNonce function', () => {
    const content = `const nonce = generateNonce();`;
    const results = detectCSPNonce(content, 'security.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// CSP Hash Detection Tests
// ============================================================================

describe('detectCSPHash', () => {
  it('should detect sha256 hash', () => {
    const content = `script-src 'sha256-abc123def456'`;
    const results = detectCSPHash(content, 'security.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('csp-hash');
  });

  it('should detect sha384 hash', () => {
    const content = `style-src 'sha384-xyz789'`;
    const results = detectCSPHash(content, 'security.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// CSP Directive Detection Tests
// ============================================================================

describe('detectCSPDirectives', () => {
  it('should detect default-src directive', () => {
    const content = `default-src 'self'`;
    const results = detectCSPDirectives(content, 'security.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('csp-directive');
  });

  it('should detect script-src directive', () => {
    const content = `script-src 'self' https://cdn.example.com`;
    const results = detectCSPDirectives(content, 'security.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect upgrade-insecure-requests', () => {
    const content = `upgrade-insecure-requests`;
    const results = detectCSPDirectives(content, 'security.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Report URI Detection Tests
// ============================================================================

describe('detectReportURI', () => {
  it('should detect report-uri directive', () => {
    const content = `report-uri /csp-report`;
    const results = detectReportURI(content, 'security.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('report-uri');
  });

  it('should detect report-to directive', () => {
    const content = `report-to csp-endpoint`;
    const results = detectReportURI(content, 'security.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Violation Detection Tests
// ============================================================================

describe('detectUnsafeInlineViolations', () => {
  it('should detect unsafe-inline', () => {
    const content = `script-src 'unsafe-inline'`;
    const results = detectUnsafeInlineViolations(content, 'security.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('unsafe-inline');
    expect(results[0]?.severity).toBe('medium');
  });
});

describe('detectUnsafeEvalViolations', () => {
  it('should detect unsafe-eval', () => {
    const content = `script-src 'unsafe-eval'`;
    const results = detectUnsafeEvalViolations(content, 'security.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('unsafe-eval');
    expect(results[0]?.severity).toBe('high');
  });
});

describe('detectWildcardSourceViolations', () => {
  it('should detect wildcard source', () => {
    const content = `script-src *;`;
    const results = detectWildcardSourceViolations(content, 'security.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('wildcard-source');
    expect(results[0]?.severity).toBe('medium');
  });
});

// ============================================================================
// Full Analysis Tests
// ============================================================================

describe('analyzeCSPHeaders', () => {
  it('should return empty analysis for excluded files', () => {
    const content = `app.use(helmet.contentSecurityPolicy());`;
    const analysis = analyzeCSPHeaders(content, 'csp.test.ts');
    
    expect(analysis.patterns.length).toBe(0);
    expect(analysis.violations.length).toBe(0);
    expect(analysis.confidence).toBe(1.0);
  });

  it('should detect CSP with helmet', () => {
    const content = `
      import helmet from 'helmet';
      app.use(helmet.contentSecurityPolicy({
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'nonce-abc123'"]
        }
      }));
    `;
    const analysis = analyzeCSPHeaders(content, 'app.ts');
    
    expect(analysis.hasCSP).toBe(true);
    expect(analysis.usesNonce).toBe(true);
    expect(analysis.confidence).toBeGreaterThan(0.9);
  });

  it('should detect CSP with hash', () => {
    const content = `script-src 'sha256-abc123'`;
    const analysis = analyzeCSPHeaders(content, 'security.ts');
    
    expect(analysis.usesHash).toBe(true);
  });

  it('should have lower confidence without nonce or hash', () => {
    const content = `res.setHeader('Content-Security-Policy', "default-src 'self'");`;
    const analysis = analyzeCSPHeaders(content, 'security.ts');
    
    expect(analysis.hasCSP).toBe(true);
    expect(analysis.usesNonce).toBe(false);
    expect(analysis.usesHash).toBe(false);
    expect(analysis.confidence).toBeLessThan(0.9);
  });
});

// ============================================================================
// Detector Class Tests
// ============================================================================

describe('CSPHeadersDetector', () => {
  it('should create detector with correct properties', () => {
    const detector = createCSPHeadersDetector();
    
    expect(detector.id).toBe('security/csp-headers');
    expect(detector.category).toBe('security');
    expect(detector.supportedLanguages).toContain('typescript');
    expect(detector.supportedLanguages).toContain('javascript');
  });

  it('should return empty result for unsupported languages', async () => {
    const detector = new CSPHeadersDetector();
    const context = createMockContext('styles.css', 'body { color: red; }');
    context.language = 'css';
    
    const result = await detector.detect(context);
    
    expect(result.patterns.length).toBe(0);
    expect(result.violations.length).toBe(0);
  });

  it('should detect patterns in TypeScript files', async () => {
    const detector = new CSPHeadersDetector();
    const content = `app.use(helmet.contentSecurityPolicy());`;
    const context = createMockContext('app.ts', content);
    
    const result = await detector.detect(context);
    
    expect(result.confidence).toBeGreaterThan(0);
  });
});
