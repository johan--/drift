/**
 * Env Naming Detector Tests
 *
 * Tests for environment variable naming pattern detection.
 *
 * @requirements 17.1 - Environment variable naming patterns
 */

import { describe, it, expect } from 'vitest';
import {
  EnvNamingDetector,
  createEnvNamingDetector,
  detectScreamingSnakeCase,
  detectAppPrefix,
  detectDbPrefix,
  detectApiPrefix,
  detectFeaturePrefix,
  detectSecretPrefix,
  detectInvalidCaseViolations,
  detectReservedNameViolations,
  analyzeEnvNaming,
  shouldExcludeFile,
} from './env-naming.js';
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

  it('should exclude .env files', () => {
    expect(shouldExcludeFile('.env')).toBe(true);
    expect(shouldExcludeFile('.env.local')).toBe(true);
  });

  it('should not exclude regular source files', () => {
    expect(shouldExcludeFile('src/config/env.ts')).toBe(false);
    expect(shouldExcludeFile('lib/settings.ts')).toBe(false);
  });
});

// ============================================================================
// Screaming Snake Case Detection Tests
// ============================================================================

describe('detectScreamingSnakeCase', () => {
  it('should detect process.env with SCREAMING_SNAKE_CASE', () => {
    const content = `const apiKey = process.env.API_KEY;`;
    const results = detectScreamingSnakeCase(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('screaming-snake-case');
    expect(results[0]?.envName).toBe('API_KEY');
  });

  it('should detect bracket notation access', () => {
    const content = `const value = process.env['DATABASE_URL'];`;
    const results = detectScreamingSnakeCase(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect import.meta.env access', () => {
    const content = `const url = import.meta.env.VITE_API_URL;`;
    const results = detectScreamingSnakeCase(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect Deno.env.get calls', () => {
    const content = `const port = Deno.env.get('PORT');`;
    const results = detectScreamingSnakeCase(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// App Prefix Detection Tests
// ============================================================================

describe('detectAppPrefix', () => {
  it('should detect APP_ prefixed env vars', () => {
    const content = `const name = process.env.APP_NAME;`;
    const results = detectAppPrefix(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('app-prefix');
    expect(results[0]?.prefix).toBe('APP_');
  });

  it('should detect VITE_ prefixed env vars', () => {
    const content = `const url = import.meta.env.VITE_API_URL;`;
    const results = detectAppPrefix(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.prefix).toBe('VITE_');
  });

  it('should detect NEXT_PUBLIC_ prefixed env vars', () => {
    const content = `const key = import.meta.env.NEXT_PUBLIC_API_KEY;`;
    const results = detectAppPrefix(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.prefix).toBe('NEXT_PUBLIC_');
  });
});

// ============================================================================
// DB Prefix Detection Tests
// ============================================================================

describe('detectDbPrefix', () => {
  it('should detect DB_ prefixed env vars', () => {
    const content = `const host = process.env.DB_HOST;`;
    const results = detectDbPrefix(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('db-prefix');
    expect(results[0]?.prefix).toBe('DB_');
  });

  it('should detect DATABASE_ prefixed env vars', () => {
    const content = `const url = process.env.DATABASE_URL;`;
    const results = detectDbPrefix(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.prefix).toBe('DATABASE_');
  });

  it('should detect POSTGRES_ prefixed env vars', () => {
    const content = `const user = process.env.POSTGRES_USER;`;
    const results = detectDbPrefix(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.prefix).toBe('POSTGRES_');
  });

  it('should detect REDIS_ prefixed env vars', () => {
    const content = `const url = process.env.REDIS_URL;`;
    const results = detectDbPrefix(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.prefix).toBe('REDIS_');
  });
});

// ============================================================================
// API Prefix Detection Tests
// ============================================================================

describe('detectApiPrefix', () => {
  it('should detect API_ prefixed env vars', () => {
    const content = `const key = process.env.API_KEY;`;
    const results = detectApiPrefix(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('api-prefix');
  });

  it('should detect API_URL env vars', () => {
    const content = `const url = process.env.API_URL;`;
    const results = detectApiPrefix(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Feature Prefix Detection Tests
// ============================================================================

describe('detectFeaturePrefix', () => {
  it('should detect FEATURE_ prefixed env vars', () => {
    const content = `const enabled = process.env.FEATURE_NEW_UI;`;
    const results = detectFeaturePrefix(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('feature-prefix');
    expect(results[0]?.prefix).toBe('FEATURE_');
  });

  it('should detect FF_ prefixed env vars', () => {
    const content = `const flag = process.env.FF_DARK_MODE;`;
    const results = detectFeaturePrefix(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.prefix).toBe('FF_');
  });

  it('should detect ENABLE_ prefixed env vars', () => {
    const content = `const enabled = process.env.ENABLE_ANALYTICS;`;
    const results = detectFeaturePrefix(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.prefix).toBe('ENABLE_');
  });
});

// ============================================================================
// Secret Prefix Detection Tests
// ============================================================================

describe('detectSecretPrefix', () => {
  it('should detect SECRET_ prefixed env vars', () => {
    const content = `const secret = process.env.SECRET_KEY;`;
    const results = detectSecretPrefix(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('secret-prefix');
  });

  it('should detect _SECRET suffixed env vars', () => {
    const content = `const secret = process.env.JWT_SECRET;`;
    const results = detectSecretPrefix(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect _TOKEN suffixed env vars', () => {
    const content = `const token = process.env.AUTH_TOKEN;`;
    const results = detectSecretPrefix(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Invalid Case Violation Tests
// ============================================================================

describe('detectInvalidCaseViolations', () => {
  it('should detect camelCase env vars', () => {
    const content = `const key = process.env.apiKey;`;
    const results = detectInvalidCaseViolations(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('invalid-case');
    expect(results[0]?.severity).toBe('medium');
  });

  it('should suggest SCREAMING_SNAKE_CASE fix', () => {
    const content = `const key = process.env.apiKey;`;
    const results = detectInvalidCaseViolations(content, 'config.ts');
    
    expect(results[0]?.suggestedFix).toContain('API_KEY');
  });
});

// ============================================================================
// Reserved Name Violation Tests
// ============================================================================

describe('detectReservedNameViolations', () => {
  it('should detect reserved system env vars', () => {
    const content = `const path = process.env.PATH;`;
    const results = detectReservedNameViolations(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('reserved-name');
    expect(results[0]?.severity).toBe('low');
  });

  it('should detect HOME env var', () => {
    const content = `const home = process.env.HOME;`;
    const results = detectReservedNameViolations(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Full Analysis Tests
// ============================================================================

describe('analyzeEnvNaming', () => {
  it('should return empty analysis for excluded files', () => {
    const content = `const key = process.env.API_KEY;`;
    const analysis = analyzeEnvNaming(content, 'config.test.ts');
    
    expect(analysis.patterns.length).toBe(0);
    expect(analysis.violations.length).toBe(0);
    expect(analysis.confidence).toBe(1.0);
  });

  it('should detect multiple patterns', () => {
    const content = `
      const apiKey = process.env.API_KEY;
      const dbUrl = process.env.DATABASE_URL;
      const feature = process.env.FEATURE_NEW_UI;
    `;
    const analysis = analyzeEnvNaming(content, 'config.ts');
    
    expect(analysis.patterns.length).toBeGreaterThan(0);
    expect(analysis.usesScreamingSnakeCase).toBe(true);
  });

  it('should collect unique prefixes', () => {
    const content = `
      const app = process.env.APP_NAME;
      const db = process.env.DB_HOST;
      const api = process.env.API_KEY;
    `;
    const analysis = analyzeEnvNaming(content, 'config.ts');
    
    expect(analysis.prefixes.length).toBeGreaterThan(0);
  });

  it('should have higher confidence with consistent naming', () => {
    const content = `
      const key = process.env.API_KEY;
      const url = process.env.API_URL;
    `;
    const analysis = analyzeEnvNaming(content, 'config.ts');
    
    expect(analysis.confidence).toBeGreaterThan(0.7);
  });
});

// ============================================================================
// Detector Class Tests
// ============================================================================

describe('EnvNamingDetector', () => {
  it('should create detector with correct properties', () => {
    const detector = createEnvNamingDetector();
    
    expect(detector.id).toBe('config/env-naming');
    expect(detector.category).toBe('config');
    expect(detector.supportedLanguages).toContain('typescript');
    expect(detector.supportedLanguages).toContain('javascript');
  });

  it('should return empty result for unsupported languages', async () => {
    const detector = new EnvNamingDetector();
    const context = createMockContext('styles.css', 'body { color: red; }');
    context.language = 'css';
    
    const result = await detector.detect(context);
    
    expect(result.patterns.length).toBe(0);
    expect(result.violations.length).toBe(0);
  });

  it('should detect patterns in TypeScript files', async () => {
    const detector = new EnvNamingDetector();
    const content = `const key = process.env.API_KEY;`;
    const context = createMockContext('config.ts', content);
    
    const result = await detector.detect(context);
    
    expect(result.confidence).toBeGreaterThan(0);
  });
});
