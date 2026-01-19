/**
 * Tests for FileNamingDetector
 * @requirements 7.1 - THE Structural_Detector SHALL detect file naming conventions
 */

import { describe, it, expect } from 'vitest';
import * as fileNaming from './file-naming.js';

const {
  detectNamingConvention,
  convertToConvention,
  splitIntoWords,
  extractBaseName,
  analyzeFileName,
  FileNamingDetector,
  COMMON_SUFFIXES,
} = fileNaming;

describe('detectNamingConvention', () => {
  it('should detect PascalCase', () => {
    expect(detectNamingConvention('MyComponent')).toBe('PascalCase');
    expect(detectNamingConvention('UserService')).toBe('PascalCase');
    expect(detectNamingConvention('App')).toBe('PascalCase');
  });

  it('should detect camelCase', () => {
    expect(detectNamingConvention('myComponent')).toBe('camelCase');
    expect(detectNamingConvention('userService')).toBe('camelCase');
    expect(detectNamingConvention('getData')).toBe('camelCase');
  });

  it('should detect kebab-case', () => {
    expect(detectNamingConvention('my-component')).toBe('kebab-case');
    expect(detectNamingConvention('user-service')).toBe('kebab-case');
    expect(detectNamingConvention('get-data')).toBe('kebab-case');
  });

  it('should detect snake_case', () => {
    expect(detectNamingConvention('my_component')).toBe('snake_case');
    expect(detectNamingConvention('user_service')).toBe('snake_case');
    expect(detectNamingConvention('get_data')).toBe('snake_case');
  });

  it('should detect SCREAMING_SNAKE_CASE', () => {
    expect(detectNamingConvention('MY_COMPONENT')).toBe('SCREAMING_SNAKE_CASE');
    expect(detectNamingConvention('USER_SERVICE')).toBe('SCREAMING_SNAKE_CASE');
    expect(detectNamingConvention('MAX_VALUE')).toBe('SCREAMING_SNAKE_CASE');
  });

  it('should return unknown for empty or invalid names', () => {
    expect(detectNamingConvention('')).toBe('unknown');
    expect(detectNamingConvention('123abc')).toBe('unknown');
    expect(detectNamingConvention('my-Component')).toBe('unknown');
  });
});

describe('convertToConvention', () => {
  it('should convert to PascalCase', () => {
    expect(convertToConvention('my-component', 'PascalCase')).toBe('MyComponent');
    expect(convertToConvention('user_service', 'PascalCase')).toBe('UserService');
    expect(convertToConvention('getData', 'PascalCase')).toBe('GetData');
  });

  it('should convert to camelCase', () => {
    expect(convertToConvention('my-component', 'camelCase')).toBe('myComponent');
    expect(convertToConvention('UserService', 'camelCase')).toBe('userService');
  });

  it('should convert to kebab-case', () => {
    expect(convertToConvention('MyComponent', 'kebab-case')).toBe('my-component');
    expect(convertToConvention('user_service', 'kebab-case')).toBe('user-service');
  });

  it('should convert to snake_case', () => {
    expect(convertToConvention('MyComponent', 'snake_case')).toBe('my_component');
    expect(convertToConvention('user-service', 'snake_case')).toBe('user_service');
  });

  it('should convert to SCREAMING_SNAKE_CASE', () => {
    expect(convertToConvention('MyComponent', 'SCREAMING_SNAKE_CASE')).toBe('MY_COMPONENT');
    expect(convertToConvention('user-service', 'SCREAMING_SNAKE_CASE')).toBe('USER_SERVICE');
  });
});

describe('splitIntoWords', () => {
  it('should split PascalCase', () => {
    expect(splitIntoWords('MyComponent')).toEqual(['My', 'Component']);
    expect(splitIntoWords('UserServiceProvider')).toEqual(['User', 'Service', 'Provider']);
  });

  it('should split camelCase', () => {
    expect(splitIntoWords('myComponent')).toEqual(['my', 'Component']);
    expect(splitIntoWords('getUserData')).toEqual(['get', 'User', 'Data']);
  });

  it('should split kebab-case', () => {
    expect(splitIntoWords('my-component')).toEqual(['my', 'component']);
    expect(splitIntoWords('user-service-provider')).toEqual(['user', 'service', 'provider']);
  });

  it('should split snake_case', () => {
    expect(splitIntoWords('my_component')).toEqual(['my', 'component']);
    expect(splitIntoWords('user_service_provider')).toEqual(['user', 'service', 'provider']);
  });
});

describe('extractBaseName', () => {
  it('should extract base name without suffix', () => {
    const result = extractBaseName('my-component.ts');
    expect(result.baseName).toBe('my-component');
    expect(result.suffix).toBeUndefined();
    expect(result.extension).toBe('.ts');
  });

  it('should extract base name with suffix', () => {
    const result = extractBaseName('user.service.ts');
    expect(result.baseName).toBe('user');
    expect(result.suffix).toBe('.service');
    expect(result.extension).toBe('.ts');
  });

  it('should extract base name with test suffix', () => {
    const result = extractBaseName('user.test.ts');
    expect(result.baseName).toBe('user');
    expect(result.suffix).toBe('.test');
    expect(result.extension).toBe('.ts');
  });

  it('should handle files without extension', () => {
    const result = extractBaseName('Dockerfile');
    expect(result.baseName).toBe('Dockerfile');
    expect(result.suffix).toBeUndefined();
    expect(result.extension).toBe('');
  });
});

describe('analyzeFileName', () => {
  it('should analyze a kebab-case file', () => {
    const result = analyzeFileName('src/components/my-component.ts');
    expect(result.fileName).toBe('my-component.ts');
    expect(result.baseName).toBe('my-component');
    expect(result.convention).toBe('kebab-case');
    expect(result.extension).toBe('.ts');
    expect(result.followsPattern).toBe(true);
  });

  it('should analyze a PascalCase file', () => {
    const result = analyzeFileName('src/components/MyComponent.tsx');
    expect(result.fileName).toBe('MyComponent.tsx');
    expect(result.baseName).toBe('MyComponent');
    expect(result.convention).toBe('PascalCase');
    expect(result.extension).toBe('.tsx');
  });

  it('should suggest name when not following dominant pattern', () => {
    const result = analyzeFileName('src/MyComponent.ts', 'kebab-case');
    expect(result.followsPattern).toBe(false);
    expect(result.suggestedName).toBe('my-component.ts');
  });

  it('should handle files with suffixes', () => {
    const result = analyzeFileName('src/user.service.ts');
    expect(result.baseName).toBe('user');
    expect(result.suffix).toBe('.service');
    expect(result.convention).toBe('kebab-case');
  });
});

describe('FileNamingDetector', () => {
  it('should have correct metadata', () => {
    const detector = new FileNamingDetector();
    expect(detector.id).toBe('structural/file-naming');
    expect(detector.category).toBe('structural');
    expect(detector.subcategory).toBe('naming-conventions');
    expect(detector.supportedLanguages).toContain('typescript');
    expect(detector.supportedLanguages).toContain('javascript');
  });

  it('should detect patterns in a file', async () => {
    const detector = new FileNamingDetector();
    const context = {
      file: 'src/components/my-component.ts',
      content: '',
      ast: null,
      imports: [],
      exports: [],
      projectContext: {
        rootDir: '/project',
        files: [
          'src/components/my-component.ts',
          'src/components/user-profile.ts',
          'src/components/data-table.ts',
        ],
        config: {},
      },
      language: 'typescript' as const,
      extension: '.ts',
      isTestFile: false,
      isTypeDefinition: false,
    };

    const result = await detector.detect(context);
    expect(result.patterns.length).toBeGreaterThan(0);
    expect(result.patterns[0].patternId).toBe('file-naming-kebab-case');
  });

  it('should detect violations when file does not follow dominant pattern', async () => {
    const detector = new FileNamingDetector();
    const context = {
      file: 'src/components/MyComponent.ts',
      content: '',
      ast: null,
      imports: [],
      exports: [],
      projectContext: {
        rootDir: '/project',
        files: [
          'src/components/my-component.ts',
          'src/components/user-profile.ts',
          'src/components/data-table.ts',
          'src/components/MyComponent.ts',
        ],
        config: {},
      },
      language: 'typescript' as const,
      extension: '.ts',
      isTestFile: false,
      isTypeDefinition: false,
    };

    const result = await detector.detect(context);
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations[0].message).toContain('PascalCase');
    expect(result.violations[0].message).toContain('kebab-case');
  });
});
