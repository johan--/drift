/**
 * @drift/detectors - Pattern detectors for Drift
 *
 * This package provides modular, pluggable pattern detectors:
 * - Registry: Detector registration and lazy loading
 * - Base: Abstract detector classes
 * - Structural: File naming, directory structure, imports
 * - Components: React/Vue component patterns
 * - Styling: Design tokens, CSS patterns
 * - API: Route structure, response formats
 * - Auth: Authentication and authorization patterns
 * - Errors: Exception handling patterns
 * - Data Access: Database patterns
 * - Testing: Test patterns
 * - Logging: Observability patterns
 * - Security: Security patterns
 * - Config: Configuration patterns
 * - Types: Type definition patterns
 * - Performance: Performance patterns
 * - Accessibility: A11y patterns
 * - Documentation: Documentation patterns
 */

// Export version
export const VERSION = '0.0.1';

// Registry exports
export * from './registry/index.js';

// Base exports
export * from './base/index.js';
