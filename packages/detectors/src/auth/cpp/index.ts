/**
 * C++ Auth Detectors
 *
 * Exports all C++ authentication and authorization pattern detectors.
 *
 * @license Apache-2.0
 */

export {
  detectCppAuthPatterns,
  hasCppAuthPatterns,
  type CppAuthPattern,
  type CppAuthType,
  type CppAuthDetectorOptions,
  type CppAuthDetectionResult,
  type CppAuthIssue,
} from './middleware-detector.js';
