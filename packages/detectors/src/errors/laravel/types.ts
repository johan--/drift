/**
 * Laravel Error Handling Type Definitions
 *
 * Types for Laravel exception and error handling pattern detection.
 *
 * @module errors/laravel/types
 */

// ============================================================================
// Exception Handler Types
// ============================================================================

/**
 * Exception handler configuration
 */
export interface ExceptionHandlerInfo {
  /** Handler class name */
  name: string;
  /** Fully qualified name */
  fqn: string;
  /** Namespace */
  namespace: string | null;
  /** Don't report exceptions */
  dontReport: string[];
  /** Don't flash inputs */
  dontFlash: string[];
  /** Custom render methods */
  renderMethods: RenderMethodInfo[];
  /** Custom report methods */
  reportMethods: ReportMethodInfo[];
  /** Reportable callbacks */
  reportableCallbacks: ReportableCallbackInfo[];
  /** Renderable callbacks */
  renderableCallbacks: RenderableCallbackInfo[];
  /** File path */
  file: string;
  /** Line number */
  line: number;
}

/**
 * Custom render method
 */
export interface RenderMethodInfo {
  /** Exception type handled */
  exceptionType: string;
  /** Response type */
  responseType: 'json' | 'view' | 'redirect' | 'response';
  /** Line number */
  line: number;
}

/**
 * Custom report method
 */
export interface ReportMethodInfo {
  /** Exception type handled */
  exceptionType: string;
  /** Logging channel */
  channel: string | null;
  /** Line number */
  line: number;
}

/**
 * Reportable callback
 */
export interface ReportableCallbackInfo {
  /** Exception type */
  exceptionType: string;
  /** Whether it stops propagation */
  stopsPropagation: boolean;
  /** Line number */
  line: number;
}

/**
 * Renderable callback
 */
export interface RenderableCallbackInfo {
  /** Exception type */
  exceptionType: string;
  /** Response type */
  responseType: string;
  /** Line number */
  line: number;
}

// ============================================================================
// Custom Exception Types
// ============================================================================

/**
 * Custom exception class
 */
export interface CustomExceptionInfo {
  /** Exception class name */
  name: string;
  /** Fully qualified name */
  fqn: string;
  /** Namespace */
  namespace: string | null;
  /** Parent exception class */
  extends: string;
  /** Whether it has custom render method */
  hasRender: boolean;
  /** Whether it has custom report method */
  hasReport: boolean;
  /** HTTP status code (if defined) */
  statusCode: number | null;
  /** Error code (if defined) */
  errorCode: string | null;
  /** Properties */
  properties: ExceptionPropertyInfo[];
  /** File path */
  file: string;
  /** Line number */
  line: number;
}

/**
 * Exception property
 */
export interface ExceptionPropertyInfo {
  /** Property name */
  name: string;
  /** Type */
  type: string | null;
  /** Visibility */
  visibility: 'public' | 'protected' | 'private';
}

// ============================================================================
// Exception Usage Types
// ============================================================================

/**
 * Exception throw usage
 */
export interface ExceptionThrowInfo {
  /** Exception class */
  exceptionClass: string;
  /** Message (if extractable) */
  message: string | null;
  /** Arguments */
  arguments: string[];
  /** File path */
  file: string;
  /** Line number */
  line: number;
}

/**
 * Try-catch block
 */
export interface TryCatchBlockInfo {
  /** Caught exception types */
  catchTypes: string[];
  /** Whether it has finally */
  hasFinally: boolean;
  /** Whether exception is rethrown */
  rethrows: boolean;
  /** Whether exception is logged */
  logs: boolean;
  /** File path */
  file: string;
  /** Line number */
  line: number;
}

/**
 * Abort usage
 */
export interface AbortUsageInfo {
  /** Abort type */
  type: 'abort' | 'abort_if' | 'abort_unless';
  /** HTTP status code */
  statusCode: number | null;
  /** Message */
  message: string | null;
  /** File path */
  file: string;
  /** Line number */
  line: number;
}

// ============================================================================
// Extraction Results
// ============================================================================

/**
 * Exception handler extraction result
 */
export interface ExceptionHandlerExtractionResult {
  /** Exception handlers */
  handlers: ExceptionHandlerInfo[];
  /** Confidence score */
  confidence: number;
}

/**
 * Custom exception extraction result
 */
export interface CustomExceptionExtractionResult {
  /** Custom exceptions */
  exceptions: CustomExceptionInfo[];
  /** Exception throws */
  throws: ExceptionThrowInfo[];
  /** Try-catch blocks */
  tryCatches: TryCatchBlockInfo[];
  /** Abort usages */
  aborts: AbortUsageInfo[];
  /** Confidence score */
  confidence: number;
}

/**
 * Complete Laravel error handling analysis
 */
export interface LaravelErrorAnalysis {
  /** Exception handler analysis */
  handlers: ExceptionHandlerExtractionResult;
  /** Custom exception analysis */
  exceptions: CustomExceptionExtractionResult;
  /** Overall confidence */
  confidence: number;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Built-in Laravel exceptions
 */
export const LARAVEL_EXCEPTIONS = [
  'AuthenticationException',
  'AuthorizationException',
  'HttpException',
  'ModelNotFoundException',
  'NotFoundHttpException',
  'TokenMismatchException',
  'ValidationException',
  'ThrottleRequestsException',
  'MaintenanceModeException',
] as const;

/**
 * Common HTTP status codes
 */
export const HTTP_STATUS_CODES: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  409: 'Conflict',
  422: 'Unprocessable Entity',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
};
