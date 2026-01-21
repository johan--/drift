/**
 * ASP.NET Core Logging Detectors
 *
 * C#-specific logging pattern detectors.
 */

// ============================================================================
// Regex-Based Detectors (Legacy)
// ============================================================================

export {
  ILoggerPatternsDetector,
  createILoggerPatternsDetector,
  type ILoggerPatternInfo,
  type ILoggerAnalysis,
} from './ilogger-patterns-detector.js';

// ============================================================================
// Semantic Detectors (Learning-Based)
// ============================================================================

export {
  ILoggerPatternsSemanticDetector,
  createILoggerPatternsSemanticDetector,
} from './ilogger-patterns-semantic.js';
