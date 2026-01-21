/**
 * ASP.NET Core Auth Detectors
 *
 * C#-specific authentication and authorization pattern detectors.
 * 
 * This module exports both legacy regex-based detectors and new semantic learning detectors.
 * The semantic versions (with -semantic suffix) are recommended for new usage as they:
 * - Learn patterns from your codebase rather than using fixed regex
 * - Provide better context-aware filtering to reduce false positives
 * - Support pattern consistency checking and violation detection
 */

// ============================================================================
// Legacy Regex-Based Detectors (kept for backward compatibility)
// ============================================================================

export {
  AuthorizeAttributeDetector,
  createAuthorizeAttributeDetector,
  type AuthorizeAttributeInfo,
  type AuthorizationAnalysis,
} from './authorize-attribute-detector.js';

export {
  IdentityPatternsDetector,
  createIdentityPatternsDetector,
  type IdentityUsageInfo,
  type IdentityAnalysis,
} from './identity-patterns-detector.js';

export {
  JwtPatternsDetector,
  createJwtPatternsDetector,
  type JwtPatternInfo,
  type JwtAnalysis,
} from './jwt-patterns-detector.js';

export {
  PolicyHandlersDetector,
  createPolicyHandlersDetector,
  type PolicyHandlerInfo,
  type PolicyAnalysis,
} from './policy-handlers-detector.js';

export {
  ResourceAuthorizationDetector,
  createResourceAuthorizationDetector,
  type ResourceAuthInfo,
  type ResourceAuthAnalysis,
} from './resource-authorization-detector.js';

// ============================================================================
// Semantic Learning Detectors (recommended)
// ============================================================================

export {
  AuthorizeAttributeSemanticDetector,
  createAuthorizeAttributeSemanticDetector,
} from './authorize-attribute-semantic.js';

export {
  IdentityPatternsSemanticDetector,
  createIdentityPatternsSemanticDetector,
} from './identity-patterns-semantic.js';

export {
  JwtPatternsSemanticDetector,
  createJwtPatternsSemanticDetector,
} from './jwt-patterns-semantic.js';

export {
  PolicyHandlersSemanticDetector,
  createPolicyHandlersSemanticDetector,
} from './policy-handlers-semantic.js';

export {
  ResourceAuthorizationSemanticDetector,
  createResourceAuthorizationSemanticDetector,
} from './resource-authorization-semantic.js';

