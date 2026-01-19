/**
 * Response Envelope Detector Tests
 *
 * Tests for response envelope pattern detection including:
 * - Standard envelope patterns
 * - JSON:API format detection
 * - HAL format detection
 * - Pagination format detection
 * - Violation detection
 *
 * @requirements 10.3 - THE API_Detector SHALL detect response envelope patterns ({ data, error, meta })
 */

import { describe, it, expect } from 'vitest';
import {
  ResponseEnvelopeDetector,
  createResponseEnvelopeDetector,
  analyzeResponseEnvelope,
  detectNextjsResponses,
  detectExpressResponses,
  detectResponseObjects,
  detectErrorResponses,
  detectPaginationPatterns,
  detectInconsistentEnvelopeViolations,
  detectMissingFieldViolations,
  detectRawDataViolations,
  detectInconsistentPaginationViolations,
  extractFieldNames,
  detectEnvelopeFormat,
  detectPaginationFormat,
  isListResponse,
  shouldExcludeFile,
} from './response-envelope.js';

// ============================================================================
// Helper Function Tests
// ============================================================================

describe('shouldExcludeFile', () => {
  it('should exclude test files', () => {
    expect(shouldExcludeFile('src/api.test.ts')).toBe(true);
    expect(shouldExcludeFile('src/api.spec.ts')).toBe(true);
    expect(shouldExcludeFile('src/api.test.js')).toBe(true);
  });

  it('should exclude story files', () => {
    expect(shouldExcludeFile('src/Button.stories.tsx')).toBe(true);
  });

  it('should exclude type definition files', () => {
    expect(shouldExcludeFile('src/types.d.ts')).toBe(true);
  });

  it('should exclude node_modules', () => {
    expect(shouldExcludeFile('node_modules/package/index.js')).toBe(true);
  });

  it('should not exclude regular source files', () => {
    expect(shouldExcludeFile('src/api/users.ts')).toBe(false);
    expect(shouldExcludeFile('src/routes/index.js')).toBe(false);
  });
});

describe('extractFieldNames', () => {
  it('should extract field names from object literal', () => {
    const fields = extractFieldNames('data: users, error: null, meta: {}');
    expect(fields).toContain('data');
    expect(fields).toContain('error');
    expect(fields).toContain('meta');
  });

  it('should handle nested objects', () => {
    const fields = extractFieldNames('data: { items: [], total: 10 }, success: true');
    expect(fields).toContain('data');
    expect(fields).toContain('items');
    expect(fields).toContain('total');
    expect(fields).toContain('success');
  });

  it('should handle empty content', () => {
    const fields = extractFieldNames('');
    expect(fields).toEqual([]);
  });
});

describe('detectEnvelopeFormat', () => {
  it('should detect standard envelope format', () => {
    expect(detectEnvelopeFormat(['data', 'error', 'success'])).toBe('standard');
    expect(detectEnvelopeFormat(['result', 'message'])).toBe('standard');
    expect(detectEnvelopeFormat(['payload', 'meta'])).toBe('standard');
  });

  it('should detect JSON:API format', () => {
    expect(detectEnvelopeFormat(['data', 'links', 'included'])).toBe('json-api');
    expect(detectEnvelopeFormat(['data', 'jsonapi', 'meta'])).toBe('json-api');
  });

  it('should detect HAL format', () => {
    expect(detectEnvelopeFormat(['_links', '_embedded'])).toBe('hal');
    expect(detectEnvelopeFormat(['_links', 'name'])).toBe('hal');
  });

  it('should detect GraphQL format', () => {
    expect(detectEnvelopeFormat(['data', 'extensions'])).toBe('graphql');
  });

  it('should detect custom format for unknown structures', () => {
    expect(detectEnvelopeFormat(['foo', 'bar', 'baz'])).toBe('custom');
  });

  it('should detect direct format for minimal structures', () => {
    expect(detectEnvelopeFormat(['id'])).toBe('direct');
    expect(detectEnvelopeFormat([])).toBe('direct');
  });
});

describe('detectPaginationFormat', () => {
  it('should detect offset pagination', () => {
    expect(detectPaginationFormat(['page', 'limit', 'total'])).toBe('offset');
    expect(detectPaginationFormat(['offset', 'count'])).toBe('offset');
    expect(detectPaginationFormat(['limit', 'offset'])).toBe('offset');
  });

  it('should detect cursor pagination', () => {
    expect(detectPaginationFormat(['cursor', 'hasMore'])).toBe('cursor');
    expect(detectPaginationFormat(['nextCursor', 'prevCursor'])).toBe('cursor');
    expect(detectPaginationFormat(['endCursor', 'hasNext'])).toBe('cursor');
  });

  it('should detect page-based pagination', () => {
    expect(detectPaginationFormat(['currentPage', 'totalPages', 'pageSize'])).toBe('page-based');
    expect(detectPaginationFormat(['page', 'pageSize', 'totalPages'])).toBe('page-based');
  });

  it('should detect link-based pagination', () => {
    expect(detectPaginationFormat(['next', 'prev', 'first', 'last'])).toBe('link-based');
  });

  it('should detect mixed pagination', () => {
    expect(detectPaginationFormat(['page', 'cursor', 'hasMore'])).toBe('mixed');
    expect(detectPaginationFormat(['limit', 'cursor'])).toBe('mixed');
  });

  it('should return null for no pagination', () => {
    expect(detectPaginationFormat(['data', 'error'])).toBeNull();
    expect(detectPaginationFormat([])).toBeNull();
  });
});

describe('isListResponse', () => {
  it('should detect list responses by field names', () => {
    expect(isListResponse(['items', 'total'], '')).toBe(true);
    expect(isListResponse(['results', 'count'], '')).toBe(true);
    expect(isListResponse(['list'], '')).toBe(true);
  });

  it('should detect list responses by pagination fields', () => {
    expect(isListResponse(['page', 'limit'], '')).toBe(true);
    expect(isListResponse(['cursor', 'hasMore'], '')).toBe(true);
  });

  it('should detect list responses by array content', () => {
    expect(isListResponse(['data'], 'data: [')).toBe(true);
    expect(isListResponse(['results'], 'results: [')).toBe(true);
  });

  it('should return false for non-list responses', () => {
    expect(isListResponse(['data', 'error'], 'data: { id: 1 }')).toBe(false);
    expect(isListResponse(['user'], '')).toBe(false);
  });
});

// ============================================================================
// Pattern Detection Tests
// ============================================================================

describe('detectNextjsResponses', () => {
  it('should detect Response.json patterns', () => {
    const content = `
      export async function GET() {
        return Response.json({ data: users, success: true });
      }
    `;
    const patterns = detectNextjsResponses(content, 'app/api/users/route.ts');
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns[0]?.type).toBe('nextjs-response');
    expect(patterns[0]?.format).toBe('standard');
  });

  it('should detect NextResponse.json patterns', () => {
    const content = `
      import { NextResponse } from 'next/server';
      export async function POST() {
        return NextResponse.json({ data: result, error: null });
      }
    `;
    const patterns = detectNextjsResponses(content, 'app/api/create/route.ts');
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns[0]?.fields).toContain('data');
    expect(patterns[0]?.fields).toContain('error');
  });

  it('should detect new Response with JSON.stringify', () => {
    const content = `
      export async function GET() {
        return new Response(JSON.stringify({ data: items, meta: { total: 10 } }));
      }
    `;
    const patterns = detectNextjsResponses(content, 'app/api/items/route.ts');
    expect(patterns.length).toBeGreaterThan(0);
  });

  it('should ignore patterns in comments', () => {
    const content = `
      // Response.json({ data: test })
      /* NextResponse.json({ error: null }) */
      export async function GET() {
        return Response.json({ data: real });
      }
    `;
    const patterns = detectNextjsResponses(content, 'app/api/test/route.ts');
    expect(patterns.length).toBe(1);
    expect(patterns[0]?.fields).toContain('data');
  });
});

describe('detectExpressResponses', () => {
  it('should detect res.json patterns', () => {
    const content = `
      app.get('/users', (req, res) => {
        res.json({ data: users, success: true });
      });
    `;
    const patterns = detectExpressResponses(content, 'src/routes/users.ts');
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns[0]?.type).toBe('express-response');
  });

  it('should detect res.send patterns', () => {
    const content = `
      router.post('/create', (req, res) => {
        res.send({ data: result, message: 'Created' });
      });
    `;
    const patterns = detectExpressResponses(content, 'src/routes/create.ts');
    expect(patterns.length).toBeGreaterThan(0);
  });

  it('should detect res.status().json patterns', () => {
    const content = `
      app.get('/item/:id', (req, res) => {
        res.status(200).json({ data: item, success: true });
      });
    `;
    const patterns = detectExpressResponses(content, 'src/routes/items.ts');
    expect(patterns.length).toBeGreaterThan(0);
  });

  it('should detect res.status().send patterns', () => {
    const content = `
      router.delete('/item/:id', (req, res) => {
        res.status(204).send({ success: true, message: 'Deleted' });
      });
    `;
    const patterns = detectExpressResponses(content, 'src/routes/items.ts');
    expect(patterns.length).toBeGreaterThan(0);
  });
});

describe('detectResponseObjects', () => {
  it('should detect return statements with envelope structure', () => {
    const content = `
      function getUser(id) {
        return { data: user, success: true };
      }
    `;
    const patterns = detectResponseObjects(content, 'src/services/user.ts');
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns[0]?.format).toBe('standard');
  });

  it('should detect response variable assignments', () => {
    const content = `
      const response = { data: items, meta: { total: 100 } };
    `;
    const patterns = detectResponseObjects(content, 'src/api/items.ts');
    expect(patterns.length).toBeGreaterThan(0);
  });

  it('should detect objects with envelope fields', () => {
    const content = `
      const result = { data: users, error: null, success: true };
    `;
    const patterns = detectResponseObjects(content, 'src/api/users.ts');
    expect(patterns.length).toBeGreaterThan(0);
  });
});

describe('detectErrorResponses', () => {
  it('should detect error object patterns', () => {
    const content = `
      return { error: { message: 'Not found', code: 404 } };
    `;
    const patterns = detectErrorResponses(content, 'src/api/error.ts');
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns[0]?.type).toBe('error-response');
  });

  it('should detect errors array patterns', () => {
    const content = `
      return { errors: [{ field: 'email', message: 'Invalid' }] };
    `;
    const patterns = detectErrorResponses(content, 'src/api/validation.ts');
    expect(patterns.length).toBeGreaterThan(0);
  });

  it('should detect success: false patterns', () => {
    const content = `
      return { success: false, error: 'Something went wrong' };
    `;
    const patterns = detectErrorResponses(content, 'src/api/error.ts');
    expect(patterns.length).toBeGreaterThan(0);
  });
});

describe('detectPaginationPatterns', () => {
  it('should detect offset pagination', () => {
    const content = `
      return { page: 1, limit: 10, total: 100, offset: 0 };
    `;
    const patterns = detectPaginationPatterns(content, 'src/api/list.ts');
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns[0]?.paginationFormat).toBe('offset');
  });

  it('should detect cursor pagination', () => {
    const content = `
      return { cursor: 'abc123', hasMore: true, nextCursor: 'def456' };
    `;
    const patterns = detectPaginationPatterns(content, 'src/api/list.ts');
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns[0]?.paginationFormat).toBe('cursor');
  });

  it('should detect page-based pagination', () => {
    const content = `
      return { currentPage: 1, totalPages: 10, pageSize: 20 };
    `;
    const patterns = detectPaginationPatterns(content, 'src/api/list.ts');
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns[0]?.paginationFormat).toBe('page-based');
  });
});

// ============================================================================
// Violation Detection Tests
// ============================================================================

describe('detectInconsistentEnvelopeViolations', () => {
  it('should detect mixed formats', () => {
    const patterns = [
      { type: 'express-response' as const, format: 'standard' as const, file: 'test.ts', line: 1, column: 1, matchedText: 'test' },
      { type: 'express-response' as const, format: 'standard' as const, file: 'test.ts', line: 5, column: 1, matchedText: 'test' },
      { type: 'express-response' as const, format: 'json-api' as const, file: 'test.ts', line: 10, column: 1, matchedText: 'test' },
    ];
    const violations = detectInconsistentEnvelopeViolations(patterns, 'test.ts');
    expect(violations.length).toBe(1);
    expect(violations[0]?.type).toBe('mixed-formats');
  });

  it('should not flag when all formats are consistent', () => {
    const patterns = [
      { type: 'express-response' as const, format: 'standard' as const, file: 'test.ts', line: 1, column: 1, matchedText: 'test' },
      { type: 'express-response' as const, format: 'standard' as const, file: 'test.ts', line: 5, column: 1, matchedText: 'test' },
    ];
    const violations = detectInconsistentEnvelopeViolations(patterns, 'test.ts');
    expect(violations.length).toBe(0);
  });

  it('should ignore direct format in consistency check', () => {
    const patterns = [
      { type: 'express-response' as const, format: 'standard' as const, file: 'test.ts', line: 1, column: 1, matchedText: 'test' },
      { type: 'express-response' as const, format: 'direct' as const, file: 'test.ts', line: 5, column: 1, matchedText: 'test' },
    ];
    const violations = detectInconsistentEnvelopeViolations(patterns, 'test.ts');
    expect(violations.length).toBe(0);
  });
});

describe('detectMissingFieldViolations', () => {
  it('should detect missing data field when others have it', () => {
    const patterns = [
      { type: 'express-response' as const, format: 'standard' as const, file: 'test.ts', line: 1, column: 1, matchedText: 'test', fields: ['data', 'success'] },
      { type: 'express-response' as const, format: 'standard' as const, file: 'test.ts', line: 5, column: 1, matchedText: 'test', fields: ['data', 'meta'] },
      { type: 'express-response' as const, format: 'standard' as const, file: 'test.ts', line: 10, column: 1, matchedText: 'test', fields: ['data', 'success'] },
      // This pattern is missing data field and doesn't have error field
      { type: 'express-response' as const, format: 'standard' as const, file: 'test.ts', line: 15, column: 1, matchedText: 'test', fields: ['success', 'meta'] },
    ];
    const violations = detectMissingFieldViolations(patterns, 'test.ts');
    expect(violations.some(v => v.type === 'missing-data-field')).toBe(true);
  });

  it('should not flag error responses for missing data field', () => {
    const patterns = [
      { type: 'express-response' as const, format: 'standard' as const, file: 'test.ts', line: 1, column: 1, matchedText: 'test', fields: ['data', 'success'] },
      { type: 'error-response' as const, format: 'standard' as const, file: 'test.ts', line: 5, column: 1, matchedText: 'test', fields: ['error', 'message'] },
    ];
    const violations = detectMissingFieldViolations(patterns, 'test.ts');
    expect(violations.filter(v => v.type === 'missing-data-field').length).toBe(0);
  });
});

describe('detectRawDataViolations', () => {
  it('should detect direct array returns when envelope is used', () => {
    const content = `
      return { data: users, success: true };
      return [item1, item2];
    `;
    const patterns = [
      { type: 'express-response' as const, format: 'standard' as const, file: 'test.ts', line: 1, column: 1, matchedText: 'test', fields: ['data', 'success'] },
    ];
    const violations = detectRawDataViolations(patterns, content, 'test.ts');
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0]?.type).toBe('raw-data-response');
  });

  it('should detect res.json with direct array', () => {
    const content = `
      res.json({ data: users });
      res.json([item1, item2]);
    `;
    const patterns = [
      { type: 'express-response' as const, format: 'standard' as const, file: 'test.ts', line: 1, column: 1, matchedText: 'test', fields: ['data'] },
    ];
    const violations = detectRawDataViolations(patterns, content, 'test.ts');
    expect(violations.length).toBeGreaterThan(0);
  });

  it('should not flag when no envelope pattern is established', () => {
    const content = `
      return [item1, item2];
    `;
    const patterns: any[] = [];
    const violations = detectRawDataViolations(patterns, content, 'test.ts');
    expect(violations.length).toBe(0);
  });
});

describe('detectInconsistentPaginationViolations', () => {
  it('should detect inconsistent pagination formats', () => {
    const patterns = [
      { type: 'pagination-metadata' as const, format: 'standard' as const, file: 'test.ts', line: 1, column: 1, matchedText: 'test', paginationFormat: 'offset' as const },
      { type: 'pagination-metadata' as const, format: 'standard' as const, file: 'test.ts', line: 5, column: 1, matchedText: 'test', paginationFormat: 'offset' as const },
      { type: 'pagination-metadata' as const, format: 'standard' as const, file: 'test.ts', line: 10, column: 1, matchedText: 'test', paginationFormat: 'cursor' as const },
    ];
    const violations = detectInconsistentPaginationViolations(patterns, 'test.ts');
    expect(violations.length).toBe(1);
    expect(violations[0]?.type).toBe('inconsistent-pagination');
  });

  it('should flag mixed pagination within single response', () => {
    const patterns = [
      { type: 'pagination-metadata' as const, format: 'standard' as const, file: 'test.ts', line: 1, column: 1, matchedText: 'test', paginationFormat: 'offset' as const },
      { type: 'pagination-metadata' as const, format: 'standard' as const, file: 'test.ts', line: 5, column: 1, matchedText: 'test', paginationFormat: 'mixed' as const },
    ];
    const violations = detectInconsistentPaginationViolations(patterns, 'test.ts');
    expect(violations.length).toBeGreaterThan(0);
    expect(violations.some(v => v.issue.includes('mixes different pagination formats'))).toBe(true);
  });

  it('should not flag consistent pagination', () => {
    const patterns = [
      { type: 'pagination-metadata' as const, format: 'standard' as const, file: 'test.ts', line: 1, column: 1, matchedText: 'test', paginationFormat: 'cursor' as const },
      { type: 'pagination-metadata' as const, format: 'standard' as const, file: 'test.ts', line: 5, column: 1, matchedText: 'test', paginationFormat: 'cursor' as const },
    ];
    const violations = detectInconsistentPaginationViolations(patterns, 'test.ts');
    expect(violations.length).toBe(0);
  });
});

// ============================================================================
// Main Analysis Function Tests
// ============================================================================

describe('analyzeResponseEnvelope', () => {
  it('should analyze file with standard envelope pattern', () => {
    const content = `
      export async function GET() {
        return Response.json({ data: users, success: true, meta: { total: 10 } });
      }
      export async function POST() {
        return Response.json({ data: newUser, success: true });
      }
    `;
    const analysis = analyzeResponseEnvelope(content, 'app/api/users/route.ts');
    expect(analysis.dominantFormat).toBe('standard');
    expect(analysis.usesConsistentEnvelope).toBe(true);
    expect(analysis.patternAdherenceConfidence).toBeGreaterThan(0.5);
  });

  it('should detect pagination format', () => {
    const content = `
      return { data: items, page: 1, limit: 10, total: 100 };
    `;
    const analysis = analyzeResponseEnvelope(content, 'src/api/items.ts');
    expect(analysis.paginationFormat).toBe('offset');
  });

  it('should skip excluded files', () => {
    const content = `
      return { data: test };
    `;
    const analysis = analyzeResponseEnvelope(content, 'src/api.test.ts');
    expect(analysis.envelopePatterns.length).toBe(0);
    expect(analysis.patternAdherenceConfidence).toBe(1.0);
  });

  it('should detect violations in mixed format files', () => {
    const content = `
      res.json({ data: users, success: true });
      res.json({ data: items, success: true });
      res.json({ data: posts, links: { self: '/posts' }, included: [] });
    `;
    const analysis = analyzeResponseEnvelope(content, 'src/routes/api.ts');
    expect(analysis.violations.length).toBeGreaterThan(0);
    expect(analysis.usesConsistentEnvelope).toBe(false);
  });
});

// ============================================================================
// Detector Class Tests
// ============================================================================

describe('ResponseEnvelopeDetector', () => {
  it('should create detector with correct properties', () => {
    const detector = createResponseEnvelopeDetector();
    expect(detector.id).toBe('api/response-envelope');
    expect(detector.category).toBe('api');
    expect(detector.subcategory).toBe('response-envelope');
    expect(detector.name).toBe('Response Envelope Detector');
    expect(detector.supportedLanguages).toContain('typescript');
    expect(detector.supportedLanguages).toContain('javascript');
  });

  it('should detect patterns in Next.js route file', async () => {
    const detector = new ResponseEnvelopeDetector();
    const context = {
      file: 'app/api/users/route.ts',
      content: `
        import { NextResponse } from 'next/server';
        
        export async function GET() {
          const users = await getUsers();
          return NextResponse.json({ data: users, success: true });
        }
        
        export async function POST(request: Request) {
          const body = await request.json();
          const user = await createUser(body);
          return NextResponse.json({ data: user, success: true });
        }
      `,
      ast: null,
      imports: [],
      exports: [],
      projectContext: { rootDir: '/project', patterns: [], config: {} },
    };
    
    const result = await detector.detect(context);
    expect(result.patterns.length).toBeGreaterThan(0);
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('should detect patterns in Express route file', async () => {
    const detector = new ResponseEnvelopeDetector();
    const context = {
      file: 'src/routes/users.ts',
      content: `
        import express from 'express';
        const router = express.Router();
        
        router.get('/', async (req, res) => {
          const users = await User.findAll();
          res.json({ data: users, success: true, meta: { total: users.length } });
        });
        
        router.post('/', async (req, res) => {
          const user = await User.create(req.body);
          res.status(201).json({ data: user, success: true });
        });
        
        export default router;
      `,
      ast: null,
      imports: [],
      exports: [],
      projectContext: { rootDir: '/project', patterns: [], config: {} },
    };
    
    const result = await detector.detect(context);
    expect(result.patterns.length).toBeGreaterThan(0);
  });

  it('should detect violations for inconsistent envelopes', async () => {
    const detector = new ResponseEnvelopeDetector();
    const context = {
      file: 'src/routes/mixed.ts',
      content: `
        // Standard format
        res.json({ data: users, success: true });
        res.json({ data: items, success: true });
        
        // JSON:API format (inconsistent)
        res.json({ data: posts, links: { self: '/posts' }, included: [] });
      `,
      ast: null,
      imports: [],
      exports: [],
      projectContext: { rootDir: '/project', patterns: [], config: {} },
    };
    
    const result = await detector.detect(context);
    expect(result.violations.length).toBeGreaterThan(0);
  });

  it('should generate quick fix for violations', () => {
    const detector = new ResponseEnvelopeDetector();
    const violation = {
      id: 'test-violation',
      patternId: 'api/response-envelope',
      severity: 'warning' as const,
      file: 'test.ts',
      range: {
        start: { line: 0, character: 0 },
        end: { line: 0, character: 10 },
      },
      message: 'Response envelope is missing a data field',
      expected: 'Add a "data" field',
      actual: '{ users }',
      aiExplainAvailable: true,
      aiFixAvailable: true,
      firstSeen: new Date(),
      occurrences: 1,
    };
    
    const quickFix = detector.generateQuickFix(violation);
    expect(quickFix).not.toBeNull();
    expect(quickFix?.title).toContain('data');
  });

  it('should return null for non-matching violations', () => {
    const detector = new ResponseEnvelopeDetector();
    const violation = {
      id: 'test-violation',
      patternId: 'other/pattern',
      severity: 'warning' as const,
      file: 'test.ts',
      range: {
        start: { line: 0, character: 0 },
        end: { line: 0, character: 10 },
      },
      message: 'Some other violation',
      expected: 'Something',
      actual: 'Something else',
      aiExplainAvailable: false,
      aiFixAvailable: false,
      firstSeen: new Date(),
      occurrences: 1,
    };
    
    const quickFix = detector.generateQuickFix(violation);
    expect(quickFix).toBeNull();
  });
});

// ============================================================================
// Edge Cases and Integration Tests
// ============================================================================

describe('Edge Cases', () => {
  it('should handle empty files', () => {
    const analysis = analyzeResponseEnvelope('', 'src/empty.ts');
    expect(analysis.envelopePatterns.length).toBe(0);
    expect(analysis.violations.length).toBe(0);
  });

  it('should handle files with only comments', () => {
    const content = `
      // This is a comment
      /* This is a block comment
         with multiple lines */
    `;
    const analysis = analyzeResponseEnvelope(content, 'src/comments.ts');
    expect(analysis.envelopePatterns.length).toBe(0);
  });

  it('should handle deeply nested response objects', () => {
    const content = `
      return {
        data: {
          user: {
            profile: {
              settings: {}
            }
          }
        },
        meta: {
          pagination: {
            page: 1,
            limit: 10
          }
        }
      };
    `;
    const analysis = analyzeResponseEnvelope(content, 'src/nested.ts');
    expect(analysis.envelopePatterns.length).toBeGreaterThan(0);
  });

  it('should handle multiple response patterns in same file', () => {
    const content = `
      // GET endpoint
      res.json({ data: users, success: true });
      
      // POST endpoint
      res.json({ data: newUser, success: true });
      
      // DELETE endpoint
      res.json({ success: true, message: 'Deleted' });
      
      // Error response
      res.status(400).json({ error: { message: 'Bad request' }, success: false });
    `;
    const analysis = analyzeResponseEnvelope(content, 'src/routes/users.ts');
    expect(analysis.envelopePatterns.length).toBeGreaterThan(2);
    expect(analysis.dominantFormat).toBe('standard');
  });
});
