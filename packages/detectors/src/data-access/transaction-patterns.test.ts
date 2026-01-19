/**
 * Transaction Patterns Detector Tests
 *
 * Tests for database transaction pattern detection.
 *
 * @requirements 13.3 - Transaction pattern detection
 */

import { describe, it, expect } from 'vitest';
import {
  TransactionPatternsDetector,
  createTransactionPatternsDetector,
  detectTransactionBlocks,
  detectTransactionDecorators,
  detectCommitPatterns,
  detectRollbackPatterns,
  detectSavepoints,
  detectIsolationLevels,
  analyzeTransactionPatterns,
  shouldExcludeFile,
} from './transaction-patterns.js';
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
    expect(shouldExcludeFile('transaction.test.ts')).toBe(true);
    expect(shouldExcludeFile('transaction.spec.ts')).toBe(true);
  });

  it('should exclude __tests__ directory', () => {
    expect(shouldExcludeFile('__tests__/transaction.ts')).toBe(true);
  });

  it('should exclude type definition files', () => {
    expect(shouldExcludeFile('types.d.ts')).toBe(true);
  });

  it('should exclude node_modules', () => {
    expect(shouldExcludeFile('node_modules/prisma/index.js')).toBe(true);
  });

  it('should not exclude regular source files', () => {
    expect(shouldExcludeFile('src/services/order.ts')).toBe(false);
    expect(shouldExcludeFile('lib/database.ts')).toBe(false);
  });
});

// ============================================================================
// Transaction Block Detection Tests
// ============================================================================

describe('detectTransactionBlocks', () => {
  it('should detect prisma $transaction', () => {
    const content = `await prisma.$transaction(async (tx) => {`;
    const results = detectTransactionBlocks(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('transaction-block');
  });

  it('should detect .transaction method', () => {
    const content = `await db.transaction(async (trx) => {`;
    const results = detectTransactionBlocks(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect beginTransaction', () => {
    const content = `const trx = await connection.beginTransaction();`;
    const results = detectTransactionBlocks(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect startTransaction', () => {
    const content = `await queryRunner.startTransaction();`;
    const results = detectTransactionBlocks(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect withTransaction', () => {
    const content = `await withTransaction(async (tx) => {`;
    const results = detectTransactionBlocks(content);
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Transaction Decorator Detection Tests
// ============================================================================

describe('detectTransactionDecorators', () => {
  it('should detect @Transaction decorator', () => {
    const content = `@Transaction()
    async createOrder() {`;
    const results = detectTransactionDecorators(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('transaction-decorator');
  });

  it('should detect @Transactional decorator', () => {
    const content = `@Transactional()
    async processPayment() {`;
    const results = detectTransactionDecorators(content);
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Commit Pattern Detection Tests
// ============================================================================

describe('detectCommitPatterns', () => {
  it('should detect .commit() method', () => {
    const content = `await transaction.commit();`;
    const results = detectCommitPatterns(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('manual-commit');
  });

  it('should detect commitTransaction', () => {
    const content = `await queryRunner.commitTransaction();`;
    const results = detectCommitPatterns(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect SQL COMMIT', () => {
    const content = `await db.query('COMMIT');`;
    const results = detectCommitPatterns(content);
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Rollback Pattern Detection Tests
// ============================================================================

describe('detectRollbackPatterns', () => {
  it('should detect .rollback() method', () => {
    const content = `await transaction.rollback();`;
    const results = detectRollbackPatterns(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('manual-rollback');
  });

  it('should detect rollbackTransaction', () => {
    const content = `await queryRunner.rollbackTransaction();`;
    const results = detectRollbackPatterns(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect SQL ROLLBACK', () => {
    const content = `await db.query('ROLLBACK');`;
    const results = detectRollbackPatterns(content);
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Savepoint Detection Tests
// ============================================================================

describe('detectSavepoints', () => {
  it('should detect SQL SAVEPOINT', () => {
    const content = `await db.query('SAVEPOINT my_savepoint');`;
    const results = detectSavepoints(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('savepoint');
  });

  it('should detect .savepoint() method', () => {
    const content = `await trx.savepoint('checkpoint');`;
    const results = detectSavepoints(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect createSavepoint', () => {
    const content = `await connection.createSavepoint('sp1');`;
    const results = detectSavepoints(content);
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Isolation Level Detection Tests
// ============================================================================

describe('detectIsolationLevels', () => {
  it('should detect isolationLevel config', () => {
    const content = `{ isolationLevel: 'ReadCommitted' }`;
    const results = detectIsolationLevels(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('isolation-level');
  });

  it('should detect SET TRANSACTION ISOLATION LEVEL', () => {
    const content = `await db.query('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE');`;
    const results = detectIsolationLevels(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect ReadCommitted level', () => {
    const content = `const level = IsolationLevel.ReadCommitted;`;
    const results = detectIsolationLevels(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect Serializable level', () => {
    const content = `const level = IsolationLevel.Serializable;`;
    const results = detectIsolationLevels(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect RepeatableRead level', () => {
    const content = `const level = IsolationLevel.RepeatableRead;`;
    const results = detectIsolationLevels(content);
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Full Analysis Tests
// ============================================================================

describe('analyzeTransactionPatterns', () => {
  it('should return empty analysis for excluded files', () => {
    const content = `await prisma.$transaction(async (tx) => {});`;
    const analysis = analyzeTransactionPatterns(content, 'transaction.test.ts');
    
    expect(analysis.patterns.length).toBe(0);
    expect(analysis.violations.length).toBe(0);
    expect(analysis.hasTransactions).toBe(false);
  });

  it('should detect transaction usage', () => {
    const content = `
      await prisma.$transaction(async (tx) => {
        await tx.user.create({ data: { name } });
        await tx.order.create({ data: { userId } });
      });
    `;
    const analysis = analyzeTransactionPatterns(content, 'service.ts');
    
    expect(analysis.hasTransactions).toBe(true);
    expect(analysis.transactionCount).toBeGreaterThan(0);
  });

  it('should detect missing rollback violation', () => {
    const content = `
      const trx = await db.beginTransaction();
      await trx.query('INSERT INTO users...');
      await trx.commit();
    `;
    const analysis = analyzeTransactionPatterns(content, 'service.ts');
    
    expect(analysis.violations.some(v => v.type === 'missing-rollback')).toBe(true);
  });

  it('should not flag missing rollback when rollback exists', () => {
    const content = `
      const trx = await db.beginTransaction();
      try {
        await trx.query('INSERT INTO users...');
        await trx.commit();
      } catch (e) {
        await trx.rollback();
      }
    `;
    const analysis = analyzeTransactionPatterns(content, 'service.ts');
    
    expect(analysis.violations.some(v => v.type === 'missing-rollback')).toBe(false);
  });

  it('should count transaction blocks', () => {
    const content = `
      await prisma.$transaction(async (tx) => {});
      await db.transaction(async (trx) => {});
    `;
    const analysis = analyzeTransactionPatterns(content, 'service.ts');
    
    expect(analysis.transactionCount).toBe(2);
  });
});

// ============================================================================
// Detector Class Tests
// ============================================================================

describe('TransactionPatternsDetector', () => {
  it('should create detector with correct properties', () => {
    const detector = createTransactionPatternsDetector();
    
    expect(detector.id).toBe('data-access/transaction-patterns');
    expect(detector.category).toBe('data-access');
    expect(detector.supportedLanguages).toContain('typescript');
    expect(detector.supportedLanguages).toContain('javascript');
  });

  it('should return empty result for unsupported languages', async () => {
    const detector = new TransactionPatternsDetector();
    const context = createMockContext('styles.css', 'body { color: red; }');
    context.language = 'css';
    
    const result = await detector.detect(context);
    
    expect(result.patterns.length).toBe(0);
    expect(result.violations.length).toBe(0);
  });

  it('should detect patterns in TypeScript files', async () => {
    const detector = new TransactionPatternsDetector();
    const content = `await prisma.$transaction(async (tx) => {});`;
    const context = createMockContext('service.ts', content);
    
    const result = await detector.detect(context);
    
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('should return empty result for files without transactions', async () => {
    const detector = new TransactionPatternsDetector();
    const content = `const x = 1 + 2;`;
    const context = createMockContext('utils.ts', content);
    
    const result = await detector.detect(context);
    
    expect(result.patterns.length).toBe(0);
  });

  it('should have higher confidence when transactions are found', async () => {
    const detector = new TransactionPatternsDetector();
    const content = `await prisma.$transaction(async (tx) => {});`;
    const context = createMockContext('service.ts', content);
    
    const result = await detector.detect(context);
    
    expect(result.confidence).toBe(0.9);
  });
});
