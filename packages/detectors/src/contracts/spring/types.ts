/**
 * Spring MVC Contract Detection Types
 *
 * Type definitions for Spring MVC endpoint and DTO detection.
 * Used for FE↔BE contract matching between Spring backends and React/TypeScript frontends.
 *
 * @module contracts/spring/types
 */

import type { ContractField, HttpMethod } from 'driftdetect-core';

// ============================================
// Endpoint Types
// ============================================

/**
 * Information about a Spring MVC endpoint.
 */
export interface SpringEndpoint {
  /** HTTP method */
  method: HttpMethod;

  /** Original path as written (e.g., /users/{id}) */
  path: string;

  /** Normalized path for matching (e.g., /users/:id) */
  normalizedPath: string;

  /** Source file */
  file: string;

  /** Line number */
  line: number;

  /** Response fields extracted from return type */
  responseFields: ContractField[];

  /** Request fields extracted from @RequestBody parameter */
  requestFields: ContractField[];

  /** Framework identifier */
  framework: 'spring-mvc';

  /** Controller class name */
  controller: string;

  /** Method name */
  action: string;

  /** Authorization annotations */
  authorization: SpringAuthInfo[];

  /** Response type name (if using a DTO) */
  responseTypeName?: string;

  /** Request type name (if using a DTO) */
  requestTypeName?: string;

  /** Query parameters from @RequestParam */
  queryParams?: SpringParamInfo[];

  /** Path variables from @PathVariable */
  pathVariables?: SpringParamInfo[];

  /** Consumes media types */
  consumes?: string[];

  /** Produces media types */
  produces?: string[];
}

// ============================================
// Controller Types
// ============================================

/**
 * Information about a Spring MVC controller class.
 */
export interface SpringControllerInfo {
  /** Controller class name */
  name: string;

  /** Base route from class-level @RequestMapping */
  baseRoute: string | null;

  /** Whether it has @RestController annotation */
  isRestController: boolean;

  /** Whether it has @Controller annotation */
  isController: boolean;

  /** File path */
  file: string;

  /** Line number */
  line: number;

  /** Class-level authorization annotations */
  authorization?: SpringAuthInfo[];
}

// ============================================
// Authorization Types
// ============================================

/**
 * Information about Spring Security authorization annotations.
 */
export interface SpringAuthInfo {
  /** Authorization type */
  type: 'PreAuthorize' | 'PostAuthorize' | 'Secured' | 'RolesAllowed' | 'Anonymous' | 'Authenticated';

  /** SpEL expression for @PreAuthorize/@PostAuthorize */
  expression: string | null;

  /** Roles extracted from @Secured or @RolesAllowed */
  roles: string[];
}

// ============================================
// Parameter Types
// ============================================

/**
 * Information about a method parameter.
 */
export interface SpringParamInfo {
  /** Parameter name */
  name: string;

  /** Parameter type */
  type: string;

  /** Whether the parameter is required */
  required: boolean;

  /** Default value if specified */
  defaultValue: string | null;

  /** Source annotation (@PathVariable, @RequestParam, @RequestBody, etc.) */
  source: 'path' | 'query' | 'body' | 'header' | 'cookie' | 'matrix' | 'model' | 'unknown';
}

// ============================================
// Method Mapping Types
// ============================================

/**
 * Information about a method with request mapping.
 */
export interface SpringMethodMapping {
  /** Method name */
  name: string;

  /** HTTP method */
  httpMethod: HttpMethod;

  /** Route path from annotation */
  route: string | null;

  /** Return type */
  returnType: string;

  /** Method parameters */
  parameters: SpringParamInfo[];

  /** Annotations on the method */
  annotations: SpringAnnotationInfo[];

  /** Line number */
  line: number;
}

/**
 * Information about an annotation.
 */
export interface SpringAnnotationInfo {
  /** Annotation name (e.g., GetMapping, PreAuthorize) */
  name: string;

  /** Annotation value/arguments */
  value: string | null;

  /** Named arguments */
  arguments: Record<string, string>;
}

// ============================================
// DTO Types
// ============================================

/**
 * Information about a Java DTO/record class.
 */
export interface SpringDtoInfo {
  /** Class/record name */
  name: string;

  /** Package name */
  packageName: string | null;

  /** Fields/properties */
  fields: ContractField[];

  /** Whether it's a record type */
  isRecord: boolean;

  /** Whether it's an enum */
  isEnum: boolean;

  /** Parent class if extends another */
  parentClass: string | null;

  /** Implemented interfaces */
  interfaces: string[];

  /** File path */
  file: string;

  /** Line number */
  line: number;
}

// ============================================
// Extraction Result Types
// ============================================

/**
 * Result of Spring MVC endpoint extraction.
 */
export interface SpringExtractionResult {
  /** Extracted endpoints */
  endpoints: SpringEndpoint[];

  /** Framework identifier */
  framework: 'spring-mvc';

  /** Confidence score (0.0 to 1.0) */
  confidence: number;

  /** Controllers found */
  controllers: SpringControllerInfo[];

  /** DTOs found (optional) */
  dtos?: SpringDtoInfo[];
}

// ============================================
// HTTP Method Mapping
// ============================================

/**
 * Map Spring annotation names to HTTP methods.
 */
export const SPRING_MAPPING_ANNOTATIONS: Record<string, HttpMethod> = {
  GetMapping: 'GET',
  PostMapping: 'POST',
  PutMapping: 'PUT',
  DeleteMapping: 'DELETE',
  PatchMapping: 'PATCH',
};

/**
 * RequestMapping method attribute values to HTTP methods.
 */
export const REQUEST_METHOD_MAP: Record<string, HttpMethod> = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
  'RequestMethod.GET': 'GET',
  'RequestMethod.POST': 'POST',
  'RequestMethod.PUT': 'PUT',
  'RequestMethod.DELETE': 'DELETE',
  'RequestMethod.PATCH': 'PATCH',
};

// ============================================
// Parameter Source Mapping
// ============================================

/**
 * Map Spring parameter annotations to source types.
 */
export const PARAM_ANNOTATION_MAP: Record<string, SpringParamInfo['source']> = {
  PathVariable: 'path',
  RequestParam: 'query',
  RequestBody: 'body',
  RequestHeader: 'header',
  CookieValue: 'cookie',
  MatrixVariable: 'matrix',
  ModelAttribute: 'model',
};
