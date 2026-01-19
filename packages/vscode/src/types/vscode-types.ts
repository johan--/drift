/**
 * VS Code-specific type definitions
 */

export interface ExtensionConfig {
  /** Enable/disable extension */
  enabled: boolean;
  /** Show status bar */
  showStatusBar: boolean;
  /** Auto-start LSP server */
  autoStart: boolean;
}

export interface PatternTreeItem {
  /** Pattern ID */
  id: string;
  /** Pattern name */
  name: string;
  /** Pattern category */
  category: string;
  /** Confidence level */
  confidence: string;
  /** Number of violations */
  violationCount: number;
}

export interface ViolationTreeItem {
  /** Violation ID */
  id: string;
  /** File path */
  file: string;
  /** Line number */
  line: number;
  /** Message */
  message: string;
  /** Severity */
  severity: 'error' | 'warning' | 'info' | 'hint';
}
