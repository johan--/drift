/**
 * Retry Patterns Detector Tests
 * @requirements 10.7 - Retry pattern detection
 * @requirements 10.8 - Timeout handling detection
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  RetryPatternsDetector,
  createRetryPatternsDetector,
  analyzeRetryPatterns,
  detectExponentialBackoff,
  detectLinearRetry,
  detectCircuitBreaker,
  detectRetryLibraries,
  detectTimeoutConfig,
  detectMissingRetryViolations,
  detectInfiniteRetryViolations,
  detectMissingTimeoutViolations,
  shouldExcludeFile,
  extractMaxRetries,
  extractTimeout,
  type RetryPatternType,
  type RetryPatternInfo,
} from './retry-patterns.js';

describe('RetryPatternsDetector', () => {
  let detector: RetryPatternsDetector;

  beforeEach(() => {
    detector = createRetryPatternsDetector();
  });

  describe('detector metadata', () => {
    it('should have correct id', () => {
      expect(detector.id).toBe('api/retry-patterns');
    });

    it('should have correct name', () => {
      expect(detector.name).toBe('Retry Patterns Detector');
    });

    it('should support typescript and javascript', () => {
      expect(detector.supportedLanguages).toContain('typescript');
      expect(detector.supportedLanguages).toContain('javascript');
    });

    it('should be in api category', () => {
      expect(detector.category).toBe('api');
    });
  });

  describe('detect', () => {
    it('should detect retry patterns', async () => {
      const content = `
        async function fetchWithRetry(url, maxRetries = 3) {
          for (let retry = 0; retry < maxRetries; retry++) {
            try {
              return await fetch(url);
            } catch (error) {
              const delay = Math.pow(2, retry) * 1000;
              await new Promise(r => setTimeout(r, delay));
            }
          }
        }
      `;
      const result = await detector.detect({ content, file: 'lib/api.ts', language: 'typescript', ast: null, imports: [], exports: [], projectContext: { rootDir: '', files: [], config: {} }, extension: '.ts', isTestFile: false, isTypeDefinition: false });
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should skip test files', async () => {
      const content = `Math.pow(2, retry)`;
      const result = await detector.detect({ content, file: 'lib/api.test.ts', language: 'typescript', ast: null, imports: [], exports: [], projectContext: { rootDir: '', files: [], config: {} }, extension: '.ts', isTestFile: true, isTypeDefinition: false });
      expect(result.patterns).toHaveLength(0);
    });
  });
});


describe('shouldExcludeFile', () => {
  it('should exclude test files', () => {
    expect(shouldExcludeFile('lib/retry.test.ts')).toBe(true);
    expect(shouldExcludeFile('lib/retry.spec.ts')).toBe(true);
  });

  it('should not exclude regular files', () => {
    expect(shouldExcludeFile('lib/retry.ts')).toBe(false);
    expect(shouldExcludeFile('utils/api.ts')).toBe(false);
  });
});

describe('extractMaxRetries', () => {
  it('should extract maxRetries value', () => {
    expect(extractMaxRetries('maxRetries = 3')).toBe(3);
    expect(extractMaxRetries('max_retries: 5')).toBe(5);
    expect(extractMaxRetries('retryLimit = 10')).toBe(10);
  });

  it('should return undefined when not found', () => {
    expect(extractMaxRetries('const x = 1')).toBeUndefined();
  });
});

describe('extractTimeout', () => {
  it('should extract timeout value', () => {
    expect(extractTimeout('timeout: 5000')).toBe(5000);
    expect(extractTimeout('timeout: 30000')).toBe(30000);
  });

  it('should return undefined when not found', () => {
    expect(extractTimeout('const x = 1')).toBeUndefined();
  });
});

describe('detectExponentialBackoff', () => {
  it('should detect Math.pow pattern', () => {
    const content = `const delay = Math.pow(2, retryCount) * 1000;`;
    const patterns = detectExponentialBackoff(content, 'lib/retry.ts');
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns[0].type).toBe('exponential-backoff');
  });

  it('should detect ** operator pattern', () => {
    const content = `const delay = 2 ** attempt * 1000;`;
    const patterns = detectExponentialBackoff(content, 'lib/retry.ts');
    expect(patterns.length).toBeGreaterThan(0);
  });

  it('should detect exponentialBackoff function', () => {
    const content = `import { exponentialBackoff } from 'utils';`;
    const patterns = detectExponentialBackoff(content, 'lib/retry.ts');
    expect(patterns.length).toBeGreaterThan(0);
  });

  it('should skip patterns in comments', () => {
    const content = `// Math.pow(2, retry)`;
    const patterns = detectExponentialBackoff(content, 'lib/retry.ts');
    expect(patterns).toHaveLength(0);
  });
});

describe('detectLinearRetry', () => {
  it('should detect retry count comparisons', () => {
    const content = `if (retryCount < 3) { retry(); }`;
    const patterns = detectLinearRetry(content, 'lib/retry.ts');
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns[0].type).toBe('linear-retry');
  });

  it('should detect retry loops', () => {
    const content = `for (let retry = 0; retry < 3; retry++) {}`;
    const patterns = detectLinearRetry(content, 'lib/retry.ts');
    expect(patterns.length).toBeGreaterThan(0);
  });

  it('should detect setTimeout', () => {
    const content = `setTimeout(retry, 1000);`;
    const patterns = detectLinearRetry(content, 'lib/retry.ts');
    expect(patterns.length).toBeGreaterThan(0);
  });
});

describe('detectCircuitBreaker', () => {
  it('should detect circuitBreaker keyword', () => {
    const content = `const circuitBreaker = new CircuitBreaker(fn);`;
    const patterns = detectCircuitBreaker(content, 'lib/resilience.ts');
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns[0].type).toBe('circuit-breaker');
  });

  it('should detect state patterns', () => {
    const content = `if (this.state === 'open state') { return fallback(); }`;
    const patterns = detectCircuitBreaker(content, 'lib/resilience.ts');
    expect(patterns.length).toBeGreaterThan(0);
  });

  it('should detect failure threshold', () => {
    const content = `const failureThreshold = 5;`;
    const patterns = detectCircuitBreaker(content, 'lib/resilience.ts');
    expect(patterns.length).toBeGreaterThan(0);
  });
});

describe('detectRetryLibraries', () => {
  it('should detect axios-retry', () => {
    const content = `import axiosRetry from 'axios-retry';`;
    const patterns = detectRetryLibraries(content, 'lib/api.ts');
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns[0].type).toBe('retry-library');
  });

  it('should detect p-retry', () => {
    const content = `import pRetry from 'p-retry';`;
    const patterns = detectRetryLibraries(content, 'lib/api.ts');
    expect(patterns.length).toBeGreaterThan(0);
  });

  it('should detect cockatiel', () => {
    const content = `import { retry } from 'cockatiel';`;
    const patterns = detectRetryLibraries(content, 'lib/api.ts');
    expect(patterns.length).toBeGreaterThan(0);
  });
});

describe('detectTimeoutConfig', () => {
  it('should detect timeout configuration', () => {
    const content = `const config = { timeout: 5000 };`;
    const patterns = detectTimeoutConfig(content, 'lib/api.ts');
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns[0].type).toBe('timeout-config');
  });

  it('should detect AbortController', () => {
    const content = `const controller = new AbortController();`;
    const patterns = detectTimeoutConfig(content, 'lib/api.ts');
    expect(patterns.length).toBeGreaterThan(0);
  });

  it('should detect signal configuration', () => {
    const content = `fetch(url, { signal: controller.signal });`;
    const patterns = detectTimeoutConfig(content, 'lib/api.ts');
    expect(patterns.length).toBeGreaterThan(0);
  });
});


describe('detectMissingRetryViolations', () => {
  it('should flag network calls without retry in API files', () => {
    const content = `const data = await fetch('/api/users');`;
    const patterns: RetryPatternInfo[] = [];
    const violations = detectMissingRetryViolations(patterns, content, 'lib/api-client.ts');
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].type).toBe('missing-retry');
  });

  it('should not flag when retry logic exists', () => {
    const content = `const data = await fetch('/api/users');`;
    const patterns: RetryPatternInfo[] = [
      { type: 'exponential-backoff', file: 'lib/api.ts', line: 1, column: 1, matchedText: 'Math.pow(2, retry)' },
    ];
    const violations = detectMissingRetryViolations(patterns, content, 'lib/api-client.ts');
    expect(violations).toHaveLength(0);
  });
});

describe('detectInfiniteRetryViolations', () => {
  it('should flag retry without max limit', () => {
    const patterns: RetryPatternInfo[] = [
      { type: 'linear-retry', file: 'lib/api.ts', line: 1, column: 1, matchedText: 'while (retry)' },
    ];
    const violations = detectInfiniteRetryViolations(patterns, 'while (retry) {}', 'lib/api.ts');
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].type).toBe('infinite-retry');
  });

  it('should not flag when maxRetries is set', () => {
    const patterns: RetryPatternInfo[] = [
      { type: 'linear-retry', file: 'lib/api.ts', line: 1, column: 1, matchedText: 'retry < 3', maxRetries: 3 },
    ];
    const violations = detectInfiniteRetryViolations(patterns, 'retry < 3', 'lib/api.ts');
    expect(violations).toHaveLength(0);
  });
});

describe('detectMissingTimeoutViolations', () => {
  it('should flag network calls without timeout in API files', () => {
    const content = `const data = await fetch('/api/users');`;
    const patterns: RetryPatternInfo[] = [];
    const violations = detectMissingTimeoutViolations(patterns, content, 'lib/api-client.ts');
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].type).toBe('missing-timeout');
  });

  it('should not flag when timeout config exists', () => {
    const content = `const data = await fetch('/api/users');`;
    const patterns: RetryPatternInfo[] = [
      { type: 'timeout-config', file: 'lib/api.ts', line: 1, column: 1, matchedText: 'timeout: 5000' },
    ];
    const violations = detectMissingTimeoutViolations(patterns, content, 'lib/api-client.ts');
    expect(violations).toHaveLength(0);
  });
});

describe('analyzeRetryPatterns', () => {
  it('should analyze retry patterns comprehensively', () => {
    const content = `
      async function fetchWithRetry(url, maxRetries = 3) {
        for (let retry = 0; retry < maxRetries; retry++) {
          try {
            const controller = new AbortController();
            setTimeout(() => controller.abort(), 5000);
            return await fetch(url, { signal: controller.signal });
          } catch (error) {
            const delay = Math.pow(2, retry) * 1000;
            await new Promise(r => setTimeout(r, delay));
          }
        }
      }
    `;
    const analysis = analyzeRetryPatterns(content, 'lib/api.ts');
    
    expect(analysis.retryPatterns.length).toBeGreaterThan(0);
    expect(analysis.hasRetryLogic).toBe(true);
    expect(analysis.hasTimeoutConfig).toBe(true);
  });

  it('should return empty analysis for excluded files', () => {
    const content = `Math.pow(2, retry)`;
    const analysis = analyzeRetryPatterns(content, 'lib/api.test.ts');
    
    expect(analysis.retryPatterns).toHaveLength(0);
    expect(analysis.violations).toHaveLength(0);
    expect(analysis.hasRetryLogic).toBe(false);
  });

  it('should detect dominant pattern type', () => {
    const content = `
      Math.pow(2, retry);
      Math.pow(2, attempt);
      delay *= 2;
    `;
    const analysis = analyzeRetryPatterns(content, 'lib/retry.ts');
    expect(analysis.dominantPattern).toBe('exponential-backoff');
  });
});

describe('real-world retry patterns', () => {
  it('should handle axios-retry configuration', () => {
    const content = `
      import axios from 'axios';
      import axiosRetry from 'axios-retry';
      
      const client = axios.create({
        baseURL: '/api',
        timeout: 10000,
      });
      
      axiosRetry(client, {
        retries: 3,
        retryDelay: axiosRetry.exponentialDelay,
        retryCondition: (error) => axiosRetry.isNetworkOrIdempotentRequestError(error),
      });
    `;
    const analysis = analyzeRetryPatterns(content, 'lib/api.ts');
    expect(analysis.hasRetryLogic).toBe(true);
    expect(analysis.hasTimeoutConfig).toBe(true);
  });

  it('should handle custom retry with exponential backoff', () => {
    const content = `
      async function withRetry<T>(
        fn: () => Promise<T>,
        maxRetries = 3,
        baseDelay = 1000
      ): Promise<T> {
        let lastError: Error;
        
        for (let attempt = 0; attempt < maxRetries; attempt++) {
          try {
            return await fn();
          } catch (error) {
            lastError = error as Error;
            const delay = baseDelay * Math.pow(2, attempt);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
        
        throw lastError!;
      }
    `;
    const analysis = analyzeRetryPatterns(content, 'lib/retry.ts');
    expect(analysis.retryPatterns.some(p => p.type === 'exponential-backoff')).toBe(true);
  });

  it('should handle circuit breaker pattern', () => {
    const content = `
      class CircuitBreaker {
        private state: 'closed' | 'open' | 'half-open' = 'closed';
        private failureCount = 0;
        private failureThreshold = 5;
        private resetTimeout = 30000;
        
        async execute<T>(fn: () => Promise<T>): Promise<T> {
          if (this.state === 'open') {
            throw new Error('Circuit is open');
          }
          
          try {
            const result = await fn();
            this.onSuccess();
            return result;
          } catch (error) {
            this.onFailure();
            throw error;
          }
        }
      }
    `;
    const analysis = analyzeRetryPatterns(content, 'lib/circuit-breaker.ts');
    expect(analysis.retryPatterns.some(p => p.type === 'circuit-breaker')).toBe(true);
  });
});