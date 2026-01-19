/**
 * Base detector module exports
 *
 * @requirements 6.1 - THE Detector_System SHALL define a BaseDetector interface that all detectors implement
 * @requirements 6.4 - THE Detector_System SHALL support detection methods: ast, regex, semantic, structural, and custom
 */

// Export base detector class and related types
export {
  BaseDetector,
  isBaseDetector,
  type DetectionContext,
  type DetectionResult,
  type DetectionMetadata,
  type ImportInfo,
  type ExportInfo,
  type ProjectContext,
  type DetectorFactory,
  type DetectorOptions,
} from './base-detector.js';

// Export AST detector class and related types
export {
  ASTDetector,
  isASTDetector,
  type ASTPattern,
  type ASTMatchResult,
  type TraversalOptions,
  type ASTVisitor,
} from './ast-detector.js';

// Export Regex detector class and related types
export {
  RegexDetector,
  isRegexDetector,
  type RegexMatch,
  type LineMatch,
  type CaptureResult,
  type PatternLocation,
  type RegexMatchOptions,
} from './regex-detector.js';

// Export Structural detector class and related types
export {
  StructuralDetector,
  isStructuralDetector,
  type NamingConvention,
  type NamingConventionResult,
  type PathMatchResult,
  type PathInfo,
  type PathMatchOptions,
} from './structural-detector.js';

// Export types from types.ts (for backward compatibility)
export * from './types.js';
