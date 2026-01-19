/**
 * Show Violations Command - drift.showViolations
 * @requirements 28.9
 */

import type { ServerContext, CommandResult, ViolationInfo } from '../server/types.js';

// ============================================================================
// Types
// ============================================================================

interface ViolationEntry {
  uri: string;
  violation: ViolationInfo;
}

interface SeverityGroups {
  error: ViolationEntry[];
  warning: ViolationEntry[];
  info: ViolationEntry[];
  hint: ViolationEntry[];
}

// ============================================================================
// Main Command
// ============================================================================

/**
 * Execute show violations command
 * Shows violations in the workspace
 */
export async function executeShowViolations(
  context: ServerContext,
  uri?: string,
  patternId?: string,
  violationId?: string
): Promise<CommandResult> {
  const { state, logger, connection } = context;

  logger.info(`Show violations requested${uri ? ` for: ${uri}` : ''}${patternId ? ` pattern: ${patternId}` : ''}`);

  // If specific violation requested
  if (violationId) {
    return showSpecificViolation(context, violationId);
  }

  // Get violations to show
  let violations: ViolationEntry[] = [];

  if (uri) {
    // Violations for specific document
    const docViolations = state.violations.get(uri) ?? [];
    violations = docViolations.map((v) => ({ uri, violation: v }));
  } else {
    // All violations
    for (const [docUri, docViolations] of state.violations) {
      for (const v of docViolations) {
        violations.push({ uri: docUri, violation: v });
      }
    }
  }

  // Filter by pattern if specified
  if (patternId) {
    violations = violations.filter((entry) => entry.violation.patternId === patternId);
  }

  if (violations.length === 0) {
    const message = uri
      ? `No violations found in ${getFileName(uri)}`
      : patternId
        ? `No violations found for pattern: ${patternId}`
        : 'No violations found in workspace';

    connection.window.showInformationMessage(message);

    return {
      success: true,
      message,
      data: { violations: [] },
    };
  }

  // Format violations summary
  const summary = formatViolationsSummary(violations, state.patterns);

  // Show summary
  connection.window.showInformationMessage(summary);

  return {
    success: true,
    message: `Found ${violations.length} violations`,
    data: {
      violations: violations.map((v) => ({
        uri: v.uri,
        ...v.violation,
      })),
      summary: getViolationStatistics(violations),
    },
  };
}

/**
 * Show specific violation details
 */
async function showSpecificViolation(
  context: ServerContext,
  violationId: string
): Promise<CommandResult> {
  const { state, logger, connection } = context;

  // Find the violation
  let foundViolation: ViolationInfo | null = null;
  let foundUri = '';

  for (const [uri, violations] of state.violations) {
    const violation = violations.find((v) => v.id === violationId);
    if (violation) {
      foundViolation = violation;
      foundUri = uri;
      break;
    }
  }

  if (!foundViolation) {
    return {
      success: false,
      error: `Violation not found: ${violationId}`,
    };
  }

  // Get pattern details
  const pattern = state.patterns.get(foundViolation.patternId);

  // Format violation details
  const details = formatViolationDetails(foundViolation, foundUri, pattern);

  // Show details
  connection.window.showInformationMessage(details);

  // Offer to navigate to violation
  const navigateResult = await connection.window.showInformationMessage(
    `Navigate to violation at line ${foundViolation.range.start.line + 1}?`,
    { title: 'Go to Location' },
    { title: 'Close' }
  );

  if (navigateResult?.title === 'Go to Location') {
    // TODO: Send notification to client to navigate to location
    logger.info(`Navigate to ${foundUri}:${foundViolation.range.start.line + 1}`);
  }

  return {
    success: true,
    message: `Violation details for: ${violationId}`,
    data: {
      violation: foundViolation,
      uri: foundUri,
      pattern,
    },
  };
}

/**
 * Format violations summary
 */
function formatViolationsSummary(
  violations: ViolationEntry[],
  patterns: Map<string, { name?: string }>
): string {
  const lines: string[] = [];

  lines.push(`⚠️ Drift Violations Summary`);
  lines.push('');

  // Group by severity
  const bySeverity = groupBySeverity(violations);

  if (bySeverity.error.length > 0) {
    lines.push(`🔴 Errors: ${bySeverity.error.length}`);
  }
  if (bySeverity.warning.length > 0) {
    lines.push(`🟡 Warnings: ${bySeverity.warning.length}`);
  }
  if (bySeverity.info.length > 0) {
    lines.push(`🔵 Info: ${bySeverity.info.length}`);
  }
  if (bySeverity.hint.length > 0) {
    lines.push(`💡 Hints: ${bySeverity.hint.length}`);
  }

  lines.push('');

  // Group by pattern
  const byPattern = groupByPattern(violations);
  const patternCount = byPattern.size;

  lines.push(`Across ${patternCount} pattern${patternCount === 1 ? '' : 's'}:`);
  lines.push('');

  for (const [patternId, patternViolations] of byPattern) {
    const pattern = patterns.get(patternId);
    const name = pattern?.name ?? patternId;
    lines.push(`  • ${name}: ${patternViolations.length}`);
  }

  // Group by file
  const byFile = groupByFile(violations);
  const fileCount = byFile.size;

  lines.push('');
  lines.push(`In ${fileCount} file${fileCount === 1 ? '' : 's'}`);

  return lines.join('\n');
}

/**
 * Format violation details
 */
function formatViolationDetails(
  violation: ViolationInfo,
  uri: string,
  pattern?: { name?: string; description?: string; category?: string }
): string {
  const lines: string[] = [];

  const severityIcon = getSeverityIcon(violation.severity);
  lines.push(`${severityIcon} Violation Details`);
  lines.push('');

  lines.push(`Message: ${violation.message}`);
  lines.push(`Severity: ${violation.severity}`);
  lines.push(`Location: ${getFileName(uri)}:${violation.range.start.line + 1}:${violation.range.start.character + 1}`);
  lines.push('');

  if (pattern) {
    lines.push(`Pattern: ${pattern.name ?? violation.patternId}`);
    if (pattern.category) {
      lines.push(`Category: ${pattern.category}`);
    }
    if (pattern.description) {
      lines.push(`Description: ${pattern.description}`);
    }
  } else {
    lines.push(`Pattern ID: ${violation.patternId}`);
  }

  return lines.join('\n');
}

/**
 * Group violations by severity
 */
function groupBySeverity(violations: ViolationEntry[]): SeverityGroups {
  const groups: SeverityGroups = {
    error: [],
    warning: [],
    info: [],
    hint: [],
  };

  for (const v of violations) {
    const severity = v.violation.severity as keyof SeverityGroups;
    if (severity in groups) {
      groups[severity].push(v);
    } else {
      groups.hint.push(v);
    }
  }

  return groups;
}

/**
 * Group violations by pattern
 */
function groupByPattern(violations: ViolationEntry[]): Map<string, ViolationEntry[]> {
  const groups = new Map<string, ViolationEntry[]>();

  for (const v of violations) {
    const patternId = v.violation.patternId;
    const group = groups.get(patternId) ?? [];
    group.push(v);
    groups.set(patternId, group);
  }

  return groups;
}

/**
 * Group violations by file
 */
function groupByFile(violations: ViolationEntry[]): Map<string, ViolationEntry[]> {
  const groups = new Map<string, ViolationEntry[]>();

  for (const v of violations) {
    const group = groups.get(v.uri) ?? [];
    group.push(v);
    groups.set(v.uri, group);
  }

  return groups;
}

/**
 * Get violation statistics
 */
function getViolationStatistics(
  violations: Array<{ uri: string; violation: { patternId: string; severity: string } }>
): {
  total: number;
  bySeverity: Record<string, number>;
  byPattern: Record<string, number>;
  byFile: Record<string, number>;
} {
  const bySeverity: Record<string, number> = {};
  const byPattern: Record<string, number> = {};
  const byFile: Record<string, number> = {};

  for (const v of violations) {
    bySeverity[v.violation.severity] = (bySeverity[v.violation.severity] ?? 0) + 1;
    byPattern[v.violation.patternId] = (byPattern[v.violation.patternId] ?? 0) + 1;
    byFile[v.uri] = (byFile[v.uri] ?? 0) + 1;
  }

  return {
    total: violations.length,
    bySeverity,
    byPattern,
    byFile,
  };
}

/**
 * Get severity icon
 */
function getSeverityIcon(severity: string): string {
  switch (severity) {
    case 'error': return '🔴';
    case 'warning': return '🟡';
    case 'info': return '🔵';
    case 'hint': return '💡';
    default: return '⚪';
  }
}

/**
 * Get file name from URI
 */
function getFileName(uri: string): string {
  return uri.split('/').pop() ?? uri;
}
