/**
 * CSRF Protection Detector Tests
 *
 * Tests for CSRF protection pattern detection.
 *
 * @requirements 16.4 - CSRF protection patterns
 */

import { describe, it, expect } from 'vitest';
import {
  CSRFProtectionDetector,
  createCSRFProtectionDetector,
  detectCSRFTokens,
  detectCSRFMiddleware,
  detectSameSiteCookies,
  detectDoubleSubmit,
  detectOriginValidation,
  detectRefererValidation,
  detectCSRFHeaders,
  detectInsecureCookieViolations,
  analyzeCSRFProtection,
  shouldExcludeFile,
} from './csrf-protection.js';
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
    expect(shouldExcludeFile('csrf.test.ts')).toBe(true);
    expect(shouldExcludeFile('security.spec.ts')).toBe(true);
  });

  it('should exclude minified files', () => {
    expect(shouldExcludeFile('bundle.min.js')).toBe(true);
  });

  it('should not exclude regular source files', () => {
    expect(shouldExcludeFile('src/middleware/csrf.ts')).toBe(false);
    expect(shouldExcludeFile('lib/security/protection.ts')).toBe(false);
  });
});

// ============================================================================
// CSRF Token Detection Tests
// ============================================================================

describe('detectCSRFTokens', () => {
  it('should detect csrfToken variable', () => {
    const content = `const csrfToken = generateToken();`;
    const results = detectCSRFTokens(content, 'auth.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('csrf-token');
  });

  it('should detect _csrf variable', () => {
    const content = `const _csrf = req.body._csrf;`;
    const results = detectCSRFTokens(content, 'auth.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect xsrfToken', () => {
    const content = `const xsrfToken = cookies.get('XSRF-TOKEN');`;
    const results = detectCSRFTokens(content, 'auth.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect generateCsrfToken function', () => {
    const content = `const token = generateCsrfToken();`;
    const results = detectCSRFTokens(content, 'auth.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// CSRF Middleware Detection Tests
// ============================================================================

describe('detectCSRFMiddleware', () => {
  it('should detect csurf middleware', () => {
    const content = `app.use(csurf());`;
    const results = detectCSRFMiddleware(content, 'app.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('csrf-middleware');
  });

  it('should detect csurf import', () => {
    const content = `import csurf from 'csurf';`;
    const results = detectCSRFMiddleware(content, 'app.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect lusca.csrf', () => {
    const content = `app.use(lusca.csrf());`;
    const results = detectCSRFMiddleware(content, 'app.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// SameSite Cookie Detection Tests
// ============================================================================

describe('detectSameSiteCookies', () => {
  it('should detect sameSite: strict', () => {
    const content = `res.cookie('session', token, { sameSite: 'strict' });`;
    const results = detectSameSiteCookies(content, 'auth.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('same-site-cookie');
  });

  it('should detect SameSite=Lax header', () => {
    const content = `Set-Cookie: session=abc; SameSite=Lax`;
    const results = detectSameSiteCookies(content, 'auth.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect cookie options with sameSite', () => {
    const content = `const cookieOptions = { sameSite: 'lax', httpOnly: true };`;
    const results = detectSameSiteCookies(content, 'auth.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Double Submit Detection Tests
// ============================================================================

describe('detectDoubleSubmit', () => {
  it('should detect doubleSubmit pattern', () => {
    const content = `const doubleSubmitToken = generateToken();`;
    const results = detectDoubleSubmit(content, 'auth.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('double-submit');
  });

  it('should detect csrfCookie pattern', () => {
    const content = `const csrfCookie = cookies.get('csrf');`;
    const results = detectDoubleSubmit(content, 'auth.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Origin Validation Detection Tests
// ============================================================================

describe('detectOriginValidation', () => {
  it('should detect origin header check', () => {
    const content = `const origin = req.headers['origin'];`;
    const results = detectOriginValidation(content, 'middleware.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('origin-validation');
  });

  it('should detect validateOrigin function', () => {
    const content = `if (validateOrigin(req.headers.origin)) { }`;
    const results = detectOriginValidation(content, 'middleware.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect allowedOrigins', () => {
    const content = `const allowedOrigins = ['https://example.com'];`;
    const results = detectOriginValidation(content, 'middleware.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Referer Validation Detection Tests
// ============================================================================

describe('detectRefererValidation', () => {
  it('should detect referer header check', () => {
    const content = `const referer = req.headers['referer'];`;
    const results = detectRefererValidation(content, 'middleware.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('referer-validation');
  });

  it('should detect validateReferer function', () => {
    const content = `if (validateReferer(req.headers.referer)) { }`;
    const results = detectRefererValidation(content, 'middleware.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// CSRF Header Detection Tests
// ============================================================================

describe('detectCSRFHeaders', () => {
  it('should detect x-csrf-token header', () => {
    const content = `const token = req.headers['x-csrf-token'];`;
    const results = detectCSRFHeaders(content, 'middleware.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('csrf-header');
  });

  it('should detect x-xsrf-token header', () => {
    const content = `headers['x-xsrf-token'] = token;`;
    const results = detectCSRFHeaders(content, 'client.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect x-requested-with header', () => {
    const content = `headers['x-requested-with'] = 'XMLHttpRequest';`;
    const results = detectCSRFHeaders(content, 'client.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Violation Detection Tests
// ============================================================================

describe('detectInsecureCookieViolations', () => {
  it('should detect httpOnly: false', () => {
    const content = `res.cookie('session', token, { httpOnly: false });`;
    const results = detectInsecureCookieViolations(content, 'auth.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('insecure-cookie');
    expect(results[0]?.severity).toBe('medium');
  });

  it('should detect secure: false', () => {
    const content = `res.cookie('session', token, { secure: false });`;
    const results = detectInsecureCookieViolations(content, 'auth.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Full Analysis Tests
// ============================================================================

describe('analyzeCSRFProtection', () => {
  it('should return empty analysis for excluded files', () => {
    const content = `app.use(csurf());`;
    const analysis = analyzeCSRFProtection(content, 'csrf.test.ts');
    
    expect(analysis.patterns.length).toBe(0);
    expect(analysis.violations.length).toBe(0);
    expect(analysis.confidence).toBe(1.0);
  });

  it('should detect CSRF protection', () => {
    const content = `
      import csurf from 'csurf';
      app.use(csurf());
      const csrfToken = req.csrfToken();
    `;
    const analysis = analyzeCSRFProtection(content, 'app.ts');
    
    expect(analysis.hasCSRFProtection).toBe(true);
    expect(analysis.patterns.length).toBeGreaterThan(0);
    expect(analysis.confidence).toBeGreaterThan(0.9);
  });

  it('should detect SameSite cookies', () => {
    const content = `res.cookie('session', token, { sameSite: 'strict' });`;
    const analysis = analyzeCSRFProtection(content, 'auth.ts');
    
    expect(analysis.hasSameSiteCookies).toBe(true);
    expect(analysis.confidence).toBeGreaterThan(0.8);
  });
});

// ============================================================================
// Detector Class Tests
// ============================================================================

describe('CSRFProtectionDetector', () => {
  it('should create detector with correct properties', () => {
    const detector = createCSRFProtectionDetector();
    
    expect(detector.id).toBe('security/csrf-protection');
    expect(detector.category).toBe('security');
    expect(detector.supportedLanguages).toContain('typescript');
    expect(detector.supportedLanguages).toContain('javascript');
  });

  it('should return empty result for unsupported languages', async () => {
    const detector = new CSRFProtectionDetector();
    const context = createMockContext('styles.css', 'body { color: red; }');
    context.language = 'css';
    
    const result = await detector.detect(context);
    
    expect(result.patterns.length).toBe(0);
    expect(result.violations.length).toBe(0);
  });

  it('should detect patterns in TypeScript files', async () => {
    const detector = new CSRFProtectionDetector();
    const content = `app.use(csurf());`;
    const context = createMockContext('app.ts', content);
    
    const result = await detector.detect(context);
    
    expect(result.confidence).toBeGreaterThan(0);
  });
});
