/**
 * Laravel XSS Extractor
 *
 * Extracts XSS-related patterns from Laravel Blade templates.
 * Identifies escaped vs unescaped output.
 *
 * @module security/laravel/extractors/xss-extractor
 */

import type { XSSUsageInfo } from '../types.js';

// ============================================================================
// Regex Patterns
// ============================================================================

/**
 * Escaped output {{ }}
 */
const ESCAPED_OUTPUT_PATTERN = /\{\{\s*([^}]+)\s*\}\}/g;

/**
 * Unescaped output {!! !!}
 */
const UNESCAPED_OUTPUT_PATTERN = /\{!!\s*([^!]+)\s*!!\}/g;

/**
 * Raw HTML directive
 */
const RAW_DIRECTIVE_PATTERN = /@raw\s*\(\s*([^)]+)\s*\)/g;

// Note: These patterns are defined for future use in sanitization detection
// const E_HELPER_PATTERN = /\be\s*\(\s*([^)]+)\s*\)/g;
// const HTMLSPECIALCHARS_PATTERN = /htmlspecialchars\s*\(\s*([^)]+)\s*\)/g;
// const STRIP_TAGS_PATTERN = /strip_tags\s*\(\s*([^)]+)\s*\)/g;
// const SANITIZE_PATTERN = /(?:clean|sanitize|purify)\s*\(\s*([^)]+)\s*\)/gi;
// const USER_INPUT_PATTERN = /\$(?:request|input|_GET|_POST|_REQUEST)\s*(?:->|\[)/g;

// ============================================================================
// Extraction Result
// ============================================================================

/**
 * XSS extraction result
 */
export interface XSSExtractionResult {
  /** XSS usages */
  usages: XSSUsageInfo[];
  /** Potential vulnerabilities */
  vulnerabilities: XSSVulnerabilityInfo[];
  /** Confidence score */
  confidence: number;
}

/**
 * XSS vulnerability info
 */
export interface XSSVulnerabilityInfo {
  /** Vulnerability type */
  type: 'unescaped-user-input' | 'raw-output' | 'missing-sanitization';
  /** Description */
  description: string;
  /** Severity */
  severity: 'low' | 'medium' | 'high';
  /** File path */
  file: string;
  /** Line number */
  line: number;
}

// ============================================================================
// XSS Extractor
// ============================================================================

/**
 * Extracts XSS-related patterns from Laravel code
 */
export class XSSExtractor {
  /**
   * Extract all XSS patterns from content
   */
  extract(content: string, file: string): XSSExtractionResult {
    const usages = this.extractUsages(content, file);
    const vulnerabilities = this.detectVulnerabilities(content, file);
    const confidence = usages.length > 0 ? 0.9 : 0;

    return {
      usages,
      vulnerabilities,
      confidence,
    };
  }

  /**
   * Check if content contains XSS-related patterns
   */
  hasXSSPatterns(content: string): boolean {
    return (
      content.includes('{{') ||
      content.includes('{!!') ||
      content.includes('@raw')
    );
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Extract XSS usages
   */
  private extractUsages(content: string, file: string): XSSUsageInfo[] {
    const usages: XSSUsageInfo[] = [];

    // Escaped output
    ESCAPED_OUTPUT_PATTERN.lastIndex = 0;
    let match;
    while ((match = ESCAPED_OUTPUT_PATTERN.exec(content)) !== null) {
      const context = match[1]?.trim() || '';
      const line = this.getLineNumber(content, match.index);

      usages.push({
        type: 'escaped',
        context,
        file,
        line,
      });
    }

    // Unescaped output
    UNESCAPED_OUTPUT_PATTERN.lastIndex = 0;
    while ((match = UNESCAPED_OUTPUT_PATTERN.exec(content)) !== null) {
      const context = match[1]?.trim() || '';
      const line = this.getLineNumber(content, match.index);

      usages.push({
        type: 'unescaped',
        context,
        file,
        line,
      });
    }

    // Raw directive
    RAW_DIRECTIVE_PATTERN.lastIndex = 0;
    while ((match = RAW_DIRECTIVE_PATTERN.exec(content)) !== null) {
      const context = match[1]?.trim() || '';
      const line = this.getLineNumber(content, match.index);

      usages.push({
        type: 'raw',
        context,
        file,
        line,
      });
    }

    return usages;
  }

  /**
   * Detect potential XSS vulnerabilities
   */
  private detectVulnerabilities(content: string, file: string): XSSVulnerabilityInfo[] {
    const vulnerabilities: XSSVulnerabilityInfo[] = [];

    // Check for unescaped user input
    UNESCAPED_OUTPUT_PATTERN.lastIndex = 0;
    let match;
    while ((match = UNESCAPED_OUTPUT_PATTERN.exec(content)) !== null) {
      const context = match[1]?.trim() || '';
      const line = this.getLineNumber(content, match.index);

      // Check if it contains user input
      if (this.containsUserInput(context)) {
        vulnerabilities.push({
          type: 'unescaped-user-input',
          description: `Unescaped user input: ${context}`,
          severity: 'high',
          file,
          line,
        });
      } else {
        // Still flag unescaped output as potential risk
        vulnerabilities.push({
          type: 'raw-output',
          description: `Unescaped output: ${context}`,
          severity: 'medium',
          file,
          line,
        });
      }
    }

    // Check for raw directive with user input
    RAW_DIRECTIVE_PATTERN.lastIndex = 0;
    while ((match = RAW_DIRECTIVE_PATTERN.exec(content)) !== null) {
      const context = match[1]?.trim() || '';
      const line = this.getLineNumber(content, match.index);

      if (this.containsUserInput(context)) {
        vulnerabilities.push({
          type: 'unescaped-user-input',
          description: `Raw directive with user input: ${context}`,
          severity: 'high',
          file,
          line,
        });
      }
    }

    return vulnerabilities;
  }

  /**
   * Check if context contains user input
   */
  private containsUserInput(context: string): boolean {
    return (
      context.includes('$request') ||
      context.includes('$input') ||
      context.includes('$_GET') ||
      context.includes('$_POST') ||
      context.includes('$_REQUEST') ||
      context.includes('request(') ||
      context.includes('input(')
    );
  }

  /**
   * Get line number from offset
   */
  private getLineNumber(content: string, offset: number): number {
    return content.substring(0, offset).split('\n').length;
  }
}

/**
 * Create a new XSS extractor
 */
export function createXSSExtractor(): XSSExtractor {
  return new XSSExtractor();
}
