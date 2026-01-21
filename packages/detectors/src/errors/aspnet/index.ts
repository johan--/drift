/**
 * ASP.NET Core Error Handling Detectors
 *
 * C#-specific error handling pattern detectors.
 */

// ============================================================================
// Regex-Based Detectors (Legacy)
// ============================================================================

export {
  ExceptionPatternsDetector,
  createExceptionPatternsDetector,
  type ExceptionPatternInfo,
  type ExceptionAnalysis,
} from './exception-patterns-detector.js';

export {
  ResultPatternDetector,
  createResultPatternDetector,
  type ResultPatternInfo,
  type ResultPatternAnalysis,
} from './result-pattern-detector.js';

// ============================================================================
// Semantic Detectors (Learning-Based)
// ============================================================================

export {
  ExceptionPatternsSemanticDetector,
  createExceptionPatternsSemanticDetector,
} from './exception-patterns-semantic.js';

export {
  ResultPatternSemanticDetector,
  createResultPatternSemanticDetector,
} from './result-pattern-semantic.js';
