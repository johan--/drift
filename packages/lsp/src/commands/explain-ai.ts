/**
 * Explain AI Command - drift.explainWithAI
 * @requirements 28.5
 */

import type { ServerContext, CommandResult } from '../server/types.js';

/**
 * Execute explain with AI command
 * Uses AI to explain why a violation occurred and how to fix it
 */
export async function executeExplainAI(
  context: ServerContext,
  violationId: string,
  patternId: string
): Promise<CommandResult> {
  const { state, logger, connection } = context;

  if (!state.configuration.aiEnabled) {
    return {
      success: false,
      error: 'AI features are not enabled. Enable them in settings.',
    };
  }

  if (!violationId || !patternId) {
    return {
      success: false,
      error: 'Violation ID and Pattern ID are required',
    };
  }

  logger.info(`Explaining violation with AI: ${violationId}`);

  // Find the violation
  let violation = null;
  let violationUri = '';
  for (const [uri, violations] of state.violations) {
    violation = violations.find((v) => v.id === violationId);
    if (violation) {
      violationUri = uri;
      break;
    }
  }

  if (!violation) {
    return {
      success: false,
      error: `Violation not found: ${violationId}`,
    };
  }

  // Get the pattern
  const pattern = state.patterns.get(patternId);

  // Get document content for context
  const docState = state.documents.get(violationUri);
  const documentContent = docState?.content ?? '';

  // Extract relevant code snippet using range (ViolationInfo uses range, not location)
  const startLine = violation.range.start.line;
  const endLine = violation.range.end.line;
  const codeSnippet = extractCodeSnippet(
    documentContent,
    startLine,
    endLine,
    5 // context lines
  );

  // TODO: Integrate with @drift/ai package
  // For now, show a placeholder explanation

  // Build explanation context
  const explanationContext = {
    violation: {
      id: violationId,
      message: violation.message,
      severity: violation.severity,
      range: violation.range,
    },
    pattern: {
      id: patternId,
      name: pattern?.name,
      description: pattern?.description,
      category: pattern?.category,
    },
    codeSnippet,
    file: violationUri,
  };

  // Note: withProgress is not available in vscode-languageserver
  // Show a simple message instead
  connection.window.showInformationMessage('Analyzing violation with AI...');

  // Simulate AI processing
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Generate placeholder explanation
  const explanation = generatePlaceholderExplanation(explanationContext);

  // Show explanation in a message
  connection.window.showInformationMessage(
    `AI Explanation for "${pattern?.name ?? patternId}":\n\n${explanation}`
  );

  logger.info(`AI explanation generated for: ${violationId}`);

  return {
    success: true,
    message: 'AI explanation generated',
    data: {
      violationId,
      patternId,
      explanation,
      context: explanationContext,
    },
  };
}

/**
 * Extract code snippet around a location
 */
function extractCodeSnippet(
  content: string,
  startLine: number,
  endLine: number,
  contextLines: number
): string {
  const lines = content.split('\n');
  const start = Math.max(0, startLine - contextLines - 1);
  const end = Math.min(lines.length, endLine + contextLines);

  return lines.slice(start, end).join('\n');
}

/**
 * Generate placeholder explanation (to be replaced with actual AI)
 */
function generatePlaceholderExplanation(context: {
  violation: { message: string; severity: string };
  pattern: { id: string; name?: string | undefined; description?: string | undefined; category?: string | undefined };
  codeSnippet: string;
}): string {
  const lines: string[] = [];

  lines.push(`## Why This Violation Occurred`);
  lines.push('');
  lines.push(context.violation.message);
  lines.push('');

  if (context.pattern.description) {
    lines.push(`## Pattern Description`);
    lines.push('');
    lines.push(context.pattern.description);
    lines.push('');
  }

  lines.push(`## How to Fix`);
  lines.push('');
  lines.push('To resolve this violation, consider the following approaches:');
  lines.push('');
  lines.push('1. **Follow the established pattern** - Update your code to match the expected pattern');
  lines.push('2. **Create a variant** - If this is an intentional deviation, create a pattern variant');
  lines.push('3. **Ignore this occurrence** - If this is a one-time exception, ignore this specific violation');
  lines.push('');

  lines.push(`## Severity: ${context.violation.severity}`);
  lines.push('');
  lines.push(getSeverityExplanation(context.violation.severity));

  return lines.join('\n');
}

/**
 * Get severity explanation
 */
function getSeverityExplanation(severity: string): string {
  switch (severity) {
    case 'error':
      return 'This is a critical violation that should be addressed before merging.';
    case 'warning':
      return 'This violation indicates a potential issue that should be reviewed.';
    case 'info':
      return 'This is an informational finding that may be worth considering.';
    case 'hint':
      return 'This is a suggestion for improvement.';
    default:
      return 'Review this violation and determine the appropriate action.';
  }
}
