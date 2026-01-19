/**
 * Tests for BarrelExportsDetector
 * @requirements 7.4 - THE Structural_Detector SHALL detect barrel/index file usage patterns
 */

import { describe, it, expect } from 'vitest';
import * as barrelExports from './barrel-exports.js';

const {
  isBarrelFile,
  getFileDirectory,
  getFileName,
  shouldDirectoryHaveBarrel,
  parseExportPatterns,
  analyzeBarrelFile,
  extractDirectories,
  analyzeBarrelPatterns,
  checkDirectoryNeedsBarrel,
  BarrelExportsDetector,
  BARREL_FILE_NAMES,
  BARREL_EXPECTED_DIRECTORIES,
} = barrelExports;

// ============================================================================
// Barrel File Detection Tests
// ============================================================================

describe('isBarrelFile', () => {
  it('should identify index.ts files', () => {
    expect(isBarrelFile('index.ts')).toBe(true);
    expect(isBarrelFile('src/components/index.ts')).toBe(true);
  });

  it('should identify index.tsx files', () => {
    expect(isBarrelFile('index.tsx')).toBe(true);
    expect(isBarrelFile('src/components/index.tsx')).toBe(true);
  });

  it('should identify index.js files', () => {
    expect(isBarrelFile('index.js')).toBe(true);
    expect(isBarrelFile('src/utils/index.js')).toBe(true);
  });

  it('should identify index.jsx files', () => {
    expect(isBarrelFile('index.jsx')).toBe(true);
  });

  it('should identify index.mjs and index.cjs files', () => {
    expect(isBarrelFile('index.mjs')).toBe(true);
    expect(isBarrelFile('index.cjs')).toBe(true);
  });


  it('should not identify regular source files as barrel files', () => {
    expect(isBarrelFile('Button.ts')).toBe(false);
    expect(isBarrelFile('Button.tsx')).toBe(false);
    expect(isBarrelFile('utils.ts')).toBe(false);
    expect(isBarrelFile('main.ts')).toBe(false);
  });

  it('should be case-insensitive', () => {
    expect(isBarrelFile('INDEX.ts')).toBe(true);
    expect(isBarrelFile('Index.ts')).toBe(true);
  });

  it('should handle Windows-style paths', () => {
    expect(isBarrelFile('src\\components\\index.ts')).toBe(true);
  });
});

// ============================================================================
// Path Helper Tests
// ============================================================================

describe('getFileDirectory', () => {
  it('should extract directory from file path', () => {
    expect(getFileDirectory('src/components/Button.tsx')).toBe('src/components');
    expect(getFileDirectory('src/index.ts')).toBe('src');
  });

  it('should return empty string for root files', () => {
    expect(getFileDirectory('index.ts')).toBe('');
    expect(getFileDirectory('Button.tsx')).toBe('');
  });

  it('should handle Windows-style paths', () => {
    expect(getFileDirectory('src\\components\\Button.tsx')).toBe('src/components');
  });
});

describe('getFileName', () => {
  it('should extract file name from path', () => {
    expect(getFileName('src/components/Button.tsx')).toBe('Button.tsx');
    expect(getFileName('index.ts')).toBe('index.ts');
  });

  it('should handle Windows-style paths', () => {
    expect(getFileName('src\\components\\Button.tsx')).toBe('Button.tsx');
  });
});

describe('shouldDirectoryHaveBarrel', () => {
  it('should return true for common barrel directories', () => {
    expect(shouldDirectoryHaveBarrel('src/components')).toBe(true);
    expect(shouldDirectoryHaveBarrel('src/hooks')).toBe(true);
    expect(shouldDirectoryHaveBarrel('src/utils')).toBe(true);
    expect(shouldDirectoryHaveBarrel('src/services')).toBe(true);
    expect(shouldDirectoryHaveBarrel('src/lib')).toBe(true);
    expect(shouldDirectoryHaveBarrel('src/types')).toBe(true);
  });

  it('should return true for plural forms', () => {
    expect(shouldDirectoryHaveBarrel('src/helpers')).toBe(true);
    expect(shouldDirectoryHaveBarrel('src/models')).toBe(true);
  });

  it('should return false for non-barrel directories', () => {
    expect(shouldDirectoryHaveBarrel('src/app')).toBe(false);
    expect(shouldDirectoryHaveBarrel('src/config')).toBe(false);
    expect(shouldDirectoryHaveBarrel('src/__tests__')).toBe(false);
  });

  it('should be case-insensitive', () => {
    expect(shouldDirectoryHaveBarrel('src/Components')).toBe(true);
    expect(shouldDirectoryHaveBarrel('src/UTILS')).toBe(true);
  });
});

// ============================================================================
// Export Pattern Parsing Tests
// ============================================================================

describe('parseExportPatterns', () => {
  it('should parse namespace re-exports', () => {
    const content = `export * from './Button';`;
    const patterns = parseExportPatterns(content);
    
    expect(patterns.length).toBe(1);
    expect(patterns[0]!.type).toBe('namespace-export');
    expect(patterns[0]!.source).toBe('./Button');
    expect(patterns[0]!.names).toEqual(['*']);
  });

  it('should parse named re-exports', () => {
    const content = `export { Button, Input } from './components';`;
    const patterns = parseExportPatterns(content);
    
    expect(patterns.length).toBe(1);
    expect(patterns[0]!.type).toBe('named-export');
    expect(patterns[0]!.source).toBe('./components');
    expect(patterns[0]!.names).toContain('Button');
    expect(patterns[0]!.names).toContain('Input');
  });

  it('should parse default re-exports', () => {
    const content = `export { default } from './Button';`;
    const patterns = parseExportPatterns(content);
    
    expect(patterns.length).toBe(1);
    expect(patterns[0]!.type).toBe('default-reexport');
    expect(patterns[0]!.source).toBe('./Button');
  });

  it('should parse renamed exports', () => {
    const content = `export { Button as PrimaryButton } from './Button';`;
    const patterns = parseExportPatterns(content);
    
    expect(patterns.length).toBe(1);
    expect(patterns[0]!.type).toBe('named-reexport');
    expect(patterns[0]!.source).toBe('./Button');
  });

  it('should parse direct exports', () => {
    const content = `export const foo = 'bar';`;
    const patterns = parseExportPatterns(content);
    
    expect(patterns.length).toBe(1);
    expect(patterns[0]!.type).toBe('direct-export');
    expect(patterns[0]!.names).toContain('foo');
    expect(patterns[0]!.source).toBeNull();
  });

  it('should parse default exports', () => {
    const content = `export default Button;`;
    const patterns = parseExportPatterns(content);
    
    expect(patterns.length).toBe(1);
    expect(patterns[0]!.type).toBe('default-export');
    expect(patterns[0]!.names).toContain('default');
  });

  it('should parse multiple exports', () => {
    const content = `
export * from './Button';
export * from './Input';
export { useAuth } from './hooks';
export const VERSION = '1.0.0';
`;
    const patterns = parseExportPatterns(content);
    
    expect(patterns.length).toBe(4);
    expect(patterns.filter(p => p.type === 'namespace-export').length).toBe(2);
    expect(patterns.filter(p => p.type === 'named-export').length).toBe(1);
    expect(patterns.filter(p => p.type === 'direct-export').length).toBe(1);
  });

  it('should skip comments', () => {
    const content = `
// This is a comment
export * from './Button';
/* Another comment */
export * from './Input';
`;
    const patterns = parseExportPatterns(content);
    
    expect(patterns.length).toBe(2);
  });

  it('should handle empty content', () => {
    const patterns = parseExportPatterns('');
    expect(patterns.length).toBe(0);
  });
});

// ============================================================================
// Barrel File Analysis Tests
// ============================================================================

describe('analyzeBarrelFile', () => {
  it('should analyze a valid barrel file', () => {
    const content = `
export * from './Button';
export * from './Input';
export { useAuth } from './hooks';
`;
    const info = analyzeBarrelFile('src/components/index.ts', content);
    
    expect(info.path).toBe('src/components/index.ts');
    expect(info.directory).toBe('src/components');
    expect(info.exportCount).toBe(3);
    expect(info.isValidBarrel).toBe(true);
    expect(info.reexportedFiles.length).toBe(3);
    expect(info.exportTypes).toContain('namespace-export');
    expect(info.exportTypes).toContain('named-export');
  });

  it('should identify invalid barrel files (no re-exports)', () => {
    const content = `
export const foo = 'bar';
export const baz = 'qux';
`;
    const info = analyzeBarrelFile('src/utils/index.ts', content);
    
    expect(info.isValidBarrel).toBe(false);
    expect(info.exportCount).toBe(2);
    expect(info.reexportedFiles.length).toBe(0);
  });

  it('should handle empty barrel files', () => {
    const info = analyzeBarrelFile('src/components/index.ts', '');
    
    expect(info.exportCount).toBe(0);
    expect(info.isValidBarrel).toBe(false);
    expect(info.reexportedFiles.length).toBe(0);
  });
});

// ============================================================================
// Directory Extraction Tests
// ============================================================================

describe('extractDirectories', () => {
  it('should extract unique directories from files', () => {
    const files = [
      'src/components/Button.tsx',
      'src/components/Input.tsx',
      'src/utils/helpers.ts',
      'src/index.ts',
    ];
    
    const directories = extractDirectories(files);
    
    expect(directories.size).toBe(3);
    expect(directories.has('src/components')).toBe(true);
    expect(directories.has('src/utils')).toBe(true);
    expect(directories.has('src')).toBe(true);
  });

  it('should group files by directory', () => {
    const files = [
      'src/components/Button.tsx',
      'src/components/Input.tsx',
      'src/components/index.ts',
    ];
    
    const directories = extractDirectories(files);
    const componentFiles = directories.get('src/components');
    
    expect(componentFiles?.length).toBe(3);
  });

  it('should handle empty file list', () => {
    const directories = extractDirectories([]);
    expect(directories.size).toBe(0);
  });
});

// ============================================================================
// Barrel Pattern Analysis Tests
// ============================================================================

describe('analyzeBarrelPatterns', () => {
  it('should detect consistent barrel pattern', () => {
    const files = [
      'src/components/Button.tsx',
      'src/components/Input.tsx',
      'src/components/index.ts',
      'src/hooks/useAuth.ts',
      'src/hooks/useForm.ts',
      'src/hooks/index.ts',
      'src/utils/helpers.ts',
      'src/utils/format.ts',
      'src/utils/index.ts',
    ];
    
    const fileContents = new Map([
      ['src/components/index.ts', `export * from './Button';\nexport * from './Input';`],
      ['src/hooks/index.ts', `export * from './useAuth';\nexport * from './useForm';`],
      ['src/utils/index.ts', `export * from './helpers';\nexport * from './format';`],
    ]);
    
    const analysis = analyzeBarrelPatterns(files, fileContents);
    
    expect(analysis.pattern).toBe('consistent');
    expect(analysis.confidence).toBeGreaterThan(0.8);
    expect(analysis.barrelFiles.length).toBe(3);
    expect(analysis.directoriesWithBarrels.length).toBe(3);
    expect(analysis.directoriesMissingBarrels.length).toBe(0);
  });

  it('should detect inconsistent barrel pattern', () => {
    const files = [
      'src/components/Button.tsx',
      'src/components/Input.tsx',
      'src/components/index.ts',
      'src/hooks/useAuth.ts',
      'src/hooks/useForm.ts',
      // Missing index.ts in hooks
      'src/utils/helpers.ts',
      'src/utils/format.ts',
      // Missing index.ts in utils
    ];
    
    const fileContents = new Map([
      ['src/components/index.ts', `export * from './Button';\nexport * from './Input';`],
    ]);
    
    const analysis = analyzeBarrelPatterns(files, fileContents);
    
    expect(analysis.pattern).toBe('inconsistent');
    expect(analysis.barrelFiles.length).toBe(1);
    expect(analysis.directoriesMissingBarrels.length).toBeGreaterThan(0);
  });

  it('should detect no barrel pattern', () => {
    const files = [
      'src/components/Button.tsx',
      'src/components/Input.tsx',
      'src/utils/helpers.ts',
    ];
    
    const analysis = analyzeBarrelPatterns(files);
    
    expect(analysis.pattern).toBe('none');
    expect(analysis.barrelFiles.length).toBe(0);
  });

  it('should identify dominant export style', () => {
    const files = [
      'src/components/index.ts',
      'src/hooks/index.ts',
    ];
    
    const fileContents = new Map([
      ['src/components/index.ts', `export * from './Button';\nexport * from './Input';`],
      ['src/hooks/index.ts', `export * from './useAuth';`],
    ]);
    
    const analysis = analyzeBarrelPatterns(files, fileContents);
    
    expect(analysis.dominantExportStyle).toBe('namespace-export');
  });

  it('should handle empty file list', () => {
    const analysis = analyzeBarrelPatterns([]);
    
    expect(analysis.pattern).toBe('none');
    expect(analysis.barrelFiles.length).toBe(0);
    expect(analysis.totalDirectories).toBe(0);
  });
});

// ============================================================================
// Directory Needs Barrel Check Tests
// ============================================================================

describe('checkDirectoryNeedsBarrel', () => {
  it('should return true for directories that need barrels', () => {
    const files = [
      'src/components/Button.tsx',
      'src/components/Input.tsx',
      'src/hooks/useAuth.ts',
      'src/hooks/index.ts',
    ];
    
    const fileContents = new Map([
      ['src/hooks/index.ts', `export * from './useAuth';`],
    ]);
    
    const analysis = analyzeBarrelPatterns(files, fileContents);
    // Force consistent pattern for testing
    analysis.pattern = 'consistent';
    
    const needsBarrel = checkDirectoryNeedsBarrel('src/components', files, analysis);
    
    expect(needsBarrel).toBe(true);
  });

  it('should return false for directories with single file', () => {
    const files = [
      'src/components/Button.tsx',
      'src/hooks/useAuth.ts',
      'src/hooks/index.ts',
    ];
    
    const fileContents = new Map([
      ['src/hooks/index.ts', `export * from './useAuth';`],
    ]);
    
    const analysis = analyzeBarrelPatterns(files, fileContents);
    analysis.pattern = 'consistent';
    
    const needsBarrel = checkDirectoryNeedsBarrel('src/components', files, analysis);
    
    expect(needsBarrel).toBe(false);
  });

  it('should return false when pattern is not consistent', () => {
    const files = [
      'src/components/Button.tsx',
      'src/components/Input.tsx',
    ];
    
    const analysis = analyzeBarrelPatterns(files);
    
    const needsBarrel = checkDirectoryNeedsBarrel('src/components', files, analysis);
    
    expect(needsBarrel).toBe(false);
  });
});

// ============================================================================
// BarrelExportsDetector Class Tests
// ============================================================================

describe('BarrelExportsDetector', () => {
  it('should have correct metadata', () => {
    const detector = new BarrelExportsDetector();

    expect(detector.id).toBe('structural/barrel-exports');
    expect(detector.category).toBe('structural');
    expect(detector.subcategory).toBe('barrel-exports');
    expect(detector.name).toBe('Barrel Exports Detector');
    expect(detector.supportedLanguages).toContain('typescript');
    expect(detector.supportedLanguages).toContain('javascript');
    expect(detector.detectionMethod).toBe('structural');
  });

  it('should detect barrel file patterns', async () => {
    const detector = new BarrelExportsDetector();
    const context = {
      file: 'src/components/index.ts',
      content: `export * from './Button';\nexport * from './Input';`,
      ast: null,
      imports: [],
      exports: [],
      projectContext: {
        rootDir: '/project',
        files: [
          'src/components/Button.tsx',
          'src/components/Input.tsx',
          'src/components/index.ts',
          'src/hooks/useAuth.ts',
          'src/hooks/index.ts',
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
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('should detect empty barrel file violation', async () => {
    const detector = new BarrelExportsDetector();
    const context = {
      file: 'src/components/index.ts',
      content: '',
      ast: null,
      imports: [],
      exports: [],
      projectContext: {
        rootDir: '/project',
        files: [
          'src/components/Button.tsx',
          'src/components/Input.tsx',
          'src/components/index.ts',
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
    expect(result.violations.some(v => v.patternId === 'structural/barrel-exports-empty')).toBe(true);
  });

  it('should detect missing barrel file violation', async () => {
    const detector = new BarrelExportsDetector();
    const context = {
      file: 'src/components/Button.tsx',
      content: 'export const Button = () => {};',
      ast: null,
      imports: [],
      exports: [],
      projectContext: {
        rootDir: '/project',
        files: [
          'src/components/Button.tsx',
          'src/components/Input.tsx',
          // Missing index.ts in components
          'src/hooks/useAuth.ts',
          'src/hooks/useForm.ts',
          'src/hooks/index.ts',
          'src/utils/helpers.ts',
          'src/utils/format.ts',
          'src/utils/index.ts',
        ],
        config: {},
      },
      language: 'typescript' as const,
      extension: '.tsx',
      isTestFile: false,
      isTypeDefinition: false,
    };

    const result = await detector.detect(context);

    // Should detect missing barrel when pattern is consistent
    expect(result.patterns.length).toBeGreaterThan(0);
  });

  it('should generate quick fix for missing barrel', () => {
    const detector = new BarrelExportsDetector();
    const violation = {
      id: 'missing-barrel',
      patternId: 'structural/barrel-exports-missing',
      severity: 'info' as const,
      file: 'src/components/Button.tsx',
      range: { start: { line: 1, character: 1 }, end: { line: 1, character: 1 } },
      message: 'Directory has no barrel file',
      expected: 'Directory with barrel file',
      actual: 'Directory without barrel',
      aiExplainAvailable: true,
      aiFixAvailable: true,
      firstSeen: new Date(),
      occurrences: 1,
    };

    const quickFix = detector.generateQuickFix(violation);

    expect(quickFix).not.toBeNull();
    expect(quickFix?.kind).toBe('quickfix');
    expect(quickFix?.title).toContain('Create barrel file');
  });

  it('should generate quick fix for empty barrel', () => {
    const detector = new BarrelExportsDetector();
    const violation = {
      id: 'empty-barrel',
      patternId: 'structural/barrel-exports-empty',
      severity: 'warning' as const,
      file: 'src/components/index.ts',
      range: { start: { line: 1, character: 1 }, end: { line: 1, character: 1 } },
      message: 'Barrel file is empty',
      expected: 'Barrel file with re-exports',
      actual: 'Empty barrel file',
      aiExplainAvailable: true,
      aiFixAvailable: true,
      firstSeen: new Date(),
      occurrences: 1,
    };

    const quickFix = detector.generateQuickFix(violation);

    expect(quickFix).not.toBeNull();
    expect(quickFix?.kind).toBe('quickfix');
    expect(quickFix?.title).toContain('Add exports');
  });

  it('should generate quick fix for style inconsistency', () => {
    const detector = new BarrelExportsDetector();
    const violation = {
      id: 'style-violation',
      patternId: 'structural/barrel-exports-style',
      severity: 'info' as const,
      file: 'src/components/index.ts',
      range: { start: { line: 1, character: 1 }, end: { line: 1, character: 1 } },
      message: 'Export style inconsistent',
      expected: 'namespace-export',
      actual: 'named-export',
      aiExplainAvailable: true,
      aiFixAvailable: false,
      firstSeen: new Date(),
      occurrences: 1,
    };

    const quickFix = detector.generateQuickFix(violation);

    expect(quickFix).not.toBeNull();
    expect(quickFix?.kind).toBe('refactor');
    expect(quickFix?.title).toContain('Update export style');
  });

  it('should return null quick fix for non-matching violations', () => {
    const detector = new BarrelExportsDetector();
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

describe('BARREL_FILE_NAMES constant', () => {
  it('should contain common barrel file names', () => {
    expect(BARREL_FILE_NAMES).toContain('index.ts');
    expect(BARREL_FILE_NAMES).toContain('index.tsx');
    expect(BARREL_FILE_NAMES).toContain('index.js');
    expect(BARREL_FILE_NAMES).toContain('index.jsx');
    expect(BARREL_FILE_NAMES).toContain('index.mjs');
    expect(BARREL_FILE_NAMES).toContain('index.cjs');
  });
});

describe('BARREL_EXPECTED_DIRECTORIES constant', () => {
  it('should contain common directories that should have barrels', () => {
    expect(BARREL_EXPECTED_DIRECTORIES).toContain('components');
    expect(BARREL_EXPECTED_DIRECTORIES).toContain('hooks');
    expect(BARREL_EXPECTED_DIRECTORIES).toContain('utils');
    expect(BARREL_EXPECTED_DIRECTORIES).toContain('services');
    expect(BARREL_EXPECTED_DIRECTORIES).toContain('lib');
    expect(BARREL_EXPECTED_DIRECTORIES).toContain('types');
  });
});