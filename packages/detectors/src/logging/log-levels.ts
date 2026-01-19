/**
 * Log Levels Detector - Log level usage pattern detection
 *
 * Detects log level patterns including:
 * - Debug, info, warn, error levels
 * - Log level configuration
 * - Appropriate level usage
 *
 * @requirements 15.2 - Log level patterns
 */

import type { Violation, QuickFix, PatternCategory, Language } from '@drift/core';
import { RegexDetector } from '../base/regex-detector.js';
import type { DetectionContext, DetectionResult } from '../base/base-detector.js';

// ============================================================================
// Types
// ============================================================================

export type LogLevelPatternType =
  | 'debug-level'
  | 'info-level'
  | 'warn-level'
  | 'error-level'
  | 'fatal-level'
  | 'trace-level'
  | 'level-config';

export interface LogLevelPatternInfo {
  type: LogLevelPatternType;
  line: number;
  column: number;
  match: string;
}

export interface LogLevelAnalysis {
  patterns: LogLevelPatternInfo[];
  levelCounts: Record<string, number>;
  hasLevelConfig: boolean;
}

// ============================================================================
// Patterns
// ============================================================================

export const DEBUG_LEVEL_PATTERNS = [
  /logger\.debug\s*\(/gi,
  /log\.debug\s*\(/gi,
  /console\.debug\s*\(/gi,
];

export const INFO_LEVEL_PATTERNS = [
  /logger\.info\s*\(/gi,
  /log\.info\s*\(/gi,
  /console\.info\s*\(/gi,
];

export const WARN_LEVEL_PATTERNS = [
  /logger\.warn\s*\(/gi,
  /log\.warn\s*\(/gi,
  /console\.warn\s*\(/gi,
];

export const ERROR_LEVEL_PATTERNS = [
  /logger\.error\s*\(/gi,
  /log\.error\s*\(/gi,
  /console\.error\s*\(/gi,
];

export const FATAL_LEVEL_PATTERNS = [
  /logger\.fatal\s*\(/gi,
  /log\.fatal\s*\(/gi,
];

export const TRACE_LEVEL_PATTERNS = [
  /logger\.trace\s*\(/gi,
  /log\.trace\s*\(/gi,
];

export const LEVEL_CONFIG_PATTERNS = [
  /level\s*:\s*['"`](?:debug|info|warn|error|fatal|trace)['"`]/gi,
  /LOG_LEVEL\s*[=:]/gi,
  /logLevel\s*[=:]/gi,
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
  type: LogLevelPatternType
): LogLevelPatternInfo[] {
  const results: LogLevelPatternInfo[] = [];
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

export function analyzeLogLevels(content: string, filePath: string): LogLevelAnalysis {
  if (shouldExcludeFile(filePath)) {
    return {
      patterns: [],
      levelCounts: {},
      hasLevelConfig: false,
    };
  }

  const patterns: LogLevelPatternInfo[] = [
    ...detectPatterns(content, DEBUG_LEVEL_PATTERNS, 'debug-level'),
    ...detectPatterns(content, INFO_LEVEL_PATTERNS, 'info-level'),
    ...detectPatterns(content, WARN_LEVEL_PATTERNS, 'warn-level'),
    ...detectPatterns(content, ERROR_LEVEL_PATTERNS, 'error-level'),
    ...detectPatterns(content, FATAL_LEVEL_PATTERNS, 'fatal-level'),
    ...detectPatterns(content, TRACE_LEVEL_PATTERNS, 'trace-level'),
    ...detectPatterns(content, LEVEL_CONFIG_PATTERNS, 'level-config'),
  ];

  const levelCounts: Record<string, number> = {};
  for (const pattern of patterns) {
    if (pattern.type !== 'level-config') {
      levelCounts[pattern.type] = (levelCounts[pattern.type] || 0) + 1;
    }
  }

  const hasLevelConfig = patterns.some((p) => p.type === 'level-config');

  return {
    patterns,
    levelCounts,
    hasLevelConfig,
  };
}

// ============================================================================
// Detector Class
// ============================================================================

export class LogLevelsDetector extends RegexDetector {
  readonly id = 'logging/log-levels';
  readonly name = 'Log Levels Detector';
  readonly description = 'Detects log level usage patterns';
  readonly category: PatternCategory = 'logging';
  readonly subcategory = 'log-levels';
  readonly supportedLanguages: Language[] = ['typescript', 'javascript'];

  async detect(context: DetectionContext): Promise<DetectionResult> {
    if (!this.supportsLanguage(context.language)) {
      return this.createEmptyResult();
    }

    const analysis = analyzeLogLevels(context.content, context.file);

    if (analysis.patterns.length === 0) {
      return this.createEmptyResult();
    }

    const confidence = 0.9;
    return this.createResult([], [], confidence, {
      custom: {
        patterns: analysis.patterns,
        levelCounts: analysis.levelCounts,
        hasLevelConfig: analysis.hasLevelConfig,
      },
    });
  }

  generateQuickFix(_violation: Violation): QuickFix | null {
    return null;
  }
}

export function createLogLevelsDetector(): LogLevelsDetector {
  return new LogLevelsDetector();
}
