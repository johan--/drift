/**
 * C++ Error Handling Detectors
 *
 * Exports all C++ error handling pattern detectors.
 *
 * @license Apache-2.0
 */

export {
  detectCppErrorPatterns,
  hasCppErrorHandling,
  detectErrorStyle,
  type CppErrorPattern,
  type CppErrorType,
  type CppErrorDetectorOptions,
  type CppErrorDetectionResult,
  type CppCustomException,
  type CppErrorIssue,
  type CppErrorStats,
} from './error-handling-detector.js';
