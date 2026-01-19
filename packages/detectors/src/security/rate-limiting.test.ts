/**
 * Rate Limiting Detector Tests
 *
 * Tests for rate limiting and throttling pattern detection.
 *
 * @requirements 16.7 - Rate limiting patterns
 */

import { describe, it, expect } from 'vitest';
import {
  RateLimitingDetector,
  createRateLimitingDetector,
  detectRateLimiters,
  detectThrottling,
  detectRequestQuotas,
  detectSlidingWindow,
  detectTokenBucket,
  detectLeakyBucket,
  detectFixedWindow,
  detectRedisRateLimit,
  detectWeakRateLimits,
  detectHardcodedLimits,
  detectMissingRateLimits,
  analyzeRateLimiting,
  shouldExcludeFile,
} from './rate-limiting.js';
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
    expect(shouldExcludeFile('ratelimit.test.ts')).toBe(true);
    expect(shouldExcludeFile('throttle.spec.ts')).toBe(true);
  });

  it('should exclude minified files', () => {
    expect(shouldExcludeFile('bundle.min.js')).toBe(true);
  });

  it('should not exclude regular source files', () => {
    expect(shouldExcludeFile('src/middleware/ratelimit.ts')).toBe(false);
    expect(shouldExcludeFile('lib/api/throttle.ts')).toBe(false);
  });
});

// ============================================================================
// Rate Limiter Detection Tests
// ============================================================================

describe('detectRateLimiters', () => {
  it('should detect rateLimit function', () => {
    const content = `app.use(rateLimit({ windowMs: 60000, max: 100 }));`;
    const results = detectRateLimiters(content, 'app.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('rate-limiter');
  });

  it('should detect express-rate-limit', () => {
    const content = `import rateLimit from 'express-rate-limit';`;
    const results = detectRateLimiters(content, 'app.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.library).toBe('express-rate-limit');
  });

  it('should detect slowDown middleware', () => {
    const content = `app.use(slowDown({ windowMs: 60000, delayAfter: 50 }));`;
    const results = detectRateLimiters(content, 'app.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Throttling Detection Tests
// ============================================================================

describe('detectThrottling', () => {
  it('should detect throttle function', () => {
    const content = `const throttled = throttle(handler, 1000);`;
    const results = detectThrottling(content, 'utils.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('throttle');
  });

  it('should detect NestJS Throttler', () => {
    const content = `@Throttle(10, 60)`;
    const results = detectThrottling(content, 'controller.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.library).toBe('@nestjs/throttler');
  });

  it('should detect ThrottlerModule', () => {
    const content = `ThrottlerModule.forRoot({ ttl: 60, limit: 10 })`;
    const results = detectThrottling(content, 'app.module.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect RxJS throttleTime', () => {
    const content = `source$.pipe(throttleTime(1000))`;
    const results = detectThrottling(content, 'stream.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.library).toBe('rxjs');
  });
});

// ============================================================================
// Request Quota Detection Tests
// ============================================================================

describe('detectRequestQuotas', () => {
  it('should detect quota variable', () => {
    const content = `const quota = { daily: 1000, monthly: 10000 };`;
    const results = detectRequestQuotas(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('request-quota');
  });

  it('should detect maxRequests', () => {
    const content = `const maxRequests = 100;`;
    const results = detectRequestQuotas(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect requestsPerDay', () => {
    const content = `const requestsPerDay = 10000;`;
    const results = detectRequestQuotas(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Algorithm Detection Tests
// ============================================================================

describe('detectSlidingWindow', () => {
  it('should detect slidingWindow pattern', () => {
    const content = `const limiter = new SlidingWindowLimiter();`;
    const results = detectSlidingWindow(content, 'limiter.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('sliding-window');
    expect(results[0]?.algorithm).toBe('sliding-window');
  });

  it('should detect windowMs option', () => {
    const content = `rateLimit({ windowMs: 60000 })`;
    const results = detectSlidingWindow(content, 'app.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });
});

describe('detectTokenBucket', () => {
  it('should detect tokenBucket pattern', () => {
    const content = `const limiter = new TokenBucket({ capacity: 100 });`;
    const results = detectTokenBucket(content, 'limiter.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('token-bucket');
    expect(results[0]?.algorithm).toBe('token-bucket');
  });

  it('should detect rate-limiter-flexible', () => {
    const content = `const limiter = new RateLimiterMemory({ points: 10 });`;
    const results = detectTokenBucket(content, 'limiter.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.library).toBe('rate-limiter-flexible');
  });
});

describe('detectLeakyBucket', () => {
  it('should detect leakyBucket pattern', () => {
    const content = `const limiter = new LeakyBucket({ capacity: 100 });`;
    const results = detectLeakyBucket(content, 'limiter.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('leaky-bucket');
    expect(results[0]?.algorithm).toBe('leaky-bucket');
  });
});

describe('detectFixedWindow', () => {
  it('should detect fixedWindow pattern', () => {
    const content = `const limiter = new FixedWindowLimiter();`;
    const results = detectFixedWindow(content, 'limiter.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('fixed-window');
    expect(results[0]?.algorithm).toBe('fixed-window');
  });
});

// ============================================================================
// Redis Rate Limit Detection Tests
// ============================================================================

describe('detectRedisRateLimit', () => {
  it('should detect RateLimiterRedis', () => {
    const content = `const limiter = new RateLimiterRedis({ storeClient: redis });`;
    const results = detectRedisRateLimit(content, 'limiter.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('redis-rate-limit');
    expect(results[0]?.library).toBe('redis');
  });

  it('should detect redis.incr for rate limiting', () => {
    const content = `await redis.incr(key);`;
    const results = detectRedisRateLimit(content, 'limiter.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Violation Detection Tests
// ============================================================================

describe('detectWeakRateLimits', () => {
  it('should detect very high max limit', () => {
    const content = `rateLimit({ max: 10000 })`;
    const results = detectWeakRateLimits(content, 'app.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('weak-rate-limit');
    expect(results[0]?.severity).toBe('medium');
  });

  it('should detect very short window', () => {
    const content = `rateLimit({ windowMs: 1000 })`;
    const results = detectWeakRateLimits(content, 'app.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });
});

describe('detectHardcodedLimits', () => {
  it('should detect hardcoded max value when rate limiting exists', () => {
    const content = `
      import rateLimit from 'express-rate-limit';
      app.use(rateLimit({ max: 100 }));
    `;
    const results = detectHardcodedLimits(content, 'app.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('hardcoded-limits');
    expect(results[0]?.severity).toBe('low');
  });

  it('should not flag env variable limits', () => {
    const content = `
      import rateLimit from 'express-rate-limit';
      app.use(rateLimit({ max: process.env.RATE_LIMIT_MAX }));
    `;
    const results = detectHardcodedLimits(content, 'app.ts');
    
    expect(results.length).toBe(0);
  });
});

describe('detectMissingRateLimits', () => {
  it('should detect missing rate limit on route file', () => {
    const content = `
      app.get('/api/users', (req, res) => {
        res.json(users);
      });
    `;
    const results = detectMissingRateLimits(content, 'routes.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('missing-rate-limit');
    expect(results[0]?.severity).toBe('high');
  });

  it('should not flag when rate limiting exists', () => {
    const content = `
      import rateLimit from 'express-rate-limit';
      app.use(rateLimit({ max: 100 }));
      app.get('/api/users', (req, res) => {
        res.json(users);
      });
    `;
    const results = detectMissingRateLimits(content, 'routes.ts');
    
    expect(results.length).toBe(0);
  });
});

// ============================================================================
// Full Analysis Tests
// ============================================================================

describe('analyzeRateLimiting', () => {
  it('should return empty analysis for excluded files', () => {
    const content = `app.use(rateLimit({ max: 100 }));`;
    const analysis = analyzeRateLimiting(content, 'ratelimit.test.ts');
    
    expect(analysis.patterns.length).toBe(0);
    expect(analysis.violations.length).toBe(0);
    expect(analysis.confidence).toBe(1.0);
  });

  it('should detect rate limiting', () => {
    const content = `
      import rateLimit from 'express-rate-limit';
      app.use(rateLimit({ windowMs: 60000, max: 100 }));
    `;
    const analysis = analyzeRateLimiting(content, 'app.ts');
    
    expect(analysis.hasRateLimiting).toBe(true);
    expect(analysis.patterns.length).toBeGreaterThan(0);
    expect(analysis.confidence).toBeGreaterThan(0.8);
  });

  it('should detect Redis usage', () => {
    const content = `const limiter = new RateLimiterRedis({ storeClient: redis });`;
    const analysis = analyzeRateLimiting(content, 'limiter.ts');
    
    expect(analysis.usesRedis).toBe(true);
    expect(analysis.confidence).toBeGreaterThan(0.8);
  });

  it('should detect algorithm', () => {
    const content = `const limiter = new TokenBucket({ capacity: 100 });`;
    const analysis = analyzeRateLimiting(content, 'limiter.ts');
    
    expect(analysis.algorithm).toBe('token-bucket');
  });
});

// ============================================================================
// Detector Class Tests
// ============================================================================

describe('RateLimitingDetector', () => {
  it('should create detector with correct properties', () => {
    const detector = createRateLimitingDetector();
    
    expect(detector.id).toBe('security/rate-limiting');
    expect(detector.category).toBe('security');
    expect(detector.supportedLanguages).toContain('typescript');
    expect(detector.supportedLanguages).toContain('javascript');
  });

  it('should return empty result for unsupported languages', async () => {
    const detector = new RateLimitingDetector();
    const context = createMockContext('styles.css', 'body { color: red; }');
    context.language = 'css';
    
    const result = await detector.detect(context);
    
    expect(result.patterns.length).toBe(0);
    expect(result.violations.length).toBe(0);
  });

  it('should detect patterns in TypeScript files', async () => {
    const detector = new RateLimitingDetector();
    const content = `app.use(rateLimit({ max: 100 }));`;
    const context = createMockContext('app.ts', content);
    
    const result = await detector.detect(context);
    
    expect(result.confidence).toBeGreaterThan(0);
  });
});
