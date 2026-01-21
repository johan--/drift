/**
 * Laravel Logging Type Definitions
 *
 * Types for Laravel logging pattern detection.
 *
 * @module logging/laravel/types
 */

// ============================================================================
// Log Facade Types
// ============================================================================

/**
 * Log facade usage
 */
export interface LogFacadeUsage {
  /** Log level */
  level: LogLevel;
  /** Message (if extractable) */
  message: string | null;
  /** Context data keys */
  contextKeys: string[];
  /** Channel (if specified) */
  channel: string | null;
  /** File path */
  file: string;
  /** Line number */
  line: number;
}

/**
 * Log levels
 */
export type LogLevel =
  | 'emergency'
  | 'alert'
  | 'critical'
  | 'error'
  | 'warning'
  | 'notice'
  | 'info'
  | 'debug';

/**
 * Log channel configuration
 */
export interface LogChannelInfo {
  /** Channel name */
  name: string;
  /** Driver type */
  driver: LogDriver;
  /** Path (for file-based drivers) */
  path: string | null;
  /** Level threshold */
  level: LogLevel | null;
  /** Days to retain (for daily driver) */
  days: number | null;
  /** File path */
  file: string;
  /** Line number */
  line: number;
}

/**
 * Log drivers
 */
export type LogDriver =
  | 'single'
  | 'daily'
  | 'slack'
  | 'papertrail'
  | 'syslog'
  | 'errorlog'
  | 'monolog'
  | 'custom'
  | 'stack';

/**
 * Log stack configuration
 */
export interface LogStackInfo {
  /** Stack name */
  name: string;
  /** Channels in stack */
  channels: string[];
  /** File path */
  file: string;
  /** Line number */
  line: number;
}

// ============================================================================
// Context Types
// ============================================================================

/**
 * Log context pattern
 */
export interface LogContextPattern {
  /** Context key */
  key: string;
  /** Value type (if determinable) */
  valueType: 'string' | 'number' | 'array' | 'object' | 'variable' | 'unknown';
  /** Occurrences */
  occurrences: number;
  /** Files where used */
  files: string[];
}

/**
 * Structured logging pattern
 */
export interface StructuredLogPattern {
  /** Pattern type */
  type: 'json' | 'key-value' | 'template' | 'plain';
  /** Example message */
  example: string | null;
  /** Context keys used */
  contextKeys: string[];
  /** File path */
  file: string;
  /** Line number */
  line: number;
}

// ============================================================================
// Extraction Results
// ============================================================================

/**
 * Log facade extraction result
 */
export interface LogFacadeExtractionResult {
  /** Log usages */
  usages: LogFacadeUsage[];
  /** Level distribution */
  levelDistribution: Record<LogLevel, number>;
  /** Confidence score */
  confidence: number;
}

/**
 * Log channel extraction result
 */
export interface LogChannelExtractionResult {
  /** Channels */
  channels: LogChannelInfo[];
  /** Stacks */
  stacks: LogStackInfo[];
  /** Default channel */
  defaultChannel: string | null;
  /** Confidence score */
  confidence: number;
}

/**
 * Complete Laravel logging analysis
 */
export interface LaravelLoggingAnalysis {
  /** Log facade analysis */
  facade: LogFacadeExtractionResult;
  /** Channel analysis */
  channels: LogChannelExtractionResult;
  /** Context patterns */
  contextPatterns: LogContextPattern[];
  /** Overall confidence */
  confidence: number;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Log levels in order of severity
 */
export const LOG_LEVELS: LogLevel[] = [
  'emergency',
  'alert',
  'critical',
  'error',
  'warning',
  'notice',
  'info',
  'debug',
];

/**
 * Log drivers
 */
export const LOG_DRIVERS: LogDriver[] = [
  'single',
  'daily',
  'slack',
  'papertrail',
  'syslog',
  'errorlog',
  'monolog',
  'custom',
  'stack',
];

/**
 * Common context keys
 */
export const COMMON_CONTEXT_KEYS = [
  'user_id',
  'request_id',
  'correlation_id',
  'trace_id',
  'span_id',
  'ip',
  'url',
  'method',
  'status',
  'duration',
  'exception',
  'stack_trace',
];
