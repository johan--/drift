/**
 * Boundaries Components Index
 * 
 * Data boundary visualization components.
 */

export { BoundariesTab } from './BoundariesTab';
export { BoundaryStats } from './BoundaryStats';
export { BoundaryFiltersComponent } from './BoundaryFilters';
export { BoundaryList } from './BoundaryList';
export { BoundaryDetail, BoundaryDetailEmpty } from './BoundaryDetail';
export { RuleEditor } from './RuleEditor';

// Types
export type {
  ViewMode,
  SortField,
  SortDirection,
  SortConfig,
  DataOperation,
  SensitivityType,
  SensitiveField,
  DataAccessPoint,
  TableInfo,
  BoundaryViolation,
  BoundaryMetrics,
  TableMetrics,
  BoundaryViewState,
  BoundaryFilters,
} from './types';

export type {
  BoundaryRule,
  BoundaryRulesConfig,
} from './RuleEditor';

// Utils
export {
  calculateMetrics,
  calculateTableMetrics,
  sortTables,
  filterTables,
  filterSensitiveFields,
  groupByFile,
  formatFieldPath,
  formatConfidence,
  getConfidenceColor,
  truncatePath,
  type FileGroup,
} from './utils';

// Constants
export {
  OPERATION_CONFIG,
  SENSITIVITY_CONFIG,
  VIEW_MODE_CONFIG,
  DISPLAY_LIMITS,
} from './constants';
