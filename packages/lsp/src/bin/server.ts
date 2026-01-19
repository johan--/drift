#!/usr/bin/env node
/**
 * Drift LSP Server Entry Point
 *
 * This is the executable entry point for the Drift LSP server.
 * It can be run directly or spawned by an editor extension.
 *
 * Usage:
 *   drift-lsp [--debug]
 */

import { startDriftServer } from '../server.js';

// Parse command line arguments
const args = process.argv.slice(2);
const debug = args.includes('--debug') || args.includes('-d');

// Start the server
const server = startDriftServer({ debug });

// Handle process signals
process.on('SIGINT', () => {
  server.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  server.stop();
  process.exit(0);
});
