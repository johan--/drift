/**
 * LSP Handlers Module
 *
 * Exports all LSP request and notification handlers.
 *
 * @requirements 27.1-27.7 - LSP Server Core Capabilities
 * @requirements 28.1-28.9 - LSP Server Commands
 */

export { createInitializeHandler } from './initialize.js';
export type { InitializeHandler } from './initialize.js';

export { createDocumentSyncHandler } from './document-sync.js';
export type { DocumentSyncHandler } from './document-sync.js';

export { createDiagnosticsHandler } from './diagnostics.js';
export type { DiagnosticsHandler, ViolationDiagnostic } from './diagnostics.js';

export { createCodeActionsHandler } from './code-actions.js';
export type { CodeActionsHandler } from './code-actions.js';

export { createHoverHandler } from './hover.js';
export type { HoverHandler } from './hover.js';

export { createCodeLensHandler } from './code-lens.js';
export type { CodeLensHandler } from './code-lens.js';

export { createCommandsHandler } from './commands.js';
export type { CommandsHandler, CommandResult } from './commands.js';
