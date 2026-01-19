/**
 * Default Values Detector Tests
 *
 * Tests for configuration default value pattern detection.
 *
 * @requirements 17.3 - Default value patterns
 */

import { describe, it, expect } from 'vitest';
import {
  DefaultValuesDetector,
  createDefaultValuesDetector,
  detectHardcodedDefaults,
  detectEnvDefaults,
  detectComputedDefaults,
  detectFallbackChains,
  detectConditionalDefaults,
  detectFactoryDefaults,
  detectMagicNumberViolations,
  detectMagicStringViolations,
  analyzeDefaultValues,
  shouldExcludeFile,
} from './default-values.js';
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

  it('should exclude minified files', () => {
    expect(shouldExcludeFile('bundle.min.js')).toBe(true);
  });

  it('should not exclude regular source files', () => {
    expect(shouldExcludeFile('src/config/defaults.ts')).toBe(false);
    expect(shouldExcludeFile('lib/settings.ts')).toBe(false);
  });
});

// ============================================================================
// Hardcoded Defaults Detection Tests
// ============================================================================

describe('detectHardcodedDefaults', () => {
  it('should detect nullish coalescing with string default', () => {
    const content = `const key = value ?? 'default-value';`;
    const results = detectHardcodedDefaults(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('hardcoded-default');
  });

  it('should detect OR operator with string default', () => {
    const content = `const key = value || 'fallback';`;
    const results = detectHardcodedDefaults(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect nullish coalescing with number default', () => {
    const content = `const port = value ?? 3000;`;
    const results = detectHardcodedDefaults(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect OR operator with number default', () => {
    const content = `const timeout = value || 5000;`;
    const results = detectHardcodedDefaults(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect nullish coalescing with boolean default', () => {
    const content = `const enabled = value ?? true;`;
    const results = detectHardcodedDefaults(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect default property assignment', () => {
    const content = `const config = { default: 'value' };`;
    const results = detectHardcodedDefaults(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect defaultValue property', () => {
    const content = `const field = { defaultValue: 'initial' };`;
    const results = detectHardcodedDefaults(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should extract default value from match', () => {
    const content = `const key = value ?? 'my-default';`;
    const results = detectHardcodedDefaults(content, 'config.ts');
    
    expect(results[0]?.defaultValue).toBeDefined();
  });
});

// ============================================================================
// Env Defaults Detection Tests
// ============================================================================

describe('detectEnvDefaults', () => {
  it('should detect env var fallback to another env var with nullish coalescing', () => {
    const content = `const url = process.env.API_URL ?? process.env.FALLBACK_URL;`;
    const results = detectEnvDefaults(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('env-default');
  });

  it('should detect env var fallback with OR operator', () => {
    const content = `const host = process.env.HOST || process.env.DEFAULT_HOST;`;
    const results = detectEnvDefaults(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect .default() with env var', () => {
    const content = `const schema = z.string().default(process.env.DEFAULT_VALUE);`;
    const results = detectEnvDefaults(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Computed Defaults Detection Tests
// ============================================================================

describe('detectComputedDefaults', () => {
  it('should detect function call as default with nullish coalescing', () => {
    const content = `const value = config ?? getDefaultValue();`;
    const results = detectComputedDefaults(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('computed-default');
  });

  it('should detect function call as default with OR operator', () => {
    const content = `const value = config || computeDefault();`;
    const results = detectComputedDefaults(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect constructor as default with nullish coalescing', () => {
    const content = `const instance = value ?? new DefaultClass();`;
    const results = detectComputedDefaults(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect arrow function default', () => {
    const content = `const config = { default: () => computeValue() };`;
    const results = detectComputedDefaults(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect getDefault function calls', () => {
    const content = `const value = getDefaultConfig();`;
    const results = detectComputedDefaults(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect createDefault function calls', () => {
    const content = `const value = createDefaultSettings();`;
    const results = detectComputedDefaults(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Fallback Chains Detection Tests
// ============================================================================

describe('detectFallbackChains', () => {
  it('should detect multiple nullish coalescing operators', () => {
    const content = `const value = a ?? b ?? c;`;
    const results = detectFallbackChains(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('fallback-chain');
  });

  it('should detect multiple OR operators', () => {
    const content = `const value = a || b || c;`;
    const results = detectFallbackChains(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect env var fallback chains', () => {
    const content = `const url = process.env.PRIMARY_URL ?? process.env.SECONDARY_URL ?? 'default';`;
    const results = detectFallbackChains(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Conditional Defaults Detection Tests
// ============================================================================

describe('detectConditionalDefaults', () => {
  it('should detect ternary with string default', () => {
    const content = `const value = condition ? 'yes' : 'no';`;
    const results = detectConditionalDefaults(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('conditional-default');
  });

  it('should detect ternary with number default', () => {
    const content = `const port = isProd ? 80 : 3000;`;
    const results = detectConditionalDefaults(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Factory Defaults Detection Tests
// ============================================================================

describe('detectFactoryDefaults', () => {
  it('should detect createConfig function', () => {
    const content = `const config = createConfig({ debug: true });`;
    const results = detectFactoryDefaults(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('factory-default');
  });

  it('should detect getConfig function', () => {
    const content = `const config = getConfig();`;
    const results = detectFactoryDefaults(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect loadConfig function', () => {
    const content = `const config = loadConfig('./config.json');`;
    const results = detectFactoryDefaults(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect configFactory function', () => {
    const content = `const config = configFactory();`;
    const results = detectFactoryDefaults(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect defaultConfig assignment', () => {
    const content = `const defaultConfig = { port: 3000 };`;
    const results = detectFactoryDefaults(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect DEFAULT_CONFIG constant', () => {
    const content = `const DEFAULT_CONFIG = { timeout: 5000 };`;
    const results = detectFactoryDefaults(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect baseConfig assignment', () => {
    const content = `const baseConfig = { level: 'info' };`;
    const results = detectFactoryDefaults(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Magic Number Violation Tests
// ============================================================================

describe('detectMagicNumberViolations', () => {
  it('should detect magic timeout numbers', () => {
    const content = `const timeout = 30000;`;
    const results = detectMagicNumberViolations(content, 'service.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('magic-number');
    expect(results[0]?.severity).toBe('low');
  });

  it('should detect magic port numbers', () => {
    const content = `const port = 8080;`;
    const results = detectMagicNumberViolations(content, 'server.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect magic maxRetries numbers', () => {
    const content = `const maxRetries = 5;`;
    const results = detectMagicNumberViolations(content, 'client.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should skip config files', () => {
    const content = `const timeout = 30000;`;
    const results = detectMagicNumberViolations(content, 'app.config.ts');
    
    expect(results.length).toBe(0);
  });

  it('should skip comments', () => {
    const content = `// timeout = 30000`;
    const results = detectMagicNumberViolations(content, 'service.ts');
    
    expect(results.length).toBe(0);
  });

  it('should skip named constants', () => {
    const content = `const TIMEOUT_MS = 30000;`;
    const results = detectMagicNumberViolations(content, 'service.ts');
    
    expect(results.length).toBe(0);
  });
});

// ============================================================================
// Magic String Violation Tests
// ============================================================================

describe('detectMagicStringViolations', () => {
  it('should detect hardcoded URLs', () => {
    const content = `const url = 'https://api.example.com/v1';`;
    const results = detectMagicStringViolations(content, 'service.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('magic-string');
    expect(results[0]?.severity).toBe('low');
  });

  it('should detect hardcoded localhost', () => {
    const content = `const host = 'localhost:3000';`;
    const results = detectMagicStringViolations(content, 'server.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect hardcoded endpoints', () => {
    const content = `const endpoint = '/api/users';`;
    const results = detectMagicStringViolations(content, 'client.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should skip config files', () => {
    const content = `const url = 'https://api.example.com';`;
    const results = detectMagicStringViolations(content, 'app.config.ts');
    
    expect(results.length).toBe(0);
  });

  it('should skip comments', () => {
    const content = `// url = 'https://api.example.com'`;
    const results = detectMagicStringViolations(content, 'service.ts');
    
    expect(results.length).toBe(0);
  });
});

// ============================================================================
// Full Analysis Tests
// ============================================================================

describe('analyzeDefaultValues', () => {
  it('should return empty analysis for excluded files', () => {
    const content = `const value = x ?? 'default';`;
    const analysis = analyzeDefaultValues(content, 'config.test.ts');
    
    expect(analysis.patterns.length).toBe(0);
    expect(analysis.violations.length).toBe(0);
    expect(analysis.confidence).toBe(1.0);
  });

  it('should detect hardcoded defaults', () => {
    const content = `
      const port = process.env.PORT ?? 3000;
      const host = process.env.HOST || 'localhost';
    `;
    const analysis = analyzeDefaultValues(content, 'config.ts');
    
    expect(analysis.hasHardcodedDefaults).toBe(true);
  });

  it('should detect env defaults', () => {
    const content = `const url = process.env.URL ?? process.env.FALLBACK_URL;`;
    const analysis = analyzeDefaultValues(content, 'config.ts');
    
    expect(analysis.hasEnvDefaults).toBe(true);
  });

  it('should have higher confidence with factory defaults', () => {
    const content = `
      const defaultConfig = { port: 3000 };
      const config = createConfig(options);
    `;
    const analysis = analyzeDefaultValues(content, 'config.ts');
    
    expect(analysis.confidence).toBeGreaterThan(0.8);
  });

  it('should collect all pattern types', () => {
    const content = `
      const a = x ?? 'default';
      const b = y || getDefault();
      const c = z ?? w ?? 'fallback';
    `;
    const analysis = analyzeDefaultValues(content, 'config.ts');
    
    expect(analysis.patterns.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Detector Class Tests
// ============================================================================

describe('DefaultValuesDetector', () => {
  it('should create detector with correct properties', () => {
    const detector = createDefaultValuesDetector();
    
    expect(detector.id).toBe('config/default-values');
    expect(detector.category).toBe('config');
    expect(detector.subcategory).toBe('default-values');
    expect(detector.supportedLanguages).toContain('typescript');
    expect(detector.supportedLanguages).toContain('javascript');
  });

  it('should return empty result for unsupported languages', async () => {
    const detector = new DefaultValuesDetector();
    const context = createMockContext('styles.css', 'body { color: red; }');
    context.language = 'css';
    
    const result = await detector.detect(context);
    
    expect(result.patterns.length).toBe(0);
    expect(result.violations.length).toBe(0);
  });

  it('should detect patterns in TypeScript files', async () => {
    const detector = new DefaultValuesDetector();
    const content = `const value = x ?? 'default';`;
    const context = createMockContext('config.ts', content);
    
    const result = await detector.detect(context);
    
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('should return empty result for files without defaults', async () => {
    const detector = new DefaultValuesDetector();
    const content = `const x = 1 + 2;`;
    const context = createMockContext('utils.ts', content);
    
    const result = await detector.detect(context);
    
    expect(result.patterns.length).toBe(0);
  });

  it('should return null for generateQuickFix', () => {
    const detector = new DefaultValuesDetector();
    const violation = {
      id: 'test-violation',
      patternId: 'config/default-values',
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
