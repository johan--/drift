/**
 * Deprecation Detector - Deprecation pattern detection
 * @requirements 21.4 - Deprecation patterns
 */

import type { Violation, QuickFix, PatternCategory, Language } from '@drift/core';
import { RegexDetector } from '../base/regex-detector.js';
import type { DetectionContext, DetectionResult } from '../base/base-detector.js';

export type DeprecationPatternType = 'jsdoc-deprecated' | 'decorator-deprecated' | 'console-warn' | 'deprecation-notice' | 'legacy-marker';
export type DeprecationViolationType = 'missing-alternative' | 'missing-removal-date';

export interface DeprecationPatternInfo { type: DeprecationPatternType; file: string; line: number; column: number; matchedText: string; alternative?: string | undefined; context?: string | undefined; }
export interface DeprecationViolationInfo { type: DeprecationViolationType; file: string; line: number; column: number; matchedText: string; issue: string; suggestedFix?: string | undefined; severity: 'high' | 'medium' | 'low'; }
export interface DeprecationAnalysis { patterns: DeprecationPatternInfo[]; violations: DeprecationViolationInfo[]; deprecatedCount: number; hasAlternatives: boolean; confidence: number; }

export const JSDOC_DEPRECATED_PATTERNS = [/@deprecated/gi, /\*\s*@deprecated\s+(.+)/g] as const;
export const DECORATOR_DEPRECATED_PATTERNS = [/@Deprecated\s*\(/g, /@deprecated\s*\(/g] as const;
export const CONSOLE_WARN_PATTERNS = [/console\.warn\s*\([^)]*deprecat/gi, /console\.warn\s*\([^)]*will be removed/gi] as const;
export const DEPRECATION_NOTICE_PATTERNS = [/DEPRECATED/g, /deprecated/g, /will be removed/gi, /no longer supported/gi] as const;
export const LEGACY_MARKER_PATTERNS = [/legacy/gi, /old\s+api/gi, /v1\s+api/gi] as const;

export function shouldExcludeFile(filePath: string): boolean {
  return [/\.test\.[jt]sx?$/, /\.spec\.[jt]sx?$/, /__tests__\//, /node_modules\//, /\.min\.[jt]s$/].some((p) => p.test(filePath));
}

function detectPatterns(content: string, filePath: string, patterns: readonly RegExp[], type: DeprecationPatternType): DeprecationPatternInfo[] {
  const results: DeprecationPatternInfo[] = [];
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    for (const pattern of patterns) {
      const regex = new RegExp(pattern.source, pattern.flags);
      let match;
      while ((match = regex.exec(line)) !== null) {
        const altMatch = line.match(/use\s+(\w+)\s+instead/i) || line.match(/replaced\s+by\s+(\w+)/i);
        results.push({ type, file: filePath, line: i + 1, column: match.index + 1, matchedText: match[0], alternative: altMatch ? altMatch[1] : undefined, context: line.trim() });
      }
    }
  }
  return results;
}

export function detectJsdocDeprecated(content: string, filePath: string): DeprecationPatternInfo[] { return detectPatterns(content, filePath, JSDOC_DEPRECATED_PATTERNS, 'jsdoc-deprecated'); }
export function detectDecoratorDeprecated(content: string, filePath: string): DeprecationPatternInfo[] { return detectPatterns(content, filePath, DECORATOR_DEPRECATED_PATTERNS, 'decorator-deprecated'); }
export function detectConsoleWarn(content: string, filePath: string): DeprecationPatternInfo[] { return detectPatterns(content, filePath, CONSOLE_WARN_PATTERNS, 'console-warn'); }
export function detectDeprecationNotice(content: string, filePath: string): DeprecationPatternInfo[] { return detectPatterns(content, filePath, DEPRECATION_NOTICE_PATTERNS, 'deprecation-notice'); }
export function detectLegacyMarker(content: string, filePath: string): DeprecationPatternInfo[] { return detectPatterns(content, filePath, LEGACY_MARKER_PATTERNS, 'legacy-marker'); }

export function analyzeDeprecation(content: string, filePath: string): DeprecationAnalysis {
  if (shouldExcludeFile(filePath)) return { patterns: [], violations: [], deprecatedCount: 0, hasAlternatives: false, confidence: 1.0 };
  const patterns: DeprecationPatternInfo[] = [...detectJsdocDeprecated(content, filePath), ...detectDecoratorDeprecated(content, filePath), ...detectConsoleWarn(content, filePath), ...detectDeprecationNotice(content, filePath), ...detectLegacyMarker(content, filePath)];
  const violations: DeprecationViolationInfo[] = [];
  const deprecatedCount = patterns.length;
  const hasAlternatives = patterns.some((p) => p.alternative);
  let confidence = 0.7; if (patterns.length > 0) confidence += 0.2; confidence = Math.min(confidence, 0.95);
  return { patterns, violations, deprecatedCount, hasAlternatives, confidence };
}

export class DeprecationDetector extends RegexDetector {
  readonly id = 'documentation/deprecation';
  readonly name = 'Deprecation Detector';
  readonly description = 'Detects deprecation patterns and notices';
  readonly category: PatternCategory = 'documentation';
  readonly subcategory = 'deprecation';
  readonly supportedLanguages: Language[] = ['typescript', 'javascript'];

  async detect(context: DetectionContext): Promise<DetectionResult> {
    if (!this.supportsLanguage(context.language)) return this.createEmptyResult();
    const analysis = analyzeDeprecation(context.content, context.file);
    if (analysis.patterns.length === 0 && analysis.violations.length === 0) return this.createEmptyResult();
    return this.createResult([], [], analysis.confidence, { custom: { patterns: analysis.patterns, violations: analysis.violations, deprecatedCount: analysis.deprecatedCount, hasAlternatives: analysis.hasAlternatives } });
  }

  generateQuickFix(_violation: Violation): QuickFix | null { return null; }
}

export function createDeprecationDetector(): DeprecationDetector { return new DeprecationDetector(); }
