/**
 * Required Optional Detector Tests
 *
 * Tests for required vs optional configuration pattern detection.
 *
 * @requirements 17.2 - Required vs optional configuration patterns
 */

import { describe, it, expect } from 'vitest';
import {
  RequiredOptionalDetector,
  createRequiredOptionalDetector,
  detectRequiredEnv,
  detectOptionalEnv,
  detectDefaultFallback,
  detectTypeCoercion,
  detectValidationCheck,
  detectUnsafeAccessViolations,
  analyzeRequiredOptional,
  shouldExcludeFile,
} from './required-optional.js';
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
    expect(shouldExcludeFile('config.test.ts')).toBe(true);
    expect(shouldExcludeFile('config.spec.ts')).toBe(true);
  });

  it('should exclude __tests__ directory', () => {
    expect(shouldExcludeFile('__tests__/config.ts')).toBe(true);
  });

  it('should exclude type definition files', () => {
    expect(shouldExcludeFile('config.d.ts')).toBe(true);
  });

  it('should exclude node_modules', () => {
    expect(shouldExcludeFile('node_modules/dotenv/index.js')).toBe(true);
  });

  it('should not exclude regular source files', () => {
    expect(shouldExcludeFile('src/config/env.ts')).toBe(false);
    expect(shouldExcludeFile('lib/settings.ts')).toBe(false);
  });
});

// ============================================================================
// Required Env Detection Tests
// ============================================================================

describe('detectRequiredEnv', () => {
  it('should detect non-null assertion on env var', () => {
    const content = `const key = process.env.API_KEY!`;
    const results = detectRequiredEnv(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('required-env');
  });

  it('should detect type assertion on env var', () => {
    const content = `const key = process.env.API_KEY as string;`;
    const results = detectRequiredEnv(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('required-env');
  });

  it('should detect throw on missing env var', () => {
    const content = `if (!process.env.API_KEY) throw new Error('Missing API_KEY');`;
    const results = detectRequiredEnv(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect required: true pattern', () => {
    const content = `const schema = z.object({ apiKey: z.string().required: true });`;
    const results = detectRequiredEnv(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Optional Env Detection Tests
// ============================================================================

describe('detectOptionalEnv', () => {
  it('should detect nullish coalescing on env var', () => {
    const content = `const key = process.env.API_KEY ?? 'default';`;
    const results = detectOptionalEnv(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('optional-env');
    expect(results[0]?.hasDefault).toBe(true);
  });

  it('should detect OR operator on env var', () => {
    const content = `const key = process.env.API_KEY || 'default';`;
    const results = detectOptionalEnv(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.hasDefault).toBe(true);
  });

  it('should detect optional chaining on env var', () => {
    const content = `const key = process.env.API_KEY?.trim();`;
    const results = detectOptionalEnv(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect .optional() method', () => {
    const content = `const schema = z.string().optional();`;
    const results = detectOptionalEnv(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Default Fallback Detection Tests
// ============================================================================

describe('detectDefaultFallback', () => {
  it('should detect nullish coalescing with string default', () => {
    const content = `const key = process.env.API_KEY ?? 'default-key';`;
    const results = detectDefaultFallback(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('default-fallback');
    expect(results[0]?.hasDefault).toBe(true);
  });

  it('should detect OR operator with string default', () => {
    const content = `const key = process.env.API_KEY || 'default-key';`;
    const results = detectDefaultFallback(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect nullish coalescing with number default', () => {
    const content = `const port = process.env.PORT ?? 3000;`;
    const results = detectDefaultFallback(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect .default() method', () => {
    const content = `const schema = z.string().default('value');`;
    const results = detectDefaultFallback(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Type Coercion Detection Tests
// ============================================================================

describe('detectTypeCoercion', () => {
  it('should detect parseInt on env var', () => {
    const content = `const port = parseInt(process.env.PORT, 10);`;
    const results = detectTypeCoercion(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('type-coercion');
  });

  it('should detect Number() on env var', () => {
    const content = `const port = Number(process.env.PORT);`;
    const results = detectTypeCoercion(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect Boolean() on env var', () => {
    const content = `const debug = Boolean(process.env.DEBUG);`;
    const results = detectTypeCoercion(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect JSON.parse on env var', () => {
    const content = `const config = JSON.parse(process.env.CONFIG);`;
    const results = detectTypeCoercion(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect string comparison for boolean', () => {
    const content = `const debug = process.env.DEBUG === 'true';`;
    const results = detectTypeCoercion(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Validation Check Detection Tests
// ============================================================================

describe('detectValidationCheck', () => {
  it('should detect if check on env var', () => {
    const content = `if (!process.env.API_KEY) { throw new Error(); }`;
    const results = detectValidationCheck(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('validation-check');
  });

  it('should detect undefined comparison', () => {
    const content = `if (process.env.API_KEY !== undefined) { }`;
    const results = detectValidationCheck(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect typeof check', () => {
    const content = `if (typeof process.env.API_KEY === 'string') { }`;
    const results = detectValidationCheck(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect Zod parse methods', () => {
    const content = `const result = schema.safeParse(config);`;
    const results = detectValidationCheck(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Unsafe Access Violation Tests
// ============================================================================

describe('detectUnsafeAccessViolations', () => {
  it('should detect direct property access without check', () => {
    const content = `const length = process.env.API_KEY.length;`;
    const results = detectUnsafeAccessViolations(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('unsafe-access');
    expect(results[0]?.severity).toBe('medium');
  });

  it('should not flag when nullish coalescing is used', () => {
    const content = `const key = process.env.API_KEY ?? 'default';`;
    const results = detectUnsafeAccessViolations(content, 'config.ts');
    
    expect(results.length).toBe(0);
  });

  it('should not flag when OR operator is used', () => {
    const content = `const key = process.env.API_KEY || 'default';`;
    const results = detectUnsafeAccessViolations(content, 'config.ts');
    
    expect(results.length).toBe(0);
  });
});

// ============================================================================
// Full Analysis Tests
// ============================================================================

describe('analyzeRequiredOptional', () => {
  it('should return empty analysis for excluded files', () => {
    const content = `const key = process.env.API_KEY;`;
    const analysis = analyzeRequiredOptional(content, 'config.test.ts');
    
    expect(analysis.patterns.length).toBe(0);
    expect(analysis.violations.length).toBe(0);
    expect(analysis.confidence).toBe(1.0);
  });

  it('should detect required checks', () => {
    const content = `
      if (!process.env.API_KEY) throw new Error('Missing API_KEY');
      const key = process.env.API_KEY as string;
    `;
    const analysis = analyzeRequiredOptional(content, 'config.ts');
    
    expect(analysis.hasRequiredChecks).toBe(true);
  });

  it('should detect defaults', () => {
    const content = `
      const port = process.env.PORT ?? 3000;
      const host = process.env.HOST || 'localhost';
    `;
    const analysis = analyzeRequiredOptional(content, 'config.ts');
    
    expect(analysis.hasDefaults).toBe(true);
  });

  it('should have higher confidence with required checks', () => {
    const content = `
      if (!process.env.API_KEY) throw new Error('Missing');
      const key = process.env.API_KEY;
    `;
    const analysis = analyzeRequiredOptional(content, 'config.ts');
    
    expect(analysis.confidence).toBeGreaterThan(0.8);
  });
});

// ============================================================================
// Detector Class Tests
// ============================================================================

describe('RequiredOptionalDetector', () => {
  it('should create detector with correct properties', () => {
    const detector = createRequiredOptionalDetector();
    
    expect(detector.id).toBe('config/required-optional');
    expect(detector.category).toBe('config');
    expect(detector.supportedLanguages).toContain('typescript');
    expect(detector.supportedLanguages).toContain('javascript');
  });

  it('should return empty result for unsupported languages', async () => {
    const detector = new RequiredOptionalDetector();
    const context = createMockContext('styles.css', 'body { color: red; }');
    context.language = 'css';
    
    const result = await detector.detect(context);
    
    expect(result.patterns.length).toBe(0);
    expect(result.violations.length).toBe(0);
  });

  it('should detect patterns in TypeScript files', async () => {
    const detector = new RequiredOptionalDetector();
    const content = `const key = process.env.API_KEY ?? 'default';`;
    const context = createMockContext('config.ts', content);
    
    const result = await detector.detect(context);
    
    expect(result.confidence).toBeGreaterThan(0);
  });
});
