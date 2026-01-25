/**
 * API detectors module exports
 *
 * Detects API patterns including route structure, HTTP methods,
 * response formats, error handling, and more.
 *
 * @requirements 10.1-10.8 - API pattern detection
 */

// Route Structure Detector
export {
  RouteStructureDetector,
  createRouteStructureDetector,
  analyzeRouteStructure,
  detectExpressRoutes,
  detectNextjsAppRouterPatterns,
  detectNextjsPagesRouterPatterns,
  detectVersioningPatterns,
  detectUrlLiterals,
  detectCasingViolations,
  detectNamingViolations,
  detectMissingVersioning,
  detectDeepNestingViolations,
  detectCasing,
  isPlural,
  isSingular,
  toPlural,
  toKebabCase,
  calculateNestingDepth,
  extractRouteParameters,
  shouldExcludeFile,
  // Types
  type RoutePatternType,
  type RouteViolationType,
  type UrlCasingConvention,
  type RoutePatternInfo,
  type RouteViolationInfo,
  type RouteStructureAnalysis,
  // Constants
  HTTP_METHODS,
  EXPRESS_ROUTE_PATTERNS,
  NEXTJS_APP_ROUTER_PATTERN,
  NEXTJS_PAGES_ROUTER_PATTERN,
  RESTFUL_URL_PATTERNS,
  API_VERSIONING_PATTERNS,
  ROUTE_PARAMETER_PATTERNS,
  PLURAL_RESOURCES,
  SINGULAR_RESOURCES,
  MAX_NESTING_DEPTH,
  EXCLUDED_FILE_PATTERNS,
} from './route-structure.js';

// HTTP Methods Detector
export {
  HttpMethodsDetector,
  createHttpMethodsDetector,
  analyzeHttpMethods,
  detectExpressHandlers,
  detectNextjsMethodExports,
  detectFetchApiUsage,
  detectAxiosUsage,
  detectHttpClientUsage,
  detectPostForReadViolations,
  detectGetForMutationViolations,
  detectPutForPartialUpdateViolations,
  detectInconsistentMethodUsage,
  shouldExcludeFile as shouldExcludeHttpMethodsFile,
  normalizeMethod,
  isReadMethod,
  isMutationMethod,
  inferOperationType,
  // Types
  type HttpMethod,
  type HttpMethodPatternType,
  type HttpMethodViolationType,
  type HttpMethodUsageInfo,
  type HttpMethodViolationInfo,
  type HttpMethodAnalysis,
  // Constants
  READ_METHODS,
  MUTATION_METHODS,
  RESTFUL_METHOD_CONVENTIONS,
  READ_OPERATION_KEYWORDS,
  MUTATION_OPERATION_KEYWORDS,
  PARTIAL_UPDATE_KEYWORDS,
  FULL_REPLACEMENT_KEYWORDS,
  EXPRESS_METHOD_PATTERNS,
  NEXTJS_METHOD_EXPORT_PATTERN,
  FETCH_METHOD_PATTERNS,
  AXIOS_METHOD_PATTERNS,
  HTTP_CLIENT_PATTERNS,
} from './http-methods.js';

// Response Envelope Detector
export {
  ResponseEnvelopeDetector,
  createResponseEnvelopeDetector,
  analyzeResponseEnvelope,
  detectNextjsResponses,
  detectExpressResponses,
  detectResponseObjects,
  detectErrorResponses,
  detectPaginationPatterns,
  detectInconsistentEnvelopeViolations,
  detectMissingFieldViolations,
  detectRawDataViolations,
  detectInconsistentPaginationViolations,
  shouldExcludeFile as shouldExcludeResponseEnvelopeFile,
  extractFieldNames,
  detectEnvelopeFormat,
  detectPaginationFormat,
  isListResponse,
  // Types
  type ResponseEnvelopeFormat,
  type ResponseEnvelopePatternType,
  type ResponseEnvelopeViolationType,
  type PaginationFormat,
  type ResponseEnvelopePatternInfo,
  type ResponseEnvelopeViolationInfo,
  type ResponseEnvelopeAnalysis,
  // Constants
  STANDARD_ENVELOPE_FIELDS,
  JSON_API_FIELDS,
  HAL_FIELDS,
  GRAPHQL_FIELDS,
  PAGINATION_FIELDS,
  NEXTJS_RESPONSE_PATTERNS,
  EXPRESS_RESPONSE_PATTERNS,
  RESPONSE_OBJECT_PATTERNS,
  ERROR_RESPONSE_PATTERNS,
} from './response-envelope.js';

// Error Format Detector
export {
  ErrorFormatDetector,
  createErrorFormatDetector,
  analyzeErrorFormat,
  detectErrorObjects,
  detectErrorClasses,
  detectErrorThrows,
  detectErrorResponses as detectErrorFormatResponses,
  detectInconsistentFormatViolations as detectInconsistentErrorFormatViolations,
  detectMissingFieldViolations as detectMissingErrorFieldViolations,
  detectRawErrorStringViolations,
  detectGenericErrorViolations,
  detectInconsistentCodeViolations,
  shouldExcludeFile as shouldExcludeErrorFormatFile,
  extractFieldNames as extractErrorFieldNames,
  detectErrorFormat,
  detectErrorCodeConvention,
  isErrorCode,
  // Types
  type ErrorFormat,
  type ErrorFormatPatternType,
  type ErrorFormatViolationType,
  type ErrorFormatPatternInfo,
  type ErrorFormatViolationInfo,
  type ErrorFormatAnalysis,
  // Constants
  STANDARD_ERROR_FIELDS,
  PROBLEM_DETAILS_FIELDS,
  JSON_API_ERROR_FIELDS,
  GRAPHQL_ERROR_FIELDS,
  ERROR_CODE_PATTERNS,
  ERROR_CLASS_PATTERNS,
  ERROR_RESPONSE_PATTERNS as ERROR_FORMAT_RESPONSE_PATTERNS,
  ERROR_THROW_PATTERNS,
  ERROR_CATCH_PATTERNS,
} from './error-format.js';

// Pagination Detector
export {
  PaginationDetector,
  createPaginationDetector,
  analyzePagination,
  detectRequestPagination,
  detectResponsePagination,
  detectGraphQLConnections,
  detectListEndpoints,
  detectInconsistentFormatViolations as detectInconsistentPaginationFormatViolations,
  detectMissingPaginationViolations,
  detectMissingTotalViolations,
  detectMissingHasMoreViolations,
  shouldExcludeFile as shouldExcludePaginationFile,
  extractFieldNames as extractPaginationFieldNames,
  detectPaginationType,
  isListResponse as isPaginationListResponse,
  // Types
  type PaginationType,
  type PaginationPatternType,
  type PaginationViolationType,
  type PaginationPatternInfo,
  type PaginationViolationInfo,
  type PaginationAnalysis,
  // Constants
  OFFSET_PAGINATION_FIELDS,
  CURSOR_PAGINATION_FIELDS,
  PAGE_BASED_FIELDS,
  LINK_BASED_FIELDS,
  GRAPHQL_CONNECTION_FIELDS,
  LIST_ENDPOINT_PATTERNS,
  REQUEST_PAGINATION_PATTERNS,
  RESPONSE_PAGINATION_PATTERNS,
} from './pagination.js';

// Client Patterns Detector
export {
  ClientPatternsDetector,
  createClientPatternsDetector,
  analyzeClientPatterns,
  detectFetchWrappers,
  detectAxiosInstances,
  detectReactQuery,
  detectSWR,
  detectDirectFetch,
  detectDirectAxios,
  detectDirectCallViolations,
  detectMixedClientViolations,
  detectMissingErrorHandlingViolations,
  shouldExcludeFile as shouldExcludeClientPatternsFile,
  hasErrorHandling,
  hasAuthHeader,
  // Types
  type ClientPatternType,
  type ClientViolationType,
  type ClientPatternInfo,
  type ClientViolationInfo,
  type ClientPatternAnalysis,
  // Constants
  FETCH_WRAPPER_PATTERNS,
  AXIOS_INSTANCE_PATTERNS,
  REACT_QUERY_PATTERNS,
  SWR_PATTERNS,
  TRPC_PATTERNS,
  APOLLO_PATTERNS,
  URQL_PATTERNS,
  DIRECT_FETCH_PATTERNS,
  DIRECT_AXIOS_PATTERNS,
} from './client-patterns.js';

// Retry Patterns Detector
export {
  RetryPatternsDetector,
  createRetryPatternsDetector,
  analyzeRetryPatterns,
  detectExponentialBackoff,
  detectLinearRetry,
  detectCircuitBreaker,
  detectRetryLibraries,
  detectTimeoutConfig,
  detectMissingRetryViolations,
  detectInfiniteRetryViolations,
  detectMissingTimeoutViolations,
  shouldExcludeFile as shouldExcludeRetryPatternsFile,
  extractMaxRetries,
  extractTimeout,
  // Types
  type RetryPatternType,
  type RetryViolationType,
  type RetryPatternInfo,
  type RetryViolationInfo,
  type RetryPatternAnalysis,
  // Constants
  EXPONENTIAL_BACKOFF_PATTERNS,
  LINEAR_RETRY_PATTERNS,
  CIRCUIT_BREAKER_PATTERNS,
  RETRY_LIBRARY_PATTERNS,
  TIMEOUT_PATTERNS,
  MAX_RETRY_PATTERNS,
  NON_IDEMPOTENT_PATTERNS,
} from './retry-patterns.js';

// ============================================================================
// Learning-Based Detectors
// ============================================================================

// Route Structure Learning Detector
export {
  RouteStructureLearningDetector,
  createRouteStructureLearningDetector,
  type RouteConventions,
  type UrlCasingConvention as LearningUrlCasingConvention,
  type ResourceNamingConvention,
} from './route-structure-learning.js';

// Client Patterns Learning Detector
export {
  ClientPatternsLearningDetector,
  createClientPatternsLearningDetector,
  type ClientConventions,
  type ClientPatternType as LearningClientPatternType,
} from './client-patterns-learning.js';

// Error Format Learning Detector
export {
  ErrorFormatLearningDetector,
  createErrorFormatLearningDetector,
  type ErrorConventions,
  type ErrorFormat as LearningErrorFormat,
  type ErrorCodeConvention,
} from './error-format-learning.js';

// HTTP Methods Learning Detector
export {
  HttpMethodsLearningDetector,
  createHttpMethodsLearningDetector,
  type HttpMethodConventions,
  type HttpMethod as LearningHttpMethod,
  type OperationType,
} from './http-methods-learning.js';

// Pagination Learning Detector
export {
  PaginationLearningDetector,
  createPaginationLearningDetector,
  type PaginationConventions,
  type PaginationType as LearningPaginationType,
} from './pagination-learning.js';

// Response Envelope Learning Detector
export {
  ResponseEnvelopeLearningDetector,
  createResponseEnvelopeLearningDetector,
  type EnvelopeConventions,
  type ResponseEnvelopeFormat as LearningResponseEnvelopeFormat,
} from './response-envelope-learning.js';

// Retry Patterns Learning Detector
export {
  RetryPatternsLearningDetector,
  createRetryPatternsLearningDetector,
  type RetryConventions,
  type RetryStrategy,
} from './retry-patterns-learning.js';

// ============================================================================
// Rust API Framework Detectors
// ============================================================================

export * from './rust/index.js';

// ============================================================================
// C++ API Framework Detectors
// ============================================================================

export * from './cpp/index.js';
