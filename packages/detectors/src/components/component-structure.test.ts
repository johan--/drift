/**
 * Component Structure Detector Tests
 *
 * Tests for component file structure pattern detection.
 *
 * @requirements 8.1 - THE Component_Detector SHALL detect component file structure patterns
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ComponentStructureDetector,
  createComponentStructureDetector,
  getComponentFileType,
  extractComponentName,
  isComponentFile,
  isComponentFolder,
  getComponentFolderFiles,
  determineStructureType,
  findRelatedFiles,
  detectComponents,
  analyzeComponentStructure,
  suggestRestructure,
  type ComponentStructureType,
  type DetectedComponent,
} from './component-structure.js';
import type { DetectionContext, ProjectContext } from '../base/index.js';

// ============================================================================
// Test Helpers
// ============================================================================

function createMockContext(
  file: string,
  files: string[],
  content: string = ''
): DetectionContext {
  const projectContext: ProjectContext = {
    rootDir: '/project',
    files,
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
    extension: '.tsx',
    isTestFile: false,
    isTypeDefinition: false,
  };
}

// ============================================================================
// Helper Function Tests
// ============================================================================

describe('getComponentFileType', () => {
  it('should identify component files', () => {
    expect(getComponentFileType('Button.tsx')).toBe('component');
    expect(getComponentFileType('Card.jsx')).toBe('component');
  });

  it('should identify styles files', () => {
    expect(getComponentFileType('Button.styles.ts')).toBe('styles');
    expect(getComponentFileType('Button.styles.tsx')).toBe('styles');
    expect(getComponentFileType('Button.module.css')).toBe('styles');
    expect(getComponentFileType('Button.module.scss')).toBe('styles');
    expect(getComponentFileType('Button.styled.ts')).toBe('styles');
    expect(getComponentFileType('Button.css')).toBe('styles');
  });

  it('should identify hooks files', () => {
    expect(getComponentFileType('Button.hooks.ts')).toBe('hooks');
    expect(getComponentFileType('useButton.ts')).toBe('hooks');
    expect(getComponentFileType('useAuth.tsx')).toBe('hooks');
  });

  it('should identify types files', () => {
    expect(getComponentFileType('Button.types.ts')).toBe('types');
    expect(getComponentFileType('Button.d.ts')).toBe('types');
  });

  it('should identify test files', () => {
    expect(getComponentFileType('Button.test.tsx')).toBe('test');
    expect(getComponentFileType('Button.spec.tsx')).toBe('test');
    expect(getComponentFileType('Button.test.ts')).toBe('test');
  });

  it('should identify stories files', () => {
    expect(getComponentFileType('Button.stories.tsx')).toBe('stories');
    expect(getComponentFileType('Button.stories.mdx')).toBe('stories');
  });

  it('should identify utils files', () => {
    expect(getComponentFileType('Button.utils.ts')).toBe('utils');
  });

  it('should identify constants files', () => {
    expect(getComponentFileType('Button.constants.ts')).toBe('constants');
  });

  it('should identify index files', () => {
    expect(getComponentFileType('index.ts')).toBe('index');
    expect(getComponentFileType('index.tsx')).toBe('index');
  });

  it('should return other for unrecognized files', () => {
    expect(getComponentFileType('README.md')).toBe('other');
    expect(getComponentFileType('config.json')).toBe('other');
  });
});

describe('extractComponentName', () => {
  it('should extract name from simple component file', () => {
    expect(extractComponentName('Button.tsx')).toBe('Button');
    expect(extractComponentName('Card.jsx')).toBe('Card');
  });

  it('should extract name from path', () => {
    expect(extractComponentName('src/components/Button.tsx')).toBe('Button');
    expect(extractComponentName('src/ui/Card.jsx')).toBe('Card');
  });

  it('should extract name from index file using parent folder', () => {
    expect(extractComponentName('src/components/Button/index.tsx')).toBe('Button');
    expect(extractComponentName('Button/index.tsx')).toBe('Button');
  });

  it('should handle files with suffixes', () => {
    expect(extractComponentName('Button.styles.ts')).toBe('Button');
    expect(extractComponentName('Button.hooks.ts')).toBe('Button');
    expect(extractComponentName('Button.test.tsx')).toBe('Button');
  });

  it('should handle Windows paths', () => {
    expect(extractComponentName('src\\components\\Button.tsx')).toBe('Button');
    expect(extractComponentName('Button\\index.tsx')).toBe('Button');
  });
});

describe('isComponentFile', () => {
  it('should return true for component files', () => {
    expect(isComponentFile('Button.tsx')).toBe(true);
    expect(isComponentFile('Card.jsx')).toBe(true);
    expect(isComponentFile('src/components/Button.tsx')).toBe(true);
  });

  it('should return false for non-component files', () => {
    expect(isComponentFile('Button.ts')).toBe(false);
    expect(isComponentFile('utils.js')).toBe(false);
    expect(isComponentFile('styles.css')).toBe(false);
  });

  it('should return false for test files', () => {
    expect(isComponentFile('Button.test.tsx')).toBe(false);
    expect(isComponentFile('Button.spec.tsx')).toBe(false);
  });

  it('should return false for stories files', () => {
    expect(isComponentFile('Button.stories.tsx')).toBe(false);
  });
});

describe('isComponentFolder', () => {
  it('should return true for PascalCase folders with component files', () => {
    const files = ['Button/index.tsx', 'Button/Button.styles.ts'];
    expect(isComponentFolder('Button', files)).toBe(true);
  });

  it('should return false for lowercase folders', () => {
    const files = ['button/index.tsx'];
    expect(isComponentFolder('button', files)).toBe(false);
  });

  it('should return false for folders without component files', () => {
    const files = ['Button/styles.css', 'Button/utils.ts'];
    expect(isComponentFolder('Button', files)).toBe(false);
  });
});

describe('getComponentFolderFiles', () => {
  it('should return direct children only', () => {
    const files = [
      'Button/index.tsx',
      'Button/Button.styles.ts',
      'Button/nested/Other.tsx',
      'Card/index.tsx',
    ];
    
    const result = getComponentFolderFiles('Button', files);
    expect(result).toHaveLength(2);
    expect(result).toContain('Button/index.tsx');
    expect(result).toContain('Button/Button.styles.ts');
    expect(result).not.toContain('Button/nested/Other.tsx');
  });

  it('should handle Windows paths', () => {
    const files = [
      'Button\\index.tsx',
      'Button\\Button.styles.ts',
    ];
    
    const result = getComponentFolderFiles('Button', files);
    expect(result).toHaveLength(2);
  });
});

describe('determineStructureType', () => {
  it('should detect folder-index pattern', () => {
    const result = determineStructureType('Button/index.tsx', ['Button/Button.styles.ts']);
    expect(result).toBe('folder-index');
  });

  it('should detect folder-named pattern', () => {
    const result = determineStructureType('Button/Button.tsx', ['Button/Button.styles.ts']);
    expect(result).toBe('folder-named');
  });

  it('should detect split-file pattern', () => {
    const result = determineStructureType('src/Button.tsx', ['src/Button.styles.ts', 'src/Button.hooks.ts']);
    expect(result).toBe('split-file');
  });

  it('should detect single-file pattern', () => {
    const result = determineStructureType('src/Button.tsx', []);
    expect(result).toBe('single-file');
  });
});

describe('findRelatedFiles', () => {
  it('should find related files in same directory', () => {
    const files = [
      'src/Button.tsx',
      'src/Button.styles.ts',
      'src/Button.hooks.ts',
      'src/Card.tsx',
    ];
    
    const result = findRelatedFiles('Button', 'src/Button.tsx', files);
    expect(result).toHaveLength(2);
    expect(result).toContain('src/Button.styles.ts');
    expect(result).toContain('src/Button.hooks.ts');
    expect(result).not.toContain('src/Card.tsx');
  });

  it('should not include files from other directories', () => {
    const files = [
      'src/Button.tsx',
      'src/Button.styles.ts',
      'other/Button.styles.ts',
    ];
    
    const result = findRelatedFiles('Button', 'src/Button.tsx', files);
    expect(result).toHaveLength(1);
    expect(result).toContain('src/Button.styles.ts');
  });
});

describe('detectComponents', () => {
  it('should detect folder-based components', () => {
    const files = [
      'src/components/Button/index.tsx',
      'src/components/Button/Button.styles.ts',
      'src/components/Card/Card.tsx',
      'src/components/Card/Card.styles.ts',
    ];
    
    const result = detectComponents(files);
    expect(result).toHaveLength(2);
    
    const button = result.find(c => c.name === 'Button');
    expect(button).toBeDefined();
    expect(button?.structureType).toBe('folder-index');
    
    const card = result.find(c => c.name === 'Card');
    expect(card).toBeDefined();
    expect(card?.structureType).toBe('folder-named');
  });

  it('should detect standalone components', () => {
    const files = [
      'src/components/Button.tsx',
      'src/components/Card.tsx',
    ];
    
    const result = detectComponents(files);
    expect(result).toHaveLength(2);
    expect(result.every(c => c.structureType === 'single-file')).toBe(true);
  });

  it('should detect split-file components', () => {
    const files = [
      'src/components/Button.tsx',
      'src/components/Button.styles.ts',
      'src/components/Button.hooks.ts',
    ];
    
    const result = detectComponents(files);
    expect(result).toHaveLength(1);
    expect(result[0]?.structureType).toBe('split-file');
    expect(result[0]?.files).toHaveLength(3);
  });

  it('should not detect non-PascalCase files as components', () => {
    const files = [
      'src/utils/helpers.tsx',
      'src/utils/formatters.tsx',
    ];
    
    const result = detectComponents(files);
    expect(result).toHaveLength(0);
  });
});

describe('analyzeComponentStructure', () => {
  it('should identify dominant pattern', () => {
    const files = [
      'src/components/Button/index.tsx',
      'src/components/Card/index.tsx',
      'src/components/Modal/index.tsx',
      'src/components/Alert.tsx', // Single file - minority
    ];
    
    const result = analyzeComponentStructure(files);
    expect(result.dominantType).toBe('folder-index');
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it('should identify inconsistent components', () => {
    const files = [
      'src/components/Button/index.tsx',
      'src/components/Card/index.tsx',
      'src/components/Alert.tsx', // Inconsistent
    ];
    
    const result = analyzeComponentStructure(files);
    expect(result.inconsistentComponents).toHaveLength(1);
    expect(result.inconsistentComponents[0]?.name).toBe('Alert');
  });

  it('should handle empty file list', () => {
    const result = analyzeComponentStructure([]);
    expect(result.dominantType).toBe('unknown');
    expect(result.confidence).toBe(0);
    expect(result.components).toHaveLength(0);
  });

  it('should count structure types correctly', () => {
    const files = [
      'src/components/Button/index.tsx',
      'src/components/Card/Card.tsx',
      'src/components/Alert.tsx',
    ];
    
    const result = analyzeComponentStructure(files);
    expect(result.typeCounts['folder-index']).toBe(1);
    expect(result.typeCounts['folder-named']).toBe(1);
    expect(result.typeCounts['single-file']).toBe(1);
  });
});

describe('suggestRestructure', () => {
  it('should suggest folder-index structure', () => {
    const component: DetectedComponent = {
      name: 'Button',
      structureType: 'single-file',
      files: [{ path: 'src/components/Button.tsx', componentName: 'Button', fileType: 'component', folderName: undefined, isMainFile: true }],
      mainFile: 'src/components/Button.tsx',
      folderPath: undefined,
    };
    
    const result = suggestRestructure(component, 'folder-index');
    expect(result).toBe('src/components/Button/index.tsx');
  });

  it('should suggest folder-named structure', () => {
    const component: DetectedComponent = {
      name: 'Button',
      structureType: 'single-file',
      files: [{ path: 'src/components/Button.tsx', componentName: 'Button', fileType: 'component', folderName: undefined, isMainFile: true }],
      mainFile: 'src/components/Button.tsx',
      folderPath: undefined,
    };
    
    const result = suggestRestructure(component, 'folder-named');
    expect(result).toBe('src/components/Button/Button.tsx');
  });

  it('should suggest single-file structure', () => {
    const component: DetectedComponent = {
      name: 'Button',
      structureType: 'folder-index',
      files: [{ path: 'src/components/Button/index.tsx', componentName: 'Button', fileType: 'index', folderName: 'Button', isMainFile: true }],
      mainFile: 'src/components/Button/index.tsx',
      folderPath: 'src/components/Button',
    };
    
    const result = suggestRestructure(component, 'single-file');
    expect(result).toBe('src/components/Button/Button.tsx');
  });

  it('should return same path if already matching target', () => {
    const component: DetectedComponent = {
      name: 'Button',
      structureType: 'folder-index',
      files: [{ path: 'src/components/Button/index.tsx', componentName: 'Button', fileType: 'index', folderName: 'Button', isMainFile: true }],
      mainFile: 'src/components/Button/index.tsx',
      folderPath: 'src/components/Button',
    };
    
    const result = suggestRestructure(component, 'folder-index');
    expect(result).toBe('src/components/Button/index.tsx');
  });
});

// ============================================================================
// Detector Class Tests
// ============================================================================

describe('ComponentStructureDetector', () => {
  let detector: ComponentStructureDetector;

  beforeEach(() => {
    detector = createComponentStructureDetector();
  });

  describe('metadata', () => {
    it('should have correct id', () => {
      expect(detector.id).toBe('components/component-structure');
    });

    it('should have correct category', () => {
      expect(detector.category).toBe('components');
    });

    it('should have correct subcategory', () => {
      expect(detector.subcategory).toBe('file-structure');
    });

    it('should support typescript and javascript', () => {
      expect(detector.supportedLanguages).toContain('typescript');
      expect(detector.supportedLanguages).toContain('javascript');
    });

    it('should use structural detection method', () => {
      expect(detector.detectionMethod).toBe('structural');
    });
  });

  describe('detect', () => {
    it('should detect dominant pattern', async () => {
      const files = [
        'src/components/Button/index.tsx',
        'src/components/Card/index.tsx',
        'src/components/Modal/index.tsx',
      ];
      
      const context = createMockContext('src/components/Button/index.tsx', files);
      const result = await detector.detect(context);
      
      expect(result.patterns.length).toBeGreaterThan(0);
      expect(result.patterns.some(p => p.patternId === 'component-structure-folder-index')).toBe(true);
    });

    it('should detect violations for inconsistent components', async () => {
      const files = [
        'src/components/Button/index.tsx',
        'src/components/Card/index.tsx',
        'src/components/Alert.tsx', // Inconsistent
      ];
      
      const context = createMockContext('src/components/Alert.tsx', files);
      const result = await detector.detect(context);
      
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.violations[0]?.message).toContain('Alert');
    });

    it('should not report violations for consistent components', async () => {
      const files = [
        'src/components/Button/index.tsx',
        'src/components/Card/index.tsx',
      ];
      
      const context = createMockContext('src/components/Button/index.tsx', files);
      const result = await detector.detect(context);
      
      expect(result.violations).toHaveLength(0);
    });

    it('should handle empty project', async () => {
      const context = createMockContext('src/App.tsx', []);
      const result = await detector.detect(context);
      
      expect(result.patterns).toHaveLength(0);
      expect(result.violations).toHaveLength(0);
    });

    it('should return confidence based on pattern consistency', async () => {
      const files = [
        'src/components/Button/index.tsx',
        'src/components/Card/index.tsx',
        'src/components/Modal/index.tsx',
      ];
      
      const context = createMockContext('src/components/Button/index.tsx', files);
      const result = await detector.detect(context);
      
      expect(result.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('generateQuickFix', () => {
    it('should generate quick fix for restructure violation', () => {
      const violation = {
        id: 'test-violation',
        patternId: 'components/component-structure',
        severity: 'warning' as const,
        file: 'src/components/Alert.tsx',
        range: { start: { line: 1, character: 1 }, end: { line: 1, character: 1 } },
        message: "Component 'Alert' uses single file but project uses folder with index. Consider restructure to 'src/components/Alert/index.tsx'",
        expected: 'folder with index',
        actual: 'single file',
        aiExplainAvailable: true,
        aiFixAvailable: false,
        firstSeen: new Date(),
        occurrences: 1,
      };
      
      const fix = detector.generateQuickFix(violation);
      
      expect(fix).not.toBeNull();
      expect(fix?.title).toContain('Move to');
      expect(fix?.kind).toBe('refactor');
    });

    it('should return null for violations without restructure suggestion', () => {
      const violation = {
        id: 'test-violation',
        patternId: 'components/component-structure',
        severity: 'warning' as const,
        file: 'src/components/Alert.tsx',
        range: { start: { line: 1, character: 1 }, end: { line: 1, character: 1 } },
        message: 'Some other message without restructure suggestion',
        expected: 'folder with index',
        actual: 'single file',
        aiExplainAvailable: true,
        aiFixAvailable: false,
        firstSeen: new Date(),
        occurrences: 1,
      };
      
      const fix = detector.generateQuickFix(violation);
      
      expect(fix).toBeNull();
    });
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('ComponentStructureDetector Integration', () => {
  let detector: ComponentStructureDetector;

  beforeEach(() => {
    detector = createComponentStructureDetector();
  });

  it('should handle real-world project structure', async () => {
    const files = [
      // Folder-index pattern (dominant)
      'src/components/Button/index.tsx',
      'src/components/Button/Button.styles.ts',
      'src/components/Button/Button.test.tsx',
      'src/components/Card/index.tsx',
      'src/components/Card/Card.styles.ts',
      'src/components/Modal/index.tsx',
      'src/components/Modal/Modal.hooks.ts',
      // Inconsistent single-file
      'src/components/Alert.tsx',
      // Non-component files (should be ignored)
      'src/utils/helpers.ts',
      'src/hooks/useAuth.ts',
    ];
    
    const context = createMockContext('src/components/Alert.tsx', files);
    const result = await detector.detect(context);
    
    // Should detect folder-index as dominant
    expect(result.patterns.some(p => p.patternId === 'component-structure-folder-index')).toBe(true);
    
    // Should flag Alert as inconsistent
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations[0]?.message).toContain('Alert');
  });

  it('should handle mixed folder patterns', async () => {
    const files = [
      'src/components/Button/Button.tsx', // folder-named
      'src/components/Card/index.tsx',     // folder-index
      'src/components/Modal/Modal.tsx',    // folder-named
    ];
    
    const context = createMockContext('src/components/Button/Button.tsx', files);
    const result = await detector.detect(context);
    
    // Should detect both patterns
    expect(result.patterns.some(p => p.patternId.includes('folder-named'))).toBe(true);
    expect(result.patterns.some(p => p.patternId.includes('folder-index'))).toBe(true);
  });

  it('should handle split-file pattern detection', async () => {
    const files = [
      'src/components/Button.tsx',
      'src/components/Button.styles.ts',
      'src/components/Button.hooks.ts',
      'src/components/Card.tsx',
      'src/components/Card.styles.ts',
    ];
    
    const context = createMockContext('src/components/Button.tsx', files);
    const result = await detector.detect(context);
    
    // Should detect split-file pattern
    expect(result.patterns.some(p => p.patternId.includes('split-file'))).toBe(true);
  });
});
