/**
 * ASP.NET Core Data Access Detectors
 *
 * C#-specific data access pattern detectors.
 * 
 * This module exports both legacy regex-based detectors and new semantic learning detectors.
 * The semantic versions (with -semantic suffix) are recommended for new usage as they:
 * - Learn patterns from your codebase rather than using fixed regex
 * - Provide better context-aware filtering to reduce false positives
 * - Support pattern consistency checking and violation detection
 */

// ============================================================================
// Legacy Regex-Based Detectors (kept for backward compatibility)
// ============================================================================

export {
  EfCorePatternsDetector,
  createEfCorePatternsDetector,
  type EfCorePatternInfo,
  type EfCoreAnalysis,
} from './efcore-patterns-detector.js';

export {
  RepositoryPatternDetector,
  createRepositoryPatternDetector,
  type RepositoryPatternInfo,
  type RepositoryAnalysis,
} from './repository-pattern-detector.js';

// ============================================================================
// Semantic Learning Detectors (recommended)
// ============================================================================

export {
  EfCorePatternsSemanticDetector,
  createEfCorePatternsSemanticDetector,
} from './efcore-patterns-semantic.js';

export {
  RepositoryPatternSemanticDetector,
  createRepositoryPatternSemanticDetector,
} from './repository-pattern-semantic.js';
