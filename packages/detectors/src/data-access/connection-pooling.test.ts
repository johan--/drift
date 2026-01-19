/**
 * Connection Pooling Detector Tests
 *
 * Tests for database connection pool pattern detection.
 *
 * @requirements 13.7 - Connection pooling detection
 */

import { describe, it, expect } from 'vitest';
import {
  ConnectionPoolingDetector,
  createConnectionPoolingDetector,
  detectPoolConfig,
  detectPoolSize,
  detectConnectionTimeout,
  detectIdleTimeout,
  detectConnectionAcquire,
  detectConnectionRelease,
  analyzeConnectionPooling,
  shouldExcludeFile,
} from './connection-pooling.js';
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
    expect(shouldExcludeFile('database.test.ts')).toBe(true);
    expect(shouldExcludeFile('database.spec.ts')).toBe(true);
  });

  it('should exclude __tests__ directory', () => {
    expect(shouldExcludeFile('__tests__/database.ts')).toBe(true);
  });

  it('should exclude type definition files', () => {
    expect(shouldExcludeFile('types.d.ts')).toBe(true);
  });

  it('should exclude node_modules', () => {
    expect(shouldExcludeFile('node_modules/pg/index.js')).toBe(true);
  });

  it('should not exclude regular source files', () => {
    expect(shouldExcludeFile('src/config/database.ts')).toBe(false);
    expect(shouldExcludeFile('lib/db.ts')).toBe(false);
  });
});

// ============================================================================
// Pool Config Detection Tests
// ============================================================================

describe('detectPoolConfig', () => {
  it('should detect pool config object', () => {
    const content = `const config = {
      pool: {
        min: 2,
        max: 10
      }
    };`;
    const results = detectPoolConfig(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('pool-config');
  });

  it('should detect connectionPool config', () => {
    const content = `const config = {
      connectionPool: {
        min: 2,
        max: 10
      }
    };`;
    const results = detectPoolConfig(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect poolConfig option', () => {
    const content = `const config = {
      poolConfig: {
        min: 2,
        max: 10
      }
    };`;
    const results = detectPoolConfig(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect createPool call', () => {
    const content = `const pool = mysql.createPool(config);`;
    const results = detectPoolConfig(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect Pool constructor', () => {
    const content = `const pool = new Pool(config);`;
    const results = detectPoolConfig(content);
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Pool Size Detection Tests
// ============================================================================

describe('detectPoolSize', () => {
  it('should detect max pool size', () => {
    const content = `const config = { max: 10 };`;
    const results = detectPoolSize(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('pool-size');
    expect(results[0]?.value).toBe('10');
  });

  it('should detect min pool size', () => {
    const content = `const config = { min: 2 };`;
    const results = detectPoolSize(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.value).toBe('2');
  });

  it('should detect poolSize option', () => {
    const content = `const config = { poolSize: 20 };`;
    const results = detectPoolSize(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.value).toBe('20');
  });

  it('should detect connectionLimit option', () => {
    const content = `const config = { connectionLimit: 15 };`;
    const results = detectPoolSize(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.value).toBe('15');
  });

  it('should detect max_connections env var', () => {
    const content = `const maxConnections = process.env.max_connections = 10;`;
    const results = detectPoolSize(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect pool_size env var', () => {
    const content = `const poolSize = process.env.pool_size = 20;`;
    const results = detectPoolSize(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect CONNECTION_POOL_SIZE constant', () => {
    const content = `const CONNECTION_POOL_SIZE = 10;`;
    const results = detectPoolSize(content);
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Connection Timeout Detection Tests
// ============================================================================

describe('detectConnectionTimeout', () => {
  it('should detect connectionTimeout option', () => {
    const content = `const config = { connectionTimeout: 30000 };`;
    const results = detectConnectionTimeout(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('connection-timeout');
    expect(results[0]?.value).toBe('30000');
  });

  it('should detect connectTimeout option', () => {
    const content = `const config = { connectTimeout: 5000 };`;
    const results = detectConnectionTimeout(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.value).toBe('5000');
  });

  it('should detect acquireTimeout option', () => {
    const content = `const config = { acquireTimeout: 10000 };`;
    const results = detectConnectionTimeout(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.value).toBe('10000');
  });

  it('should detect connection_timeout env var', () => {
    const content = `const timeout = process.env.connection_timeout = 5000;`;
    const results = detectConnectionTimeout(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect timeout option', () => {
    const content = `const config = { timeout: 30000 };`;
    const results = detectConnectionTimeout(content);
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Idle Timeout Detection Tests
// ============================================================================

describe('detectIdleTimeout', () => {
  it('should detect idleTimeout option', () => {
    const content = `const config = { idleTimeout: 60000 };`;
    const results = detectIdleTimeout(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('idle-timeout');
    expect(results[0]?.value).toBe('60000');
  });

  it('should detect idleTimeoutMillis option', () => {
    const content = `const config = { idleTimeoutMillis: 30000 };`;
    const results = detectIdleTimeout(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.value).toBe('30000');
  });

  it('should detect idle_timeout env var', () => {
    // The pattern expects 'idle_timeout' followed by = or :
    const content = `const config = { idle_timeout: 60000 };`;
    const results = detectIdleTimeout(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect evictionRunIntervalMillis option', () => {
    const content = `const config = { evictionRunIntervalMillis: 10000 };`;
    const results = detectIdleTimeout(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.value).toBe('10000');
  });

  it('should detect softIdleTimeoutMillis option', () => {
    const content = `const config = { softIdleTimeoutMillis: 5000 };`;
    const results = detectIdleTimeout(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.value).toBe('5000');
  });
});

// ============================================================================
// Connection Acquire Detection Tests
// ============================================================================

describe('detectConnectionAcquire', () => {
  it('should detect .getConnection() method', () => {
    const content = `const connection = await pool.getConnection();`;
    const results = detectConnectionAcquire(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('connection-acquire');
  });

  it('should detect .acquire() method', () => {
    const content = `const connection = await pool.acquire();`;
    const results = detectConnectionAcquire(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect .connect() method', () => {
    const content = `const client = await pool.connect();`;
    const results = detectConnectionAcquire(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect pool.query() method', () => {
    const content = `const result = await pool.query('SELECT * FROM users');`;
    const results = detectConnectionAcquire(content);
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Connection Release Detection Tests
// ============================================================================

describe('detectConnectionRelease', () => {
  it('should detect .release() method', () => {
    const content = `connection.release();`;
    const results = detectConnectionRelease(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('connection-release');
  });

  it('should detect .end() method', () => {
    const content = `await connection.end();`;
    const results = detectConnectionRelease(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect .destroy() method', () => {
    const content = `connection.destroy();`;
    const results = detectConnectionRelease(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect connection.close() method', () => {
    const content = `await connection.close();`;
    const results = detectConnectionRelease(content);
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Full Analysis Tests
// ============================================================================

describe('analyzeConnectionPooling', () => {
  it('should return empty analysis for excluded files', () => {
    const content = `const pool = new Pool({ max: 10 });`;
    const analysis = analyzeConnectionPooling(content, 'database.test.ts');
    
    expect(analysis.patterns.length).toBe(0);
    expect(analysis.violations.length).toBe(0);
    expect(analysis.hasPoolConfig).toBe(false);
  });

  it('should detect pool configuration', () => {
    const content = `
      const pool = new Pool({
        max: 10,
        min: 2,
        idleTimeoutMillis: 30000
      });
    `;
    const analysis = analyzeConnectionPooling(content, 'database.ts');
    
    expect(analysis.hasPoolConfig).toBe(true);
    expect(analysis.poolSettings).toHaveProperty('pool-size');
  });

  it('should detect connection leak potential', () => {
    const content = `
      async function query() {
        const connection = await pool.getConnection();
        const result = await connection.query('SELECT * FROM users');
        return result;
      }
    `;
    const analysis = analyzeConnectionPooling(content, 'database.ts');
    
    expect(analysis.violations.some(v => v.type === 'connection-leak')).toBe(true);
  });

  it('should not flag connection leak when release exists', () => {
    const content = `
      async function query() {
        const connection = await pool.getConnection();
        try {
          const result = await connection.query('SELECT * FROM users');
          return result;
        } finally {
          connection.release();
        }
      }
    `;
    const analysis = analyzeConnectionPooling(content, 'database.ts');
    
    expect(analysis.violations.some(v => v.type === 'connection-leak')).toBe(false);
  });

  it('should collect pool settings', () => {
    const content = `
      const config = {
        max: 10,
        connectionTimeout: 5000,
        idleTimeout: 30000
      };
    `;
    const analysis = analyzeConnectionPooling(content, 'database.ts');
    
    expect(Object.keys(analysis.poolSettings).length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Detector Class Tests
// ============================================================================

describe('ConnectionPoolingDetector', () => {
  it('should create detector with correct properties', () => {
    const detector = createConnectionPoolingDetector();
    
    expect(detector.id).toBe('data-access/connection-pooling');
    expect(detector.category).toBe('data-access');
    expect(detector.supportedLanguages).toContain('typescript');
    expect(detector.supportedLanguages).toContain('javascript');
  });

  it('should return empty result for unsupported languages', async () => {
    const detector = new ConnectionPoolingDetector();
    const context = createMockContext('styles.css', 'body { color: red; }');
    context.language = 'css';
    
    const result = await detector.detect(context);
    
    expect(result.patterns.length).toBe(0);
    expect(result.violations.length).toBe(0);
  });

  it('should detect patterns in TypeScript files', async () => {
    const detector = new ConnectionPoolingDetector();
    const content = `const pool = new Pool({ max: 10 });`;
    const context = createMockContext('database.ts', content);
    
    const result = await detector.detect(context);
    
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('should return empty result for files without pool config', async () => {
    const detector = new ConnectionPoolingDetector();
    const content = `const x = 1 + 2;`;
    const context = createMockContext('utils.ts', content);
    
    const result = await detector.detect(context);
    
    expect(result.patterns.length).toBe(0);
  });

  it('should have higher confidence when pool config is found', async () => {
    const detector = new ConnectionPoolingDetector();
    const content = `const pool = new Pool({ max: 10 });`;
    const context = createMockContext('database.ts', content);
    
    const result = await detector.detect(context);
    
    expect(result.confidence).toBe(0.9);
  });

  it('should have lower confidence when only acquire is found', async () => {
    const detector = new ConnectionPoolingDetector();
    const content = `const connection = await pool.getConnection();`;
    const context = createMockContext('service.ts', content);
    
    const result = await detector.detect(context);
    
    expect(result.confidence).toBe(0.7);
  });
});
