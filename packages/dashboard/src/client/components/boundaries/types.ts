/**
 * Boundaries Component Types
 * 
 * Types for data boundary visualization.
 */

import type { Severity } from '../../types';

// ============================================================================
// View Types
// ============================================================================

export type ViewMode = 'tables' | 'files' | 'sensitive';

export type SortField = 'name' | 'accessCount' | 'sensitiveCount';
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

// ============================================================================
// Data Types
// ============================================================================

export type DataOperation = 'read' | 'write' | 'delete' | 'unknown';
export type SensitivityType = 'pii' | 'credentials' | 'financial' | 'health' | 'unknown';

export interface SensitiveField {
  field: string;
  table: string | null;
  sensitivityType: SensitivityType;
  file: string;
  line: number;
  confidence: number;
}

export interface DataAccessPoint {
  id: string;
  table: string;
  fields: string[];
  operation: DataOperation;
  file: string;
  line: number;
  column: number;
  context: string;
  isRawSql: boolean;
  confidence: number;
}

export interface TableInfo {
  name: string;
  model: string | null;
  fields: string[];
  sensitiveFields: SensitiveField[];
  accessedBy: DataAccessPoint[];
}

export interface BoundaryViolation {
  id: string;
  ruleId: string;
  ruleDescription: string;
  severity: Severity;
  file: string;
  line: number;
  column: number;
  message: string;
  table: string;
  fields: string[];
  operation: DataOperation;
  suggestion?: string;
}

// ============================================================================
// Metrics Types
// ============================================================================

export interface BoundaryMetrics {
  totalTables: number;
  totalAccessPoints: number;
  totalSensitiveFields: number;
  totalViolations: number;
  bySensitivityType: Record<SensitivityType, number>;
  byOperation: Record<DataOperation, number>;
}

export interface TableMetrics {
  accessCount: number;
  fileCount: number;
  sensitiveCount: number;
  readCount: number;
  writeCount: number;
  deleteCount: number;
}

// ============================================================================
// View State
// ============================================================================

export interface BoundaryViewState {
  viewMode: ViewMode;
  sort: SortConfig;
  selectedTable: string | null;
  selectedFile: string | null;
  expandedGroups: Set<string>;
}

// ============================================================================
// Filter Types
// ============================================================================

export interface BoundaryFilters {
  sensitivityType?: SensitivityType;
  operation?: DataOperation;
  hasViolations?: boolean;
  search?: string;
}
