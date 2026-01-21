/**
 * Contract Detectors - BE↔FE mismatch detection
 *
 * These detectors extract API endpoint definitions from backend code
 * and TypeScript types from frontend code, enabling cross-file
 * contract matching and mismatch detection.
 */

export * from './backend-endpoint-detector.js';
export * from './frontend-type-detector.js';
export * from './contract-matcher.js';
export * from './schema-parser.js';
export * from './types.js';

// Django REST Framework support
export * from './django/index.js';

// ASP.NET Core support
export * from './aspnet/index.js';

// Spring MVC support
export * from './spring/index.js';

// Laravel support
export {
  LaravelEndpointDetector,
  createLaravelEndpointDetector,
  RouteExtractor,
  createRouteExtractor,
  ControllerExtractor,
  createControllerExtractor,
  ResourceExtractor,
  createResourceExtractor,
  FormRequestExtractor,
  createFormRequestExtractor,
  // Types - renamed to avoid conflict with Django
  toContractFields as laravelToContractFields,
  validationRulesToContractFields,
  inferTypeFromRules,
  RESOURCE_ACTIONS,
  API_RESOURCE_ACTIONS,
} from './laravel/index.js';

// Re-export Laravel types
export type {
  LaravelRouteInfo,
  LaravelRouteGroup,
  LaravelControllerInfo,
  LaravelResourceInfo,
  LaravelFormRequestInfo,
  LaravelExtractionResult,
  LaravelHttpMethod,
  RouteParameter,
  ControllerAction,
  ControllerMiddleware,
  ActionParameter,
  ModelBinding,
  ResourceField,
  ConditionalField,
  ValidationRule,
} from './laravel/index.js';
