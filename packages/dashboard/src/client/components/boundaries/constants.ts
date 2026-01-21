/**
 * Boundaries Component Constants
 * 
 * Configuration and display constants for boundary visualization.
 */

import type { DataOperation, SensitivityType, ViewMode } from './types';

// ============================================================================
// Operation Configuration
// ============================================================================

export const OPERATION_CONFIG: Record<DataOperation, {
  label: string;
  icon: string;
  color: string;
  bgColor: string;
}> = {
  read: {
    label: 'Read',
    icon: '📖',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
  },
  write: {
    label: 'Write',
    icon: '✏️',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
  },
  delete: {
    label: 'Delete',
    icon: '🗑️',
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
  },
  unknown: {
    label: 'Unknown',
    icon: '❓',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/20',
  },
};

// ============================================================================
// Sensitivity Configuration
// ============================================================================

export const SENSITIVITY_CONFIG: Record<SensitivityType, {
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  description: string;
}> = {
  pii: {
    label: 'PII',
    icon: '👤',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    description: 'Personally Identifiable Information',
  },
  credentials: {
    label: 'Credentials',
    icon: '🔐',
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    description: 'Passwords, tokens, API keys',
  },
  financial: {
    label: 'Financial',
    icon: '💳',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    description: 'Payment and financial data',
  },
  health: {
    label: 'Health',
    icon: '🏥',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
    description: 'Medical and health records',
  },
  unknown: {
    label: 'Unknown',
    icon: '❓',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/20',
    description: 'Unclassified sensitive data',
  },
};

// ============================================================================
// View Mode Configuration
// ============================================================================

export const VIEW_MODE_CONFIG: Record<ViewMode, {
  label: string;
  icon: string;
  description: string;
}> = {
  tables: {
    label: 'By Table',
    icon: '🗄️',
    description: 'Group by database table',
  },
  files: {
    label: 'By File',
    icon: '📁',
    description: 'Group by source file',
  },
  sensitive: {
    label: 'Sensitive',
    icon: '🔒',
    description: 'Show sensitive fields only',
  },
};

// ============================================================================
// Display Limits
// ============================================================================

export const DISPLAY_LIMITS = {
  maxAccessPointsPerTable: 50,
  maxTablesInList: 100,
  maxFilesInList: 100,
  maxSensitiveFields: 100,
  maxViolations: 50,
};
