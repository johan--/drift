/**
 * Context Fields Detector Tests
 *
 * Tests for logging context field pattern detection.
 *
 * @requirements 15.3 - Context field patterns (correlation IDs)
 */

import { describe, it, expect } from 'vitest';
import {
  ContextFieldsDetector,
  createContextFieldsDetector,
  analyzeContextFields,
  shouldExcludeFile,
  REQUEST_ID_PATTERNS,
  USER_ID_PATTERNS,
  TIMESTAMP_PATTERNS,
  SERVICE_NAME_PATTERNS,
  CUSTOM_CONTEXT_PATTERNS,
} from './context-fields.js';
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
    expect(shouldExcludeFile('logger.test.ts')).toBe(true);
    expect(shouldExcludeFile('logger.spec.ts')).toBe(true);
  });

  it('should exclude __tests__ directory', () => {
    expect(shouldExcludeFile('__tests__/logger.ts')).toBe(true);
  });

  it('should exclude type definition files', () => {
    expect(shouldExcludeFile('types.d.ts')).toBe(true);
  });

  it('should exclude node_modules', () => {
    expect(shouldExcludeFile('node_modules/pino/index.js')).toBe(true);
  });

  it('should not exclude regular source files', () => {
    expect(shouldExcludeFile('src/logger.ts')).toBe(false);
    expect(shouldExcludeFile('lib/context.ts')).toBe(false);
  });
});

// ============================================================================
// Pattern Regex Tests
// ============================================================================

describe('Context Field Patterns', () => {
  describe('REQUEST_ID_PATTERNS', () => {
    it('should match requestId assignment', () => {
      expect(REQUEST_ID_PATTERNS.some(p => p.test('requestId ='))).toBe(true);
    });

    it('should match request_id assignment', () => {
      expect(REQUEST_ID_PATTERNS.some(p => p.test('request_id:'))).toBe(true);
    });

    it('should match traceId assignment', () => {
      expect(REQUEST_ID_PATTERNS.some(p => p.test('traceId ='))).toBe(true);
    });

    it('should match x-request-id header', () => {
      expect(REQUEST_ID_PATTERNS.some(p => p.test('x-request-id'))).toBe(true);
    });
  });

  describe('USER_ID_PATTERNS', () => {
    it('should match userId assignment', () => {
      expect(USER_ID_PATTERNS.some(p => p.test('userId ='))).toBe(true);
    });

    it('should match user_id assignment', () => {
      expect(USER_ID_PATTERNS.some(p => p.test('user_id:'))).toBe(true);
    });

    it('should match userID assignment', () => {
      expect(USER_ID_PATTERNS.some(p => p.test('userID ='))).toBe(true);
    });
  });

  describe('TIMESTAMP_PATTERNS', () => {
    it('should match timestamp assignment', () => {
      expect(TIMESTAMP_PATTERNS.some(p => p.test('timestamp ='))).toBe(true);
    });

    it('should match time with Date', () => {
      expect(TIMESTAMP_PATTERNS.some(p => p.test('time = new Date'))).toBe(true);
    });

    it('should match createdAt assignment', () => {
      expect(TIMESTAMP_PATTERNS.some(p => p.test('createdAt:'))).toBe(true);
    });
  });

  describe('SERVICE_NAME_PATTERNS', () => {
    it('should match serviceName assignment', () => {
      expect(SERVICE_NAME_PATTERNS.some(p => p.test('serviceName ='))).toBe(true);
    });

    it('should match service_name assignment', () => {
      expect(SERVICE_NAME_PATTERNS.some(p => p.test('service_name:'))).toBe(true);
    });

    it('should match service with string', () => {
      expect(SERVICE_NAME_PATTERNS.some(p => p.test("service: '"))).toBe(true);
    });
  });

  describe('CUSTOM_CONTEXT_PATTERNS', () => {
    it('should match context object', () => {
      expect(CUSTOM_CONTEXT_PATTERNS.some(p => p.test('context = {'))).toBe(true);
    });

    it('should match metadata object', () => {
      expect(CUSTOM_CONTEXT_PATTERNS.some(p => p.test('metadata: {'))).toBe(true);
    });

    it('should match .child() call', () => {
      expect(CUSTOM_CONTEXT_PATTERNS.some(p => p.test('.child( {'))).toBe(true);
    });
  });
});

// ============================================================================
// analyzeContextFields Tests
// ============================================================================

describe('analyzeContextFields', () => {
  it('should return empty analysis for excluded files', () => {
    const content = `const requestId = uuid();`;
    const analysis = analyzeContextFields(content, 'logger.test.ts');
    
    expect(analysis.patterns.length).toBe(0);
    expect(analysis.hasRequestId).toBe(false);
    expect(analysis.hasUserId).toBe(false);
    expect(analysis.hasTimestamp).toBe(false);
  });

  it('should detect request ID fields', () => {
    const content = `const requestId = uuid();`;
    const analysis = analyzeContextFields(content, 'logger.ts');
    
    expect(analysis.hasRequestId).toBe(true);
    expect(analysis.patterns.some(p => p.type === 'request-id')).toBe(true);
  });

  it('should detect user ID fields', () => {
    const content = `const userId = user.id;`;
    const analysis = analyzeContextFields(content, 'logger.ts');
    
    expect(analysis.hasUserId).toBe(true);
    expect(analysis.patterns.some(p => p.type === 'user-id')).toBe(true);
  });

  it('should detect timestamp fields', () => {
    const content = `const timestamp = new Date();`;
    const analysis = analyzeContextFields(content, 'logger.ts');
    
    expect(analysis.hasTimestamp).toBe(true);
    expect(analysis.patterns.some(p => p.type === 'timestamp')).toBe(true);
  });

  it('should detect service name fields', () => {
    const content = `const serviceName = 'user-service';`;
    const analysis = analyzeContextFields(content, 'logger.ts');
    
    expect(analysis.patterns.some(p => p.type === 'service-name')).toBe(true);
  });

  it('should detect custom context patterns', () => {
    const content = `const context = { userId, requestId };`;
    const analysis = analyzeContextFields(content, 'logger.ts');
    
    expect(analysis.patterns.some(p => p.type === 'custom-context')).toBe(true);
  });

  it('should collect unique context field types', () => {
    const content = `
      const requestId = uuid();
      const userId = user.id;
      const timestamp = new Date();
    `;
    const analysis = analyzeContextFields(content, 'logger.ts');
    
    expect(analysis.contextFields).toContain('request-id');
    expect(analysis.contextFields).toContain('user-id');
    expect(analysis.contextFields).toContain('timestamp');
  });

  it('should handle files without context fields', () => {
    const content = `const x = 1 + 2;`;
    const analysis = analyzeContextFields(content, 'utils.ts');
    
    expect(analysis.patterns.length).toBe(0);
    expect(analysis.hasRequestId).toBe(false);
    expect(analysis.hasUserId).toBe(false);
    expect(analysis.hasTimestamp).toBe(false);
  });

  it('should detect x-request-id header', () => {
    const content = `const requestId = req.headers['x-request-id'];`;
    const analysis = analyzeContextFields(content, 'middleware.ts');
    
    expect(analysis.hasRequestId).toBe(true);
  });

  it('should detect child logger context', () => {
    const content = `const childLogger = logger.child({ requestId, userId });`;
    const analysis = analyzeContextFields(content, 'logger.ts');
    
    expect(analysis.patterns.some(p => p.type === 'custom-context')).toBe(true);
  });
});

// ============================================================================
// Detector Class Tests
// ============================================================================

describe('ContextFieldsDetector', () => {
  it('should create detector with correct properties', () => {
    const detector = createContextFieldsDetector();
    
    expect(detector.id).toBe('logging/context-fields');
    expect(detector.category).toBe('logging');
    expect(detector.subcategory).toBe('context-fields');
    expect(detector.supportedLanguages).toContain('typescript');
    expect(detector.supportedLanguages).toContain('javascript');
  });

  it('should return empty result for unsupported languages', async () => {
    const detector = new ContextFieldsDetector();
    const context = createMockContext('styles.css', 'body { color: red; }');
    context.language = 'css';
    
    const result = await detector.detect(context);
    
    expect(result.patterns.length).toBe(0);
    expect(result.violations.length).toBe(0);
  });

  it('should detect patterns in TypeScript files', async () => {
    const detector = new ContextFieldsDetector();
    const content = `
      const requestId = uuid();
      const userId = user.id;
    `;
    const context = createMockContext('logger.ts', content);
    
    const result = await detector.detect(context);
    
    expect(result.confidence).toBe(0.9);
  });

  it('should return empty result for files without context fields', async () => {
    const detector = new ContextFieldsDetector();
    const content = `const x = 1 + 2;`;
    const context = createMockContext('utils.ts', content);
    
    const result = await detector.detect(context);
    
    expect(result.patterns.length).toBe(0);
  });

  it('should include context field info in metadata', async () => {
    const detector = new ContextFieldsDetector();
    const content = `const requestId = uuid();`;
    const context = createMockContext('logger.ts', content);
    
    const result = await detector.detect(context);
    
    expect(result.metadata?.custom?.hasRequestId).toBe(true);
    expect(result.metadata?.custom?.contextFields).toBeDefined();
  });

  it('should return null for generateQuickFix', () => {
    const detector = new ContextFieldsDetector();
    const violation = {
      id: 'test-violation',
      patternId: 'logging/context-fields',
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
