/**
 * Security detectors module exports
 *
 * Detects security patterns including:
 * - Input sanitization
 * - SQL injection prevention
 * - XSS prevention
 * - CSRF protection
 * - CSP headers
 * - Secret management
 * - Rate limiting
 *
 * @requirements 16 - Security pattern detection
 */

import { createInputSanitizationDetector } from './input-sanitization.js';
import { createSQLInjectionDetector } from './sql-injection.js';
import { createXSSPreventionDetector } from './xss-prevention.js';
import { createCSRFProtectionDetector } from './csrf-protection.js';
import { createCSPHeadersDetector } from './csp-headers.js';
import { createSecretManagementDetector } from './secret-management.js';
import { createRateLimitingDetector } from './rate-limiting.js';

// Input Sanitization
export {
  InputSanitizationDetector,
  createInputSanitizationDetector,
  analyzeInputSanitization,
  shouldExcludeFile as shouldExcludeInputSanitizationFile,
} from './input-sanitization.js';
export type {
  InputSanitizationPatternType,
  InputSanitizationViolationType,
  InputSanitizationPatternInfo,
  InputSanitizationViolationInfo,
  InputSanitizationAnalysis,
} from './input-sanitization.js';

// SQL Injection
export {
  SQLInjectionDetector,
  createSQLInjectionDetector,
  analyzeSQLInjection,
  detectParameterizedQueries,
  detectPreparedStatements,
  detectORMQueries,
  detectQueryBuilders,
  detectEscapeFunctions,
  detectTaggedTemplates,
  detectStringConcatViolations,
  detectTemplateLiteralViolations,
  detectRawSQLViolations,
  shouldExcludeFile as shouldExcludeSQLInjectionFile,
  PARAMETERIZED_QUERY_PATTERNS,
  PREPARED_STATEMENT_PATTERNS,
  ORM_QUERY_PATTERNS,
  QUERY_BUILDER_PATTERNS,
  ESCAPE_FUNCTION_PATTERNS,
  TAGGED_TEMPLATE_PATTERNS,
  STRING_CONCAT_VIOLATION_PATTERNS,
  TEMPLATE_LITERAL_VIOLATION_PATTERNS,
  RAW_SQL_WITH_INPUT_PATTERNS,
} from './sql-injection.js';
export type {
  SQLInjectionPatternType,
  SQLInjectionViolationType,
  SQLInjectionPatternInfo,
  SQLInjectionViolationInfo,
  SQLInjectionAnalysis,
} from './sql-injection.js';

// XSS Prevention
export {
  XSSPreventionDetector,
  createXSSPreventionDetector,
  analyzeXSSPrevention,
  shouldExcludeFile as shouldExcludeXSSFile,
} from './xss-prevention.js';
export type {
  XSSPreventionPatternType,
  XSSViolationType,
  XSSPreventionPatternInfo,
  XSSViolationInfo,
  XSSPreventionAnalysis,
} from './xss-prevention.js';

// CSRF Protection
export {
  CSRFProtectionDetector,
  createCSRFProtectionDetector,
  analyzeCSRFProtection,
  shouldExcludeFile as shouldExcludeCSRFFile,
} from './csrf-protection.js';
export type {
  CSRFProtectionPatternType,
  CSRFViolationType,
  CSRFProtectionPatternInfo,
  CSRFViolationInfo,
  CSRFProtectionAnalysis,
} from './csrf-protection.js';

// CSP Headers
export {
  CSPHeadersDetector,
  createCSPHeadersDetector,
  analyzeCSPHeaders,
  shouldExcludeFile as shouldExcludeCSPFile,
} from './csp-headers.js';
export type {
  CSPHeaderPatternType,
  CSPViolationType,
  CSPHeaderPatternInfo,
  CSPViolationInfo,
  CSPHeaderAnalysis,
} from './csp-headers.js';

// Secret Management
export {
  SecretManagementDetector,
  createSecretManagementDetector,
  analyzeSecretManagement,
  shouldExcludeFile as shouldExcludeSecretFile,
} from './secret-management.js';
export type {
  SecretPatternType,
  SecretViolationType,
  SecretPatternInfo,
  SecretViolationInfo,
  SecretManagementAnalysis,
} from './secret-management.js';

// Rate Limiting
export {
  RateLimitingDetector,
  createRateLimitingDetector,
  analyzeRateLimiting,
  shouldExcludeFile as shouldExcludeRateLimitFile,
} from './rate-limiting.js';
export type {
  RateLimitPatternType,
  RateLimitViolationType,
  RateLimitPatternInfo,
  RateLimitViolationInfo,
  RateLimitAnalysis,
} from './rate-limiting.js';

// Factory function to create all security detectors
export function createSecurityDetectors() {
  return [
    createInputSanitizationDetector(),
    createSQLInjectionDetector(),
    createXSSPreventionDetector(),
    createCSRFProtectionDetector(),
    createCSPHeadersDetector(),
    createSecretManagementDetector(),
    createRateLimitingDetector(),
  ];
}
