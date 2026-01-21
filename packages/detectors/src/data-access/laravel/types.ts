/**
 * Laravel Data Access Type Definitions
 *
 * Types for Laravel Eloquent ORM pattern detection.
 *
 * @module data-access/laravel/types
 */

// ============================================================================
// Model Types
// ============================================================================

/**
 * Eloquent model definition
 */
export interface EloquentModelInfo {
  /** Model class name */
  name: string;
  /** Fully qualified name */
  fqn: string;
  /** Namespace */
  namespace: string | null;
  /** Table name (explicit or inferred) */
  table: string | null;
  /** Primary key */
  primaryKey: string;
  /** Whether timestamps are enabled */
  timestamps: boolean;
  /** Fillable fields */
  fillable: string[];
  /** Guarded fields */
  guarded: string[];
  /** Hidden fields */
  hidden: string[];
  /** Visible fields */
  visible: string[];
  /** Cast definitions */
  casts: Record<string, string>;
  /** Appends (accessors) */
  appends: string[];
  /** Relationships */
  relationships: RelationshipInfo[];
  /** Scopes */
  scopes: ScopeInfo[];
  /** Accessors */
  accessors: AccessorInfo[];
  /** Mutators */
  mutators: MutatorInfo[];
  /** Events */
  events: ModelEventInfo[];
  /** File path */
  file: string;
  /** Line number */
  line: number;
}

/**
 * Relationship definition
 */
export interface RelationshipInfo {
  /** Method name */
  name: string;
  /** Relationship type */
  type: RelationshipType;
  /** Related model class */
  relatedModel: string;
  /** Foreign key (if specified) */
  foreignKey: string | null;
  /** Local key (if specified) */
  localKey: string | null;
  /** Pivot table (for many-to-many) */
  pivotTable: string | null;
  /** Pivot fields */
  pivotFields: string[];
  /** Whether it's a morph relationship */
  isMorph: boolean;
  /** Line number */
  line: number;
}

/**
 * Relationship types
 */
export type RelationshipType =
  | 'hasOne'
  | 'hasMany'
  | 'belongsTo'
  | 'belongsToMany'
  | 'hasOneThrough'
  | 'hasManyThrough'
  | 'morphOne'
  | 'morphMany'
  | 'morphTo'
  | 'morphToMany'
  | 'morphedByMany';

/**
 * Scope definition
 */
export interface ScopeInfo {
  /** Scope name (without 'scope' prefix) */
  name: string;
  /** Parameters */
  parameters: string[];
  /** Line number */
  line: number;
}

/**
 * Accessor definition
 */
export interface AccessorInfo {
  /** Attribute name */
  attribute: string;
  /** Method name */
  methodName: string;
  /** Whether it's a new-style Attribute accessor */
  isNewStyle: boolean;
  /** Line number */
  line: number;
}

/**
 * Mutator definition
 */
export interface MutatorInfo {
  /** Attribute name */
  attribute: string;
  /** Method name */
  methodName: string;
  /** Whether it's a new-style Attribute mutator */
  isNewStyle: boolean;
  /** Line number */
  line: number;
}

/**
 * Model event
 */
export interface ModelEventInfo {
  /** Event name */
  event: ModelEvent;
  /** Handler type */
  handlerType: 'closure' | 'observer' | 'trait';
  /** Line number */
  line: number;
}

/**
 * Model events
 */
export type ModelEvent =
  | 'creating'
  | 'created'
  | 'updating'
  | 'updated'
  | 'saving'
  | 'saved'
  | 'deleting'
  | 'deleted'
  | 'restoring'
  | 'restored'
  | 'replicating'
  | 'forceDeleting'
  | 'forceDeleted';

// ============================================================================
// Query Builder Types
// ============================================================================

/**
 * Query builder usage
 */
export interface QueryBuilderUsage {
  /** Model or table being queried */
  target: string;
  /** Query methods used */
  methods: QueryMethod[];
  /** Whether it's a raw query */
  isRaw: boolean;
  /** Whether eager loading is used */
  hasEagerLoading: boolean;
  /** Eager loaded relationships */
  eagerLoads: string[];
  /** File path */
  file: string;
  /** Line number */
  line: number;
}

/**
 * Query method
 */
export interface QueryMethod {
  /** Method name */
  name: string;
  /** Arguments */
  arguments: string[];
  /** Line number */
  line: number;
}

/**
 * Raw query usage (potential security concern)
 */
export interface RawQueryUsage {
  /** Query type */
  type: 'select' | 'insert' | 'update' | 'delete' | 'statement';
  /** Raw SQL (if extractable) */
  sql: string | null;
  /** Whether bindings are used */
  hasBindings: boolean;
  /** File path */
  file: string;
  /** Line number */
  line: number;
}

// ============================================================================
// Extraction Results
// ============================================================================

/**
 * Model extraction result
 */
export interface ModelExtractionResult {
  /** Extracted models */
  models: EloquentModelInfo[];
  /** Confidence score */
  confidence: number;
}

/**
 * Relationship extraction result
 */
export interface RelationshipExtractionResult {
  /** Extracted relationships */
  relationships: RelationshipInfo[];
  /** Confidence score */
  confidence: number;
}

/**
 * Scope extraction result
 */
export interface ScopeExtractionResult {
  /** Extracted scopes */
  scopes: ScopeInfo[];
  /** Confidence score */
  confidence: number;
}

/**
 * Query builder extraction result
 */
export interface QueryBuilderExtractionResult {
  /** Query usages */
  queries: QueryBuilderUsage[];
  /** Raw queries */
  rawQueries: RawQueryUsage[];
  /** Confidence score */
  confidence: number;
}

/**
 * Complete Laravel data access analysis
 */
export interface LaravelDataAccessAnalysis {
  /** Model analysis */
  models: ModelExtractionResult;
  /** Query analysis */
  queries: QueryBuilderExtractionResult;
  /** Overall confidence */
  confidence: number;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * All relationship types
 */
export const RELATIONSHIP_TYPES: RelationshipType[] = [
  'hasOne',
  'hasMany',
  'belongsTo',
  'belongsToMany',
  'hasOneThrough',
  'hasManyThrough',
  'morphOne',
  'morphMany',
  'morphTo',
  'morphToMany',
  'morphedByMany',
];

/**
 * Morph relationship types
 */
export const MORPH_RELATIONSHIP_TYPES: RelationshipType[] = [
  'morphOne',
  'morphMany',
  'morphTo',
  'morphToMany',
  'morphedByMany',
];

/**
 * Model events
 */
export const MODEL_EVENTS: ModelEvent[] = [
  'creating',
  'created',
  'updating',
  'updated',
  'saving',
  'saved',
  'deleting',
  'deleted',
  'restoring',
  'restored',
  'replicating',
  'forceDeleting',
  'forceDeleted',
];

/**
 * Query builder methods that indicate eager loading
 */
export const EAGER_LOADING_METHODS = ['with', 'load', 'loadMissing', 'loadCount', 'loadMax', 'loadMin', 'loadSum', 'loadAvg'];

/**
 * Query builder methods that indicate raw SQL
 */
export const RAW_QUERY_METHODS = ['selectRaw', 'whereRaw', 'orWhereRaw', 'havingRaw', 'orderByRaw', 'groupByRaw'];
