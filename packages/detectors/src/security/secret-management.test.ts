/**
 * Secret Management Detector Tests
 *
 * Tests for secret and credential handling pattern detection.
 *
 * @requirements 16.6 - Secret management patterns
 */

import { describe, it, expect } from 'vitest';
import {
  SecretManagementDetector,
  createSecretManagementDetector,
  detectEnvVariables,
  detectSecretManager,
  detectVaultIntegration,
  detectKeyRotation,
  detectCredentialStore,
  detectConfigEncryption,
  detectHardcodedSecrets,
  detectHardcodedApiKeys,
  detectHardcodedPasswords,
  detectHardcodedTokens,
  detectExposedCredentials,
  detectInsecureStorage,
  analyzeSecretManagement,
  shouldExcludeFile,
} from './secret-management.js';
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
    expect(shouldExcludeFile('secrets.test.ts')).toBe(true);
    expect(shouldExcludeFile('config.spec.ts')).toBe(true);
  });

  it('should exclude example files', () => {
    expect(shouldExcludeFile('config.example')).toBe(true);
    expect(shouldExcludeFile('secrets.sample')).toBe(true);
    expect(shouldExcludeFile('env.template')).toBe(true);
  });

  it('should not exclude regular source files', () => {
    expect(shouldExcludeFile('src/config/secrets.ts')).toBe(false);
    expect(shouldExcludeFile('lib/auth/credentials.ts')).toBe(false);
  });
});

// ============================================================================
// Environment Variable Detection Tests
// ============================================================================

describe('detectEnvVariables', () => {
  it('should detect process.env usage', () => {
    const content = `const apiKey = process.env.API_KEY;`;
    const results = detectEnvVariables(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('env-variable');
  });

  it('should detect process.env bracket notation', () => {
    const content = `const secret = process.env['DATABASE_URL'];`;
    const results = detectEnvVariables(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect import.meta.env', () => {
    const content = `const apiUrl = import.meta.env.VITE_API_URL;`;
    const results = detectEnvVariables(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect Deno.env.get', () => {
    const content = `const secret = Deno.env.get('SECRET_KEY');`;
    const results = detectEnvVariables(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Secret Manager Detection Tests
// ============================================================================

describe('detectSecretManager', () => {
  it('should detect AWS SecretsManager', () => {
    const content = `const client = new SecretsManager();`;
    const results = detectSecretManager(content, 'secrets.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('secret-manager');
  });

  it('should detect getSecretValue', () => {
    const content = `const secret = await client.getSecretValue({ SecretId: 'my-secret' });`;
    const results = detectSecretManager(content, 'secrets.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect Azure KeyVault', () => {
    const content = `const client = new SecretClient(vaultUrl, credential);`;
    const results = detectSecretManager(content, 'secrets.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Vault Integration Detection Tests
// ============================================================================

describe('detectVaultIntegration', () => {
  it('should detect vault.read', () => {
    const content = `const secret = await vault.read('secret/data/myapp');`;
    const results = detectVaultIntegration(content, 'secrets.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('vault-integration');
    expect(results[0]?.provider).toBe('hashicorp');
  });

  it('should detect VAULT_ADDR', () => {
    const content = `const vaultAddr = process.env.VAULT_ADDR;`;
    const results = detectVaultIntegration(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Key Rotation Detection Tests
// ============================================================================

describe('detectKeyRotation', () => {
  it('should detect rotateSecret function', () => {
    const content = `await rotateSecret('api-key');`;
    const results = detectKeyRotation(content, 'secrets.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('key-rotation');
  });

  it('should detect refreshToken', () => {
    const content = `const newToken = await refreshToken(oldToken);`;
    const results = detectKeyRotation(content, 'auth.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Credential Store Detection Tests
// ============================================================================

describe('detectCredentialStore', () => {
  it('should detect keytar usage', () => {
    const content = `const password = await keytar.getPassword('myapp', 'user');`;
    const results = detectCredentialStore(content, 'auth.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('credential-store');
  });

  it('should detect SecureStorage', () => {
    const content = `await SecureStorage.setItem('token', value);`;
    const results = detectCredentialStore(content, 'auth.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Config Encryption Detection Tests
// ============================================================================

describe('detectConfigEncryption', () => {
  it('should detect encryptConfig', () => {
    const content = `const encrypted = encryptConfig(config);`;
    const results = detectConfigEncryption(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('config-encryption');
  });

  it('should detect sops', () => {
    const content = `// Encrypted with sops`;
    const results = detectConfigEncryption(content, 'secrets.yaml');
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Violation Detection Tests
// ============================================================================

describe('detectHardcodedApiKeys', () => {
  it('should detect Google API key', () => {
    const content = `const apiKey = "AIzaSyC1234567890abcdefghijklmnopqrstuv";`;
    const results = detectHardcodedApiKeys(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('hardcoded-api-key');
    expect(results[0]?.severity).toBe('critical');
  });

  it('should detect AWS Access Key', () => {
    const content = `const accessKey = "AKIAIOSFODNN7EXAMPLE";`;
    const results = detectHardcodedApiKeys(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.secretType).toBe('aws-access-key');
  });

  it('should skip comments', () => {
    const content = `// Example: const apiKey = "AIzaSyC1234567890abcdefghijklmnopqrstuv";`;
    const results = detectHardcodedApiKeys(content, 'config.ts');
    
    expect(results.length).toBe(0);
  });
});

describe('detectHardcodedPasswords', () => {
  it('should detect hardcoded password', () => {
    const content = `const password = "mysecretpassword123";`;
    const results = detectHardcodedPasswords(content, 'config.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('hardcoded-password');
    expect(results[0]?.severity).toBe('critical');
  });

  it('should not flag env variable passwords', () => {
    const content = `const password = process.env.DB_PASSWORD;`;
    const results = detectHardcodedPasswords(content, 'config.ts');
    
    expect(results.length).toBe(0);
  });
});

describe('detectExposedCredentials', () => {
  it('should detect credentials in console.log', () => {
    const content = `console.log('Password:', password);`;
    const results = detectExposedCredentials(content, 'auth.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('exposed-credential');
    expect(results[0]?.severity).toBe('high');
  });

  it('should detect credentials in logger', () => {
    const content = `logger.debug('Token:', token);`;
    const results = detectExposedCredentials(content, 'auth.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });
});

describe('detectInsecureStorage', () => {
  it('should detect token in localStorage', () => {
    const content = `localStorage.setItem('token', authToken);`;
    const results = detectInsecureStorage(content, 'auth.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('insecure-storage');
    expect(results[0]?.severity).toBe('high');
  });

  it('should detect secret in sessionStorage', () => {
    const content = `sessionStorage.setItem('secret', value);`;
    const results = detectInsecureStorage(content, 'auth.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Full Analysis Tests
// ============================================================================

describe('analyzeSecretManagement', () => {
  it('should return empty analysis for excluded files', () => {
    const content = `const apiKey = process.env.API_KEY;`;
    const analysis = analyzeSecretManagement(content, 'config.test.ts');
    
    expect(analysis.patterns.length).toBe(0);
    expect(analysis.violations.length).toBe(0);
    expect(analysis.confidence).toBe(1.0);
  });

  it('should detect env variable usage', () => {
    const content = `
      const apiKey = process.env.API_KEY;
      const dbUrl = process.env.DATABASE_URL;
    `;
    const analysis = analyzeSecretManagement(content, 'config.ts');
    
    expect(analysis.usesEnvVariables).toBe(true);
    expect(analysis.patterns.length).toBeGreaterThan(0);
    expect(analysis.confidence).toBeGreaterThan(0.7);
  });

  it('should detect secret manager usage', () => {
    const content = `
      const client = new SecretsManager();
      const secret = await client.getSecretValue({ SecretId: 'my-secret' });
    `;
    const analysis = analyzeSecretManagement(content, 'secrets.ts');
    
    expect(analysis.usesSecretManager).toBe(true);
    expect(analysis.confidence).toBeGreaterThan(0.8);
  });

  it('should detect vault usage', () => {
    const content = `const secret = await vault.read('secret/data/myapp');`;
    const analysis = analyzeSecretManagement(content, 'secrets.ts');
    
    expect(analysis.usesVault).toBe(true);
    expect(analysis.confidence).toBeGreaterThan(0.8);
  });
});

// ============================================================================
// Detector Class Tests
// ============================================================================

describe('SecretManagementDetector', () => {
  it('should create detector with correct properties', () => {
    const detector = createSecretManagementDetector();
    
    expect(detector.id).toBe('security/secret-management');
    expect(detector.category).toBe('security');
    expect(detector.supportedLanguages).toContain('typescript');
    expect(detector.supportedLanguages).toContain('javascript');
    expect(detector.supportedLanguages).toContain('python');
  });

  it('should return empty result for unsupported languages', async () => {
    const detector = new SecretManagementDetector();
    const context = createMockContext('styles.css', 'body { color: red; }');
    context.language = 'css';
    
    const result = await detector.detect(context);
    
    expect(result.patterns.length).toBe(0);
    expect(result.violations.length).toBe(0);
  });

  it('should detect patterns in TypeScript files', async () => {
    const detector = new SecretManagementDetector();
    const content = `const apiKey = process.env.API_KEY;`;
    const context = createMockContext('config.ts', content);
    
    const result = await detector.detect(context);
    
    expect(result.confidence).toBeGreaterThan(0);
  });
});
