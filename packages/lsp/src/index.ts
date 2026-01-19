/**
 * @drift/lsp - Language Server Protocol implementation for Drift
 *
 * Provides LSP server capabilities for IDE integration:
 * - Document synchronization (open, change, save, close)
 * - Diagnostic publishing for violations
 * - Code actions for quick fixes
 * - Hover information for violations
 * - Code lens for pattern information
 * - Command handling for pattern management
 *
 * @requirements 27.1-27.7 - LSP Server Core Capabilities
 * @requirements 28.1-28.9 - LSP Server Commands
 */

export const VERSION = '0.0.1';

// Server exports
export { createDriftServer, startDriftServer } from './server.js';
export type { DriftServer, ServerOptions } from './server.js';

// Capabilities exports
export { buildServerCapabilities, DRIFT_COMMANDS, SERVER_INFO } from './capabilities.js';

// Handler exports
export * from './handlers/index.js';

// Utility exports
export * from './utils/index.js';

// Integration exports
export * from './integration/index.js';
