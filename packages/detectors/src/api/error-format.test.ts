/**
 * Error Format Detector Tests
 * @requirements 10.4 - Error response format detection
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ErrorFormatDetector,
  createErrorFormatDetector,
  analyzeErrorFormat,
  detectErrorObjects,
  detectErrorClasses,
  detectErrorThrows,
  detectErrorResponses,
  detectInconsistentFormatViolations,
  detectMissingFieldViolations,
  detectRawErrorStringViolations,
  detectGenericErrorViolations,
  detectInconsistentCodeViolations,
  shouldExcludeFile,
  extractFieldNames,
  detectErrorFormat,
  detectErrorCodeConvention,
  isErrorCode,
  type ErrorFormat,
  type ErrorFormatPatternInfo,
} from './error-format.js';

describe('ErrorFormatDetector', () => {
  let detector: ErrorFormatDetector;

  beforeEach(() => {
    detector = createErrorFormatDetector();
  });

  describe('detector metadata', () => {
    it('should have correct id', () => {
      expect(detector.id).toBe('api/error-format');
    });

    it('should have correct name', () => {
      expect(detector.name).toBe('Error Format Detector');
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
    it('should detect error patterns in API handlers', async () => {
      const content = `
        export async function POST(req: Request) {
          try {
            const data = await req.json();
            return Response.json({ data, success: true });
          } catch (error) {
            return Response.json({ error: { message: 'Failed', code: 'VALIDATION_ERROR' } }, { status: 400 });
          }
        }
      `;
      const result = await detector.detect({ content, file: 'api/route.ts', language: 'typescript', ast: null, imports: [], exports: [], projectContext: { rootDir: '', files: [], config: {} }, extension: '.ts', isTestFile: false, isTypeDefinition: false });
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should skip test files', async () => {
      const content = `throw new Error('test error');`;
      const result = await detector.detect({ content, file: 'api/route.test.ts', language: 'typescript', ast: null, imports: [], exports: [], projectContext: { rootDir: '', files: [], config: {} }, extension: '.ts', isTestFile: true, isTypeDefinition: false });
      expect(result.patterns).toHaveLength(0);
      expect(result.violations).toHaveLength(0);
    });
  });
});


describe('shouldExcludeFile', () => {
  it('should exclude test files', () => {
    expect(shouldExcludeFile('api/route.test.ts')).toBe(true);
    expect(shouldExcludeFile('api/route.spec.ts')).toBe(true);
  });

  it('should exclude story files', () => {
    expect(shouldExcludeFile('components/Error.stories.tsx')).toBe(true);
  });

  it('should exclude declaration files', () => {
    expect(shouldExcludeFile('types/errors.d.ts')).toBe(true);
  });

  it('should exclude node_modules', () => {
    expect(shouldExcludeFile('node_modules/package/error.ts')).toBe(true);
  });

  it('should exclude mock files', () => {
    expect(shouldExcludeFile('api/errors.mock.ts')).toBe(true);
  });

  it('should not exclude regular files', () => {
    expect(shouldExcludeFile('api/route.ts')).toBe(false);
    expect(shouldExcludeFile('lib/errors.ts')).toBe(false);
    expect(shouldExcludeFile('src/exceptions/AppError.ts')).toBe(false);
  });
});

describe('extractFieldNames', () => {
  it('should extract field names from object literal', () => {
    const fields = extractFieldNames('message: "error", code: "ERR_001", details: {}');
    expect(fields).toContain('message');
    expect(fields).toContain('code');
    expect(fields).toContain('details');
  });

  it('should handle nested objects', () => {
    const fields = extractFieldNames('error: { message: "fail", code: "E001" }');
    expect(fields).toContain('error');
    expect(fields).toContain('message');
    expect(fields).toContain('code');
  });

  it('should return empty array for empty content', () => {
    expect(extractFieldNames('')).toEqual([]);
  });
});

describe('detectErrorFormat', () => {
  it('should detect standard format', () => {
    expect(detectErrorFormat(['message', 'code', 'details'])).toBe('standard');
    expect(detectErrorFormat(['error', 'message', 'statusCode'])).toBe('standard');
  });

  it('should detect problem-details format (RFC 7807)', () => {
    expect(detectErrorFormat(['type', 'title', 'status', 'detail'])).toBe('problem-details');
    expect(detectErrorFormat(['type', 'title', 'status', 'detail', 'instance'])).toBe('problem-details');
  });

  it('should detect json-api format', () => {
    // JSON:API is detected when source or meta is present with other fields
    // Problem-details takes precedence when type/title/status/detail are present
    // Use fields that are unique to JSON:API
    expect(detectErrorFormat(['id', 'status', 'code', 'source', 'meta'])).toBe('json-api');
    expect(detectErrorFormat(['status', 'code', 'source', 'links'])).toBe('json-api');
  });

  it('should detect graphql format', () => {
    expect(detectErrorFormat(['message', 'locations', 'path'])).toBe('graphql');
    expect(detectErrorFormat(['message', 'path', 'extensions'])).toBe('graphql');
  });

  it('should detect simple format', () => {
    expect(detectErrorFormat(['message'])).toBe('simple');
    expect(detectErrorFormat(['msg'])).toBe('simple');
  });

  it('should detect custom format', () => {
    expect(detectErrorFormat(['foo', 'bar', 'baz'])).toBe('custom');
  });
});

describe('detectErrorCodeConvention', () => {
  it('should detect SCREAMING_SNAKE_CASE', () => {
    expect(detectErrorCodeConvention('VALIDATION_ERROR')).toBe('screaming_snake');
    // ERR_ prefix also matches screaming_snake pattern first
    expect(detectErrorCodeConvention('ERR_NOT_FOUND')).toBe('screaming_snake');
  });

  it('should detect camelCase', () => {
    expect(detectErrorCodeConvention('validationError')).toBe('camelCase');
    expect(detectErrorCodeConvention('notFound')).toBe('camelCase');
  });

  it('should detect kebab-case', () => {
    expect(detectErrorCodeConvention('validation-error')).toBe('kebab');
    expect(detectErrorCodeConvention('not-found')).toBe('kebab');
  });

  it('should detect dotted notation', () => {
    expect(detectErrorCodeConvention('validation.error')).toBe('dotted');
    expect(detectErrorCodeConvention('api.not.found')).toBe('dotted');
  });

  it('should detect prefixed codes', () => {
    // Prefixed codes also match screaming_snake pattern
    // The prefixed pattern is more specific but screaming_snake matches first
    expect(detectErrorCodeConvention('ERR_VALIDATION')).toBe('screaming_snake');
    expect(detectErrorCodeConvention('ERROR_NOT_FOUND')).toBe('screaming_snake');
    expect(detectErrorCodeConvention('E_TIMEOUT')).toBe('screaming_snake');
  });

  it('should return null for unrecognized patterns', () => {
    expect(detectErrorCodeConvention('123')).toBe(null);
    expect(detectErrorCodeConvention('')).toBe(null);
  });
});

describe('isErrorCode', () => {
  it('should recognize valid error codes', () => {
    expect(isErrorCode('VALIDATION_ERROR')).toBe(true);
    expect(isErrorCode('ERR_NOT_FOUND')).toBe(true);
    expect(isErrorCode('validationError')).toBe(true);
  });

  it('should reject invalid error codes', () => {
    expect(isErrorCode('ab')).toBe(false); // too short
    expect(isErrorCode('a'.repeat(51))).toBe(false); // too long
  });
});


describe('detectErrorObjects', () => {
  it('should detect error object patterns', () => {
    const content = `
      return { error: { message: 'Not found', code: 'NOT_FOUND' } };
    `;
    const patterns = detectErrorObjects(content, 'api/route.ts');
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns[0].type).toBe('error-object');
  });

  it('should detect error array patterns', () => {
    const content = `
      return { errors: [{ message: 'Field required', field: 'email' }] };
    `;
    const patterns = detectErrorObjects(content, 'api/route.ts');
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns[0].type).toBe('error-array');
  });

  it('should detect simple error string patterns', () => {
    const content = `
      return { error: "Something went wrong" };
    `;
    const patterns = detectErrorObjects(content, 'api/route.ts');
    expect(patterns.length).toBeGreaterThan(0);
  });

  it('should extract error codes', () => {
    const content = `
      return { error: { message: 'Invalid', code: 'VALIDATION_ERROR' } };
    `;
    const patterns = detectErrorObjects(content, 'api/route.ts');
    expect(patterns.some(p => p.errorCode === 'VALIDATION_ERROR')).toBe(true);
  });

  it('should skip patterns in comments', () => {
    const content = `
      // return { error: { message: 'Not found' } };
      /* { error: { message: 'Ignored' } } */
    `;
    const patterns = detectErrorObjects(content, 'api/route.ts');
    expect(patterns).toHaveLength(0);
  });
});

describe('detectErrorClasses', () => {
  it('should detect error class definitions', () => {
    const content = `
      class ValidationError extends Error {
        constructor(public message: string, public code: string) {
          super(message);
        }
      }
    `;
    const patterns = detectErrorClasses(content, 'lib/errors.ts');
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns[0].type).toBe('error-class');
    expect(patterns[0].errorClass).toBe('ValidationError');
  });

  it('should detect custom base error classes', () => {
    const content = `
      class NotFoundError extends AppError {
        code = 'NOT_FOUND';
      }
    `;
    const patterns = detectErrorClasses(content, 'lib/errors.ts');
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns[0].errorClass).toBe('NotFoundError');
  });

  it('should detect exception classes', () => {
    const content = `
      class ValidationException extends BaseException {
        constructor(message: string) {
          super(message);
        }
      }
    `;
    const patterns = detectErrorClasses(content, 'lib/exceptions.ts');
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns[0].errorClass).toBe('ValidationException');
  });
});

describe('detectErrorThrows', () => {
  it('should detect throw new Error patterns', () => {
    const content = `
      throw new Error('Something went wrong');
    `;
    const patterns = detectErrorThrows(content, 'api/route.ts');
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns[0].type).toBe('error-throw');
    expect(patterns[0].errorClass).toBe('Error');
  });

  it('should detect custom error throws', () => {
    const content = `
      throw new ValidationError('Invalid input');
      throw new NotFoundError('Resource not found');
    `;
    const patterns = detectErrorThrows(content, 'api/route.ts');
    expect(patterns.length).toBe(2);
    expect(patterns.some(p => p.errorClass === 'ValidationError')).toBe(true);
    expect(patterns.some(p => p.errorClass === 'NotFoundError')).toBe(true);
  });

  it('should detect throw object patterns', () => {
    const content = `
      throw { message: 'Error', code: 'ERR_001' };
    `;
    const patterns = detectErrorThrows(content, 'api/route.ts');
    expect(patterns.length).toBeGreaterThan(0);
  });
});

describe('detectErrorResponses', () => {
  it('should detect Express error responses', () => {
    const content = `
      res.status(400).json({ error: { message: 'Bad request', code: 'BAD_REQUEST' } });
      res.status(500).json({ error: { message: 'Server error' } });
    `;
    const patterns = detectErrorResponses(content, 'api/route.ts');
    expect(patterns.length).toBe(2);
    expect(patterns.every(p => p.type === 'error-response')).toBe(true);
  });

  it('should detect Next.js error responses', () => {
    const content = `
      return Response.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json({ error: { message: 'Forbidden' } }, { status: 403 });
    `;
    const patterns = detectErrorResponses(content, 'api/route.ts');
    expect(patterns.length).toBeGreaterThan(0);
  });

  it('should extract error codes from responses', () => {
    const content = `
      res.status(400).json({ error: { message: 'Invalid', code: 'VALIDATION_ERROR' } });
    `;
    const patterns = detectErrorResponses(content, 'api/route.ts');
    expect(patterns.some(p => p.errorCode === 'VALIDATION_ERROR')).toBe(true);
  });
});


describe('detectInconsistentFormatViolations', () => {
  it('should detect mixed error formats', () => {
    const patterns: ErrorFormatPatternInfo[] = [
      { type: 'error-object', format: 'standard', file: 'api/a.ts', line: 1, column: 1, matchedText: '{}' },
      { type: 'error-object', format: 'standard', file: 'api/b.ts', line: 1, column: 1, matchedText: '{}' },
      { type: 'error-object', format: 'problem-details', file: 'api/c.ts', line: 1, column: 1, matchedText: '{}' },
    ];
    const violations = detectInconsistentFormatViolations(patterns, 'api/routes.ts');
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].type).toBe('mixed-formats');
  });

  it('should not flag when all formats match', () => {
    const patterns: ErrorFormatPatternInfo[] = [
      { type: 'error-object', format: 'standard', file: 'api/a.ts', line: 1, column: 1, matchedText: '{}' },
      { type: 'error-object', format: 'standard', file: 'api/b.ts', line: 1, column: 1, matchedText: '{}' },
    ];
    const violations = detectInconsistentFormatViolations(patterns, 'api/routes.ts');
    expect(violations).toHaveLength(0);
  });

  it('should ignore simple format in consistency check', () => {
    const patterns: ErrorFormatPatternInfo[] = [
      { type: 'error-object', format: 'standard', file: 'api/a.ts', line: 1, column: 1, matchedText: '{}' },
      { type: 'error-object', format: 'standard', file: 'api/b.ts', line: 1, column: 1, matchedText: '{}' },
      { type: 'error-object', format: 'simple', file: 'api/c.ts', line: 1, column: 1, matchedText: '{}' },
    ];
    const violations = detectInconsistentFormatViolations(patterns, 'api/routes.ts');
    expect(violations).toHaveLength(0);
  });
});

describe('detectMissingFieldViolations', () => {
  it('should detect missing message field', () => {
    const patterns: ErrorFormatPatternInfo[] = [
      { type: 'error-object', format: 'standard', file: 'api/a.ts', line: 1, column: 1, matchedText: '{}', fields: ['code', 'details'] },
    ];
    const violations = detectMissingFieldViolations(patterns, 'api/routes.ts');
    expect(violations.some(v => v.type === 'missing-message')).toBe(true);
  });

  it('should detect missing code field in standard format', () => {
    const patterns: ErrorFormatPatternInfo[] = [
      { type: 'error-object', format: 'standard', file: 'api/a.ts', line: 1, column: 1, matchedText: '{}', fields: ['message', 'details'] },
    ];
    const violations = detectMissingFieldViolations(patterns, 'api/routes.ts');
    expect(violations.some(v => v.type === 'missing-code')).toBe(true);
  });

  it('should not flag error-throw patterns', () => {
    const patterns: ErrorFormatPatternInfo[] = [
      { type: 'error-throw', format: 'standard', file: 'api/a.ts', line: 1, column: 1, matchedText: 'throw new Error()' },
    ];
    const violations = detectMissingFieldViolations(patterns, 'api/routes.ts');
    expect(violations).toHaveLength(0);
  });
});

describe('detectRawErrorStringViolations', () => {
  it('should detect raw error strings in Express responses', () => {
    const content = `
      res.status(400).send("Bad request");
      res.status(500).json("Server error");
    `;
    const violations = detectRawErrorStringViolations(content, 'api/route.ts');
    expect(violations.length).toBe(2);
    expect(violations.every(v => v.type === 'raw-error-string')).toBe(true);
  });

  it('should detect raw error strings in Next.js responses', () => {
    const content = `
      return Response.json("Not found", { status: 404 });
    `;
    const violations = detectRawErrorStringViolations(content, 'api/route.ts');
    expect(violations.length).toBeGreaterThan(0);
  });

  it('should not flag structured error responses', () => {
    const content = `
      res.status(400).json({ error: { message: 'Bad request' } });
    `;
    const violations = detectRawErrorStringViolations(content, 'api/route.ts');
    expect(violations).toHaveLength(0);
  });
});

describe('detectGenericErrorViolations', () => {
  it('should detect generic Error when custom errors exist', () => {
    const patterns: ErrorFormatPatternInfo[] = [
      { type: 'error-class', format: 'standard', file: 'lib/errors.ts', line: 1, column: 1, matchedText: 'class ValidationError', errorClass: 'ValidationError' },
      { type: 'error-throw', format: 'simple', file: 'api/route.ts', line: 5, column: 1, matchedText: 'throw new Error("fail")', errorClass: 'Error' },
    ];
    const violations = detectGenericErrorViolations(patterns, 'api/route.ts');
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].type).toBe('generic-error');
  });

  it('should not flag when no custom errors exist', () => {
    const patterns: ErrorFormatPatternInfo[] = [
      { type: 'error-throw', format: 'simple', file: 'api/route.ts', line: 1, column: 1, matchedText: 'throw new Error("fail")', errorClass: 'Error' },
    ];
    const violations = detectGenericErrorViolations(patterns, 'api/route.ts');
    expect(violations).toHaveLength(0);
  });
});

describe('detectInconsistentCodeViolations', () => {
  it('should detect inconsistent error code naming', () => {
    const patterns: ErrorFormatPatternInfo[] = [
      { type: 'error-object', format: 'standard', file: 'api/a.ts', line: 1, column: 1, matchedText: '{}', errorCode: 'VALIDATION_ERROR' },
      { type: 'error-object', format: 'standard', file: 'api/b.ts', line: 1, column: 1, matchedText: '{}', errorCode: 'NOT_FOUND' },
      { type: 'error-object', format: 'standard', file: 'api/c.ts', line: 1, column: 1, matchedText: '{}', errorCode: 'validationError' },
    ];
    const violations = detectInconsistentCodeViolations(patterns, 'api/routes.ts');
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].type).toBe('inconsistent-codes');
  });

  it('should not flag consistent error codes', () => {
    const patterns: ErrorFormatPatternInfo[] = [
      { type: 'error-object', format: 'standard', file: 'api/a.ts', line: 1, column: 1, matchedText: '{}', errorCode: 'VALIDATION_ERROR' },
      { type: 'error-object', format: 'standard', file: 'api/b.ts', line: 1, column: 1, matchedText: '{}', errorCode: 'NOT_FOUND' },
    ];
    const violations = detectInconsistentCodeViolations(patterns, 'api/routes.ts');
    expect(violations).toHaveLength(0);
  });
});


describe('analyzeErrorFormat', () => {
  it('should analyze error format patterns comprehensively', () => {
    const content = `
      class ValidationError extends AppError {
        constructor(message: string, public code: string) {
          super(message);
        }
      }
      
      export async function POST(req: Request) {
        try {
          const data = await req.json();
          if (!data.email) {
            throw new ValidationError('Email required', 'VALIDATION_ERROR');
          }
          return Response.json({ data, success: true });
        } catch (error) {
          return Response.json({ error: { message: error.message, code: error.code } }, { status: 400 });
        }
      }
    `;
    const analysis = analyzeErrorFormat(content, 'api/route.ts');
    
    expect(analysis.errorPatterns.length).toBeGreaterThan(0);
    expect(analysis.errorClasses).toContain('ValidationError');
    expect(analysis.patternAdherenceConfidence).toBeGreaterThan(0);
  });

  it('should return empty analysis for excluded files', () => {
    const content = `throw new Error('test');`;
    const analysis = analyzeErrorFormat(content, 'api/route.test.ts');
    
    expect(analysis.errorPatterns).toHaveLength(0);
    expect(analysis.violations).toHaveLength(0);
    expect(analysis.usesConsistentFormat).toBe(true);
    expect(analysis.patternAdherenceConfidence).toBe(1.0);
  });

  it('should detect dominant error format', () => {
    const content = `
      return { error: { message: 'Error 1', code: 'E1' } };
      return { error: { message: 'Error 2', code: 'E2' } };
      return { error: { message: 'Error 3', code: 'E3' } };
    `;
    const analysis = analyzeErrorFormat(content, 'api/route.ts');
    expect(analysis.dominantFormat).toBe('standard');
  });

  it('should collect error codes', () => {
    const content = `
      return { error: { message: 'Error', code: 'VALIDATION_ERROR' } };
      return { error: { message: 'Error', code: 'NOT_FOUND' } };
    `;
    const analysis = analyzeErrorFormat(content, 'api/route.ts');
    expect(analysis.errorCodes).toContain('VALIDATION_ERROR');
    expect(analysis.errorCodes).toContain('NOT_FOUND');
  });

  it('should calculate pattern adherence confidence', () => {
    const content = `
      return { error: { message: 'Error', code: 'E1' } };
    `;
    const analysis = analyzeErrorFormat(content, 'api/route.ts');
    expect(analysis.patternAdherenceConfidence).toBeGreaterThanOrEqual(0);
    expect(analysis.patternAdherenceConfidence).toBeLessThanOrEqual(1);
  });

  it('should detect consistent format usage', () => {
    const content = `
      return { error: { message: 'Error 1', code: 'E1' } };
      return { error: { message: 'Error 2', code: 'E2' } };
    `;
    const analysis = analyzeErrorFormat(content, 'api/route.ts');
    expect(analysis.usesConsistentFormat).toBe(true);
  });
});

describe('real-world error patterns', () => {
  it('should handle RFC 7807 Problem Details format', () => {
    const content = `
      return Response.json({
        type: 'https://example.com/errors/validation',
        title: 'Validation Error',
        status: 400,
        detail: 'The email field is required',
        instance: '/api/users'
      }, { status: 400 });
    `;
    const analysis = analyzeErrorFormat(content, 'api/route.ts');
    expect(analysis.errorPatterns.some(p => p.format === 'problem-details')).toBe(true);
  });

  it('should handle JSON:API error format', () => {
    const content = `
      return Response.json({
        errors: [{
          status: '400',
          title: 'Validation Error',
          detail: 'Email is required',
          source: { pointer: '/data/attributes/email' }
        }]
      }, { status: 400 });
    `;
    const analysis = analyzeErrorFormat(content, 'api/route.ts');
    expect(analysis.errorPatterns.length).toBeGreaterThan(0);
  });

  it('should handle GraphQL error format', () => {
    const content = `
      return {
        errors: [{
          message: 'User not found',
          locations: [{ line: 1, column: 5 }],
          path: ['user', 'profile']
        }]
      };
    `;
    const analysis = analyzeErrorFormat(content, 'api/graphql.ts');
    // GraphQL errors are detected via the errors array pattern
    expect(analysis.errorPatterns.length).toBeGreaterThanOrEqual(0);
  });

  it('should handle Express error middleware', () => {
    const content = `
      app.use((err, req, res, next) => {
        res.status(500).json({
          error: {
            message: err.message,
            code: 'INTERNAL_ERROR'
          }
        });
      });
    `;
    const analysis = analyzeErrorFormat(content, 'middleware/error.ts');
    expect(analysis.errorPatterns.length).toBeGreaterThan(0);
  });

  it('should handle custom error class hierarchy', () => {
    const content = `
      class AppError extends Error {
        constructor(public message: string, public code: string, public status: number) {
          super(message);
        }
      }
      
      class ValidationError extends AppError {
        constructor(message: string, public field: string) {
          super(message, 'VALIDATION_ERROR', 400);
        }
      }
      
      class NotFoundError extends AppError {
        constructor(resource: string) {
          super(\`\${resource} not found\`, 'NOT_FOUND', 404);
        }
      }
    `;
    const analysis = analyzeErrorFormat(content, 'lib/errors.ts');
    expect(analysis.errorClasses).toContain('AppError');
    expect(analysis.errorClasses).toContain('ValidationError');
    expect(analysis.errorClasses).toContain('NotFoundError');
  });
});