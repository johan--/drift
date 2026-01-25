/**
 * C++ Auth Middleware Detector
 *
 * Detects authentication and authorization patterns in C++ code:
 * - JWT handling (jwt-cpp, libjwt)
 * - Session management
 * - Basic/Bearer auth
 * - OAuth patterns
 * - RBAC patterns
 *
 * @license Apache-2.0
 */

import type { PatternCategory } from 'driftdetect-core';

// ============================================================================
// Types
// ============================================================================

export interface CppAuthPattern {
  id: string;
  name: string;
  category: PatternCategory;
  file: string;
  line: number;
  column: number;
  context: string;
  confidence: number;
  framework: string;
  authType: CppAuthType;
}

export type CppAuthType =
  | 'middleware'
  | 'jwt'
  | 'session'
  | 'bearer'
  | 'basic'
  | 'api-key'
  | 'oauth'
  | 'rbac'
  | 'permission';

export interface CppAuthDetectorOptions {
  includeJwt?: boolean;
  includeSessions?: boolean;
  includeRbac?: boolean;
}

export interface CppAuthDetectionResult {
  patterns: CppAuthPattern[];
  issues: CppAuthIssue[];
}

export interface CppAuthIssue {
  type: 'hardcoded-secret' | 'weak-auth' | 'insecure-token';
  message: string;
  file: string;
  line: number;
  suggestion: string;
}

// ============================================================================
// Regex Patterns
// ============================================================================

// JWT patterns (jwt-cpp library)
const JWT_CPP_DECODE_PATTERN = /jwt::decode\s*\(/g;
const JWT_CPP_VERIFY_PATTERN = /jwt::verify\s*\(/g;
const JWT_CPP_CREATE_PATTERN = /jwt::create\s*\(\s*\)/g;
const JWT_CLAIMS_PATTERN = /\.set_payload_claim\s*\(\s*"([^"]+)"/g;

// libjwt patterns
const LIBJWT_DECODE_PATTERN = /jwt_decode\s*\(/g;
const LIBJWT_ENCODE_PATTERN = /jwt_encode_str\s*\(/g;

// Authorization header patterns
const AUTH_HEADER_PATTERN = /["']Authorization["']\s*[,)]/gi;
const BEARER_PATTERN = /Bearer\s+/g;
const BASIC_AUTH_PATTERN = /Basic\s+/g;

// API Key patterns
const API_KEY_HEADER_PATTERN = /["'](?:X-API-Key|Api-Key|x-api-key)["']/gi;
const API_KEY_QUERY_PATTERN = /["']api_key["']\s*[,)]/gi;

// Session patterns
const SESSION_PATTERN = /session\s*\[\s*["'](\w+)["']\s*\]/gi;
const COOKIE_PATTERN = /(?:set_cookie|get_cookie|Cookie)\s*\(/gi;

// RBAC patterns
const ROLE_CHECK_PATTERN = /(?:has_role|check_role|is_admin|is_user|require_role)\s*\(/gi;
const PERMISSION_CHECK_PATTERN = /(?:has_permission|check_permission|can_access|is_authorized)\s*\(/gi;

// OAuth patterns
const OAUTH_TOKEN_PATTERN = /(?:access_token|refresh_token|oauth_token)\s*[=:]/gi;
const OAUTH_SCOPE_PATTERN = /["']scope["']\s*[=:]/gi;

// Security issues
const HARDCODED_SECRET_PATTERN = /(?:secret|key|password|token)\s*=\s*["'][^"']{8,}["']/gi;
const WEAK_ALGORITHM_PATTERN = /(?:HS256|none)\s*[,)]/g;

// ============================================================================
// Detector Implementation
// ============================================================================

/**
 * Detect C++ authentication and authorization patterns
 */
export function detectCppAuthPatterns(
  source: string,
  filePath: string,
  options: CppAuthDetectorOptions = {}
): CppAuthDetectionResult {
  const patterns: CppAuthPattern[] = [];
  const issues: CppAuthIssue[] = [];

  // JWT patterns
  if (options.includeJwt !== false) {
    detectJwtPatterns(source, filePath, patterns);
  }

  // Authorization header patterns
  detectAuthHeaderPatterns(source, filePath, patterns);

  // Session patterns
  if (options.includeSessions !== false) {
    detectSessionPatterns(source, filePath, patterns);
  }

  // RBAC patterns
  if (options.includeRbac !== false) {
    detectRbacPatterns(source, filePath, patterns);
  }

  // OAuth patterns
  detectOAuthPatterns(source, filePath, patterns);

  // Security issues
  detectSecurityIssues(source, filePath, issues);

  return { patterns, issues };
}


// ============================================================================
// Pattern Detection Functions
// ============================================================================

function detectJwtPatterns(
  source: string,
  filePath: string,
  patterns: CppAuthPattern[]
): void {
  let match;

  // jwt-cpp decode
  while ((match = JWT_CPP_DECODE_PATTERN.exec(source)) !== null) {
    const line = getLineNumber(source, match.index);
    patterns.push({
      id: `cpp-jwt-decode-${filePath}:${line}`,
      name: 'cpp-jwt-decode',
      category: 'auth' as PatternCategory,
      file: filePath,
      line,
      column: 0,
      context: 'jwt::decode()',
      confidence: 0.95,
      framework: 'jwt-cpp',
      authType: 'jwt',
    });
  }

  // jwt-cpp verify
  JWT_CPP_VERIFY_PATTERN.lastIndex = 0;
  while ((match = JWT_CPP_VERIFY_PATTERN.exec(source)) !== null) {
    const line = getLineNumber(source, match.index);
    patterns.push({
      id: `cpp-jwt-verify-${filePath}:${line}`,
      name: 'cpp-jwt-verify',
      category: 'auth' as PatternCategory,
      file: filePath,
      line,
      column: 0,
      context: 'jwt::verify()',
      confidence: 0.95,
      framework: 'jwt-cpp',
      authType: 'jwt',
    });
  }

  // jwt-cpp create
  JWT_CPP_CREATE_PATTERN.lastIndex = 0;
  while ((match = JWT_CPP_CREATE_PATTERN.exec(source)) !== null) {
    const line = getLineNumber(source, match.index);
    patterns.push({
      id: `cpp-jwt-create-${filePath}:${line}`,
      name: 'cpp-jwt-create',
      category: 'auth' as PatternCategory,
      file: filePath,
      line,
      column: 0,
      context: 'jwt::create()',
      confidence: 0.95,
      framework: 'jwt-cpp',
      authType: 'jwt',
    });
  }

  // JWT claims
  JWT_CLAIMS_PATTERN.lastIndex = 0;
  while ((match = JWT_CLAIMS_PATTERN.exec(source)) !== null) {
    const claim = match[1] ?? 'unknown';
    const line = getLineNumber(source, match.index);
    patterns.push({
      id: `cpp-jwt-claim-${filePath}:${line}`,
      name: 'cpp-jwt-claim',
      category: 'auth' as PatternCategory,
      file: filePath,
      line,
      column: 0,
      context: `.set_payload_claim("${claim}")`,
      confidence: 0.9,
      framework: 'jwt-cpp',
      authType: 'jwt',
    });
  }

  // libjwt decode
  LIBJWT_DECODE_PATTERN.lastIndex = 0;
  while ((match = LIBJWT_DECODE_PATTERN.exec(source)) !== null) {
    const line = getLineNumber(source, match.index);
    patterns.push({
      id: `cpp-libjwt-decode-${filePath}:${line}`,
      name: 'cpp-libjwt-decode',
      category: 'auth' as PatternCategory,
      file: filePath,
      line,
      column: 0,
      context: 'jwt_decode()',
      confidence: 0.95,
      framework: 'libjwt',
      authType: 'jwt',
    });
  }

  // libjwt encode
  LIBJWT_ENCODE_PATTERN.lastIndex = 0;
  while ((match = LIBJWT_ENCODE_PATTERN.exec(source)) !== null) {
    const line = getLineNumber(source, match.index);
    patterns.push({
      id: `cpp-libjwt-encode-${filePath}:${line}`,
      name: 'cpp-libjwt-encode',
      category: 'auth' as PatternCategory,
      file: filePath,
      line,
      column: 0,
      context: 'jwt_encode_str()',
      confidence: 0.95,
      framework: 'libjwt',
      authType: 'jwt',
    });
  }
}

function detectAuthHeaderPatterns(
  source: string,
  filePath: string,
  patterns: CppAuthPattern[]
): void {
  let match;

  // Authorization header
  while ((match = AUTH_HEADER_PATTERN.exec(source)) !== null) {
    const line = getLineNumber(source, match.index);
    patterns.push({
      id: `cpp-auth-header-${filePath}:${line}`,
      name: 'cpp-auth-header',
      category: 'auth' as PatternCategory,
      file: filePath,
      line,
      column: 0,
      context: 'Authorization header',
      confidence: 0.85,
      framework: 'http',
      authType: 'bearer',
    });
  }

  // Bearer token
  BEARER_PATTERN.lastIndex = 0;
  while ((match = BEARER_PATTERN.exec(source)) !== null) {
    const line = getLineNumber(source, match.index);
    patterns.push({
      id: `cpp-bearer-${filePath}:${line}`,
      name: 'cpp-bearer-token',
      category: 'auth' as PatternCategory,
      file: filePath,
      line,
      column: 0,
      context: 'Bearer token',
      confidence: 0.9,
      framework: 'http',
      authType: 'bearer',
    });
  }

  // Basic auth
  BASIC_AUTH_PATTERN.lastIndex = 0;
  while ((match = BASIC_AUTH_PATTERN.exec(source)) !== null) {
    const line = getLineNumber(source, match.index);
    patterns.push({
      id: `cpp-basic-auth-${filePath}:${line}`,
      name: 'cpp-basic-auth',
      category: 'auth' as PatternCategory,
      file: filePath,
      line,
      column: 0,
      context: 'Basic auth',
      confidence: 0.9,
      framework: 'http',
      authType: 'basic',
    });
  }

  // API Key header
  API_KEY_HEADER_PATTERN.lastIndex = 0;
  while ((match = API_KEY_HEADER_PATTERN.exec(source)) !== null) {
    const line = getLineNumber(source, match.index);
    patterns.push({
      id: `cpp-api-key-${filePath}:${line}`,
      name: 'cpp-api-key',
      category: 'auth' as PatternCategory,
      file: filePath,
      line,
      column: 0,
      context: 'API Key header',
      confidence: 0.9,
      framework: 'http',
      authType: 'api-key',
    });
  }

  // API Key query param
  API_KEY_QUERY_PATTERN.lastIndex = 0;
  while ((match = API_KEY_QUERY_PATTERN.exec(source)) !== null) {
    const line = getLineNumber(source, match.index);
    patterns.push({
      id: `cpp-api-key-query-${filePath}:${line}`,
      name: 'cpp-api-key-query',
      category: 'auth' as PatternCategory,
      file: filePath,
      line,
      column: 0,
      context: 'API Key query param',
      confidence: 0.85,
      framework: 'http',
      authType: 'api-key',
    });
  }
}

function detectSessionPatterns(
  source: string,
  filePath: string,
  patterns: CppAuthPattern[]
): void {
  let match;

  // Session access
  while ((match = SESSION_PATTERN.exec(source)) !== null) {
    const key = match[1] ?? 'unknown';
    const line = getLineNumber(source, match.index);
    patterns.push({
      id: `cpp-session-${filePath}:${line}`,
      name: 'cpp-session-access',
      category: 'auth' as PatternCategory,
      file: filePath,
      line,
      column: 0,
      context: `session["${key}"]`,
      confidence: 0.85,
      framework: 'session',
      authType: 'session',
    });
  }

  // Cookie handling
  COOKIE_PATTERN.lastIndex = 0;
  while ((match = COOKIE_PATTERN.exec(source)) !== null) {
    const line = getLineNumber(source, match.index);
    patterns.push({
      id: `cpp-cookie-${filePath}:${line}`,
      name: 'cpp-cookie',
      category: 'auth' as PatternCategory,
      file: filePath,
      line,
      column: 0,
      context: 'Cookie handling',
      confidence: 0.8,
      framework: 'http',
      authType: 'session',
    });
  }
}

function detectRbacPatterns(
  source: string,
  filePath: string,
  patterns: CppAuthPattern[]
): void {
  let match;

  // Role checks
  while ((match = ROLE_CHECK_PATTERN.exec(source)) !== null) {
    const line = getLineNumber(source, match.index);
    patterns.push({
      id: `cpp-role-check-${filePath}:${line}`,
      name: 'cpp-role-check',
      category: 'auth' as PatternCategory,
      file: filePath,
      line,
      column: 0,
      context: match[0].trim(),
      confidence: 0.85,
      framework: 'rbac',
      authType: 'rbac',
    });
  }

  // Permission checks
  PERMISSION_CHECK_PATTERN.lastIndex = 0;
  while ((match = PERMISSION_CHECK_PATTERN.exec(source)) !== null) {
    const line = getLineNumber(source, match.index);
    patterns.push({
      id: `cpp-permission-check-${filePath}:${line}`,
      name: 'cpp-permission-check',
      category: 'auth' as PatternCategory,
      file: filePath,
      line,
      column: 0,
      context: match[0].trim(),
      confidence: 0.85,
      framework: 'rbac',
      authType: 'permission',
    });
  }
}

function detectOAuthPatterns(
  source: string,
  filePath: string,
  patterns: CppAuthPattern[]
): void {
  let match;

  // OAuth tokens
  while ((match = OAUTH_TOKEN_PATTERN.exec(source)) !== null) {
    const line = getLineNumber(source, match.index);
    patterns.push({
      id: `cpp-oauth-token-${filePath}:${line}`,
      name: 'cpp-oauth-token',
      category: 'auth' as PatternCategory,
      file: filePath,
      line,
      column: 0,
      context: 'OAuth token',
      confidence: 0.85,
      framework: 'oauth',
      authType: 'oauth',
    });
  }

  // OAuth scope
  OAUTH_SCOPE_PATTERN.lastIndex = 0;
  while ((match = OAUTH_SCOPE_PATTERN.exec(source)) !== null) {
    const line = getLineNumber(source, match.index);
    patterns.push({
      id: `cpp-oauth-scope-${filePath}:${line}`,
      name: 'cpp-oauth-scope',
      category: 'auth' as PatternCategory,
      file: filePath,
      line,
      column: 0,
      context: 'OAuth scope',
      confidence: 0.8,
      framework: 'oauth',
      authType: 'oauth',
    });
  }
}

function detectSecurityIssues(
  source: string,
  filePath: string,
  issues: CppAuthIssue[]
): void {
  let match;

  // Hardcoded secrets
  while ((match = HARDCODED_SECRET_PATTERN.exec(source)) !== null) {
    const line = getLineNumber(source, match.index);
    issues.push({
      type: 'hardcoded-secret',
      message: 'Potential hardcoded secret detected',
      file: filePath,
      line,
      suggestion: 'Use environment variables or a secrets manager',
    });
  }

  // Weak algorithms
  WEAK_ALGORITHM_PATTERN.lastIndex = 0;
  while ((match = WEAK_ALGORITHM_PATTERN.exec(source)) !== null) {
    const line = getLineNumber(source, match.index);
    issues.push({
      type: 'weak-auth',
      message: 'Weak JWT algorithm detected (HS256 or none)',
      file: filePath,
      line,
      suggestion: 'Use RS256 or ES256 for production',
    });
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function getLineNumber(source: string, index: number): number {
  return source.slice(0, index).split('\n').length;
}

/**
 * Check if source has C++ authentication patterns
 */
export function hasCppAuthPatterns(source: string): boolean {
  return JWT_CPP_DECODE_PATTERN.test(source) ||
         JWT_CPP_VERIFY_PATTERN.test(source) ||
         LIBJWT_DECODE_PATTERN.test(source) ||
         AUTH_HEADER_PATTERN.test(source) ||
         source.includes('Authorization') ||
         source.includes('Bearer');
}
