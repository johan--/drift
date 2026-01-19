/**
 * Fix AI Command - drift.fixWithAI
 * @requirements 28.6
 */

import type { ServerContext, CommandResult } from '../server/types.js';

/**
 * Execute fix with AI command
 * Uses AI to generate a fix for a violation
 */
export async function executeFixAI(
  context: ServerContext,
  violationId: string,
  uri: string
): Promise<CommandResult> {
  const { state, logger, connection } = context;

  if (!state.configuration.aiEnabled) {
    return {
      success: false,
      error: 'AI features are not enabled. Enable them in settings.',
    };
  }

  if (!violationId || !uri) {
    return {
      success: false,
      error: 'Violation ID and document URI are required',
    };
  }

  logger.info(`Fixing violation with AI: ${violationId}`);

  // Find the violation
  const violations = state.violations.get(uri);
  const violation = violations?.find((v) => v.id === violationId);

  if (!violation) {
    return {
      success: false,
      error: `Violation not found: ${violationId}`,
    };
  }

  // Get the pattern
  const pattern = state.patterns.get(violation.patternId);

  // Get document content
  const docState = state.documents.get(uri);
  if (!docState) {
    return {
      success: false,
      error: `Document not found: ${uri}`,
    };
  }

  // Extract code to fix using range (ViolationInfo uses range, not location)
  const startLine = violation.range.start.line;
  const endLine = violation.range.end.line;
  const codeToFix = extractCodeToFix(
    docState.content,
    startLine,
    endLine
  );

  // Build fix context
  const fixContext = {
    violation: {
      id: violationId,
      message: violation.message,
      patternId: violation.patternId,
      range: violation.range,
    },
    pattern: {
      id: violation.patternId,
      name: pattern?.name,
      description: pattern?.description,
    },
    code: codeToFix,
    language: docState.languageId,
    file: uri,
  };

  // Show confirmation dialog
  const confirmResult = await connection.window.showInformationMessage(
    `AI will analyze and suggest a fix for:\n\n"${violation.message}"\n\nThis will send code context to the AI provider. Continue?`,
    { title: 'Continue' },
    { title: 'Cancel' }
  );

  if (confirmResult?.title !== 'Continue') {
    return {
      success: false,
      error: 'Fix cancelled by user',
    };
  }

  // Note: withProgress is not available in vscode-languageserver
  // Show a simple message instead
  connection.window.showInformationMessage('Generating AI fix...');

  // Simulate AI processing
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Generate placeholder fix
  const suggestedFix = generatePlaceholderFix(fixContext);

  // Show fix preview and ask for confirmation
  const applyResult = await connection.window.showInformationMessage(
    `AI suggested the following fix:\n\n${suggestedFix}\n\nApply this fix?`,
    { title: 'Apply' },
    { title: 'Cancel' }
  );

  if (applyResult?.title === 'Apply') {
    // Apply the fix
    const edit = createFixEdit(uri, violation.range, suggestedFix);

    const applied = await connection.workspace.applyEdit({
      label: `AI Fix: ${violation.message}`,
      edit,
    });

    if (applied) {
      logger.info(`AI fix applied for: ${violationId}`);
      return {
        success: true,
        message: 'AI fix applied successfully',
        data: {
          violationId,
          uri,
          fix: suggestedFix,
        },
      };
    } else {
      return {
        success: false,
        error: 'Failed to apply fix',
      };
    }
  }

  return {
    success: false,
    error: 'Fix cancelled by user',
  };
}

/**
 * Extract code to fix from document
 */
function extractCodeToFix(
  content: string,
  startLine: number,
  endLine: number
): string {
  const lines = content.split('\n');
  return lines.slice(startLine - 1, endLine).join('\n');
}

/**
 * Generate placeholder fix (to be replaced with actual AI)
 */
function generatePlaceholderFix(context: {
  violation: { message: string };
  pattern: { name?: string | undefined };
  code: string;
  language: string;
}): string {
  // This is a placeholder - actual implementation would call AI
  return `// TODO: AI-generated fix for "${context.violation.message}"
// Pattern: ${context.pattern.name ?? 'unknown'}
${context.code}`;
}

/**
 * Create workspace edit for fix
 */
function createFixEdit(
  uri: string,
  range: { start: { line: number; character: number }; end: { line: number; character: number } },
  newText: string
): { changes: Record<string, Array<{ range: { start: { line: number; character: number }; end: { line: number; character: number } }; newText: string }>> } {
  return {
    changes: {
      [uri]: [
        {
          range: {
            start: { line: range.start.line, character: range.start.character },
            end: { line: range.end.line, character: range.end.character },
          },
          newText,
        },
      ],
    },
  };
}
