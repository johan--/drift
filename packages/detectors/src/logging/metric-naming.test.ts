/**
 * Metric Naming Detector Tests
 *
 * Tests for metric naming convention detection.
 *
 * @requirements 15.6 - Metric naming conventions
 */

import { describe, it, expect } from 'vitest';
import {
  MetricNamingDetector,
  createMetricNamingDetector,
  analyzeMetricNaming,
  shouldExcludeFile,
  COUNTER_METRIC_PATTERNS,
  GAUGE_METRIC_PATTERNS,
  HISTOGRAM_METRIC_PATTERNS,
  SUMMARY_METRIC_PATTERNS,
  METRIC_PREFIX_PATTERNS,
} from './metric-naming.js';
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
    expect(shouldExcludeFile('metrics.test.ts')).toBe(true);
    expect(shouldExcludeFile('metrics.spec.ts')).toBe(true);
  });

  it('should exclude __tests__ directory', () => {
    expect(shouldExcludeFile('__tests__/metrics.ts')).toBe(true);
  });

  it('should exclude type definition files', () => {
    expect(shouldExcludeFile('types.d.ts')).toBe(true);
  });

  it('should exclude node_modules', () => {
    expect(shouldExcludeFile('node_modules/prom-client/index.js')).toBe(true);
  });

  it('should not exclude regular source files', () => {
    expect(shouldExcludeFile('src/metrics.ts')).toBe(false);
    expect(shouldExcludeFile('lib/observability.ts')).toBe(false);
  });
});

// ============================================================================
// Pattern Regex Tests
// ============================================================================

describe('Metric Naming Patterns', () => {
  describe('COUNTER_METRIC_PATTERNS', () => {
    it('should match Counter constructor', () => {
      expect(COUNTER_METRIC_PATTERNS.some(p => p.test("Counter('http_requests_total'"))).toBe(true);
    });

    it('should match createCounter call', () => {
      expect(COUNTER_METRIC_PATTERNS.some(p => p.test("createCounter('requests'"))).toBe(true);
    });

    it('should match .counter method', () => {
      expect(COUNTER_METRIC_PATTERNS.some(p => p.test(".counter('events'"))).toBe(true);
    });

    it('should match _total suffix', () => {
      expect(COUNTER_METRIC_PATTERNS.some(p => p.test('requests_total ='))).toBe(true);
    });

    it('should match _count suffix', () => {
      expect(COUNTER_METRIC_PATTERNS.some(p => p.test('errors_count:'))).toBe(true);
    });
  });

  describe('GAUGE_METRIC_PATTERNS', () => {
    it('should match Gauge constructor', () => {
      expect(GAUGE_METRIC_PATTERNS.some(p => p.test("Gauge('active_connections'"))).toBe(true);
    });

    it('should match createGauge call', () => {
      expect(GAUGE_METRIC_PATTERNS.some(p => p.test("createGauge('memory_usage'"))).toBe(true);
    });

    it('should match .gauge method', () => {
      expect(GAUGE_METRIC_PATTERNS.some(p => p.test(".gauge('temperature'"))).toBe(true);
    });
  });

  describe('HISTOGRAM_METRIC_PATTERNS', () => {
    it('should match Histogram constructor', () => {
      expect(HISTOGRAM_METRIC_PATTERNS.some(p => p.test("Histogram('request_duration'"))).toBe(true);
    });

    it('should match createHistogram call', () => {
      expect(HISTOGRAM_METRIC_PATTERNS.some(p => p.test("createHistogram('latency'"))).toBe(true);
    });

    it('should match .histogram method', () => {
      expect(HISTOGRAM_METRIC_PATTERNS.some(p => p.test(".histogram('response_time'"))).toBe(true);
    });

    it('should match _bucket suffix', () => {
      expect(HISTOGRAM_METRIC_PATTERNS.some(p => p.test('latency_bucket ='))).toBe(true);
    });

    it('should match _duration suffix', () => {
      expect(HISTOGRAM_METRIC_PATTERNS.some(p => p.test('request_duration'))).toBe(true);
    });
  });

  describe('SUMMARY_METRIC_PATTERNS', () => {
    it('should match Summary constructor', () => {
      expect(SUMMARY_METRIC_PATTERNS.some(p => p.test("Summary('request_latency'"))).toBe(true);
    });

    it('should match createSummary call', () => {
      expect(SUMMARY_METRIC_PATTERNS.some(p => p.test("createSummary('response_size'"))).toBe(true);
    });

    it('should match .summary method', () => {
      expect(SUMMARY_METRIC_PATTERNS.some(p => p.test(".summary('processing_time'"))).toBe(true);
    });
  });

  describe('METRIC_PREFIX_PATTERNS', () => {
    it('should match http_request_ prefix', () => {
      expect(METRIC_PREFIX_PATTERNS.some(p => p.test('http_request_'))).toBe(true);
    });

    it('should match app_ prefix', () => {
      expect(METRIC_PREFIX_PATTERNS.some(p => p.test('app_'))).toBe(true);
    });

    it('should match service_ prefix', () => {
      expect(METRIC_PREFIX_PATTERNS.some(p => p.test('service_'))).toBe(true);
    });

    it('should match process_ prefix', () => {
      expect(METRIC_PREFIX_PATTERNS.some(p => p.test('process_'))).toBe(true);
    });

    it('should match nodejs_ prefix', () => {
      expect(METRIC_PREFIX_PATTERNS.some(p => p.test('nodejs_'))).toBe(true);
    });
  });
});

// ============================================================================
// analyzeMetricNaming Tests
// ============================================================================

describe('analyzeMetricNaming', () => {
  it('should return empty analysis for excluded files', () => {
    const content = `const counter = new Counter('requests');`;
    const analysis = analyzeMetricNaming(content, 'metrics.test.ts');
    
    expect(analysis.patterns.length).toBe(0);
    expect(analysis.hasMetrics).toBe(false);
    expect(analysis.metricTypes).toEqual([]);
  });

  it('should detect counter metrics', () => {
    const content = `const counter = new Counter('http_requests_total');`;
    const analysis = analyzeMetricNaming(content, 'metrics.ts');
    
    expect(analysis.hasMetrics).toBe(true);
    expect(analysis.patterns.some(p => p.type === 'counter-metric')).toBe(true);
  });

  it('should detect gauge metrics', () => {
    const content = `const gauge = new Gauge('active_connections');`;
    const analysis = analyzeMetricNaming(content, 'metrics.ts');
    
    expect(analysis.hasMetrics).toBe(true);
    expect(analysis.patterns.some(p => p.type === 'gauge-metric')).toBe(true);
  });

  it('should detect histogram metrics', () => {
    const content = `const histogram = new Histogram('request_duration_seconds');`;
    const analysis = analyzeMetricNaming(content, 'metrics.ts');
    
    expect(analysis.hasMetrics).toBe(true);
    expect(analysis.patterns.some(p => p.type === 'histogram-metric')).toBe(true);
  });

  it('should detect summary metrics', () => {
    const content = `const summary = new Summary('response_size_bytes');`;
    const analysis = analyzeMetricNaming(content, 'metrics.ts');
    
    expect(analysis.hasMetrics).toBe(true);
    expect(analysis.patterns.some(p => p.type === 'summary-metric')).toBe(true);
  });

  it('should detect metric prefixes', () => {
    const content = `const metric = 'http_request_duration_seconds';`;
    const analysis = analyzeMetricNaming(content, 'metrics.ts');
    
    expect(analysis.hasMetrics).toBe(true);
    expect(analysis.patterns.some(p => p.type === 'metric-prefix')).toBe(true);
  });

  it('should collect unique metric types', () => {
    const content = `
      const counter = new Counter('requests_total');
      const gauge = new Gauge('connections');
      const histogram = new Histogram('latency');
    `;
    const analysis = analyzeMetricNaming(content, 'metrics.ts');
    
    expect(analysis.metricTypes).toContain('counter-metric');
    expect(analysis.metricTypes).toContain('gauge-metric');
    expect(analysis.metricTypes).toContain('histogram-metric');
  });

  it('should handle files without metrics', () => {
    const content = `const x = 1 + 2;`;
    const analysis = analyzeMetricNaming(content, 'utils.ts');
    
    expect(analysis.patterns.length).toBe(0);
    expect(analysis.hasMetrics).toBe(false);
    expect(analysis.metricTypes).toEqual([]);
  });

  it('should detect createCounter helper', () => {
    const content = `const counter = createCounter('api_calls_total');`;
    const analysis = analyzeMetricNaming(content, 'metrics.ts');
    
    expect(analysis.hasMetrics).toBe(true);
    expect(analysis.patterns.some(p => p.type === 'counter-metric')).toBe(true);
  });

  it('should detect _total suffix pattern', () => {
    const content = `const requests_total = 0;`;
    const analysis = analyzeMetricNaming(content, 'metrics.ts');
    
    expect(analysis.hasMetrics).toBe(true);
  });

  it('should detect _duration pattern', () => {
    const content = `const request_duration = histogram.observe();`;
    const analysis = analyzeMetricNaming(content, 'metrics.ts');
    
    expect(analysis.hasMetrics).toBe(true);
  });
});

// ============================================================================
// Detector Class Tests
// ============================================================================

describe('MetricNamingDetector', () => {
  it('should create detector with correct properties', () => {
    const detector = createMetricNamingDetector();
    
    expect(detector.id).toBe('logging/metric-naming');
    expect(detector.category).toBe('logging');
    expect(detector.subcategory).toBe('metric-naming');
    expect(detector.supportedLanguages).toContain('typescript');
    expect(detector.supportedLanguages).toContain('javascript');
  });

  it('should return empty result for unsupported languages', async () => {
    const detector = new MetricNamingDetector();
    const context = createMockContext('styles.css', 'body { color: red; }');
    context.language = 'css';
    
    const result = await detector.detect(context);
    
    expect(result.patterns.length).toBe(0);
    expect(result.violations.length).toBe(0);
  });

  it('should detect patterns in TypeScript files', async () => {
    const detector = new MetricNamingDetector();
    const content = `
      const counter = new Counter('http_requests_total');
      const gauge = new Gauge('active_connections');
    `;
    const context = createMockContext('metrics.ts', content);
    
    const result = await detector.detect(context);
    
    expect(result.confidence).toBe(0.9);
  });

  it('should return empty result for files without metrics', async () => {
    const detector = new MetricNamingDetector();
    const content = `const x = 1 + 2;`;
    const context = createMockContext('utils.ts', content);
    
    const result = await detector.detect(context);
    
    expect(result.patterns.length).toBe(0);
  });

  it('should include metric info in metadata', async () => {
    const detector = new MetricNamingDetector();
    const content = `const counter = new Counter('requests_total');`;
    const context = createMockContext('metrics.ts', content);
    
    const result = await detector.detect(context);
    
    expect(result.metadata?.custom?.hasMetrics).toBe(true);
    expect(result.metadata?.custom?.metricTypes).toBeDefined();
  });

  it('should return null for generateQuickFix', () => {
    const detector = new MetricNamingDetector();
    const violation = {
      id: 'test-violation',
      patternId: 'logging/metric-naming',
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
