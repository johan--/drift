/**
 * AI Provider type definitions
 * @requirements 33.1
 */

export interface AIProvider {
  /** Provider name */
  name: string;
  /** Whether API key is required */
  requiresApiKey: boolean;
  /** Environment variable name for API key */
  envKeyName: string;
  /** Check if provider is configured */
  isConfigured(): boolean;
  /** Generate explanation */
  explain(context: ExplainContext): Promise<ExplainResult>;
  /** Generate fix */
  generateFix(context: FixContext): Promise<FixResult>;
}

export interface ExplainContext {
  /** Violation being explained */
  violation: unknown;
  /** Pattern being violated */
  pattern: unknown;
  /** Code snippet */
  codeSnippet: string;
  /** Similar examples */
  similarExamples: CodeExample[];
}

export interface FixContext {
  /** Violation to fix */
  violation: unknown;
  /** Pattern to conform to */
  pattern: unknown;
  /** Code snippet */
  codeSnippet: string;
  /** Surrounding code */
  surroundingCode: string;
}

export interface ExplainResult {
  /** Explanation text */
  explanation: string;
  /** Suggested action */
  suggestedAction: 'fix' | 'variant' | 'ignore';
}

export interface FixResult {
  /** Fixed code */
  fixedCode: string;
  /** Explanation of changes */
  explanation: string;
  /** Confidence in fix */
  confidence: number;
}

export interface CodeExample {
  /** File path */
  file: string;
  /** Code snippet */
  code: string;
}
