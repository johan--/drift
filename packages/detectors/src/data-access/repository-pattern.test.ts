/**
 * Repository Pattern Detector Tests
 *
 * Tests for repository pattern usage detection.
 *
 * @requirements 13.2 - Repository pattern detection
 */

import { describe, it, expect } from 'vitest';
import {
  RepositoryPatternDetector,
  createRepositoryPatternDetector,
  detectRepositoryClasses,
  detectRepositoryInterfaces,
  detectRepositoryInjection,
  detectGenericRepositories,
  detectBaseRepositories,
  detectDirectDBAccessViolations,
  analyzeRepositoryPattern,
  shouldExcludeFile,
} from './repository-pattern.js';
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
    expect(shouldExcludeFile('repository.test.ts')).toBe(true);
    expect(shouldExcludeFile('repository.spec.ts')).toBe(true);
  });

  it('should exclude __tests__ directory', () => {
    expect(shouldExcludeFile('__tests__/repository.ts')).toBe(true);
  });

  it('should exclude type definition files', () => {
    expect(shouldExcludeFile('types.d.ts')).toBe(true);
  });

  it('should exclude node_modules', () => {
    expect(shouldExcludeFile('node_modules/typeorm/index.js')).toBe(true);
  });

  it('should not exclude regular source files', () => {
    expect(shouldExcludeFile('src/repositories/user.ts')).toBe(false);
    expect(shouldExcludeFile('lib/UserRepository.ts')).toBe(false);
  });
});

// ============================================================================
// Repository Class Detection Tests
// ============================================================================

describe('detectRepositoryClasses', () => {
  it('should detect repository class with extends', () => {
    const content = `class UserRepository extends BaseRepository {`;
    const results = detectRepositoryClasses(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('repository-class');
    expect(results[0]?.name).toBe('UserRepository');
  });

  it('should detect repository class with implements', () => {
    const content = `class UserRepository implements IUserRepository {`;
    const results = detectRepositoryClasses(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.name).toBe('UserRepository');
  });

  it('should detect simple repository class', () => {
    const content = `class UserRepository {`;
    const results = detectRepositoryClasses(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect exported repository class', () => {
    const content = `export class ProductRepository extends BaseRepository {`;
    const results = detectRepositoryClasses(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.name).toBe('ProductRepository');
  });
});

// ============================================================================
// Repository Interface Detection Tests
// ============================================================================

describe('detectRepositoryInterfaces', () => {
  it('should detect repository interface', () => {
    const content = `interface UserRepository {`;
    const results = detectRepositoryInterfaces(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('repository-interface');
    expect(results[0]?.name).toBe('UserRepository');
  });

  it('should detect I-prefixed repository interface', () => {
    const content = `interface IUserRepository {`;
    const results = detectRepositoryInterfaces(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect repository type alias', () => {
    const content = `type UserRepository = {`;
    const results = detectRepositoryInterfaces(content);
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Repository Injection Detection Tests
// ============================================================================

describe('detectRepositoryInjection', () => {
  it('should detect repository in constructor', () => {
    const content = `constructor(private userRepository: UserRepository) {`;
    const results = detectRepositoryInjection(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('repository-injection');
  });

  it('should detect private readonly repository', () => {
    const content = `private readonly userRepository: UserRepository;`;
    const results = detectRepositoryInjection(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect @Inject decorator with repository', () => {
    const content = `@Inject(UserRepository) private userRepo: UserRepository`;
    const results = detectRepositoryInjection(content);
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Generic Repository Detection Tests
// ============================================================================

describe('detectGenericRepositories', () => {
  it('should detect generic repository class', () => {
    const content = `class UserRepository<User> extends BaseRepository {`;
    const results = detectGenericRepositories(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('generic-repository');
  });

  it('should detect BaseRepository with generic', () => {
    const content = `class UserRepo extends BaseRepository<User> {`;
    const results = detectGenericRepositories(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect GenericRepository usage', () => {
    const content = `const repo = new GenericRepository<Product>();`;
    const results = detectGenericRepositories(content);
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Base Repository Detection Tests
// ============================================================================

describe('detectBaseRepositories', () => {
  it('should detect BaseRepository class', () => {
    const content = `class BaseRepository {`;
    const results = detectBaseRepositories(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('base-repository');
  });

  it('should detect abstract repository class', () => {
    const content = `abstract class AbstractRepository {`;
    const results = detectBaseRepositories(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect extends BaseRepository', () => {
    const content = `class UserRepo extends BaseRepository {`;
    const results = detectBaseRepositories(content);
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Direct DB Access Violation Tests
// ============================================================================

describe('detectDirectDBAccessViolations', () => {
  it('should detect direct prisma access in non-repository files', () => {
    const content = `const users = await prisma.user.findMany();`;
    const results = detectDirectDBAccessViolations(content, 'service.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('direct-db-access');
    expect(results[0]?.message).toContain('repository pattern');
  });

  it('should detect direct db access in non-repository files', () => {
    const content = `const users = await db.user.findMany();`;
    const results = detectDirectDBAccessViolations(content, 'controller.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should not flag direct access in repository files', () => {
    const content = `const users = await prisma.user.findMany();`;
    const results = detectDirectDBAccessViolations(content, 'UserRepository.ts');
    
    expect(results.length).toBe(0);
  });

  it('should not flag direct access in repository directory', () => {
    const content = `const users = await prisma.user.findMany();`;
    // The detector checks for 'repository' in the file path (case-insensitive)
    // 'repositories/user.ts' contains 'repositor' which matches
    const results = detectDirectDBAccessViolations(content, 'src/repositories/UserRepository.ts');
    
    expect(results.length).toBe(0);
  });

  it('should detect getRepository direct access', () => {
    const content = `const user = await getRepository(User).findOne({ id });`;
    const results = detectDirectDBAccessViolations(content, 'service.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Full Analysis Tests
// ============================================================================

describe('analyzeRepositoryPattern', () => {
  it('should return empty analysis for excluded files', () => {
    const content = `class UserRepository extends BaseRepository {}`;
    const analysis = analyzeRepositoryPattern(content, 'repository.test.ts');
    
    expect(analysis.patterns.length).toBe(0);
    expect(analysis.violations.length).toBe(0);
    expect(analysis.hasRepositoryPattern).toBe(false);
  });

  it('should detect repository pattern usage', () => {
    const content = `
      class UserRepository extends BaseRepository {
        async findById(id: string) {
          return this.prisma.user.findUnique({ where: { id } });
        }
      }
    `;
    const analysis = analyzeRepositoryPattern(content, 'UserRepository.ts');
    
    expect(analysis.hasRepositoryPattern).toBe(true);
    expect(analysis.repositoryCount).toBeGreaterThan(0);
  });

  it('should count repository classes', () => {
    const content = `
      class UserRepository extends BaseRepository {}
      class ProductRepository extends BaseRepository {}
    `;
    const analysis = analyzeRepositoryPattern(content, 'repositories.ts');
    
    expect(analysis.repositoryCount).toBe(2);
  });

  it('should detect violations in non-repository files', () => {
    const content = `
      class UserService {
        async getUsers() {
          return await prisma.user.findMany();
        }
      }
    `;
    const analysis = analyzeRepositoryPattern(content, 'UserService.ts');
    
    expect(analysis.violations.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Detector Class Tests
// ============================================================================

describe('RepositoryPatternDetector', () => {
  it('should create detector with correct properties', () => {
    const detector = createRepositoryPatternDetector();
    
    expect(detector.id).toBe('data-access/repository-pattern');
    expect(detector.category).toBe('data-access');
    expect(detector.supportedLanguages).toContain('typescript');
    expect(detector.supportedLanguages).toContain('javascript');
  });

  it('should return empty result for unsupported languages', async () => {
    const detector = new RepositoryPatternDetector();
    const context = createMockContext('styles.css', 'body { color: red; }');
    context.language = 'css';
    
    const result = await detector.detect(context);
    
    expect(result.patterns.length).toBe(0);
    expect(result.violations.length).toBe(0);
  });

  it('should detect patterns in TypeScript files', async () => {
    const detector = new RepositoryPatternDetector();
    const content = `class UserRepository extends BaseRepository {}`;
    const context = createMockContext('UserRepository.ts', content);
    
    const result = await detector.detect(context);
    
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('should return empty result for files without repository patterns', async () => {
    const detector = new RepositoryPatternDetector();
    const content = `const x = 1 + 2;`;
    const context = createMockContext('utils.ts', content);
    
    const result = await detector.detect(context);
    
    expect(result.patterns.length).toBe(0);
  });

  it('should have higher confidence when repository pattern is found', async () => {
    const detector = new RepositoryPatternDetector();
    const content = `class UserRepository extends BaseRepository {}`;
    const context = createMockContext('UserRepository.ts', content);
    
    const result = await detector.detect(context);
    
    expect(result.confidence).toBe(0.9);
  });

  it('should have lower confidence when only violations are found', async () => {
    const detector = new RepositoryPatternDetector();
    const content = `const users = await prisma.user.findMany();`;
    const context = createMockContext('service.ts', content);
    
    const result = await detector.detect(context);
    
    expect(result.confidence).toBe(0.7);
  });
});
