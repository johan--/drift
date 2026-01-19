/**
 * Structural detectors module exports
 *
 * Detects file organization and structure patterns.
 *
 * @requirements 7.1 - THE Structural_Detector SHALL detect file naming conventions
 * @requirements 7.2 - THE Structural_Detector SHALL detect directory structure patterns
 * @requirements 7.3 - THE Structural_Detector SHALL detect co-location patterns
 * @requirements 7.4 - THE Structural_Detector SHALL detect barrel/index file usage patterns
 * @requirements 7.5 - THE Structural_Detector SHALL detect import ordering and grouping patterns
 * @requirements 7.6 - THE Structural_Detector SHALL detect module boundary violations
 * @requirements 7.7 - THE Structural_Detector SHALL detect circular dependencies
 * @requirements 7.8 - THE Structural_Detector SHALL detect package boundary violations in monorepos
 */

export * from './file-naming.js';

// Re-export directory-structure with explicit names to avoid conflicts
export {
  isLayerDirectory,
  isFeatureContainer,
  extractDirectories as extractDirectoryInfo,
  detectLayerBasedStructure,
  detectFeatureBasedStructure,
  analyzeDirectoryStructure,
  detectDirectoryPatterns,
  DirectoryStructureDetector,
  createDirectoryStructureDetector,
  LAYER_DIRECTORIES,
  FEATURE_DIRECTORIES,
  type DirectoryOrganization,
  type DirectoryInfo,
  type DirectoryStructureAnalysis,
  type DirectoryPattern,
} from './directory-structure.js';

// Re-export co-location with explicit names to avoid conflicts
export {
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
  createCoLocationDetector,
  TEST_FILE_PATTERNS,
  TEST_DIRECTORIES,
  STYLE_FILE_PATTERNS,
  STYLE_DIRECTORIES,
  getFileDirectory as getCoLocationFileDirectory,
  type CoLocationPattern,
  type TestFileInfo,
  type StyleFileInfo,
  type TestCoLocationAnalysis,
  type StyleCoLocationAnalysis,
  type CoLocationAnalysis,
} from './co-location.js';

// Re-export barrel-exports with explicit names to avoid conflicts
export {
  isBarrelFile,
  getFileDirectory as getBarrelFileDirectory,
  getFileName,
  shouldDirectoryHaveBarrel,
  parseExportPatterns,
  analyzeBarrelFile,
  extractDirectories as extractBarrelDirectories,
  analyzeBarrelPatterns,
  checkDirectoryNeedsBarrel,
  BarrelExportsDetector,
  createBarrelExportsDetector,
  BARREL_FILE_NAMES,
  BARREL_EXPECTED_DIRECTORIES,
  type BarrelPattern,
  type ExportType,
  type BarrelFileInfo,
  type DirectoryBarrelInfo,
  type BarrelAnalysis,
  type ExportPattern,
} from './barrel-exports.js';

export * from './import-ordering.js';
export * from './module-boundaries.js';
export * from './circular-deps.js';
export * from './package-boundaries.js';
