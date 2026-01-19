/**
 * Fixture Patterns Detector Tests
 *
 * Tests for test fixture pattern detection (factories, builders, fixtures).
 *
 * @requirements 14.5 - Fixture patterns
 */

import { describe, it, expect } from 'vitest';
import {
  FixturePatternsDetector,
  createFixturePatternsDetector,
  shouldExcludeFile,
  detectFactoryFunctions,
  detectBuilderPatterns,
  detectFixtureFiles,
  detectTestData,
  detectFakerUsage,
  analyzeFixturePatterns,
  FACTORY_FUNCTION_PATTERNS,
  BUILDER_PATTERN_PATTERNS,
  FIXTURE_FILE_PATTERNS,
  TEST_DATA_PATTERNS,
  FAKER_USAGE_PATTERNS,
} from './fixture-patterns.js';
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
  it('should exclude .d.ts files', () => {
    expect(shouldExcludeFile('types.d.ts')).toBe(true);
  });

  it('should exclude node_modules files', () => {
    expect(shouldExcludeFile('node_modules/package/index.ts')).toBe(true);
  });

  it('should not exclude regular source files', () => {
    expect(shouldExcludeFile('src/fixtures.ts')).toBe(false);
  });

  it('should not exclude test files', () => {
    expect(shouldExcludeFile('component.test.ts')).toBe(false);
  });
});

// ============================================================================
// detectFactoryFunctions Tests
// ============================================================================

describe('detectFactoryFunctions', () => {
  it('should detect createUserFactory', () => {
    const content = `const createUserFactory = () => ({ name: 'John' });`;
    const results = detectFactoryFunctions(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('factory-function');
  });

  it('should detect makeUserFactory', () => {
    const content = `const makeUserFactory = () => ({ name: 'John' });`;
    const results = detectFactoryFunctions(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect buildUserFactory', () => {
    const content = `const buildUserFactory = () => ({ name: 'John' });`;
    const results = detectFactoryFunctions(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect generateUserFactory', () => {
    const content = `const generateUserFactory = () => ({ name: 'John' });`;
    const results = detectFactoryFunctions(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect function createUser()', () => {
    const content = `function createUser() { return { name: 'John' }; }`;
    const results = detectFactoryFunctions(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect function makeUser()', () => {
    const content = `function makeUser() { return { name: 'John' }; }`;
    const results = detectFactoryFunctions(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect function buildUser()', () => {
    const content = `function buildUser() { return { name: 'John' }; }`;
    const results = detectFactoryFunctions(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect arrow function factories', () => {
    const content = `const createUser = () => ({ name: 'John' });`;
    const results = detectFactoryFunctions(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should count multiple factory functions', () => {
    const content = `
      const createUserFactory = () => ({});
      const createPostFactory = () => ({});
    `;
    const results = detectFactoryFunctions(content);
    
    expect(results.length).toBeGreaterThanOrEqual(2);
  });
});

// ============================================================================
// detectBuilderPatterns Tests
// ============================================================================

describe('detectBuilderPatterns', () => {
  it('should detect class UserBuilder', () => {
    const content = `class UserBuilder { build() { return this.user; } }`;
    const results = detectBuilderPatterns(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('builder-pattern');
  });

  it('should detect .withName() chaining', () => {
    const content = `const user = builder.withName('John').withEmail('john@example.com');`;
    const results = detectBuilderPatterns(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect .build() method', () => {
    const content = `const user = userBuilder.build();`;
    const results = detectBuilderPatterns(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect Builder.create()', () => {
    const content = `const builder = Builder.create();`;
    const results = detectBuilderPatterns(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect chained builder methods', () => {
    const content = `
      const user = UserBuilder
        .create()
        .withName('John')
        .withAge(30)
        .build();
    `;
    const results = detectBuilderPatterns(content);
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// detectFixtureFiles Tests
// ============================================================================

describe('detectFixtureFiles', () => {
  it('should detect fixtures.ts files', () => {
    const results = detectFixtureFiles('fixtures.ts');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('fixture-file');
  });

  it('should detect files in /fixtures/ directory', () => {
    const results = detectFixtureFiles('src/fixtures/users.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect .fixture.ts files', () => {
    const results = detectFixtureFiles('user.fixture.ts');
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect .fixture.jsx files', () => {
    const results = detectFixtureFiles('user.fixture.jsx');
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should not detect regular source files', () => {
    const results = detectFixtureFiles('component.ts');
    
    expect(results.length).toBe(0);
  });
});

// ============================================================================
// detectTestData Tests
// ============================================================================

describe('detectTestData', () => {
  it('should detect mockData constant', () => {
    const content = `const mockData = { name: 'John' };`;
    const results = detectTestData(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('test-data');
  });

  it('should detect fakeData constant', () => {
    const content = `const fakeData = { name: 'John' };`;
    const results = detectTestData(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect stubData constant', () => {
    const content = `const stubData = { name: 'John' };`;
    const results = detectTestData(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect testData constant', () => {
    const content = `const testData = { name: 'John' };`;
    const results = detectTestData(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect userMock constant', () => {
    const content = `const userMock = { name: 'John' };`;
    const results = detectTestData(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect userFake constant', () => {
    const content = `const userFake = { name: 'John' };`;
    const results = detectTestData(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect userStub constant', () => {
    const content = `const userStub = { name: 'John' };`;
    const results = detectTestData(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect userFixture constant', () => {
    const content = `const userFixture = { name: 'John' };`;
    const results = detectTestData(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect exported fixtures', () => {
    const content = `export const userFixture = { name: 'John' };`;
    const results = detectTestData(content);
    
    expect(results.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// detectFakerUsage Tests
// ============================================================================

describe('detectFakerUsage', () => {
  it('should detect faker.person.firstName()', () => {
    const content = `const name = faker.person.firstName();`;
    const results = detectFakerUsage(content);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.type).toBe('faker-usage');
  });

  it('should detect faker.internet.email()', () => {
    const content = `const email = faker.internet.email();`;
    const results = detectFakerUsage(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect @faker-js/faker import', () => {
    const content = `import { faker } from '@faker-js/faker';`;
    const results = detectFakerUsage(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect faker import', () => {
    const content = `import faker from 'faker';`;
    const results = detectFakerUsage(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should detect chance.js usage', () => {
    const content = `const name = chance.name();`;
    const results = detectFakerUsage(content);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should count multiple faker usages', () => {
    const content = `
      const name = faker.person.firstName();
      const email = faker.internet.email();
      const phone = faker.phone.number();
    `;
    const results = detectFakerUsage(content);
    
    expect(results.length).toBe(3);
  });
});

// ============================================================================
// analyzeFixturePatterns Tests
// ============================================================================

describe('analyzeFixturePatterns', () => {
  it('should return empty analysis for excluded files', () => {
    const content = `const x = 1;`;
    const analysis = analyzeFixturePatterns(content, 'types.d.ts');
    
    expect(analysis.patterns.length).toBe(0);
    expect(analysis.hasFactories).toBe(false);
    expect(analysis.hasBuilders).toBe(false);
    expect(analysis.fixtureCount).toBe(0);
  });

  it('should detect factory functions', () => {
    const content = `
      const createUserFactory = () => ({ name: 'John' });
      function buildPost() { return { title: 'Test' }; }
    `;
    const analysis = analyzeFixturePatterns(content, 'fixtures.ts');
    
    expect(analysis.hasFactories).toBe(true);
    expect(analysis.fixtureCount).toBeGreaterThan(0);
  });

  it('should detect builder patterns', () => {
    const content = `
      class UserBuilder {
        build() { return this.user; }
      }
    `;
    const analysis = analyzeFixturePatterns(content, 'fixtures.ts');
    
    expect(analysis.hasBuilders).toBe(true);
  });

  it('should detect fixture files', () => {
    const content = `export const userFixture = { name: 'John' };`;
    const analysis = analyzeFixturePatterns(content, 'fixtures/users.ts');
    
    expect(analysis.fixtureCount).toBeGreaterThan(0);
  });

  it('should detect faker usage', () => {
    const content = `
      import { faker } from '@faker-js/faker';
      const name = faker.person.firstName();
    `;
    const analysis = analyzeFixturePatterns(content, 'fixtures.ts');
    
    expect(analysis.fixtureCount).toBeGreaterThan(0);
  });

  it('should combine all fixture patterns', () => {
    const content = `
      import { faker } from '@faker-js/faker';
      
      const createUserFactory = () => ({
        name: faker.person.firstName(),
        email: faker.internet.email(),
      });
      
      class UserBuilder {
        build() { return this.user; }
      }
      
      export const userFixture = { name: 'John' };
    `;
    const analysis = analyzeFixturePatterns(content, 'fixtures.ts');
    
    expect(analysis.hasFactories).toBe(true);
    expect(analysis.hasBuilders).toBe(true);
    expect(analysis.fixtureCount).toBeGreaterThan(0);
  });
});

// ============================================================================
// Detector Class Tests
// ============================================================================

describe('FixturePatternsDetector', () => {
  it('should create detector with correct properties', () => {
    const detector = createFixturePatternsDetector();
    
    expect(detector.id).toBe('testing/fixture-patterns');
    expect(detector.category).toBe('testing');
    expect(detector.subcategory).toBe('fixture-patterns');
    expect(detector.supportedLanguages).toContain('typescript');
    expect(detector.supportedLanguages).toContain('javascript');
  });

  it('should return empty result for unsupported languages', async () => {
    const detector = new FixturePatternsDetector();
    const context = createMockContext('styles.css', 'body { color: red; }');
    context.language = 'css';
    
    const result = await detector.detect(context);
    
    expect(result.patterns.length).toBe(0);
    expect(result.violations.length).toBe(0);
  });

  it('should detect fixture patterns', async () => {
    const detector = new FixturePatternsDetector();
    const content = `
      const createUserFactory = () => ({ name: 'John' });
      export const userFixture = { name: 'John' };
    `;
    const context = createMockContext('fixtures.ts', content);
    
    const result = await detector.detect(context);
    
    expect(result.confidence).toBe(0.9);
    expect(result.metadata?.custom?.hasFactories).toBe(true);
    expect(result.metadata?.custom?.fixtureCount).toBeGreaterThan(0);
  });

  it('should return empty result for files without fixtures', async () => {
    const detector = new FixturePatternsDetector();
    const content = `const x = 1;`;
    const context = createMockContext('utils.ts', content);
    
    const result = await detector.detect(context);
    
    expect(result.patterns.length).toBe(0);
  });

  it('should return null for generateQuickFix', () => {
    const detector = new FixturePatternsDetector();
    const violation = {
      id: 'test-violation',
      patternId: 'testing/fixture-patterns',
      severity: 'warning' as const,
      file: 'test.ts',
      range: { start: { line: 1, column: 1 }, end: { line: 1, column: 10 } },
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
