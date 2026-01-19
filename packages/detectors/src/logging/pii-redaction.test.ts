/**
 * PII Redaction Detector Tests
 *
 * Tests for PII redaction pattern detection.
 *
 * @requirements 15.5 - PII handling patterns
 */

import { describe, it, expect } from 'vitest';
import {
  PIIRedactionDetector,
  createPIIRedactionDetector,
  analyzePIIRedaction,
  shouldExcludeFile,
  REDACT_FUNCTION_PATTERNS,
  MASK_FUNCTION_PATTERNS,
  SANITIZE_FUNCTION_PATTERNS,
  SENSITIVE_FIELD_PATTERNS,
  REDACTION_CONFIG_PATTERNS,
} from './pii-redaction.js';
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
    expect(shouldExcludeFile('redaction.test.ts')).toBe(true);
    expect(shouldExcludeFile('redaction.spec.ts')).toBe(true);
  });

  it('should exclude __tests__ directory', () => {
    expect(shouldExcludeFile('__tests__/redaction.ts')).toBe(true);
  });

  it('should exclude type definition files', () => {
    expect(shouldExcludeFile('types.d.ts')).toBe(true);
  });

  it('should exclude node_modules', () => {
    expect(shouldExcludeFile('node_modules/pino/index.js')).toBe(true);
  });

  it('should not exclude regular source files', () => {
    expect(shouldExcludeFile('src/redaction.ts')).toBe(false);
    expect(shouldExcludeFile('lib/sanitize.ts')).toBe(false);
  });
});

// ============================================================================
// Pattern Regex Tests
// ============================================================================

describe('PII Redaction Patterns', () => {
  describe('REDACT_FUNCTION_PATTERNS', () => {
    it('should match redact function call', () => {
      expect(REDACT_FUNCTION_PATTERNS.some(p => p.test('redact('))).toBe(true);
    });

    it('should match redactPII function call', () => {
      expect(REDACT_FUNCTION_PATTERNS.some(p => p.test('redactPII('))).toBe(true);
    });

    it('should match redactSensitive function call', () => {
      expect(REDACT_FUNCTION_PATTERNS.some(p => p.test('redactSensitive('))).toBe(true);
    });
  });

  describe('MASK_FUNCTION_PATTERNS', () => {
    it('should match mask function call', () => {
      expect(MASK_FUNCTION_PATTERNS.some(p => p.test('mask('))).toBe(true);
    });

    it('should match maskEmail function call', () => {
      expect(MASK_FUNCTION_PATTERNS.some(p => p.test('maskEmail('))).toBe(true);
    });

    it('should match maskPhone function call', () => {
      expect(MASK_FUNCTION_PATTERNS.some(p => p.test('maskPhone('))).toBe(true);
    });

    it('should match maskSSN function call', () => {
      expect(MASK_FUNCTION_PATTERNS.some(p => p.test('maskSSN('))).toBe(true);
    });

    it('should match maskCreditCard function call', () => {
      expect(MASK_FUNCTION_PATTERNS.some(p => p.test('maskCreditCard('))).toBe(true);
    });
  });

  describe('SANITIZE_FUNCTION_PATTERNS', () => {
    it('should match sanitize function call', () => {
      expect(SANITIZE_FUNCTION_PATTERNS.some(p => p.test('sanitize('))).toBe(true);
    });

    it('should match sanitizeLog function call', () => {
      expect(SANITIZE_FUNCTION_PATTERNS.some(p => p.test('sanitizeLog('))).toBe(true);
    });

    it('should match sanitizeData function call', () => {
      expect(SANITIZE_FUNCTION_PATTERNS.some(p => p.test('sanitizeData('))).toBe(true);
    });
  });

  describe('SENSITIVE_FIELD_PATTERNS', () => {
    it('should match password field', () => {
      expect(SENSITIVE_FIELD_PATTERNS.some(p => p.test('password ='))).toBe(true);
    });

    it('should match ssn field', () => {
      expect(SENSITIVE_FIELD_PATTERNS.some(p => p.test('ssn:'))).toBe(true);
    });

    it('should match creditCard field', () => {
      expect(SENSITIVE_FIELD_PATTERNS.some(p => p.test('creditCard ='))).toBe(true);
    });

    it('should match socialSecurity field', () => {
      expect(SENSITIVE_FIELD_PATTERNS.some(p => p.test('socialSecurity:'))).toBe(true);
    });

    it('should match secret field', () => {
      expect(SENSITIVE_FIELD_PATTERNS.some(p => p.test('secret ='))).toBe(true);
    });

    it('should match apiKey field', () => {
      expect(SENSITIVE_FIELD_PATTERNS.some(p => p.test('apiKey:'))).toBe(true);
    });
  });

  describe('REDACTION_CONFIG_PATTERNS', () => {
    it('should match redactPaths config', () => {
      expect(REDACTION_CONFIG_PATTERNS.some(p => p.test('redactPaths ='))).toBe(true);
    });

    it('should match sensitiveFields config', () => {
      expect(REDACTION_CONFIG_PATTERNS.some(p => p.test('sensitiveFields:'))).toBe(true);
    });

    it('should match redactionRules config', () => {
      expect(REDACTION_CONFIG_PATTERNS.some(p => p.test('redactionRules ='))).toBe(true);
    });
  });
});

// ============================================================================
// analyzePIIRedaction Tests
// ============================================================================

describe('analyzePIIRedaction', () => {
  it('should return empty analysis for excluded files', () => {
    const content = `redact(data);`;
    const analysis = analyzePIIRedaction(content, 'redaction.test.ts');
    
    expect(analysis.patterns.length).toBe(0);
    expect(analysis.hasRedaction).toBe(false);
    expect(analysis.hasSensitiveFields).toBe(false);
  });

  it('should detect redact function usage', () => {
    const content = `const sanitized = redact(userData);`;
    const analysis = analyzePIIRedaction(content, 'logger.ts');
    
    expect(analysis.hasRedaction).toBe(true);
    expect(analysis.patterns.some(p => p.type === 'redact-function')).toBe(true);
  });

  it('should detect mask function usage', () => {
    const content = `const masked = maskEmail(email);`;
    const analysis = analyzePIIRedaction(content, 'utils.ts');
    
    expect(analysis.hasRedaction).toBe(true);
    expect(analysis.patterns.some(p => p.type === 'mask-function')).toBe(true);
  });

  it('should detect sanitize function usage', () => {
    const content = `const clean = sanitizeLog(logData);`;
    const analysis = analyzePIIRedaction(content, 'logger.ts');
    
    expect(analysis.hasRedaction).toBe(true);
    expect(analysis.patterns.some(p => p.type === 'sanitize-function')).toBe(true);
  });

  it('should detect sensitive field usage', () => {
    const content = `const password = user.password;`;
    const analysis = analyzePIIRedaction(content, 'auth.ts');
    
    expect(analysis.hasSensitiveFields).toBe(true);
    expect(analysis.patterns.some(p => p.type === 'sensitive-field')).toBe(true);
  });

  it('should detect redaction config', () => {
    const content = `const redactPaths = ['password', 'ssn'];`;
    const analysis = analyzePIIRedaction(content, 'config.ts');
    
    expect(analysis.patterns.some(p => p.type === 'redaction-config')).toBe(true);
  });

  it('should detect multiple sensitive fields', () => {
    const content = `
      const password = user.password;
      const ssn = user.ssn;
      const creditCard = payment.creditCard;
    `;
    const analysis = analyzePIIRedaction(content, 'user.ts');
    
    expect(analysis.hasSensitiveFields).toBe(true);
    expect(analysis.patterns.filter(p => p.type === 'sensitive-field').length).toBe(3);
  });

  it('should detect multiple mask functions', () => {
    const content = `
      const maskedEmail = maskEmail(email);
      const maskedPhone = maskPhone(phone);
      const maskedSSN = maskSSN(ssn);
    `;
    const analysis = analyzePIIRedaction(content, 'utils.ts');
    
    expect(analysis.hasRedaction).toBe(true);
    expect(analysis.patterns.filter(p => p.type === 'mask-function').length).toBe(3);
  });

  it('should handle files without PII patterns', () => {
    const content = `const x = 1 + 2;`;
    const analysis = analyzePIIRedaction(content, 'utils.ts');
    
    expect(analysis.patterns.length).toBe(0);
    expect(analysis.hasRedaction).toBe(false);
    expect(analysis.hasSensitiveFields).toBe(false);
  });

  it('should detect apiKey as sensitive field', () => {
    const content = `const apiKey = process.env.API_KEY;`;
    const analysis = analyzePIIRedaction(content, 'config.ts');
    
    expect(analysis.hasSensitiveFields).toBe(true);
  });

  it('should detect secret as sensitive field', () => {
    const content = `const secret = config.secret;`;
    const analysis = analyzePIIRedaction(content, 'auth.ts');
    
    expect(analysis.hasSensitiveFields).toBe(true);
  });
});

// ============================================================================
// Detector Class Tests
// ============================================================================

describe('PIIRedactionDetector', () => {
  it('should create detector with correct properties', () => {
    const detector = createPIIRedactionDetector();
    
    expect(detector.id).toBe('logging/pii-redaction');
    expect(detector.category).toBe('logging');
    expect(detector.subcategory).toBe('pii-redaction');
    expect(detector.supportedLanguages).toContain('typescript');
    expect(detector.supportedLanguages).toContain('javascript');
  });

  it('should return empty result for unsupported languages', async () => {
    const detector = new PIIRedactionDetector();
    const context = createMockContext('styles.css', 'body { color: red; }');
    context.language = 'css';
    
    const result = await detector.detect(context);
    
    expect(result.patterns.length).toBe(0);
    expect(result.violations.length).toBe(0);
  });

  it('should detect patterns in TypeScript files', async () => {
    const detector = new PIIRedactionDetector();
    const content = `
      const sanitized = redact(userData);
      const password = user.password;
    `;
    const context = createMockContext('auth.ts', content);
    
    const result = await detector.detect(context);
    
    expect(result.confidence).toBe(0.9);
  });

  it('should return empty result for files without PII patterns', async () => {
    const detector = new PIIRedactionDetector();
    const content = `const x = 1 + 2;`;
    const context = createMockContext('utils.ts', content);
    
    const result = await detector.detect(context);
    
    expect(result.patterns.length).toBe(0);
  });

  it('should include redaction info in metadata', async () => {
    const detector = new PIIRedactionDetector();
    const content = `const sanitized = redact(userData);`;
    const context = createMockContext('logger.ts', content);
    
    const result = await detector.detect(context);
    
    expect(result.metadata?.custom?.hasRedaction).toBe(true);
    expect(result.metadata?.custom?.hasSensitiveFields).toBeDefined();
  });

  it('should return null for generateQuickFix', () => {
    const detector = new PIIRedactionDetector();
    const violation = {
      id: 'test-violation',
      patternId: 'logging/pii-redaction',
      severity: 'warning' as const,
      file: 'test.ts',
      range: { start: { line: 1, character: 1 }, end: { line: 1, character: 10 } },
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
