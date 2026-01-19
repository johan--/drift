/**
 * Correlation IDs Detector Tests
 *
 * Tests for request correlation ID pattern detection.
 *
 * @requirements 15.4 - Request tracing patterns
 */

import { describe, it, expect } from 'vitest';
import {
  CorrelationIdsDetector,
  createCorrelationIdsDetector,
  analyzeCorrelationIds,
  shouldExcludeFile,
  CORRELATION_ID_PATTERNS,
  TRACE_ID_PATTERNS,
  SPAN_ID_PATTERNS,
  REQUEST_ID_PATTERNS,
  PROPAGATION_PATTERNS,
} from './correlation-ids.js';
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
    expect(shouldExcludeFile('tracing.test.ts')).toBe(true);
    expect(shouldExcludeFile('tracing.spec.ts')).toBe(true);
  });

  it('should exclude __tests__ directory', () => {
    expect(shouldExcludeFile('__tests__/tracing.ts')).toBe(true);
  });

  it('should exclude type definition files', () => {
    expect(shouldExcludeFile('types.d.ts')).toBe(true);
  });

  it('should exclude node_modules', () => {
    expect(shouldExcludeFile('node_modules/opentelemetry/index.js')).toBe(true);
  });

  it('should not exclude regular source files', () => {
    expect(shouldExcludeFile('src/tracing.ts')).toBe(false);
    expect(shouldExcludeFile('lib/correlation.ts')).toBe(false);
  });
});

// ============================================================================
// Pattern Regex Tests
// ============================================================================

describe('Correlation ID Patterns', () => {
  describe('CORRELATION_ID_PATTERNS', () => {
    it('should match correlationId', () => {
      expect(CORRELATION_ID_PATTERNS.some(p => p.test('correlationId'))).toBe(true);
    });

    it('should match correlation_id', () => {
      expect(CORRELATION_ID_PATTERNS.some(p => p.test('correlation_id'))).toBe(true);
    });

    it('should match x-correlation-id header', () => {
      expect(CORRELATION_ID_PATTERNS.some(p => p.test('x-correlation-id'))).toBe(true);
    });
  });

  describe('TRACE_ID_PATTERNS', () => {
    it('should match traceId', () => {
      expect(TRACE_ID_PATTERNS.some(p => p.test('traceId'))).toBe(true);
    });

    it('should match trace_id', () => {
      expect(TRACE_ID_PATTERNS.some(p => p.test('trace_id'))).toBe(true);
    });

    it('should match x-trace-id header', () => {
      expect(TRACE_ID_PATTERNS.some(p => p.test('x-trace-id'))).toBe(true);
    });

    it('should match traceparent header', () => {
      expect(TRACE_ID_PATTERNS.some(p => p.test('traceparent'))).toBe(true);
    });
  });

  describe('SPAN_ID_PATTERNS', () => {
    it('should match spanId', () => {
      expect(SPAN_ID_PATTERNS.some(p => p.test('spanId'))).toBe(true);
    });

    it('should match span_id', () => {
      expect(SPAN_ID_PATTERNS.some(p => p.test('span_id'))).toBe(true);
    });

    it('should match x-span-id header', () => {
      expect(SPAN_ID_PATTERNS.some(p => p.test('x-span-id'))).toBe(true);
    });
  });

  describe('REQUEST_ID_PATTERNS', () => {
    it('should match requestId', () => {
      expect(REQUEST_ID_PATTERNS.some(p => p.test('requestId'))).toBe(true);
    });

    it('should match request_id', () => {
      expect(REQUEST_ID_PATTERNS.some(p => p.test('request_id'))).toBe(true);
    });

    it('should match x-request-id header', () => {
      expect(REQUEST_ID_PATTERNS.some(p => p.test('x-request-id'))).toBe(true);
    });
  });

  describe('PROPAGATION_PATTERNS', () => {
    it('should match propagate call', () => {
      expect(PROPAGATION_PATTERNS.some(p => p.test('propagate('))).toBe(true);
    });

    it('should match inject with context', () => {
      expect(PROPAGATION_PATTERNS.some(p => p.test('inject(context'))).toBe(true);
    });

    it('should match extract with context', () => {
      expect(PROPAGATION_PATTERNS.some(p => p.test('extract(context'))).toBe(true);
    });

    it('should match AsyncLocalStorage', () => {
      expect(PROPAGATION_PATTERNS.some(p => p.test('AsyncLocalStorage'))).toBe(true);
    });
  });
});

// ============================================================================
// analyzeCorrelationIds Tests
// ============================================================================

describe('analyzeCorrelationIds', () => {
  it('should return empty analysis for excluded files', () => {
    const content = `const correlationId = uuid();`;
    const analysis = analyzeCorrelationIds(content, 'tracing.test.ts');
    
    expect(analysis.patterns.length).toBe(0);
    expect(analysis.hasCorrelationId).toBe(false);
    expect(analysis.hasDistributedTracing).toBe(false);
  });

  it('should detect correlation ID usage', () => {
    const content = `const correlationId = uuid();`;
    const analysis = analyzeCorrelationIds(content, 'tracing.ts');
    
    expect(analysis.hasCorrelationId).toBe(true);
    expect(analysis.patterns.some(p => p.type === 'correlation-id')).toBe(true);
  });

  it('should detect request ID usage', () => {
    const content = `const requestId = req.headers['x-request-id'];`;
    const analysis = analyzeCorrelationIds(content, 'middleware.ts');
    
    expect(analysis.hasCorrelationId).toBe(true);
    expect(analysis.patterns.some(p => p.type === 'request-id')).toBe(true);
  });

  it('should detect trace ID usage', () => {
    const content = `const traceId = span.context().traceId;`;
    const analysis = analyzeCorrelationIds(content, 'tracing.ts');
    
    expect(analysis.hasDistributedTracing).toBe(true);
    expect(analysis.patterns.some(p => p.type === 'trace-id')).toBe(true);
  });

  it('should detect span ID usage', () => {
    const content = `const spanId = span.context().spanId;`;
    const analysis = analyzeCorrelationIds(content, 'tracing.ts');
    
    expect(analysis.hasDistributedTracing).toBe(true);
    expect(analysis.patterns.some(p => p.type === 'span-id')).toBe(true);
  });

  it('should detect context propagation', () => {
    const content = `propagate.inject(context, carrier);`;
    const analysis = analyzeCorrelationIds(content, 'tracing.ts');
    
    expect(analysis.patterns.some(p => p.type === 'propagation')).toBe(true);
  });

  it('should detect AsyncLocalStorage usage', () => {
    const content = `const storage = new AsyncLocalStorage();`;
    const analysis = analyzeCorrelationIds(content, 'context.ts');
    
    expect(analysis.patterns.some(p => p.type === 'propagation')).toBe(true);
  });

  it('should detect traceparent header', () => {
    const content = `const traceparent = req.headers['traceparent'];`;
    const analysis = analyzeCorrelationIds(content, 'middleware.ts');
    
    expect(analysis.hasDistributedTracing).toBe(true);
  });

  it('should handle files without correlation IDs', () => {
    const content = `const x = 1 + 2;`;
    const analysis = analyzeCorrelationIds(content, 'utils.ts');
    
    expect(analysis.patterns.length).toBe(0);
    expect(analysis.hasCorrelationId).toBe(false);
    expect(analysis.hasDistributedTracing).toBe(false);
  });

  it('should detect multiple correlation patterns', () => {
    const content = `
      const correlationId = uuid();
      const traceId = span.context().traceId;
      const spanId = span.context().spanId;
    `;
    const analysis = analyzeCorrelationIds(content, 'tracing.ts');
    
    expect(analysis.hasCorrelationId).toBe(true);
    expect(analysis.hasDistributedTracing).toBe(true);
    expect(analysis.patterns.length).toBeGreaterThan(2);
  });
});

// ============================================================================
// Detector Class Tests
// ============================================================================

describe('CorrelationIdsDetector', () => {
  it('should create detector with correct properties', () => {
    const detector = createCorrelationIdsDetector();
    
    expect(detector.id).toBe('logging/correlation-ids');
    expect(detector.category).toBe('logging');
    expect(detector.subcategory).toBe('correlation-ids');
    expect(detector.supportedLanguages).toContain('typescript');
    expect(detector.supportedLanguages).toContain('javascript');
  });

  it('should return empty result for unsupported languages', async () => {
    const detector = new CorrelationIdsDetector();
    const context = createMockContext('styles.css', 'body { color: red; }');
    context.language = 'css';
    
    const result = await detector.detect(context);
    
    expect(result.patterns.length).toBe(0);
    expect(result.violations.length).toBe(0);
  });

  it('should detect patterns in TypeScript files', async () => {
    const detector = new CorrelationIdsDetector();
    const content = `
      const correlationId = uuid();
      const traceId = span.context().traceId;
    `;
    const context = createMockContext('tracing.ts', content);
    
    const result = await detector.detect(context);
    
    expect(result.confidence).toBe(0.9);
  });

  it('should return empty result for files without correlation IDs', async () => {
    const detector = new CorrelationIdsDetector();
    const content = `const x = 1 + 2;`;
    const context = createMockContext('utils.ts', content);
    
    const result = await detector.detect(context);
    
    expect(result.patterns.length).toBe(0);
  });

  it('should include correlation info in metadata', async () => {
    const detector = new CorrelationIdsDetector();
    const content = `const correlationId = uuid();`;
    const context = createMockContext('tracing.ts', content);
    
    const result = await detector.detect(context);
    
    expect(result.metadata?.custom?.hasCorrelationId).toBe(true);
    expect(result.metadata?.custom?.hasDistributedTracing).toBeDefined();
  });

  it('should return null for generateQuickFix', () => {
    const detector = new CorrelationIdsDetector();
    const violation = {
      id: 'test-violation',
      patternId: 'logging/correlation-ids',
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
