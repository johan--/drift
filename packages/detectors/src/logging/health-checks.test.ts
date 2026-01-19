/**
 * Health Checks Detector Tests
 *
 * Tests for health check pattern detection.
 *
 * @requirements 15.7 - Health check patterns
 */

import { describe, it, expect } from 'vitest';
import {
  HealthChecksDetector,
  createHealthChecksDetector,
  analyzeHealthChecks,
  shouldExcludeFile,
  HEALTH_ENDPOINT_PATTERNS,
  LIVENESS_PROBE_PATTERNS,
  READINESS_PROBE_PATTERNS,
  HEALTH_CHECK_FUNCTION_PATTERNS,
  DEPENDENCY_CHECK_PATTERNS,
} from './health-checks.js';
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
    expect(shouldExcludeFile('health.test.ts')).toBe(true);
    expect(shouldExcludeFile('health.spec.ts')).toBe(true);
  });

  it('should exclude __tests__ directory', () => {
    expect(shouldExcludeFile('__tests__/health.ts')).toBe(true);
  });

  it('should exclude type definition files', () => {
    expect(shouldExcludeFile('types.d.ts')).toBe(true);
  });

  it('should exclude node_modules', () => {
    expect(shouldExcludeFile('node_modules/express/index.js')).toBe(true);
  });

  it('should not exclude regular source files', () => {
    expect(shouldExcludeFile('src/health.ts')).toBe(false);
    expect(shouldExcludeFile('lib/routes.ts')).toBe(false);
  });
});

// ============================================================================
// Pattern Regex Tests
// ============================================================================

describe('Health Check Patterns', () => {
  describe('HEALTH_ENDPOINT_PATTERNS', () => {
    it('should match /health endpoint', () => {
      expect(HEALTH_ENDPOINT_PATTERNS.some(p => p.test("'/health'"))).toBe(true);
    });

    it('should match /healthz endpoint', () => {
      expect(HEALTH_ENDPOINT_PATTERNS.some(p => p.test("'/healthz'"))).toBe(true);
    });

    it('should match /health/live endpoint', () => {
      expect(HEALTH_ENDPOINT_PATTERNS.some(p => p.test("'/health/live'"))).toBe(true);
    });

    it('should match /health/ready endpoint', () => {
      expect(HEALTH_ENDPOINT_PATTERNS.some(p => p.test("'/health/ready'"))).toBe(true);
    });

    it('should match /_health endpoint', () => {
      expect(HEALTH_ENDPOINT_PATTERNS.some(p => p.test("'/_health'"))).toBe(true);
    });
  });

  describe('LIVENESS_PROBE_PATTERNS', () => {
    it('should match liveness keyword', () => {
      expect(LIVENESS_PROBE_PATTERNS.some(p => p.test('liveness'))).toBe(true);
    });

    it('should match /live path', () => {
      expect(LIVENESS_PROBE_PATTERNS.some(p => p.test('/live'))).toBe(true);
    });

    it('should match isAlive function', () => {
      expect(LIVENESS_PROBE_PATTERNS.some(p => p.test('isAlive'))).toBe(true);
    });

    it('should match livenessProbe config', () => {
      expect(LIVENESS_PROBE_PATTERNS.some(p => p.test('livenessProbe'))).toBe(true);
    });
  });

  describe('READINESS_PROBE_PATTERNS', () => {
    it('should match readiness keyword', () => {
      expect(READINESS_PROBE_PATTERNS.some(p => p.test('readiness'))).toBe(true);
    });

    it('should match /ready path', () => {
      expect(READINESS_PROBE_PATTERNS.some(p => p.test('/ready'))).toBe(true);
    });

    it('should match isReady function', () => {
      expect(READINESS_PROBE_PATTERNS.some(p => p.test('isReady'))).toBe(true);
    });

    it('should match readinessProbe config', () => {
      expect(READINESS_PROBE_PATTERNS.some(p => p.test('readinessProbe'))).toBe(true);
    });
  });

  describe('HEALTH_CHECK_FUNCTION_PATTERNS', () => {
    it('should match healthCheck function', () => {
      expect(HEALTH_CHECK_FUNCTION_PATTERNS.some(p => p.test('healthCheck('))).toBe(true);
    });

    it('should match checkHealth function', () => {
      expect(HEALTH_CHECK_FUNCTION_PATTERNS.some(p => p.test('checkHealth('))).toBe(true);
    });

    it('should match getHealth function', () => {
      expect(HEALTH_CHECK_FUNCTION_PATTERNS.some(p => p.test('getHealth('))).toBe(true);
    });

    it('should match healthStatus function', () => {
      expect(HEALTH_CHECK_FUNCTION_PATTERNS.some(p => p.test('healthStatus('))).toBe(true);
    });
  });

  describe('DEPENDENCY_CHECK_PATTERNS', () => {
    it('should match checkDatabase function', () => {
      expect(DEPENDENCY_CHECK_PATTERNS.some(p => p.test('checkDatabase('))).toBe(true);
    });

    it('should match checkRedis function', () => {
      expect(DEPENDENCY_CHECK_PATTERNS.some(p => p.test('checkRedis('))).toBe(true);
    });

    it('should match checkDependencies function', () => {
      expect(DEPENDENCY_CHECK_PATTERNS.some(p => p.test('checkDependencies('))).toBe(true);
    });

    it('should match pingDatabase function', () => {
      expect(DEPENDENCY_CHECK_PATTERNS.some(p => p.test('pingDatabase('))).toBe(true);
    });
  });
});

// ============================================================================
// analyzeHealthChecks Tests
// ============================================================================

describe('analyzeHealthChecks', () => {
  it('should return empty analysis for excluded files', () => {
    const content = `app.get('/health', healthCheck);`;
    const analysis = analyzeHealthChecks(content, 'health.test.ts');
    
    expect(analysis.patterns.length).toBe(0);
    expect(analysis.hasHealthEndpoint).toBe(false);
    expect(analysis.hasLivenessProbe).toBe(false);
    expect(analysis.hasReadinessProbe).toBe(false);
  });

  it('should detect health endpoint', () => {
    const content = `app.get('/health', (req, res) => res.json({ status: 'ok' }));`;
    const analysis = analyzeHealthChecks(content, 'routes.ts');
    
    expect(analysis.hasHealthEndpoint).toBe(true);
    expect(analysis.patterns.some(p => p.type === 'health-endpoint')).toBe(true);
  });

  it('should detect healthz endpoint', () => {
    const content = `app.get('/healthz', healthHandler);`;
    const analysis = analyzeHealthChecks(content, 'routes.ts');
    
    expect(analysis.hasHealthEndpoint).toBe(true);
  });

  it('should detect liveness probe', () => {
    const content = `
      const livenessProbe = async () => {
        return { status: 'alive' };
      };
    `;
    const analysis = analyzeHealthChecks(content, 'health.ts');
    
    expect(analysis.hasLivenessProbe).toBe(true);
    expect(analysis.patterns.some(p => p.type === 'liveness-probe')).toBe(true);
  });

  it('should detect readiness probe', () => {
    const content = `
      const readinessProbe = async () => {
        return { status: 'ready' };
      };
    `;
    const analysis = analyzeHealthChecks(content, 'health.ts');
    
    expect(analysis.hasReadinessProbe).toBe(true);
    expect(analysis.patterns.some(p => p.type === 'readiness-probe')).toBe(true);
  });

  it('should detect health check function', () => {
    const content = `
      async function healthCheck() {
        return { status: 'healthy' };
      }
    `;
    const analysis = analyzeHealthChecks(content, 'health.ts');
    
    expect(analysis.patterns.some(p => p.type === 'health-check-function')).toBe(true);
  });

  it('should detect dependency check', () => {
    const content = `
      async function checkDatabase() {
        await db.ping();
      }
    `;
    const analysis = analyzeHealthChecks(content, 'health.ts');
    
    expect(analysis.patterns.some(p => p.type === 'dependency-check')).toBe(true);
  });

  it('should detect isAlive function', () => {
    const content = `const isAlive = () => true;`;
    const analysis = analyzeHealthChecks(content, 'health.ts');
    
    expect(analysis.hasLivenessProbe).toBe(true);
  });

  it('should detect isReady function', () => {
    const content = `const isReady = () => dbConnected;`;
    const analysis = analyzeHealthChecks(content, 'health.ts');
    
    expect(analysis.hasReadinessProbe).toBe(true);
  });

  it('should detect /health/live endpoint', () => {
    const content = `app.get('/health/live', livenessHandler);`;
    const analysis = analyzeHealthChecks(content, 'routes.ts');
    
    expect(analysis.hasHealthEndpoint).toBe(true);
  });

  it('should detect /health/ready endpoint', () => {
    const content = `app.get('/health/ready', readinessHandler);`;
    const analysis = analyzeHealthChecks(content, 'routes.ts');
    
    expect(analysis.hasHealthEndpoint).toBe(true);
  });

  it('should handle files without health checks', () => {
    const content = `const x = 1 + 2;`;
    const analysis = analyzeHealthChecks(content, 'utils.ts');
    
    expect(analysis.patterns.length).toBe(0);
    expect(analysis.hasHealthEndpoint).toBe(false);
    expect(analysis.hasLivenessProbe).toBe(false);
    expect(analysis.hasReadinessProbe).toBe(false);
  });

  it('should detect multiple health patterns', () => {
    const content = `
      app.get('/health', healthCheck);
      app.get('/health/live', livenessProbe);
      app.get('/health/ready', readinessProbe);
    `;
    const analysis = analyzeHealthChecks(content, 'routes.ts');
    
    expect(analysis.hasHealthEndpoint).toBe(true);
    expect(analysis.hasLivenessProbe).toBe(true);
    expect(analysis.hasReadinessProbe).toBe(true);
  });

  it('should detect checkRedis dependency check', () => {
    const content = `await checkRedis();`;
    const analysis = analyzeHealthChecks(content, 'health.ts');
    
    expect(analysis.patterns.some(p => p.type === 'dependency-check')).toBe(true);
  });

  it('should detect pingDatabase dependency check', () => {
    const content = `await pingDatabase();`;
    const analysis = analyzeHealthChecks(content, 'health.ts');
    
    expect(analysis.patterns.some(p => p.type === 'dependency-check')).toBe(true);
  });
});

// ============================================================================
// Detector Class Tests
// ============================================================================

describe('HealthChecksDetector', () => {
  it('should create detector with correct properties', () => {
    const detector = createHealthChecksDetector();
    
    expect(detector.id).toBe('logging/health-checks');
    expect(detector.category).toBe('logging');
    expect(detector.subcategory).toBe('health-checks');
    expect(detector.supportedLanguages).toContain('typescript');
    expect(detector.supportedLanguages).toContain('javascript');
  });

  it('should return empty result for unsupported languages', async () => {
    const detector = new HealthChecksDetector();
    const context = createMockContext('styles.css', 'body { color: red; }');
    context.language = 'css';
    
    const result = await detector.detect(context);
    
    expect(result.patterns.length).toBe(0);
    expect(result.violations.length).toBe(0);
  });

  it('should detect patterns in TypeScript files', async () => {
    const detector = new HealthChecksDetector();
    const content = `
      app.get('/health', healthCheck);
      app.get('/health/live', livenessProbe);
    `;
    const context = createMockContext('routes.ts', content);
    
    const result = await detector.detect(context);
    
    expect(result.confidence).toBe(0.9);
  });

  it('should return empty result for files without health checks', async () => {
    const detector = new HealthChecksDetector();
    const content = `const x = 1 + 2;`;
    const context = createMockContext('utils.ts', content);
    
    const result = await detector.detect(context);
    
    expect(result.patterns.length).toBe(0);
  });

  it('should include health check info in metadata', async () => {
    const detector = new HealthChecksDetector();
    const content = `app.get('/health', healthCheck);`;
    const context = createMockContext('routes.ts', content);
    
    const result = await detector.detect(context);
    
    expect(result.metadata?.custom?.hasHealthEndpoint).toBe(true);
    expect(result.metadata?.custom?.hasLivenessProbe).toBeDefined();
    expect(result.metadata?.custom?.hasReadinessProbe).toBeDefined();
  });

  it('should return null for generateQuickFix', () => {
    const detector = new HealthChecksDetector();
    const violation = {
      id: 'test-violation',
      patternId: 'logging/health-checks',
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
