/**
 * HTTP Methods Detector Tests
 *
 * Tests for HTTP method usage pattern detection and violation detection.
 *
 * @requirements 10.2 - THE API_Detector SHALL detect HTTP method usage patterns
 */

import { describe, it, expect } from 'vitest';
import {
  HttpMethodsDetector,
  createHttpMethodsDetector,
  analyzeHttpMethods,
  detectExpressHandlers,
  detectNextjsMethodExports,
  detectFetchApiUsage,
  detectAxiosUsage,
  detectHttpClientUsage,
  detectPostForReadViolations,
  detectGetForMutationViolations,
  detectPutForPartialUpdateViolations,
  detectInconsistentMethodUsage,
  shouldExcludeFile,
  normalizeMethod,
  isReadMethod,
  isMutationMethod,
  inferOperationType,
  type HttpMethodUsageInfo,
} from './http-methods.js';

// ============================================================================
// Helper Function Tests
// ============================================================================

describe('HTTP Methods Helper Functions', () => {
  describe('shouldExcludeFile', () => {
    it('should exclude test files', () => {
      expect(shouldExcludeFile('api.test.ts')).toBe(true);
      expect(shouldExcludeFile('api.spec.ts')).toBe(true);
      expect(shouldExcludeFile('src/api.test.tsx')).toBe(true);
    });

    it('should exclude story files', () => {
      expect(shouldExcludeFile('Button.stories.tsx')).toBe(true);
    });

    it('should exclude type definition files', () => {
      expect(shouldExcludeFile('types.d.ts')).toBe(true);
    });

    it('should not exclude regular source files', () => {
      expect(shouldExcludeFile('api.ts')).toBe(false);
      expect(shouldExcludeFile('src/routes/users.ts')).toBe(false);
    });
  });

  describe('normalizeMethod', () => {
    it('should normalize lowercase methods to uppercase', () => {
      expect(normalizeMethod('get')).toBe('GET');
      expect(normalizeMethod('post')).toBe('POST');
      expect(normalizeMethod('put')).toBe('PUT');
      expect(normalizeMethod('patch')).toBe('PATCH');
      expect(normalizeMethod('delete')).toBe('DELETE');
    });

    it('should keep uppercase methods unchanged', () => {
      expect(normalizeMethod('GET')).toBe('GET');
      expect(normalizeMethod('POST')).toBe('POST');
    });
  });

  describe('isReadMethod', () => {
    it('should return true for read methods', () => {
      expect(isReadMethod('GET')).toBe(true);
      expect(isReadMethod('HEAD')).toBe(true);
      expect(isReadMethod('OPTIONS')).toBe(true);
    });

    it('should return false for mutation methods', () => {
      expect(isReadMethod('POST')).toBe(false);
      expect(isReadMethod('PUT')).toBe(false);
      expect(isReadMethod('PATCH')).toBe(false);
      expect(isReadMethod('DELETE')).toBe(false);
    });
  });

  describe('isMutationMethod', () => {
    it('should return true for mutation methods', () => {
      expect(isMutationMethod('POST')).toBe(true);
      expect(isMutationMethod('PUT')).toBe(true);
      expect(isMutationMethod('PATCH')).toBe(true);
      expect(isMutationMethod('DELETE')).toBe(true);
    });

    it('should return false for read methods', () => {
      expect(isMutationMethod('GET')).toBe(false);
      expect(isMutationMethod('HEAD')).toBe(false);
      expect(isMutationMethod('OPTIONS')).toBe(false);
    });
  });

  describe('inferOperationType', () => {
    it('should infer read operations', () => {
      expect(inferOperationType('getUsers')).toBe('read');
      expect(inferOperationType('fetchData')).toBe('read');
      expect(inferOperationType('findById')).toBe('read');
      expect(inferOperationType('listItems')).toBe('read');
      expect(inferOperationType('searchProducts')).toBe('read');
    });

    it('should infer create operations', () => {
      expect(inferOperationType('createUser')).toBe('create');
      expect(inferOperationType('addItem')).toBe('create');
      expect(inferOperationType('insertRecord')).toBe('create');
    });

    it('should infer update operations', () => {
      expect(inferOperationType('updateUser')).toBe('update');
      expect(inferOperationType('editProfile')).toBe('update');
      expect(inferOperationType('modifySettings')).toBe('update');
    });

    it('should infer delete operations', () => {
      expect(inferOperationType('deleteUser')).toBe('delete');
      expect(inferOperationType('removeItem')).toBe('delete');
      expect(inferOperationType('destroySession')).toBe('delete');
    });

    it('should return unknown for ambiguous context', () => {
      expect(inferOperationType('handleRequest')).toBe('unknown');
      expect(inferOperationType('processData')).toBe('unknown');
    });
  });
});

// ============================================================================
// Express Handler Detection Tests
// ============================================================================

describe('detectExpressHandlers', () => {
  it('should detect router.get handlers', () => {
    const content = `
      router.get('/users', getUsers);
      router.get('/users/:id', getUserById);
    `;
    const results = detectExpressHandlers(content, 'routes.ts');
    
    expect(results).toHaveLength(2);
    expect(results[0]?.method).toBe('GET');
    expect(results[0]?.routePath).toBe('/users');
    expect(results[1]?.routePath).toBe('/users/:id');
  });

  it('should detect router.post handlers', () => {
    const content = `router.post('/users', createUser);`;
    const results = detectExpressHandlers(content, 'routes.ts');
    
    expect(results).toHaveLength(1);
    expect(results[0]?.method).toBe('POST');
    expect(results[0]?.routePath).toBe('/users');
  });

  it('should detect app.put handlers', () => {
    const content = `app.put('/users/:id', updateUser);`;
    const results = detectExpressHandlers(content, 'routes.ts');
    
    expect(results).toHaveLength(1);
    expect(results[0]?.method).toBe('PUT');
  });

  it('should detect app.patch handlers', () => {
    const content = `app.patch('/users/:id', patchUser);`;
    const results = detectExpressHandlers(content, 'routes.ts');
    
    expect(results).toHaveLength(1);
    expect(results[0]?.method).toBe('PATCH');
  });

  it('should detect app.delete handlers', () => {
    const content = `app.delete('/users/:id', deleteUser);`;
    const results = detectExpressHandlers(content, 'routes.ts');
    
    expect(results).toHaveLength(1);
    expect(results[0]?.method).toBe('DELETE');
  });

  it('should detect fastify handlers', () => {
    const content = `
      fastify.get('/api/items', getItems);
      fastify.post('/api/items', createItem);
    `;
    const results = detectExpressHandlers(content, 'routes.ts');
    
    expect(results).toHaveLength(2);
    expect(results[0]?.method).toBe('GET');
    expect(results[1]?.method).toBe('POST');
  });

  it('should detect server handlers', () => {
    const content = `server.get('/health', healthCheck);`;
    const results = detectExpressHandlers(content, 'routes.ts');
    
    expect(results).toHaveLength(1);
    expect(results[0]?.method).toBe('GET');
  });

  it('should ignore handlers inside comments', () => {
    const content = `
      // router.get('/commented', handler);
      /* router.post('/blocked', handler); */
      router.get('/active', handler);
    `;
    const results = detectExpressHandlers(content, 'routes.ts');
    
    expect(results).toHaveLength(1);
    expect(results[0]?.routePath).toBe('/active');
  });

  it('should detect route chaining pattern', () => {
    const content = `
      router.route('/users')
        .get(getUsers)
        .post(createUser);
    `;
    const results = detectExpressHandlers(content, 'routes.ts');
    
    // Should detect the .route().get() and .route().post() patterns
    expect(results.length).toBeGreaterThanOrEqual(1);
  });
});

// ============================================================================
// Next.js App Router Detection Tests
// ============================================================================

describe('detectNextjsMethodExports', () => {
  it('should detect exported GET function', () => {
    const content = `
      export function GET(request: Request) {
        return Response.json({ data: [] });
      }
    `;
    const results = detectNextjsMethodExports(content, '/app/api/users/route.ts');
    
    expect(results).toHaveLength(1);
    expect(results[0]?.method).toBe('GET');
    expect(results[0]?.type).toBe('nextjs-app-router');
  });

  it('should detect exported async POST function', () => {
    const content = `
      export async function POST(request: Request) {
        const body = await request.json();
        return Response.json({ created: true });
      }
    `;
    const results = detectNextjsMethodExports(content, '/app/api/users/route.ts');
    
    expect(results).toHaveLength(1);
    expect(results[0]?.method).toBe('POST');
  });

  it('should detect multiple method exports', () => {
    const content = `
      export function GET(request: Request) {
        return Response.json({ data: [] });
      }
      
      export async function POST(request: Request) {
        return Response.json({ created: true });
      }
      
      export async function DELETE(request: Request) {
        return Response.json({ deleted: true });
      }
    `;
    const results = detectNextjsMethodExports(content, '/app/api/users/route.ts');
    
    expect(results).toHaveLength(3);
    expect(results.map(r => r.method)).toContain('GET');
    expect(results.map(r => r.method)).toContain('POST');
    expect(results.map(r => r.method)).toContain('DELETE');
  });

  it('should not detect methods in non-app-router files', () => {
    const content = `
      export function GET(request: Request) {
        return Response.json({ data: [] });
      }
    `;
    const results = detectNextjsMethodExports(content, '/src/utils/api.ts');
    
    expect(results).toHaveLength(0);
  });

  it('should detect PUT and PATCH exports', () => {
    const content = `
      export async function PUT(request: Request) {
        return Response.json({ replaced: true });
      }
      
      export async function PATCH(request: Request) {
        return Response.json({ updated: true });
      }
    `;
    const results = detectNextjsMethodExports(content, '/app/api/items/[id]/route.ts');
    
    expect(results).toHaveLength(2);
    expect(results.map(r => r.method)).toContain('PUT');
    expect(results.map(r => r.method)).toContain('PATCH');
  });
});

// ============================================================================
// Fetch API Detection Tests
// ============================================================================

describe('detectFetchApiUsage', () => {
  it('should detect fetch with method option', () => {
    const content = `
      fetch('/api/users', { method: 'POST', body: JSON.stringify(data) });
    `;
    const results = detectFetchApiUsage(content, 'api.ts');
    
    expect(results).toHaveLength(1);
    expect(results[0]?.method).toBe('POST');
    expect(results[0]?.type).toBe('fetch-api');
  });

  it('should detect fetch with different quote styles', () => {
    const content = `
      fetch('/api/users', { method: "GET" });
      fetch('/api/items', { method: 'POST' });
      fetch('/api/data', { method: \`PUT\` });
    `;
    const results = detectFetchApiUsage(content, 'api.ts');
    
    expect(results).toHaveLength(3);
  });

  it('should detect all HTTP methods', () => {
    const content = `
      fetch(url, { method: 'GET' });
      fetch(url, { method: 'POST' });
      fetch(url, { method: 'PUT' });
      fetch(url, { method: 'PATCH' });
      fetch(url, { method: 'DELETE' });
    `;
    const results = detectFetchApiUsage(content, 'api.ts');
    
    expect(results).toHaveLength(5);
    expect(results.map(r => r.method)).toEqual(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
  });
});

// ============================================================================
// Axios Detection Tests
// ============================================================================

describe('detectAxiosUsage', () => {
  it('should detect axios.get', () => {
    const content = `
      const response = await axios.get('/api/users');
    `;
    const results = detectAxiosUsage(content, 'api.ts');
    
    expect(results).toHaveLength(1);
    expect(results[0]?.method).toBe('GET');
    expect(results[0]?.type).toBe('axios-method');
  });

  it('should detect axios.post', () => {
    const content = `
      const response = await axios.post('/api/users', userData);
    `;
    const results = detectAxiosUsage(content, 'api.ts');
    
    expect(results).toHaveLength(1);
    expect(results[0]?.method).toBe('POST');
  });

  it('should detect all axios methods', () => {
    const content = `
      axios.get('/api/data');
      axios.post('/api/data', body);
      axios.put('/api/data/1', body);
      axios.patch('/api/data/1', partial);
      axios.delete('/api/data/1');
    `;
    const results = detectAxiosUsage(content, 'api.ts');
    
    expect(results).toHaveLength(5);
  });

  it('should detect axios with config object', () => {
    const content = `
      axios({ method: 'POST', url: '/api/users', data: userData });
    `;
    const results = detectAxiosUsage(content, 'api.ts');
    
    expect(results).toHaveLength(1);
    expect(results[0]?.method).toBe('POST');
  });

  it('should detect axios.request with method', () => {
    const content = `
      axios.request({ method: 'PUT', url: '/api/users/1' });
    `;
    const results = detectAxiosUsage(content, 'api.ts');
    
    expect(results).toHaveLength(1);
    expect(results[0]?.method).toBe('PUT');
  });
});

// ============================================================================
// HTTP Client Detection Tests
// ============================================================================

describe('detectHttpClientUsage', () => {
  it('should detect http.get', () => {
    const content = `http.get('/api/users');`;
    const results = detectHttpClientUsage(content, 'api.ts');
    
    expect(results).toHaveLength(1);
    expect(results[0]?.method).toBe('GET');
  });

  it('should detect client.post', () => {
    const content = `client.post('/api/users', data);`;
    const results = detectHttpClientUsage(content, 'api.ts');
    
    expect(results).toHaveLength(1);
    expect(results[0]?.method).toBe('POST');
  });

  it('should detect api.put', () => {
    const content = `api.put('/users/1', data);`;
    const results = detectHttpClientUsage(content, 'api.ts');
    
    expect(results).toHaveLength(1);
    expect(results[0]?.method).toBe('PUT');
  });

  it('should detect got library methods', () => {
    const content = `
      got.get('/api/data');
      got.post('/api/data', { json: body });
    `;
    const results = detectHttpClientUsage(content, 'api.ts');
    
    expect(results).toHaveLength(2);
  });

  it('should detect ky library methods', () => {
    const content = `
      ky.get('/api/data');
      ky.post('/api/data', { json: body });
    `;
    const results = detectHttpClientUsage(content, 'api.ts');
    
    expect(results).toHaveLength(2);
  });

  it('should detect superagent methods', () => {
    const content = `
      superagent.get('/api/data');
      superagent.post('/api/data').send(body);
    `;
    const results = detectHttpClientUsage(content, 'api.ts');
    
    expect(results).toHaveLength(2);
  });
});

// ============================================================================
// Violation Detection Tests
// ============================================================================

describe('detectPostForReadViolations', () => {
  it('should detect POST used for read operations', () => {
    const usages: HttpMethodUsageInfo[] = [
      {
        type: 'express-handler',
        method: 'POST',
        file: 'routes.ts',
        line: 1,
        column: 1,
        matchedText: 'router.post("/users/search")',
        routePath: '/users/search',
        context: 'router.post("/users/search", searchUsers)',
      },
    ];
    
    const violations = detectPostForReadViolations(usages, 'routes.ts');
    
    expect(violations).toHaveLength(1);
    expect(violations[0]?.type).toBe('post-for-read');
    expect(violations[0]?.suggestedMethod).toBe('GET');
  });

  it('should detect POST for fetch operations', () => {
    const usages: HttpMethodUsageInfo[] = [
      {
        type: 'express-handler',
        method: 'POST',
        file: 'routes.ts',
        line: 1,
        column: 1,
        matchedText: 'router.post("/data/fetch")',
        routePath: '/data/fetch',
        context: 'router.post("/data/fetch", fetchData)',
      },
    ];
    
    const violations = detectPostForReadViolations(usages, 'routes.ts');
    
    expect(violations).toHaveLength(1);
  });

  it('should not flag POST for create operations', () => {
    const usages: HttpMethodUsageInfo[] = [
      {
        type: 'express-handler',
        method: 'POST',
        file: 'routes.ts',
        line: 1,
        column: 1,
        matchedText: 'router.post("/users")',
        routePath: '/users',
        context: 'router.post("/users", createUser)',
      },
    ];
    
    const violations = detectPostForReadViolations(usages, 'routes.ts');
    
    expect(violations).toHaveLength(0);
  });
});

describe('detectGetForMutationViolations', () => {
  it('should detect GET used for delete operations', () => {
    const usages: HttpMethodUsageInfo[] = [
      {
        type: 'express-handler',
        method: 'GET',
        file: 'routes.ts',
        line: 1,
        column: 1,
        matchedText: 'router.get("/users/delete/:id")',
        routePath: '/users/delete/:id',
        context: 'router.get("/users/delete/:id", deleteUser)',
      },
    ];
    
    const violations = detectGetForMutationViolations(usages, 'routes.ts');
    
    expect(violations).toHaveLength(1);
    expect(violations[0]?.type).toBe('get-for-mutation');
    expect(violations[0]?.suggestedMethod).toBe('DELETE');
  });

  it('should detect GET used for create operations', () => {
    const usages: HttpMethodUsageInfo[] = [
      {
        type: 'express-handler',
        method: 'GET',
        file: 'routes.ts',
        line: 1,
        column: 1,
        matchedText: 'router.get("/users/create")',
        routePath: '/users/create',
        context: 'router.get("/users/create", createUser)',
      },
    ];
    
    const violations = detectGetForMutationViolations(usages, 'routes.ts');
    
    expect(violations).toHaveLength(1);
    expect(violations[0]?.suggestedMethod).toBe('POST');
  });

  it('should detect GET used for update operations', () => {
    const usages: HttpMethodUsageInfo[] = [
      {
        type: 'express-handler',
        method: 'GET',
        file: 'routes.ts',
        line: 1,
        column: 1,
        matchedText: 'router.get("/users/update/:id")',
        routePath: '/users/update/:id',
        context: 'router.get("/users/update/:id", updateUser)',
      },
    ];
    
    const violations = detectGetForMutationViolations(usages, 'routes.ts');
    
    expect(violations).toHaveLength(1);
    expect(violations[0]?.suggestedMethod).toBe('PATCH');
  });

  it('should not flag GET for read operations', () => {
    const usages: HttpMethodUsageInfo[] = [
      {
        type: 'express-handler',
        method: 'GET',
        file: 'routes.ts',
        line: 1,
        column: 1,
        matchedText: 'router.get("/users")',
        routePath: '/users',
        context: 'router.get("/users", getUsers)',
      },
    ];
    
    const violations = detectGetForMutationViolations(usages, 'routes.ts');
    
    expect(violations).toHaveLength(0);
  });
});

describe('detectPutForPartialUpdateViolations', () => {
  it('should detect PUT used for partial updates', () => {
    const usages: HttpMethodUsageInfo[] = [
      {
        type: 'express-handler',
        method: 'PUT',
        file: 'routes.ts',
        line: 1,
        column: 1,
        matchedText: 'router.put("/users/:id")',
        routePath: '/users/:id',
        context: 'router.put("/users/:id", updateUserPartial)',
      },
    ];
    
    const violations = detectPutForPartialUpdateViolations(usages, 'routes.ts');
    
    expect(violations).toHaveLength(1);
    expect(violations[0]?.type).toBe('put-for-partial');
    expect(violations[0]?.suggestedMethod).toBe('PATCH');
  });

  it('should not flag PUT for full replacement', () => {
    const usages: HttpMethodUsageInfo[] = [
      {
        type: 'express-handler',
        method: 'PUT',
        file: 'routes.ts',
        line: 1,
        column: 1,
        matchedText: 'router.put("/users/:id")',
        routePath: '/users/:id/replace',
        context: 'router.put("/users/:id/replace", replaceUser)',
      },
    ];
    
    const violations = detectPutForPartialUpdateViolations(usages, 'routes.ts');
    
    expect(violations).toHaveLength(0);
  });
});

describe('detectInconsistentMethodUsage', () => {
  it('should detect inconsistent methods for same operation type', () => {
    const usages: HttpMethodUsageInfo[] = [
      {
        type: 'express-handler',
        method: 'GET',
        file: 'routes.ts',
        line: 1,
        column: 1,
        matchedText: 'router.get("/users")',
        routePath: '/users',
        operationType: 'read',
        context: 'router.get("/users", getUsers)',
      },
      {
        type: 'express-handler',
        method: 'GET',
        file: 'routes.ts',
        line: 2,
        column: 1,
        matchedText: 'router.get("/items")',
        routePath: '/items',
        operationType: 'read',
        context: 'router.get("/items", getItems)',
      },
      {
        type: 'express-handler',
        method: 'POST',
        file: 'routes.ts',
        line: 3,
        column: 1,
        matchedText: 'router.post("/products")',
        routePath: '/products',
        operationType: 'read',
        context: 'router.post("/products", getProducts)',
      },
    ];
    
    const violations = detectInconsistentMethodUsage(usages, 'routes.ts');
    
    expect(violations).toHaveLength(1);
    expect(violations[0]?.type).toBe('inconsistent-method');
    expect(violations[0]?.method).toBe('POST');
    expect(violations[0]?.suggestedMethod).toBe('GET');
  });

  it('should not flag consistent method usage', () => {
    const usages: HttpMethodUsageInfo[] = [
      {
        type: 'express-handler',
        method: 'GET',
        file: 'routes.ts',
        line: 1,
        column: 1,
        matchedText: 'router.get("/users")',
        routePath: '/users',
        operationType: 'read',
        context: 'router.get("/users", getUsers)',
      },
      {
        type: 'express-handler',
        method: 'GET',
        file: 'routes.ts',
        line: 2,
        column: 1,
        matchedText: 'router.get("/items")',
        routePath: '/items',
        operationType: 'read',
        context: 'router.get("/items", getItems)',
      },
    ];
    
    const violations = detectInconsistentMethodUsage(usages, 'routes.ts');
    
    expect(violations).toHaveLength(0);
  });
});

// ============================================================================
// Main Analysis Function Tests
// ============================================================================

describe('analyzeHttpMethods', () => {
  it('should analyze Express routes', () => {
    const content = `
      router.get('/users', getUsers);
      router.post('/users', createUser);
      router.put('/users/:id', updateUser);
      router.delete('/users/:id', deleteUser);
    `;
    
    const analysis = analyzeHttpMethods(content, 'routes.ts');
    
    expect(analysis.methodUsages).toHaveLength(4);
    expect(analysis.methodsUsed.has('GET')).toBe(true);
    expect(analysis.methodsUsed.has('POST')).toBe(true);
    expect(analysis.methodsUsed.has('PUT')).toBe(true);
    expect(analysis.methodsUsed.has('DELETE')).toBe(true);
  });

  it('should skip excluded files', () => {
    const content = `
      router.get('/users', getUsers);
      router.post('/users', createUser);
    `;
    
    const analysis = analyzeHttpMethods(content, 'routes.test.ts');
    
    expect(analysis.methodUsages).toHaveLength(0);
    expect(analysis.patternAdherenceConfidence).toBe(1.0);
  });

  it('should detect violations', () => {
    const content = `
      router.get('/users/delete/:id', deleteUser);
    `;
    
    const analysis = analyzeHttpMethods(content, 'routes.ts');
    
    expect(analysis.violations.length).toBeGreaterThan(0);
    expect(analysis.usesRestfulConventions).toBe(false);
  });

  it('should calculate confidence based on violations', () => {
    const content = `
      router.get('/users', getUsers);
      router.post('/users', createUser);
      router.get('/users/delete/:id', deleteUser);
    `;
    
    const analysis = analyzeHttpMethods(content, 'routes.ts');
    
    expect(analysis.patternAdherenceConfidence).toBeLessThan(1.0);
    expect(analysis.patternAdherenceConfidence).toBeGreaterThan(0);
  });

  it('should return 0.5 confidence when no methods detected', () => {
    const content = `
      const x = 1;
      const y = 2;
    `;
    
    const analysis = analyzeHttpMethods(content, 'utils.ts');
    
    expect(analysis.methodUsages).toHaveLength(0);
    expect(analysis.patternAdherenceConfidence).toBe(0.5);
  });
});

// ============================================================================
// Detector Class Tests
// ============================================================================

describe('HttpMethodsDetector', () => {
  it('should create detector with correct metadata', () => {
    const detector = createHttpMethodsDetector();
    
    expect(detector.id).toBe('api/http-methods');
    expect(detector.category).toBe('api');
    expect(detector.subcategory).toBe('http-methods');
    expect(detector.name).toBe('HTTP Methods Detector');
    expect(detector.supportedLanguages).toContain('typescript');
    expect(detector.supportedLanguages).toContain('javascript');
  });

  it('should detect patterns in Express routes', async () => {
    const detector = createHttpMethodsDetector();
    const context = {
      file: 'routes.ts',
      content: `
        router.get('/users', getUsers);
        router.post('/users', createUser);
      `,
      ast: null,
      imports: [],
      exports: [],
      projectContext: {
        rootDir: '/project',
        files: ['routes.ts'],
        config: {},
      },
      language: 'typescript' as const,
      extension: '.ts',
      isTestFile: false,
      isTypeDefinition: false,
    };
    
    const result = await detector.detect(context);
    
    expect(result.patterns.length).toBeGreaterThan(0);
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('should detect violations and create proper violation objects', async () => {
    const detector = createHttpMethodsDetector();
    const context = {
      file: 'routes.ts',
      content: `
        router.get('/users/delete/:id', deleteUser);
      `,
      ast: null,
      imports: [],
      exports: [],
      projectContext: {
        rootDir: '/project',
        files: ['routes.ts'],
        config: {},
      },
      language: 'typescript' as const,
      extension: '.ts',
      isTestFile: false,
      isTypeDefinition: false,
    };
    
    const result = await detector.detect(context);
    
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations[0]?.severity).toBe('error');
    expect(result.violations[0]?.message).toContain('GET');
    expect(result.violations[0]?.message).toContain('mutation');
  });

  it('should generate quick fixes for violations', () => {
    const detector = createHttpMethodsDetector();
    const violation = {
      id: 'test-violation',
      patternId: 'api/http-methods',
      severity: 'error' as const,
      file: 'routes.ts',
      range: {
        start: { line: 0, character: 0 },
        end: { line: 0, character: 10 },
      },
      message: 'Using GET for mutation',
      expected: 'DELETE',
      actual: 'GET',
      aiExplainAvailable: true,
      aiFixAvailable: true,
      firstSeen: new Date(),
      occurrences: 1,
    };
    
    const quickFix = detector.generateQuickFix(violation);
    
    expect(quickFix).not.toBeNull();
    expect(quickFix?.title).toContain('DELETE');
  });

  it('should return null for non-HTTP-method violations', () => {
    const detector = createHttpMethodsDetector();
    const violation = {
      id: 'test-violation',
      patternId: 'other/pattern',
      severity: 'error' as const,
      file: 'routes.ts',
      range: {
        start: { line: 0, character: 0 },
        end: { line: 0, character: 10 },
      },
      message: 'Some other violation',
      expected: 'something',
      actual: 'other',
      aiExplainAvailable: false,
      aiFixAvailable: false,
      firstSeen: new Date(),
      occurrences: 1,
    };
    
    const quickFix = detector.generateQuickFix(violation);
    
    expect(quickFix).toBeNull();
  });
});
