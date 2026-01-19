/**
 * Tests for CoLocationDetector
 * @requirements 7.3 - THE Structural_Detector SHALL detect co-location patterns (tests next to source vs separate)
 */

import { describe, it, expect } from 'vitest';
import * as coLocation from './co-location.js';

const {
  isTestFile,
  isInTestDirectory,
  getTestDirectory,
  isStyleFile,
  isInStyleDirectory,
  getStyleDirectory,
  extractTestBaseName,
  extractStyleBaseName,
  findSourceFileForTest,
  findComponentFileForStyle,
  analyzeTestCoLocation,
  analyzeStyleCoLocation,
  analyzeCoLocation,
  CoLocationDetector,
  TEST_FILE_PATTERNS,
  TEST_DIRECTORIES,
  STYLE_FILE_PATTERNS,
  STYLE_DIRECTORIES,
} = coLocation;

// ============================================================================
// Test File Detection Tests
// ============================================================================

describe('isTestFile', () => {
  it('should identify .test.ts files', () => {
    expect(isTestFile('Button.test.ts')).toBe(true);
    expect(isTestFile('src/components/Button.test.ts')).toBe(true);
  });

  it('should identify .test.tsx files', () => {
    expect(isTestFile('Button.test.tsx')).toBe(true);
    expect(isTestFile('src/components/Button.test.tsx')).toBe(true);
  });

  it('should identify .spec.ts files', () => {
    expect(isTestFile('Button.spec.ts')).toBe(true);
    expect(isTestFile('src/components/Button.spec.ts')).toBe(true);
  });

  it('should identify .spec.tsx files', () => {
    expect(isTestFile('Button.spec.tsx')).toBe(true);
  });

  it('should identify _test.ts files', () => {
    expect(isTestFile('Button_test.ts')).toBe(true);
  });

  it('should identify _spec.ts files', () => {
    expect(isTestFile('Button_spec.ts')).toBe(true);
  });

  it('should identify JavaScript test files', () => {
    expect(isTestFile('Button.test.js')).toBe(true);
    expect(isTestFile('Button.spec.jsx')).toBe(true);
  });

  it('should not identify regular source files as test files', () => {
    expect(isTestFile('Button.ts')).toBe(false);
    expect(isTestFile('Button.tsx')).toBe(false);
    expect(isTestFile('index.ts')).toBe(false);
  });

  it('should handle Windows-style paths', () => {
    expect(isTestFile('src\\components\\Button.test.ts')).toBe(true);
  });
});

describe('isInTestDirectory', () => {
  it('should identify files in __tests__ directory', () => {
    expect(isInTestDirectory('src/__tests__/Button.ts')).toBe(true);
    expect(isInTestDirectory('__tests__/Button.ts')).toBe(true);
  });

  it('should identify files in tests directory', () => {
    expect(isInTestDirectory('tests/Button.ts')).toBe(true);
    expect(isInTestDirectory('src/tests/Button.ts')).toBe(true);
  });

  it('should identify files in test directory', () => {
    expect(isInTestDirectory('test/Button.ts')).toBe(true);
  });

  it('should identify files in spec directory', () => {
    expect(isInTestDirectory('spec/Button.ts')).toBe(true);
    expect(isInTestDirectory('specs/Button.ts')).toBe(true);
  });

  it('should not identify files outside test directories', () => {
    expect(isInTestDirectory('src/components/Button.ts')).toBe(false);
    expect(isInTestDirectory('src/Button.test.ts')).toBe(false);
  });

  it('should be case-insensitive', () => {
    expect(isInTestDirectory('src/__TESTS__/Button.ts')).toBe(true);
    expect(isInTestDirectory('TESTS/Button.ts')).toBe(true);
  });
});

describe('getTestDirectory', () => {
  it('should return the test directory path', () => {
    expect(getTestDirectory('src/__tests__/Button.ts')).toBe('src/__tests__');
    expect(getTestDirectory('__tests__/Button.ts')).toBe('__tests__');
    expect(getTestDirectory('tests/unit/Button.ts')).toBe('tests');
  });

  it('should return null for files not in test directories', () => {
    expect(getTestDirectory('src/components/Button.ts')).toBeNull();
    expect(getTestDirectory('src/Button.test.ts')).toBeNull();
  });
});

// ============================================================================
// Style File Detection Tests
// ============================================================================

describe('isStyleFile', () => {
  it('should identify .module.css files', () => {
    expect(isStyleFile('Button.module.css')).toBe(true);
    expect(isStyleFile('src/components/Button.module.css')).toBe(true);
  });

  it('should identify .module.scss files', () => {
    expect(isStyleFile('Button.module.scss')).toBe(true);
  });

  it('should identify .css files', () => {
    expect(isStyleFile('Button.css')).toBe(true);
    expect(isStyleFile('styles.css')).toBe(true);
  });

  it('should identify .scss files', () => {
    expect(isStyleFile('Button.scss')).toBe(true);
  });

  it('should identify .styles.ts files', () => {
    expect(isStyleFile('Button.styles.ts')).toBe(true);
  });

  it('should identify .styled.ts files', () => {
    expect(isStyleFile('Button.styled.ts')).toBe(true);
  });

  it('should not identify regular source files as style files', () => {
    expect(isStyleFile('Button.ts')).toBe(false);
    expect(isStyleFile('Button.tsx')).toBe(false);
    expect(isStyleFile('index.ts')).toBe(false);
  });
});

describe('isInStyleDirectory', () => {
  it('should identify files in styles directory', () => {
    expect(isInStyleDirectory('src/styles/Button.css')).toBe(true);
    expect(isInStyleDirectory('styles/Button.css')).toBe(true);
  });

  it('should identify files in css directory', () => {
    expect(isInStyleDirectory('css/Button.css')).toBe(true);
  });

  it('should identify files in scss directory', () => {
    expect(isInStyleDirectory('scss/Button.scss')).toBe(true);
  });

  it('should not identify files outside style directories', () => {
    expect(isInStyleDirectory('src/components/Button.css')).toBe(false);
    expect(isInStyleDirectory('src/Button.module.css')).toBe(false);
  });

  it('should be case-insensitive', () => {
    expect(isInStyleDirectory('src/STYLES/Button.css')).toBe(true);
  });
});

describe('getStyleDirectory', () => {
  it('should return the style directory path', () => {
    expect(getStyleDirectory('src/styles/Button.css')).toBe('src/styles');
    expect(getStyleDirectory('styles/Button.css')).toBe('styles');
  });

  it('should return null for files not in style directories', () => {
    expect(getStyleDirectory('src/components/Button.css')).toBeNull();
  });
});

// ============================================================================
// Base Name Extraction Tests
// ============================================================================

describe('extractTestBaseName', () => {
  it('should extract base name from .test.ts files', () => {
    expect(extractTestBaseName('Button.test.ts')).toBe('Button');
    expect(extractTestBaseName('src/Button.test.ts')).toBe('Button');
  });

  it('should extract base name from .spec.ts files', () => {
    expect(extractTestBaseName('Button.spec.ts')).toBe('Button');
  });

  it('should extract base name from _test.ts files', () => {
    expect(extractTestBaseName('Button_test.ts')).toBe('Button');
  });

  it('should extract base name from _spec.ts files', () => {
    expect(extractTestBaseName('Button_spec.ts')).toBe('Button');
  });

  it('should handle complex file names', () => {
    expect(extractTestBaseName('MyComponent.test.tsx')).toBe('MyComponent');
    expect(extractTestBaseName('use-auth.spec.ts')).toBe('use-auth');
  });
});

describe('extractStyleBaseName', () => {
  it('should extract base name from .module.css files', () => {
    expect(extractStyleBaseName('Button.module.css')).toBe('Button');
  });

  it('should extract base name from .css files', () => {
    expect(extractStyleBaseName('Button.css')).toBe('Button');
  });

  it('should extract base name from .styles.ts files', () => {
    expect(extractStyleBaseName('Button.styles.ts')).toBe('Button');
  });

  it('should extract base name from .styled.ts files', () => {
    expect(extractStyleBaseName('Button.styled.ts')).toBe('Button');
  });
});


// ============================================================================
// Source/Component File Finding Tests
// ============================================================================

describe('findSourceFileForTest', () => {
  it('should find co-located source file', () => {
    const files = [
      'src/components/Button.tsx',
      'src/components/Button.test.tsx',
    ];
    expect(findSourceFileForTest('src/components/Button.test.tsx', files)).toBe('src/components/Button.tsx');
  });

  it('should find source file in parent directory for __tests__', () => {
    const files = [
      'src/components/Button.tsx',
      'src/components/__tests__/Button.test.tsx',
    ];
    expect(findSourceFileForTest('src/components/__tests__/Button.test.tsx', files)).toBe('src/components/Button.tsx');
  });

  it('should return null when no source file found', () => {
    const files = [
      'src/components/Button.test.tsx',
    ];
    expect(findSourceFileForTest('src/components/Button.test.tsx', files)).toBeNull();
  });

  it('should find source file with different extension', () => {
    const files = [
      'src/utils/helpers.ts',
      'src/utils/helpers.test.ts',
    ];
    expect(findSourceFileForTest('src/utils/helpers.test.ts', files)).toBe('src/utils/helpers.ts');
  });

  it('should find source file by base name match', () => {
    const files = [
      'src/components/Button.tsx',
      'tests/Button.test.tsx',
    ];
    expect(findSourceFileForTest('tests/Button.test.tsx', files)).toBe('src/components/Button.tsx');
  });
});

describe('findComponentFileForStyle', () => {
  it('should find co-located component file', () => {
    const files = [
      'src/components/Button.tsx',
      'src/components/Button.module.css',
    ];
    expect(findComponentFileForStyle('src/components/Button.module.css', files)).toBe('src/components/Button.tsx');
  });

  it('should find component file in parent directory for styles/', () => {
    const files = [
      'src/components/Button.tsx',
      'src/components/styles/Button.css',
    ];
    expect(findComponentFileForStyle('src/components/styles/Button.css', files)).toBe('src/components/Button.tsx');
  });

  it('should return null when no component file found', () => {
    const files = [
      'src/components/Button.module.css',
    ];
    expect(findComponentFileForStyle('src/components/Button.module.css', files)).toBeNull();
  });

  it('should find component file by base name match', () => {
    const files = [
      'src/components/Button.tsx',
      'styles/Button.css',
    ];
    expect(findComponentFileForStyle('styles/Button.css', files)).toBe('src/components/Button.tsx');
  });
});

// ============================================================================
// Test Co-location Analysis Tests
// ============================================================================

describe('analyzeTestCoLocation', () => {
  it('should detect co-located test pattern', () => {
    const files = [
      'src/components/Button.tsx',
      'src/components/Button.test.tsx',
      'src/components/Input.tsx',
      'src/components/Input.test.tsx',
      'src/utils/helpers.ts',
      'src/utils/helpers.test.ts',
    ];

    const analysis = analyzeTestCoLocation(files);

    expect(analysis.pattern).toBe('co-located');
    expect(analysis.confidence).toBeGreaterThan(0.8);
    expect(analysis.coLocatedTests.length).toBe(3);
    expect(analysis.separateTests.length).toBe(0);
    expect(analysis.totalTestFiles).toBe(3);
    expect(analysis.coLocationRatio).toBe(1);
  });

  it('should detect separate test pattern', () => {
    const files = [
      'src/components/Button.tsx',
      'src/components/Input.tsx',
      '__tests__/Button.test.tsx',
      '__tests__/Input.test.tsx',
      'tests/helpers.test.ts',
    ];

    const analysis = analyzeTestCoLocation(files);

    expect(analysis.pattern).toBe('separate');
    expect(analysis.confidence).toBeGreaterThan(0.8);
    expect(analysis.coLocatedTests.length).toBe(0);
    expect(analysis.separateTests.length).toBe(3);
    expect(analysis.totalTestFiles).toBe(3);
    expect(analysis.coLocationRatio).toBe(0);
  });

  it('should detect mixed test pattern', () => {
    const files = [
      'src/components/Button.tsx',
      'src/components/Button.test.tsx',
      'src/components/Input.tsx',
      '__tests__/Input.test.tsx',
    ];

    const analysis = analyzeTestCoLocation(files);

    expect(analysis.pattern).toBe('mixed');
    expect(analysis.coLocatedTests.length).toBe(1);
    expect(analysis.separateTests.length).toBe(1);
  });

  it('should return unknown for no test files', () => {
    const files = [
      'src/components/Button.tsx',
      'src/components/Input.tsx',
    ];

    const analysis = analyzeTestCoLocation(files);

    expect(analysis.pattern).toBe('unknown');
    expect(analysis.confidence).toBe(0);
    expect(analysis.totalTestFiles).toBe(0);
  });
});

// ============================================================================
// Style Co-location Analysis Tests
// ============================================================================

describe('analyzeStyleCoLocation', () => {
  it('should detect co-located style pattern', () => {
    const files = [
      'src/components/Button.tsx',
      'src/components/Button.module.css',
      'src/components/Input.tsx',
      'src/components/Input.module.css',
    ];

    const analysis = analyzeStyleCoLocation(files);

    expect(analysis.pattern).toBe('co-located');
    expect(analysis.confidence).toBeGreaterThan(0.8);
    expect(analysis.coLocatedStyles.length).toBe(2);
    expect(analysis.separateStyles.length).toBe(0);
    expect(analysis.totalStyleFiles).toBe(2);
    expect(analysis.coLocationRatio).toBe(1);
  });

  it('should detect separate style pattern', () => {
    const files = [
      'src/components/Button.tsx',
      'src/components/Input.tsx',
      'styles/Button.css',
      'styles/Input.css',
    ];

    const analysis = analyzeStyleCoLocation(files);

    expect(analysis.pattern).toBe('separate');
    expect(analysis.confidence).toBeGreaterThan(0.8);
    expect(analysis.coLocatedStyles.length).toBe(0);
    expect(analysis.separateStyles.length).toBe(2);
    expect(analysis.totalStyleFiles).toBe(2);
    expect(analysis.coLocationRatio).toBe(0);
  });

  it('should detect mixed style pattern', () => {
    const files = [
      'src/components/Button.tsx',
      'src/components/Button.module.css',
      'src/components/Input.tsx',
      'styles/Input.css',
    ];

    const analysis = analyzeStyleCoLocation(files);

    expect(analysis.pattern).toBe('mixed');
    expect(analysis.coLocatedStyles.length).toBe(1);
    expect(analysis.separateStyles.length).toBe(1);
  });

  it('should return unknown for no style files', () => {
    const files = [
      'src/components/Button.tsx',
      'src/components/Input.tsx',
    ];

    const analysis = analyzeStyleCoLocation(files);

    expect(analysis.pattern).toBe('unknown');
    expect(analysis.confidence).toBe(0);
    expect(analysis.totalStyleFiles).toBe(0);
  });
});


// ============================================================================
// Combined Co-location Analysis Tests
// ============================================================================

describe('analyzeCoLocation', () => {
  it('should analyze both test and style co-location', () => {
    const files = [
      'src/components/Button.tsx',
      'src/components/Button.test.tsx',
      'src/components/Button.module.css',
      'src/components/Input.tsx',
      'src/components/Input.test.tsx',
      'src/components/Input.module.css',
    ];

    const analysis = analyzeCoLocation(files);

    expect(analysis.tests.pattern).toBe('co-located');
    expect(analysis.styles.pattern).toBe('co-located');
    expect(analysis.confidence).toBeGreaterThan(0.8);
  });

  it('should handle projects with only tests', () => {
    const files = [
      'src/components/Button.tsx',
      'src/components/Button.test.tsx',
    ];

    const analysis = analyzeCoLocation(files);

    expect(analysis.tests.pattern).toBe('co-located');
    expect(analysis.styles.pattern).toBe('unknown');
  });

  it('should handle projects with only styles', () => {
    const files = [
      'src/components/Button.tsx',
      'src/components/Button.module.css',
    ];

    const analysis = analyzeCoLocation(files);

    expect(analysis.tests.pattern).toBe('unknown');
    expect(analysis.styles.pattern).toBe('co-located');
  });

  it('should handle empty file list', () => {
    const analysis = analyzeCoLocation([]);

    expect(analysis.tests.pattern).toBe('unknown');
    expect(analysis.styles.pattern).toBe('unknown');
    expect(analysis.confidence).toBe(0);
  });
});

// ============================================================================
// CoLocationDetector Class Tests
// ============================================================================

describe('CoLocationDetector', () => {
  it('should have correct metadata', () => {
    const detector = new CoLocationDetector();

    expect(detector.id).toBe('structural/co-location');
    expect(detector.category).toBe('structural');
    expect(detector.subcategory).toBe('co-location');
    expect(detector.name).toBe('Co-location Detector');
    expect(detector.supportedLanguages).toContain('typescript');
    expect(detector.supportedLanguages).toContain('javascript');
    expect(detector.supportedLanguages).toContain('css');
    expect(detector.detectionMethod).toBe('structural');
  });

  it('should detect co-located test patterns', async () => {
    const detector = new CoLocationDetector();
    const context = {
      file: 'src/components/Button.test.tsx',
      content: '',
      ast: null,
      imports: [],
      exports: [],
      projectContext: {
        rootDir: '/project',
        files: [
          'src/components/Button.tsx',
          'src/components/Button.test.tsx',
          'src/components/Input.tsx',
          'src/components/Input.test.tsx',
        ],
        config: {},
      },
      language: 'typescript' as const,
      extension: '.tsx',
      isTestFile: true,
      isTypeDefinition: false,
    };

    const result = await detector.detect(context);

    expect(result.patterns.length).toBeGreaterThan(0);
    expect(result.patterns.some(p => p.patternId.includes('co-located'))).toBe(true);
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('should detect separate test patterns', async () => {
    const detector = new CoLocationDetector();
    const context = {
      file: '__tests__/Button.test.tsx',
      content: '',
      ast: null,
      imports: [],
      exports: [],
      projectContext: {
        rootDir: '/project',
        files: [
          'src/components/Button.tsx',
          'src/components/Input.tsx',
          '__tests__/Button.test.tsx',
          '__tests__/Input.test.tsx',
        ],
        config: {},
      },
      language: 'typescript' as const,
      extension: '.tsx',
      isTestFile: true,
      isTypeDefinition: false,
    };

    const result = await detector.detect(context);

    expect(result.patterns.length).toBeGreaterThan(0);
    expect(result.patterns.some(p => p.patternId.includes('separate'))).toBe(true);
  });

  it('should detect co-located style patterns', async () => {
    const detector = new CoLocationDetector();
    const context = {
      file: 'src/components/Button.module.css',
      content: '',
      ast: null,
      imports: [],
      exports: [],
      projectContext: {
        rootDir: '/project',
        files: [
          'src/components/Button.tsx',
          'src/components/Button.module.css',
          'src/components/Input.tsx',
          'src/components/Input.module.css',
        ],
        config: {},
      },
      language: 'css' as const,
      extension: '.css',
      isTestFile: false,
      isTypeDefinition: false,
    };

    const result = await detector.detect(context);

    expect(result.patterns.length).toBeGreaterThan(0);
    expect(result.patterns.some(p => p.patternId.includes('style'))).toBe(true);
  });

  it('should generate violation for inconsistent test co-location', async () => {
    const detector = new CoLocationDetector();
    const context = {
      file: '__tests__/Button.test.tsx',
      content: '',
      ast: null,
      imports: [],
      exports: [],
      projectContext: {
        rootDir: '/project',
        files: [
          'src/components/Button.tsx',
          'src/components/Button.test.tsx',
          'src/components/Input.tsx',
          'src/components/Input.test.tsx',
          'src/components/Form.tsx',
          'src/components/Form.test.tsx',
          'src/components/Card.tsx',
          'src/components/Card.test.tsx',
          '__tests__/Button.test.tsx', // Inconsistent - in separate directory
        ],
        config: {},
      },
      language: 'typescript' as const,
      extension: '.tsx',
      isTestFile: true,
      isTypeDefinition: false,
    };

    const result = await detector.detect(context);

    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations.some(v => v.patternId.includes('test-inconsistency'))).toBe(true);
  });

  it('should generate quick fix for test violations', () => {
    const detector = new CoLocationDetector();
    const violation = {
      id: 'test-violation',
      patternId: 'structural/co-location-test-inconsistency',
      severity: 'info' as const,
      file: '__tests__/Button.test.tsx',
      range: { start: { line: 1, character: 1 }, end: { line: 1, character: 1 } },
      message: 'Test file is in separate directory but project uses co-located tests',
      expected: 'co-located tests',
      actual: 'separate test directory',
      aiExplainAvailable: true,
      aiFixAvailable: false,
      firstSeen: new Date(),
      occurrences: 1,
    };

    const quickFix = detector.generateQuickFix(violation);

    expect(quickFix).not.toBeNull();
    expect(quickFix?.kind).toBe('refactor');
    expect(quickFix?.title).toContain('Move test file');
  });

  it('should generate quick fix for style violations', () => {
    const detector = new CoLocationDetector();
    const violation = {
      id: 'style-violation',
      patternId: 'structural/co-location-style-inconsistency',
      severity: 'info' as const,
      file: 'styles/Button.css',
      range: { start: { line: 1, character: 1 }, end: { line: 1, character: 1 } },
      message: 'Style file is in separate directory but project uses co-located styles',
      expected: 'co-located styles',
      actual: 'separate style directory',
      aiExplainAvailable: true,
      aiFixAvailable: false,
      firstSeen: new Date(),
      occurrences: 1,
    };

    const quickFix = detector.generateQuickFix(violation);

    expect(quickFix).not.toBeNull();
    expect(quickFix?.kind).toBe('refactor');
    expect(quickFix?.title).toContain('Move style file');
  });

  it('should return null quick fix for non-matching violations', () => {
    const detector = new CoLocationDetector();
    const violation = {
      id: 'other-violation',
      patternId: 'some-other-pattern',
      severity: 'info' as const,
      file: 'src/file.ts',
      range: { start: { line: 1, character: 1 }, end: { line: 1, character: 1 } },
      message: 'Some other violation',
      expected: 'something',
      actual: 'something else',
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
// Constants Tests
// ============================================================================

describe('TEST_FILE_PATTERNS constant', () => {
  it('should contain common test file patterns', () => {
    expect(TEST_FILE_PATTERNS.length).toBeGreaterThan(0);
    // Verify patterns work
    expect(TEST_FILE_PATTERNS.some(p => p.test('Button.test.ts'))).toBe(true);
    expect(TEST_FILE_PATTERNS.some(p => p.test('Button.spec.ts'))).toBe(true);
  });
});

describe('TEST_DIRECTORIES constant', () => {
  it('should contain common test directory names', () => {
    expect(TEST_DIRECTORIES).toContain('__tests__');
    expect(TEST_DIRECTORIES).toContain('tests');
    expect(TEST_DIRECTORIES).toContain('test');
    expect(TEST_DIRECTORIES).toContain('spec');
  });
});

describe('STYLE_FILE_PATTERNS constant', () => {
  it('should contain common style file patterns', () => {
    expect(STYLE_FILE_PATTERNS.length).toBeGreaterThan(0);
    // Verify patterns work
    expect(STYLE_FILE_PATTERNS.some(p => p.test('Button.module.css'))).toBe(true);
    expect(STYLE_FILE_PATTERNS.some(p => p.test('Button.css'))).toBe(true);
  });
});

describe('STYLE_DIRECTORIES constant', () => {
  it('should contain common style directory names', () => {
    expect(STYLE_DIRECTORIES).toContain('styles');
    expect(STYLE_DIRECTORIES).toContain('style');
    expect(STYLE_DIRECTORIES).toContain('css');
  });
});
