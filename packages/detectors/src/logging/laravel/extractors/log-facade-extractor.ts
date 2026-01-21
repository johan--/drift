/**
 * Laravel Log Facade Extractor
 *
 * Extracts Log facade usages from Laravel code.
 *
 * @module logging/laravel/extractors/log-facade-extractor
 */

import type {
  LogFacadeUsage,
  LogLevel,
  LogFacadeExtractionResult,
} from '../types.js';

// ============================================================================
// Regex Patterns
// ============================================================================

/**
 * Log facade method call
 */
const LOG_FACADE_PATTERN = /Log::(emergency|alert|critical|error|warning|notice|info|debug)\s*\(\s*([^)]+)\)/g;

/**
 * Log facade with channel
 */
const LOG_CHANNEL_PATTERN = /Log::channel\s*\(\s*['"](\w+)['"]\s*\)\s*->(emergency|alert|critical|error|warning|notice|info|debug)\s*\(\s*([^)]+)\)/g;

/**
 * logger() helper
 */
const LOGGER_HELPER_PATTERN = /logger\s*\(\s*\)\s*->(emergency|alert|critical|error|warning|notice|info|debug)\s*\(\s*([^)]+)\)/g;

/**
 * logger() with message
 */
const LOGGER_MESSAGE_PATTERN = /logger\s*\(\s*['"]([^'"]+)['"]/g;

/**
 * Context key extraction
 */
const CONTEXT_KEY_PATTERN = /['"](\w+)['"]\s*=>/g;

// ============================================================================
// Log Facade Extractor
// ============================================================================

/**
 * Extracts Log facade usages
 */
export class LogFacadeExtractor {
  /**
   * Extract all log facade usages from content
   */
  extract(content: string, file: string): LogFacadeExtractionResult {
    const usages = this.extractUsages(content, file);
    const levelDistribution = this.calculateLevelDistribution(usages);
    const confidence = usages.length > 0 ? 0.9 : 0;

    return {
      usages,
      levelDistribution,
      confidence,
    };
  }

  /**
   * Check if content contains log facade patterns
   */
  hasLogs(content: string): boolean {
    return (
      content.includes('Log::') ||
      content.includes('logger(')
    );
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Extract log usages
   */
  private extractUsages(content: string, file: string): LogFacadeUsage[] {
    const usages: LogFacadeUsage[] = [];

    // Log::level()
    LOG_FACADE_PATTERN.lastIndex = 0;
    let match;
    while ((match = LOG_FACADE_PATTERN.exec(content)) !== null) {
      const level = match[1] as LogLevel;
      const argsStr = match[2] || '';
      const line = this.getLineNumber(content, match.index);

      const { message, contextKeys } = this.parseLogArgs(argsStr);

      usages.push({
        level,
        message,
        contextKeys,
        channel: null,
        file,
        line,
      });
    }

    // Log::channel()->level()
    LOG_CHANNEL_PATTERN.lastIndex = 0;
    while ((match = LOG_CHANNEL_PATTERN.exec(content)) !== null) {
      const channel = match[1] || null;
      const level = match[2] as LogLevel;
      const argsStr = match[3] || '';
      const line = this.getLineNumber(content, match.index);

      const { message, contextKeys } = this.parseLogArgs(argsStr);

      usages.push({
        level,
        message,
        contextKeys,
        channel,
        file,
        line,
      });
    }

    // logger()->level()
    LOGGER_HELPER_PATTERN.lastIndex = 0;
    while ((match = LOGGER_HELPER_PATTERN.exec(content)) !== null) {
      const level = match[1] as LogLevel;
      const argsStr = match[2] || '';
      const line = this.getLineNumber(content, match.index);

      const { message, contextKeys } = this.parseLogArgs(argsStr);

      usages.push({
        level,
        message,
        contextKeys,
        channel: null,
        file,
        line,
      });
    }

    // logger('message')
    LOGGER_MESSAGE_PATTERN.lastIndex = 0;
    while ((match = LOGGER_MESSAGE_PATTERN.exec(content)) !== null) {
      const message = match[1] || null;
      const line = this.getLineNumber(content, match.index);

      usages.push({
        level: 'debug',
        message,
        contextKeys: [],
        channel: null,
        file,
        line,
      });
    }

    return usages;
  }

  /**
   * Parse log arguments
   */
  private parseLogArgs(argsStr: string): { message: string | null; contextKeys: string[] } {
    // Extract message (first string argument)
    const messageMatch = argsStr.match(/^['"]([^'"]+)['"]/);
    const message = messageMatch ? messageMatch[1] || null : null;

    // Extract context keys
    const contextKeys: string[] = [];
    CONTEXT_KEY_PATTERN.lastIndex = 0;
    let keyMatch;
    while ((keyMatch = CONTEXT_KEY_PATTERN.exec(argsStr)) !== null) {
      if (keyMatch[1]) {
        contextKeys.push(keyMatch[1]);
      }
    }

    return { message, contextKeys };
  }

  /**
   * Calculate level distribution
   */
  private calculateLevelDistribution(usages: LogFacadeUsage[]): Record<LogLevel, number> {
    const distribution: Record<LogLevel, number> = {
      emergency: 0,
      alert: 0,
      critical: 0,
      error: 0,
      warning: 0,
      notice: 0,
      info: 0,
      debug: 0,
    };

    for (const usage of usages) {
      distribution[usage.level]++;
    }

    return distribution;
  }

  /**
   * Get line number from offset
   */
  private getLineNumber(content: string, offset: number): number {
    return content.substring(0, offset).split('\n').length;
  }
}

/**
 * Create a new log facade extractor
 */
export function createLogFacadeExtractor(): LogFacadeExtractor {
  return new LogFacadeExtractor();
}
