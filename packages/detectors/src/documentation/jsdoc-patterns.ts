/**
 * JSDoc Patterns Detector - JSDoc documentation pattern detection
 * @requirements 21.1 - JSDoc patterns
 */

import type { Violation, QuickFix, PatternCategory, Language } from '@drift/core';
import { RegexDetector } from '../base/regex-detector.js';
import type { DetectionContext, DetectionResult } from '../base/base-detector.js';

export type JsdocPatternType = 'jsdoc-block' | 'param-tag' | 'returns-tag' | 'example-tag' | 'deprecated-tag' | 'see-tag' | 'throws-tag' | 'type-tag';
export type JsdocViolationType = 'missing-jsdoc' | 'incomplete-jsdoc' | 'outdated-jsdoc';

export interface JsdocPatternInfo { type: JsdocPatternType; file: string; line: number; column: number; matchedText: string; context?: string | undefined; }
export interface JsdocViolationInfo { type: JsdocViolationType; file: string; line: number; column: number; matchedText: string; issue: string; suggestedFix?: string | undefined; severity: 'high' | 'medium' | 'low'; }
export interface JsdocAnalysis { patterns: JsdocPatternInfo[]; violations: JsdocViolationInfo[]; jsdocBlockCount: number; paramTagCount: number; hasExamples: boolean; confidence: number; }

export const JSDOC_BLOCK_PATTERNS = [/\/\*\*[\s\S]*?\*\//g] as const;
export const PARAM_TAG_PATTERNS = [/@param\s+\{[^}]+\}\s+\w+/g, /@param\s+\w+/g] as const;
export const RETURNS_TAG_PATTERNS = [/@returns?\s+\{[^}]+\}/g, /@returns?\s+\w+/g] as const;
export const EXAMPLE_TAG_PATTERNS = [/@example/g] as const;
export const DEPRECATED_TAG_PATTERNS = [/@deprecated/g] as const;
export const SEE_TAG_PATTERNS = [/@see\s+/g] as const;
export const THROWS_TAG_PATTERNS = [/@throws?\s+\{[^}]+\}/g] as const;
export const TYPE_TAG_PATTERNS = [/@type\s+\{[^}]+\}/g] as const;
export const MISSING_JSDOC_PATTERNS = [/^export\s+(?:async\s+)?function\s+\w+/gm, /^export\s+class\s+\w+/gm] as const;

export function shouldExcludeFile(filePath: string): boolean {
  return [/\.test\.[jt]sx?$/, /\.spec\.[jt]sx?$/, /__tests__\//, /node_modules\//, /\.min\.[jt]s$/, /\.d\.ts$/].some((p) => p.test(filePath));
}

function detectPatterns(content: string, filePath: string, patterns: readonly RegExp[], type: JsdocPatternType): JsdocPatternInfo[] {
  const results: JsdocPatternInfo[] = [];
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    for (const pattern of patterns) {
      const regex = new RegExp(pattern.source, pattern.flags);
      let match;
      while ((match = regex.exec(line)) !== null) {
        results.push({ type, file: filePath, line: i + 1, column: match.index + 1, matchedText: match[0].slice(0, 50), context: line.trim() });
      }
    }
  }
  return results;
}

export function detectJsdocBlock(content: string, filePath: string): JsdocPatternInfo[] { return detectPatterns(content, filePath, JSDOC_BLOCK_PATTERNS, 'jsdoc-block'); }
export function detectParamTag(content: string, filePath: string): JsdocPatternInfo[] { return detectPatterns(content, filePath, PARAM_TAG_PATTERNS, 'param-tag'); }
export function detectReturnsTag(content: string, filePath: string): JsdocPatternInfo[] { return detectPatterns(content, filePath, RETURNS_TAG_PATTERNS, 'returns-tag'); }
export function detectExampleTag(content: string, filePath: string): JsdocPatternInfo[] { return detectPatterns(content, filePath, EXAMPLE_TAG_PATTERNS, 'example-tag'); }
export function detectDeprecatedTag(content: string, filePath: string): JsdocPatternInfo[] { return detectPatterns(content, filePath, DEPRECATED_TAG_PATTERNS, 'deprecated-tag'); }
export function detectSeeTag(content: string, filePath: string): JsdocPatternInfo[] { return detectPatterns(content, filePath, SEE_TAG_PATTERNS, 'see-tag'); }
export function detectThrowsTag(content: string, filePath: string): JsdocPatternInfo[] { return detectPatterns(content, filePath, THROWS_TAG_PATTERNS, 'throws-tag'); }
export function detectTypeTag(content: string, filePath: string): JsdocPatternInfo[] { return detectPatterns(content, filePath, TYPE_TAG_PATTERNS, 'type-tag'); }

export function analyzeJsdocPatterns(content: string, filePath: string): JsdocAnalysis {
  if (shouldExcludeFile(filePath)) return { patterns: [], violations: [], jsdocBlockCount: 0, paramTagCount: 0, hasExamples: false, confidence: 1.0 };
  const patterns: JsdocPatternInfo[] = [...detectJsdocBlock(content, filePath), ...detectParamTag(content, filePath), ...detectReturnsTag(content, filePath), ...detectExampleTag(content, filePath), ...detectDeprecatedTag(content, filePath), ...detectSeeTag(content, filePath), ...detectThrowsTag(content, filePath), ...detectTypeTag(content, filePath)];
  const violations: JsdocViolationInfo[] = [];
  const jsdocBlockCount = patterns.filter((p) => p.type === 'jsdoc-block').length;
  const paramTagCount = patterns.filter((p) => p.type === 'param-tag').length;
  const hasExamples = patterns.some((p) => p.type === 'example-tag');
  let confidence = 0.7; if (patterns.length > 0) confidence += 0.15; if (hasExamples) confidence += 0.1; confidence = Math.min(confidence, 0.95);
  return { patterns, violations, jsdocBlockCount, paramTagCount, hasExamples, confidence };
}

export class JsdocPatternsDetector extends RegexDetector {
  readonly id = 'documentation/jsdoc-patterns';
  readonly name = 'JSDoc Patterns Detector';
  readonly description = 'Detects JSDoc documentation patterns';
  readonly category: PatternCategory = 'documentation';
  readonly subcategory = 'jsdoc-patterns';
  readonly supportedLanguages: Language[] = ['typescript', 'javascript'];

  async detect(context: DetectionContext): Promise<DetectionResult> {
    if (!this.supportsLanguage(context.language)) return this.createEmptyResult();
    const analysis = analyzeJsdocPatterns(context.content, context.file);
    if (analysis.patterns.length === 0 && analysis.violations.length === 0) return this.createEmptyResult();
    return this.createResult([], [], analysis.confidence, { custom: { patterns: analysis.patterns, violations: analysis.violations, jsdocBlockCount: analysis.jsdocBlockCount, paramTagCount: analysis.paramTagCount, hasExamples: analysis.hasExamples } });
  }

  generateQuickFix(_violation: Violation): QuickFix | null { return null; }
}

export function createJsdocPatternsDetector(): JsdocPatternsDetector { return new JsdocPatternsDetector(); }
