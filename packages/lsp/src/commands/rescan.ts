/**
 * Rescan Command - drift.rescan
 * @requirements 28.7
 */

import type { ServerContext, DocumentScanner, DiagnosticPublisher, CommandResult } from '../server/types.js';

/**
 * Execute rescan command
 * Rescans documents for drift violations
 */
export async function executeRescan(
  context: ServerContext,
  scanner: DocumentScanner,
  diagnosticPublisher: DiagnosticPublisher,
  uri?: string
): Promise<CommandResult> {
  const { state, logger, connection } = context;

  logger.info(`Rescan requested${uri ? ` for: ${uri}` : ' for all documents'}`);

  // Clear caches
  if (uri) {
    scanner.invalidate(uri);
  } else {
    scanner.clearCache();
  }

  // Note: withProgress is not available in vscode-languageserver
  // Show a simple message instead
  const documentsToScan = uri
    ? [uri].filter((u) => state.documents.has(u))
    : Array.from(state.documents.keys());

  if (documentsToScan.length === 0) {
    return {
      success: true,
      message: 'No documents to scan',
      data: { scannedCount: 0 },
    };
  }

  connection.window.showInformationMessage(`Rescanning ${documentsToScan.length} document(s)...`);

  let scannedCount = 0;
  let totalViolations = 0;

  for (const docUri of documentsToScan) {
    try {
      // Publish diagnostics (which triggers scan)
      await diagnosticPublisher.publish(docUri);
      scannedCount++;

      // Count violations
      const violations = state.violations.get(docUri) ?? [];
      totalViolations += violations.length;
    } catch (error) {
      logger.error(`Error scanning ${docUri}: ${error}`);
    }
  }

  // Show summary
  const message = `Rescan complete: ${scannedCount} document${scannedCount === 1 ? '' : 's'} scanned, ${totalViolations} violation${totalViolations === 1 ? '' : 's'} found`;

  connection.window.showInformationMessage(message);

  logger.info(message);

  return {
    success: true,
    message,
    data: {
      scannedCount,
      totalViolations,
      documentsScanned: documentsToScan.slice(0, scannedCount),
    },
  };
}

/**
 * Execute rescan for specific patterns
 */
export async function executeRescanPatterns(
  context: ServerContext,
  scanner: DocumentScanner,
  diagnosticPublisher: DiagnosticPublisher,
  patternIds: string[]
): Promise<CommandResult> {
  const { state, logger } = context;

  logger.info(`Rescan requested for patterns: ${patternIds.join(', ')}`);

  // Clear all caches (pattern-specific invalidation not supported yet)
  scanner.clearCache();

  // Rescan all documents
  const result = await executeRescan(context, scanner, diagnosticPublisher);

  // Filter results to only include specified patterns
  if (result.success && result.data) {
    const data = result.data as { scannedCount: number; totalViolations: number };

    // Count violations for specified patterns only
    let patternViolations = 0;
    for (const violations of state.violations.values()) {
      patternViolations += violations.filter((v) => patternIds.includes(v.patternId)).length;
    }

    return {
      success: true,
      message: `Rescan complete: ${data.scannedCount} documents scanned, ${patternViolations} violations found for specified patterns`,
      data: {
        ...data,
        patternIds,
        patternViolations,
      },
    };
  }

  return result;
}

/**
 * Execute incremental rescan for changed files
 */
export async function executeIncrementalRescan(
  context: ServerContext,
  scanner: DocumentScanner,
  diagnosticPublisher: DiagnosticPublisher,
  changedUris: string[]
): Promise<CommandResult> {
  const { logger } = context;

  logger.info(`Incremental rescan for ${changedUris.length} changed files`);

  // Invalidate changed files
  for (const uri of changedUris) {
    scanner.invalidate(uri);
  }

  // Rescan only changed files
  let scannedCount = 0;
  let totalViolations = 0;

  for (const uri of changedUris) {
    try {
      await diagnosticPublisher.publish(uri);
      scannedCount++;

      const violations = context.state.violations.get(uri) ?? [];
      totalViolations += violations.length;
    } catch (error) {
      logger.error(`Error scanning ${uri}: ${error}`);
    }
  }

  return {
    success: true,
    message: `Incremental rescan complete: ${scannedCount} files, ${totalViolations} violations`,
    data: {
      scannedCount,
      totalViolations,
      changedUris,
    },
  };
}
