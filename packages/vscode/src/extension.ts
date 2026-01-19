/**
 * @drift/vscode - VS Code extension for Drift
 *
 * This extension provides:
 * - LSP client integration
 * - Violation highlighting
 * - Quick fix actions
 * - Pattern management panels
 * - Status bar integration
 */

import * as vscode from 'vscode';

// Export version
export const VERSION = '0.0.1';

/**
 * Activates the Drift extension
 */
export function activate(_context: vscode.ExtensionContext): void {
  console.log('Drift extension is now active');

  // Placeholder - LSP client will be initialized in subsequent tasks
  // The _context parameter will be used when initializing the LSP client
}

/**
 * Deactivates the Drift extension
 */
export function deactivate(): void {
  console.log('Drift extension is now deactivated');
}
