/**
 * Client Patterns Detector Tests
 * @requirements 10.6 - API client pattern detection (fetch wrapper usage)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ClientPatternsDetector,
  createClientPatternsDetector,
  analyzeClientPatterns,
  detectFetchWrappers,
  detectAxiosInstances,
  detectReactQuery,
  detectSWR,
  detectDirectFetch,
  detectDirectAxios,
  detectDirectCallViolations,
  detectMixedClientViolations,
  detectMissingErrorHandlingViolations,
  shouldExcludeFile,
  hasErrorHandling,
  hasAuthHeader,
  type ClientPatternType,
  type ClientPatternInfo,
} from './client-patterns.js';

describe('ClientPatternsDetector', () => {
  let detector: ClientPatternsDetector;

  beforeEach(() => {
    detector = createClientPatternsDetector();
  });

  describe('detector metadata', () => {
    it('should have correct id', () => {
      expect(detector.id).toBe('api/client-patterns');
    });

    it('should have correct name', () => {
      expect(detector.name).toBe('Client Patterns Detector');
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
    it('should detect client patterns', async () => {
      const content = `
        const apiClient = axios.create({ baseURL: '/api' });
        const { data } = useQuery(['users'], () => apiClient.get('/users'));
      `;
      const result = await detector.detect({ content, file: 'lib/api.ts', language: 'typescript', ast: null, imports: [], exports: [], projectContext: { rootDir: '', files: [], config: {} }, extension: '.ts', isTestFile: false, isTypeDefinition: false });
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should skip test files', async () => {
      const content = `fetch('/api/test');`;
      const result = await detector.detect({ content, file: 'api/client.test.ts', language: 'typescript', ast: null, imports: [], exports: [], projectContext: { rootDir: '', files: [], config: {} }, extension: '.ts', isTestFile: true, isTypeDefinition: false });
      expect(result.patterns).toHaveLength(0);
    });
  });
});


describe('shouldExcludeFile', () => {
  it('should exclude test files', () => {
    expect(shouldExcludeFile('lib/api.test.ts')).toBe(true);
    expect(shouldExcludeFile('lib/api.spec.ts')).toBe(true);
  });

  it('should not exclude regular files', () => {
    expect(shouldExcludeFile('lib/api.ts')).toBe(false);
    expect(shouldExcludeFile('hooks/useApi.ts')).toBe(false);
  });
});

describe('hasErrorHandling', () => {
  it('should detect try/catch', () => {
    const content = `
      try {
        const data = await fetch('/api');
      } catch (error) {
        console.error(error);
      }
    `;
    expect(hasErrorHandling(content, content.indexOf('fetch'))).toBe(true);
  });

  it('should detect .catch()', () => {
    const content = `fetch('/api').then(r => r.json()).catch(console.error);`;
    expect(hasErrorHandling(content, 0)).toBe(true);
  });

  it('should return false when no error handling', () => {
    const content = `const data = await fetch('/api');`;
    expect(hasErrorHandling(content, content.indexOf('fetch'))).toBe(false);
  });
});

describe('hasAuthHeader', () => {
  it('should detect Authorization header', () => {
    const content = `headers: { Authorization: 'Bearer token' }`;
    expect(hasAuthHeader(content)).toBe(true);
  });

  it('should detect interceptors', () => {
    const content = `axios.interceptors.request.use(config => { config.headers.Authorization = token; });`;
    expect(hasAuthHeader(content)).toBe(true);
  });

  it('should return false when no auth', () => {
    const content = `fetch('/api')`;
    expect(hasAuthHeader(content)).toBe(false);
  });
});

describe('detectFetchWrappers', () => {
  it('should detect custom fetch functions', () => {
    const content = `export const apiFetch = (url) => fetch(url);`;
    const patterns = detectFetchWrappers(content, 'lib/api.ts');
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns[0].type).toBe('fetch-wrapper');
  });

  it('should detect API client classes', () => {
    const content = `class ApiClient { async get(url) { return fetch(url); } }`;
    const patterns = detectFetchWrappers(content, 'lib/api.ts');
    expect(patterns.length).toBeGreaterThan(0);
  });

  it('should detect createClient patterns', () => {
    const content = `const client = createClient({ baseUrl: '/api' });`;
    const patterns = detectFetchWrappers(content, 'lib/api.ts');
    expect(patterns.length).toBeGreaterThan(0);
  });
});

describe('detectAxiosInstances', () => {
  it('should detect axios.create', () => {
    const content = `const api = axios.create({ baseURL: '/api' });`;
    const patterns = detectAxiosInstances(content, 'lib/api.ts');
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns[0].type).toBe('axios-instance');
  });

  it('should capture instance name', () => {
    const content = `const apiClient = axios.create({ baseURL: '/api' });`;
    const patterns = detectAxiosInstances(content, 'lib/api.ts');
    expect(patterns.some(p => p.clientName === 'apiClient')).toBe(true);
  });
});

describe('detectReactQuery', () => {
  it('should detect useQuery', () => {
    const content = `const { data } = useQuery(['users'], fetchUsers);`;
    const patterns = detectReactQuery(content, 'hooks/useUsers.ts');
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns[0].type).toBe('react-query');
  });

  it('should detect useMutation', () => {
    const content = `const mutation = useMutation(createUser);`;
    const patterns = detectReactQuery(content, 'hooks/useUsers.ts');
    expect(patterns.length).toBeGreaterThan(0);
  });

  it('should detect QueryClient', () => {
    const content = `const queryClient = new QueryClient();`;
    const patterns = detectReactQuery(content, 'lib/query.ts');
    expect(patterns.length).toBeGreaterThan(0);
  });
});

describe('detectSWR', () => {
  it('should detect useSWR', () => {
    const content = `const { data } = useSWR('/api/users', fetcher);`;
    const patterns = detectSWR(content, 'hooks/useUsers.ts');
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns[0].type).toBe('swr');
  });

  it('should detect useSWRMutation', () => {
    const content = `const { trigger } = useSWRMutation('/api/users', createUser);`;
    const patterns = detectSWR(content, 'hooks/useUsers.ts');
    expect(patterns.length).toBeGreaterThan(0);
  });
});

describe('detectDirectFetch', () => {
  it('should detect direct fetch calls', () => {
    const content = `const response = await fetch('/api/users');`;
    const patterns = detectDirectFetch(content, 'components/Users.tsx');
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns[0].type).toBe('direct-fetch');
  });

  it('should detect fetch with template literal', () => {
    const content = 'const response = await fetch(`/api/users/${id}`);';
    const patterns = detectDirectFetch(content, 'components/Users.tsx');
    expect(patterns.length).toBeGreaterThan(0);
  });

  it('should skip patterns in comments', () => {
    const content = `// fetch('/api/users')`;
    const patterns = detectDirectFetch(content, 'components/Users.tsx');
    expect(patterns).toHaveLength(0);
  });
});

describe('detectDirectAxios', () => {
  it('should detect axios.get', () => {
    const content = `const { data } = await axios.get('/api/users');`;
    const patterns = detectDirectAxios(content, 'components/Users.tsx');
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns[0].type).toBe('direct-axios');
  });

  it('should detect axios.post', () => {
    const content = `await axios.post('/api/users', userData);`;
    const patterns = detectDirectAxios(content, 'components/Users.tsx');
    expect(patterns.length).toBeGreaterThan(0);
  });
});


describe('detectDirectCallViolations', () => {
  it('should flag direct calls when wrapper exists', () => {
    const patterns: ClientPatternInfo[] = [
      { type: 'fetch-wrapper', file: 'lib/api.ts', line: 1, column: 1, matchedText: 'apiFetch' },
      { type: 'direct-fetch', file: 'components/Users.tsx', line: 5, column: 1, matchedText: "fetch('/api')" },
    ];
    const violations = detectDirectCallViolations(patterns, 'components/Users.tsx');
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].type).toBe('direct-call');
  });

  it('should not flag when no wrapper exists', () => {
    const patterns: ClientPatternInfo[] = [
      { type: 'direct-fetch', file: 'components/Users.tsx', line: 5, column: 1, matchedText: "fetch('/api')" },
    ];
    const violations = detectDirectCallViolations(patterns, 'components/Users.tsx');
    expect(violations).toHaveLength(0);
  });
});

describe('detectMixedClientViolations', () => {
  it('should flag mixed data fetching libraries', () => {
    const patterns: ClientPatternInfo[] = [
      { type: 'react-query', file: 'hooks/a.ts', line: 1, column: 1, matchedText: 'useQuery' },
      { type: 'swr', file: 'hooks/b.ts', line: 1, column: 1, matchedText: 'useSWR' },
    ];
    const violations = detectMixedClientViolations(patterns, 'hooks/');
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].type).toBe('mixed-clients');
  });

  it('should not flag single library usage', () => {
    const patterns: ClientPatternInfo[] = [
      { type: 'react-query', file: 'hooks/a.ts', line: 1, column: 1, matchedText: 'useQuery' },
      { type: 'react-query', file: 'hooks/b.ts', line: 1, column: 1, matchedText: 'useMutation' },
    ];
    const violations = detectMixedClientViolations(patterns, 'hooks/');
    expect(violations).toHaveLength(0);
  });
});

describe('detectMissingErrorHandlingViolations', () => {
  it('should flag direct calls without error handling', () => {
    const patterns: ClientPatternInfo[] = [
      { type: 'direct-fetch', file: 'api.ts', line: 1, column: 1, matchedText: "fetch('/api')", hasErrorHandling: false },
    ];
    const violations = detectMissingErrorHandlingViolations(patterns, 'api.ts');
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].type).toBe('missing-error-handling');
  });

  it('should not flag calls with error handling', () => {
    const patterns: ClientPatternInfo[] = [
      { type: 'direct-fetch', file: 'api.ts', line: 1, column: 1, matchedText: "fetch('/api')", hasErrorHandling: true },
    ];
    const violations = detectMissingErrorHandlingViolations(patterns, 'api.ts');
    expect(violations).toHaveLength(0);
  });
});

describe('analyzeClientPatterns', () => {
  it('should analyze client patterns comprehensively', () => {
    const content = `
      const apiClient = axios.create({ baseURL: '/api' });
      const { data } = useQuery(['users'], () => apiClient.get('/users'));
    `;
    const analysis = analyzeClientPatterns(content, 'lib/api.ts');
    
    expect(analysis.clientPatterns.length).toBeGreaterThan(0);
    expect(analysis.hasWrapper).toBe(true);
    expect(analysis.patternAdherenceConfidence).toBeGreaterThan(0);
  });

  it('should return empty analysis for excluded files', () => {
    const content = `fetch('/api');`;
    const analysis = analyzeClientPatterns(content, 'lib/api.test.ts');
    
    expect(analysis.clientPatterns).toHaveLength(0);
    expect(analysis.violations).toHaveLength(0);
    expect(analysis.usesConsistentClient).toBe(true);
  });

  it('should detect dominant client type', () => {
    const content = `
      useQuery(['a'], fetchA);
      useQuery(['b'], fetchB);
      useMutation(createC);
    `;
    const analysis = analyzeClientPatterns(content, 'hooks/queries.ts');
    expect(analysis.dominantClient).toBe('react-query');
  });
});

describe('real-world client patterns', () => {
  it('should handle axios instance with interceptors', () => {
    const content = `
      const api = axios.create({
        baseURL: process.env.API_URL,
        headers: { 'Content-Type': 'application/json' }
      });
      
      api.interceptors.request.use(config => {
        config.headers.Authorization = \`Bearer \${getToken()}\`;
        return config;
      });
    `;
    const analysis = analyzeClientPatterns(content, 'lib/api.ts');
    expect(analysis.hasWrapper).toBe(true);
    expect(analysis.clientPatterns.some(p => p.hasAuthHeader)).toBe(true);
  });

  it('should handle React Query with custom hooks', () => {
    const content = `
      export function useUsers() {
        return useQuery({
          queryKey: ['users'],
          queryFn: () => api.get('/users').then(r => r.data),
        });
      }
      
      export function useCreateUser() {
        const queryClient = useQueryClient();
        return useMutation({
          mutationFn: (data) => api.post('/users', data),
          onSuccess: () => queryClient.invalidateQueries(['users']),
        });
      }
    `;
    const analysis = analyzeClientPatterns(content, 'hooks/useUsers.ts');
    expect(analysis.clientPatterns.some(p => p.type === 'react-query')).toBe(true);
  });

  it('should handle SWR with fetcher', () => {
    const content = `
      const fetcher = (url) => fetch(url).then(r => r.json());
      
      export function useUser(id) {
        const { data, error, isLoading } = useSWR(
          id ? \`/api/users/\${id}\` : null,
          fetcher
        );
        return { user: data, error, isLoading };
      }
    `;
    const analysis = analyzeClientPatterns(content, 'hooks/useUser.ts');
    expect(analysis.clientPatterns.some(p => p.type === 'swr')).toBe(true);
  });
});