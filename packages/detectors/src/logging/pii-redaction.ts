/**
 * PII Redaction Detector - PII redaction pattern detection
 *
 * Detects PII redaction patterns including:
 * - Sensitive field masking
 * - Redaction utilities
 * - Data sanitization
 *
 * @requirements 15.5 - PII redaction patterns
 */

import type { Violation, QuickFix, PatternCategory, Language } from '@drift/core';
import { RegexDetector } from '../base/regex-detector.js';
import type { DetectionContext, DetectionResult } from '../base/base-detector.js';

// ============================================================================
// Types
// ============================================================================

export type PIIRedactionPatternType =
  | 'redact-function'
  | 'mask-function'
  | 'sanitize-function'
  | 'sensitive-field'
  | 'redaction-config';

export interface PIIRedactionPatternInfo {
  type: PIIRedactionPatternType;
  line: number;
  column: number;
  match: string;
}

export interface PIIRedactionAnalysis {
  patterns: PIIRedactionPatternInfo[];
  hasRedaction: boolean;
  hasSensitiveFields: boolean;
}

// ============================================================================
// Patterns
// ============================================================================

export const REDACT_FUNCTION_PATTERNS = [
  /redact\s*\(/gi,
  /redactPII\s*\(/gi,
  /redactSensitive\s*\(/gi,
];

export const MASK_FUNCTION_PATTERNS = [
  /mask\s*\(/gi,
  /maskEmail\s*\(/gi,
  /maskPhone\s*\(/gi,
  /maskSSN\s*\(/gi,
  /maskCreditCard\s*\(/gi,
];

export const SANITIZE_FUNCTION_PATTERNS = [
  /sanitize\s*\(/gi,
  /sanitizeLog\s*\(/gi,
  /sanitizeData\s*\(/gi,
];

export const SENSITIVE_FIELD_PATTERNS = [
  /password\s*[=:]/gi,
  /ssn\s*[=:]/gi,
  /creditCard\s*[=:]/gi,
  /socialSecurity\s*[=:]/gi,
  /secret\s*[=:]/gi,
  /apiKey\s*[=:]/gi,
];

export const REDACTION_CONFIG_PATTERNS = [
  /redactPaths\s*[=:]/gi,
  /sensitiveFields\s*[=:]/gi,
  /redactionRules\s*[=:]/gi,
];

// ============================================================================
// Analysis Functions
// ============================================================================

export function shouldExcludeFile(filePath: string): boolean {
  const excludePatterns = [
    /\.test\.[jt]sx?$/,
    /\.spec\.[jt]sx?$/,
    /__tests__\//,
    /\.d\.ts$/,
    /node_modules\//,
  ];
  return excludePatterns.some((p) => p.test(filePath));
}

function detectPatterns(
  content: string,
  patterns: RegExp[],
  type: PIIRedactionPatternType
): PIIRedactionPatternInfo[] {
  const results: PIIRedactionPatternInfo[] = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    for (const pattern of patterns) {
      const regex = new RegExp(pattern.source, pattern.flags);
      let match;
      while ((match = regex.exec(line)) !== null) {
        results.push({
          type,
          line: i + 1,
          column: match.index + 1,
          match: match[0],
        });
      }
    }
  }

  return results;
}

export function analyzePIIRedaction(content: string, filePath: string): PIIRedactionAnalysis {
  if (shouldExcludeFile(filePath)) {
    return {
      patterns: [],
      hasRedaction: false,
      hasSensitiveFields: false,
    };
  }

  const patterns: PIIRedactionPatternInfo[] = [
    ...detectPatterns(content, REDACT_FUNCTION_PATTERNS, 'redact-function'),
    ...detectPatterns(content, MASK_FUNCTION_PATTERNS, 'mask-function'),
    ...detectPatterns(content, SANITIZE_FUNCTION_PATTERNS, 'sanitize-function'),
    ...detectPatterns(content, SENSITIVE_FIELD_PATTERNS, 'sensitive-field'),
    ...detectPatterns(content, REDACTION_CONFIG_PATTERNS, 'redaction-config'),
  ];

  const hasRedaction = patterns.some(
    (p) =>
      p.type === 'redact-function' ||
      p.type === 'mask-function' ||
      p.type === 'sanitize-function'
  );
  const hasSensitiveFields = patterns.some((p) => p.type === 'sensitive-field');

  return {
    patterns,
    hasRedaction,
    hasSensitiveFields,
  };
}

// ============================================================================
// Detector Class
// ============================================================================

export class PIIRedactionDetector extends RegexDetector {
  readonly id = 'logging/pii-redaction';
  readonly name = 'PII Redaction Detector';
  readonly description = 'Detects PII redaction patterns';
  readonly category: PatternCategory = 'logging';
  readonly subcategory = 'pii-redaction';
  readonly supportedLanguages: Language[] = ['typescript', 'javascript'];

  async detect(context: DetectionContext): Promise<DetectionResult> {
    if (!this.supportsLanguage(context.language)) {
      return this.createEmptyResult();
    }

    const analysis = analyzePIIRedaction(context.content, context.file);

    if (analysis.patterns.length === 0) {
      return this.createEmptyResult();
    }

    const confidence = 0.9;
    return this.createResult([], [], confidence, {
      custom: {
        patterns: analysis.patterns,
        hasRedaction: analysis.hasRedaction,
        hasSensitiveFields: analysis.hasSensitiveFields,
      },
    });
  }

  generateQuickFix(_violation: Violation): QuickFix | null {
    return null;
  }
}

export function createPIIRedactionDetector(): PIIRedactionDetector {
  return new PIIRedactionDetector();
}
