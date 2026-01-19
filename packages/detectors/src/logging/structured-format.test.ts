/**
 * Structured Format Detector Tests
 *
 * Tests for structured logging format pattern detection.
 *
 * @requirements 15.1 - Structured logging format patterns
 */

import { describe, it, expect } from 'vitest';
import {
  StructuredFormatDetector,
  createStructuredFormatDetector,
  detectJSONLogging,
  detectWinstonLogger,
  detectPinoLogger,
  detectConsoleLog,
  analyzeStructuredFormat,
  shouldExcludeFile,
  JSON_LOGGING_PATTERNS,
  WINSTON_PATTERNS,
  PINO_PATTERNS,
  CONSOLE_LOG_PATTERNS,
} from './structured-format.js';
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
// JSON Logging Detection Tests
// ============================================================================

describe('detectJSONLogging', () => {
  it('should detect logger.info with object', () => {
    const content = `logger.info({ message: 'User logged in', userId: 123 });`;
    const results = detectJSONLogging(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('json-logging');
  });

  it('should detect logger.error with object', () => {
    const content = `logger.error({ error: err, context: 'auth' });`;
    const results = detectJSONLogging(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect log.debug with object', () => {
    const content = `log.debug({ data: payload });`;
    const results = detectJSONLogging(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect JSON.stringify with log', () => {
    const content = `console.log(JSON.stringify(logData));`;
    const results = detectJSONLogging(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should return empty for non-JSON logging', () => {
    const content = `console.log('Simple message');`;
    const results = detectJSONLogging(content);
    
    expect(results.length).toBe(0);
  });
});

// ============================================================================
// Winston Logger Detection Tests
// ============================================================================

describe('detectWinstonLogger', () => {
  it('should detect winston.createLogger', () => {
    const content = `const logger = winston.createLogger({ level: 'info' });`;
    const results = detectWinstonLogger(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('winston-logger');
    expect(results[0]?.library).toBe('winston');
  });

  it('should detect winston import', () => {
    const content = `import winston from 'winston';`;
    const results = detectWinstonLogger(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect winston method calls', () => {
    const content = `winston.info('message');`;
    const results = detectWinstonLogger(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should return empty for non-winston code', () => {
    const content = `console.log('message');`;
    const results = detectWinstonLogger(content);
    
    expect(results.length).toBe(0);
  });
});

// ============================================================================
// Pino Logger Detection Tests
// ============================================================================

describe('detectPinoLogger', () => {
  it('should detect pino initialization', () => {
    const content = `const logger = pino({ level: 'info' });`;
    const results = detectPinoLogger(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('pino-logger');
    expect(results[0]?.library).toBe('pino');
  });

  it('should detect pino import', () => {
    const content = `import pino from 'pino';`;
    const results = detectPinoLogger(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect pino require', () => {
    const content = `const pino = require('pino');`;
    const results = detectPinoLogger(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should return empty for non-pino code', () => {
    const content = `console.log('message');`;
    const results = detectPinoLogger(content);
    
    expect(results.length).toBe(0);
  });
});

// ============================================================================
// Console Log Detection Tests
// ============================================================================

describe('detectConsoleLog', () => {
  it('should detect console.log', () => {
    const content = `console.log('Debug message');`;
    const results = detectConsoleLog(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('console-log');
  });

  it('should detect console.info', () => {
    const content = `console.info('Info message');`;
    const results = detectConsoleLog(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect console.warn', () => {
    const content = `console.warn('Warning message');`;
    const results = detectConsoleLog(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect console.error', () => {
    const content = `console.error('Error message');`;
    const results = detectConsoleLog(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect console.debug', () => {
    const content = `console.debug('Debug message');`;
    const results = detectConsoleLog(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect multiple console calls', () => {
    const content = `
      console.log('log');
      console.error('error');
    `;
    const results = detectConsoleLog(content);
    
    expect(results.length).toBe(2);
  });
});

// ============================================================================
// Full Analysis Tests
// ============================================================================

describe('analyzeStructuredFormat', () => {
  it('should return empty analysis for excluded files', () => {
    const content = `logger.info({ message: 'test' });`;
    const analysis = analyzeStructuredFormat(content, 'logger.test.ts');
    
    expect(analysis.patterns.length).toBe(0);
    expect(analysis.hasStructuredLogging).toBe(false);
    expect(analysis.dominantLibrary).toBeNull();
  });

  it('should detect structured logging', () => {
    const content = `
      import winston from 'winston';
      const logger = winston.createLogger({ level: 'info' });
      logger.info({ message: 'User logged in' });
    `;
    const analysis = analyzeStructuredFormat(content, 'logger.ts');
    
    expect(analysis.hasStructuredLogging).toBe(true);
    expect(analysis.dominantLibrary).toBe('winston');
  });

  it('should count console.log usage', () => {
    const content = `
      console.log('message 1');
      console.log('message 2');
      console.error('error');
    `;
    const analysis = analyzeStructuredFormat(content, 'app.ts');
    
    expect(analysis.consoleLogCount).toBe(3);
  });

  it('should identify dominant library', () => {
    const content = `
      import pino from 'pino';
      const logger = pino();
      logger.info('message');
    `;
    const analysis = analyzeStructuredFormat(content, 'logger.ts');
    
    expect(analysis.dominantLibrary).toBe('pino');
  });

  it('should handle files without logging', () => {
    const content = `const x = 1 + 2;`;
    const analysis = analyzeStructuredFormat(content, 'utils.ts');
    
    expect(analysis.patterns.length).toBe(0);
    expect(analysis.hasStructuredLogging).toBe(false);
  });
});

// ============================================================================
// Detector Class Tests
// ============================================================================

describe('StructuredFormatDetector', () => {
  it('should create detector with correct properties', () => {
    const detector = createStructuredFormatDetector();
    
    expect(detector.id).toBe('logging/structured-format');
    expect(detector.category).toBe('logging');
    expect(detector.subcategory).toBe('structured-format');
    expect(detector.supportedLanguages).toContain('typescript');
    expect(detector.supportedLanguages).toContain('javascript');
  });

  it('should return empty result for unsupported languages', async () => {
    const detector = new StructuredFormatDetector();
    const context = createMockContext('styles.css', 'body { color: red; }');
    context.language = 'css';
    
    const result = await detector.detect(context);
    
    expect(result.patterns.length).toBe(0);
    expect(result.violations.length).toBe(0);
  });

  it('should detect patterns in TypeScript files', async () => {
    const detector = new StructuredFormatDetector();
    const content = `
      import winston from 'winston';
      logger.info({ message: 'test' });
    `;
    const context = createMockContext('logger.ts', content);
    
    const result = await detector.detect(context);
    
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('should return empty result for files without logging', async () => {
    const detector = new StructuredFormatDetector();
    const content = `const x = 1 + 2;`;
    const context = createMockContext('utils.ts', content);
    
    const result = await detector.detect(context);
    
    expect(result.patterns.length).toBe(0);
  });

  it('should have higher confidence for structured logging', async () => {
    const detector = new StructuredFormatDetector();
    const content = `logger.info({ message: 'test', userId: 123 });`;
    const context = createMockContext('logger.ts', content);
    
    const result = await detector.detect(context);
    
    expect(result.confidence).toBe(0.9);
  });

  it('should have lower confidence for console.log only', async () => {
    const detector = new StructuredFormatDetector();
    const content = `console.log('message');`;
    const context = createMockContext('app.ts', content);
    
    const result = await detector.detect(context);
    
    expect(result.confidence).toBe(0.7);
  });

  it('should return null for generateQuickFix', () => {
    const detector = new StructuredFormatDetector();
    const violation = {
      id: 'test-violation',
      patternId: 'logging/structured-format',
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
