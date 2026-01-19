/**
 * Log Levels Detector Tests
 *
 * Tests for log level usage pattern detection.
 *
 * @requirements 15.2 - Log level usage patterns
 */

import { describe, it, expect } from 'vitest';
import {
  LogLevelsDetector,
  createLogLevelsDetector,
  analyzeLogLevels,
  shouldExcludeFile,
  DEBUG_LEVEL_PATTERNS,
  INFO_LEVEL_PATTERNS,
  WARN_LEVEL_PATTERNS,
  ERROR_LEVEL_PATTERNS,
  FATAL_LEVEL_PATTERNS,
  TRACE_LEVEL_PATTERNS,
  LEVEL_CONFIG_PATTERNS,
} from './log-levels.js';
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
    expect(shouldExcludeFile('node_modules/winston/index.js')).toBe(true);
  });

  it('should not exclude regular source files', () => {
    expect(shouldExcludeFile('src/logger.ts')).toBe(false);
    expect(shouldExcludeFile('lib/logging.ts')).toBe(false);
  });
});

// ============================================================================
// Pattern Regex Tests
// ============================================================================

describe('Log Level Patterns', () => {
  describe('DEBUG_LEVEL_PATTERNS', () => {
    it('should match logger.debug calls', () => {
      expect(DEBUG_LEVEL_PATTERNS.some(p => p.test('logger.debug('))).toBe(true);
    });

    it('should match log.debug calls', () => {
      expect(DEBUG_LEVEL_PATTERNS.some(p => p.test('log.debug('))).toBe(true);
    });

    it('should match console.debug calls', () => {
      expect(DEBUG_LEVEL_PATTERNS.some(p => p.test('console.debug('))).toBe(true);
    });
  });

  describe('INFO_LEVEL_PATTERNS', () => {
    it('should match logger.info calls', () => {
      expect(INFO_LEVEL_PATTERNS.some(p => p.test('logger.info('))).toBe(true);
    });

    it('should match log.info calls', () => {
      expect(INFO_LEVEL_PATTERNS.some(p => p.test('log.info('))).toBe(true);
    });

    it('should match console.info calls', () => {
      expect(INFO_LEVEL_PATTERNS.some(p => p.test('console.info('))).toBe(true);
    });
  });

  describe('WARN_LEVEL_PATTERNS', () => {
    it('should match logger.warn calls', () => {
      expect(WARN_LEVEL_PATTERNS.some(p => p.test('logger.warn('))).toBe(true);
    });

    it('should match log.warn calls', () => {
      expect(WARN_LEVEL_PATTERNS.some(p => p.test('log.warn('))).toBe(true);
    });

    it('should match console.warn calls', () => {
      expect(WARN_LEVEL_PATTERNS.some(p => p.test('console.warn('))).toBe(true);
    });
  });

  describe('ERROR_LEVEL_PATTERNS', () => {
    it('should match logger.error calls', () => {
      expect(ERROR_LEVEL_PATTERNS.some(p => p.test('logger.error('))).toBe(true);
    });

    it('should match log.error calls', () => {
      expect(ERROR_LEVEL_PATTERNS.some(p => p.test('log.error('))).toBe(true);
    });

    it('should match console.error calls', () => {
      expect(ERROR_LEVEL_PATTERNS.some(p => p.test('console.error('))).toBe(true);
    });
  });

  describe('FATAL_LEVEL_PATTERNS', () => {
    it('should match logger.fatal calls', () => {
      expect(FATAL_LEVEL_PATTERNS.some(p => p.test('logger.fatal('))).toBe(true);
    });

    it('should match log.fatal calls', () => {
      expect(FATAL_LEVEL_PATTERNS.some(p => p.test('log.fatal('))).toBe(true);
    });
  });

  describe('TRACE_LEVEL_PATTERNS', () => {
    it('should match logger.trace calls', () => {
      expect(TRACE_LEVEL_PATTERNS.some(p => p.test('logger.trace('))).toBe(true);
    });

    it('should match log.trace calls', () => {
      expect(TRACE_LEVEL_PATTERNS.some(p => p.test('log.trace('))).toBe(true);
    });
  });

  describe('LEVEL_CONFIG_PATTERNS', () => {
    it('should match level config with debug', () => {
      expect(LEVEL_CONFIG_PATTERNS.some(p => new RegExp(p.source, p.flags).test("level: 'debug'"))).toBe(true);
    });

    it('should match level config with info', () => {
      expect(LEVEL_CONFIG_PATTERNS.some(p => new RegExp(p.source, p.flags).test("level: 'info'"))).toBe(true);
    });

    it('should match LOG_LEVEL assignment', () => {
      expect(LEVEL_CONFIG_PATTERNS.some(p => new RegExp(p.source, p.flags).test('LOG_LEVEL='))).toBe(true);
    });

    it('should match logLevel assignment', () => {
      expect(LEVEL_CONFIG_PATTERNS.some(p => new RegExp(p.source, p.flags).test('logLevel:'))).toBe(true);
    });
  });
});

// ============================================================================
// analyzeLogLevels Tests
// ============================================================================

describe('analyzeLogLevels', () => {
  it('should return empty analysis for excluded files', () => {
    const content = `logger.info('test');`;
    const analysis = analyzeLogLevels(content, 'logger.test.ts');
    
    expect(analysis.patterns.length).toBe(0);
    expect(analysis.levelCounts).toEqual({});
    expect(analysis.hasLevelConfig).toBe(false);
  });

  it('should detect debug level usage', () => {
    const content = `logger.debug('Debug message');`;
    const analysis = analyzeLogLevels(content, 'logger.ts');
    
    expect(analysis.patterns.length).toBeGreaterThan(0);
    expect(analysis.levelCounts['debug-level']).toBe(1);
  });

  it('should detect info level usage', () => {
    const content = `logger.info('Info message');`;
    const analysis = analyzeLogLevels(content, 'logger.ts');
    
    expect(analysis.patterns.length).toBeGreaterThan(0);
    expect(analysis.levelCounts['info-level']).toBe(1);
  });

  it('should detect warn level usage', () => {
    const content = `logger.warn('Warning message');`;
    const analysis = analyzeLogLevels(content, 'logger.ts');
    
    expect(analysis.patterns.length).toBeGreaterThan(0);
    expect(analysis.levelCounts['warn-level']).toBe(1);
  });

  it('should detect error level usage', () => {
    const content = `logger.error('Error message');`;
    const analysis = analyzeLogLevels(content, 'logger.ts');
    
    expect(analysis.patterns.length).toBeGreaterThan(0);
    expect(analysis.levelCounts['error-level']).toBe(1);
  });

  it('should detect fatal level usage', () => {
    const content = `logger.fatal('Fatal error');`;
    const analysis = analyzeLogLevels(content, 'logger.ts');
    
    expect(analysis.patterns.length).toBeGreaterThan(0);
    expect(analysis.levelCounts['fatal-level']).toBe(1);
  });

  it('should detect trace level usage', () => {
    const content = `logger.trace('Trace message');`;
    const analysis = analyzeLogLevels(content, 'logger.ts');
    
    expect(analysis.patterns.length).toBeGreaterThan(0);
    expect(analysis.levelCounts['trace-level']).toBe(1);
  });

  it('should detect level configuration', () => {
    const content = `const logger = createLogger({ level: 'info' });`;
    const analysis = analyzeLogLevels(content, 'logger.ts');
    
    expect(analysis.hasLevelConfig).toBe(true);
  });

  it('should count multiple log levels', () => {
    const content = `
      logger.debug('debug');
      logger.info('info');
      logger.info('info 2');
      logger.error('error');
    `;
    const analysis = analyzeLogLevels(content, 'logger.ts');
    
    expect(analysis.levelCounts['debug-level']).toBe(1);
    expect(analysis.levelCounts['info-level']).toBe(2);
    expect(analysis.levelCounts['error-level']).toBe(1);
  });

  it('should handle files without logging', () => {
    const content = `const x = 1 + 2;`;
    const analysis = analyzeLogLevels(content, 'utils.ts');
    
    expect(analysis.patterns.length).toBe(0);
    expect(analysis.levelCounts).toEqual({});
  });
});

// ============================================================================
// Detector Class Tests
// ============================================================================

describe('LogLevelsDetector', () => {
  it('should create detector with correct properties', () => {
    const detector = createLogLevelsDetector();
    
    expect(detector.id).toBe('logging/log-levels');
    expect(detector.category).toBe('logging');
    expect(detector.subcategory).toBe('log-levels');
    expect(detector.supportedLanguages).toContain('typescript');
    expect(detector.supportedLanguages).toContain('javascript');
  });

  it('should return empty result for unsupported languages', async () => {
    const detector = new LogLevelsDetector();
    const context = createMockContext('styles.css', 'body { color: red; }');
    context.language = 'css';
    
    const result = await detector.detect(context);
    
    expect(result.patterns.length).toBe(0);
    expect(result.violations.length).toBe(0);
  });

  it('should detect patterns in TypeScript files', async () => {
    const detector = new LogLevelsDetector();
    const content = `
      logger.info('Info message');
      logger.error('Error message');
    `;
    const context = createMockContext('logger.ts', content);
    
    const result = await detector.detect(context);
    
    expect(result.confidence).toBe(0.9);
  });

  it('should return empty result for files without logging', async () => {
    const detector = new LogLevelsDetector();
    const content = `const x = 1 + 2;`;
    const context = createMockContext('utils.ts', content);
    
    const result = await detector.detect(context);
    
    expect(result.patterns.length).toBe(0);
  });

  it('should include level counts in metadata', async () => {
    const detector = new LogLevelsDetector();
    const content = `
      logger.info('info');
      logger.error('error');
    `;
    const context = createMockContext('logger.ts', content);
    
    const result = await detector.detect(context);
    
    expect(result.metadata?.custom?.levelCounts).toBeDefined();
  });

  it('should return null for generateQuickFix', () => {
    const detector = new LogLevelsDetector();
    const violation = {
      id: 'test-violation',
      patternId: 'logging/log-levels',
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
