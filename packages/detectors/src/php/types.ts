/**
 * PHP Core Type Definitions
 *
 * Shared type definitions for PHP pattern detection across all frameworks.
 * These types represent PHP language constructs independent of any framework.
 *
 * @module php/types
 */

// ============================================================================
// Visibility & Modifiers
// ============================================================================

/** PHP visibility modifiers */
export type PhpVisibility = 'public' | 'protected' | 'private';

/** PHP class modifiers */
export interface PhpClassModifiers {
  isAbstract: boolean;
  isFinal: boolean;
  isReadonly: boolean; // PHP 8.2+
}

/** PHP method modifiers */
export interface PhpMethodModifiers {
  isStatic: boolean;
  isAbstract: boolean;
  isFinal: boolean;
}

/** PHP property modifiers */
export interface PhpPropertyModifiers {
  isStatic: boolean;
  isReadonly: boolean; // PHP 8.1+
}

// ============================================================================
// PHP 8 Attributes
// ============================================================================

/**
 * PHP 8 attribute (annotation)
 *
 * @example #[Route('/api/users', methods: ['GET'])]
 */
export interface PhpAttribute {
  /** Attribute class name (e.g., 'Route', 'Middleware') */
  name: string;
  /** Fully qualified name if available */
  fqn: string | null;
  /** Positional arguments */
  arguments: PhpAttributeArgument[];
  /** Named arguments */
  namedArguments: Record<string, PhpAttributeArgument>;
  /** Line number */
  line: number;
  /** Column number */
  column: number;
}

/**
 * Attribute argument value
 */
export interface PhpAttributeArgument {
  /** Raw string representation */
  raw: string;
  /** Parsed value if determinable */
  value: string | number | boolean | string[] | null;
  /** Value type */
  type: 'string' | 'number' | 'boolean' | 'array' | 'constant' | 'expression';
}

// ============================================================================
// PHPDoc / Docblocks
// ============================================================================

/**
 * PHPDoc block information
 */
export interface DocblockInfo {
  /** Summary line (first line of description) */
  summary: string;
  /** Full description */
  description: string;
  /** All tags in the docblock */
  tags: DocblockTag[];
  /** Raw docblock content */
  raw: string;
  /** Line number where docblock starts */
  line: number;
}

/**
 * PHPDoc tag
 *
 * @example @param string $name The user's name
 * @example @return User|null
 * @example @throws InvalidArgumentException
 */
export interface DocblockTag {
  /** Tag name without @ (e.g., 'param', 'return', 'throws') */
  name: string;
  /** Type annotation if present */
  type: string | null;
  /** Variable name for @param tags */
  variable: string | null;
  /** Description text */
  description: string;
  /** Line number */
  line: number;
}

// ============================================================================
// Use Statements / Imports
// ============================================================================

/**
 * PHP use statement
 *
 * @example use App\Models\User;
 * @example use App\Models\User as UserModel;
 * @example use function App\Helpers\format_date;
 * @example use const App\Constants\MAX_LIMIT;
 */
export interface PhpUseStatement {
  /** Fully qualified class/function/constant name */
  fqn: string;
  /** Alias if using 'as' keyword */
  alias: string | null;
  /** Type of import */
  type: 'class' | 'function' | 'const';
  /** Line number */
  line: number;
}

/**
 * PHP namespace declaration
 */
export interface PhpNamespace {
  /** Namespace name */
  name: string;
  /** Line number */
  line: number;
}

// ============================================================================
// Parameters & Types
// ============================================================================

/**
 * PHP parameter information
 */
export interface PhpParameterInfo {
  /** Parameter name (without $) */
  name: string;
  /** Type hint if present */
  type: PhpTypeInfo | null;
  /** Default value if present */
  defaultValue: string | null;
  /** Whether parameter has default value */
  hasDefault: boolean;
  /** Whether parameter is variadic (...$args) */
  isVariadic: boolean;
  /** Whether parameter is passed by reference (&$param) */
  isByReference: boolean;
  /** PHP 8 constructor property promotion */
  isPromoted: boolean;
  /** Visibility if promoted property */
  promotedVisibility: PhpVisibility | null;
  /** Attributes on parameter */
  attributes: PhpAttribute[];
  /** Line number */
  line: number;
}

/**
 * PHP type information
 *
 * Handles union types (string|int), intersection types (A&B),
 * nullable types (?string), and mixed types.
 */
export interface PhpTypeInfo {
  /** Raw type string as written */
  raw: string;
  /** Whether type is nullable (? prefix or includes null in union) */
  isNullable: boolean;
  /** Individual types in union/intersection */
  types: string[];
  /** Type combination mode */
  mode: 'single' | 'union' | 'intersection';
  /** Whether this is a built-in type */
  isBuiltin: boolean;
}

// ============================================================================
// Properties
// ============================================================================

/**
 * PHP class property
 */
export interface PhpPropertyInfo {
  /** Property name (without $) */
  name: string;
  /** Visibility */
  visibility: PhpVisibility;
  /** Modifiers */
  modifiers: PhpPropertyModifiers;
  /** Type hint if present */
  type: PhpTypeInfo | null;
  /** Default value if present */
  defaultValue: string | null;
  /** Whether property has default value */
  hasDefault: boolean;
  /** Attributes on property */
  attributes: PhpAttribute[];
  /** Docblock if present */
  docblock: DocblockInfo | null;
  /** Line number */
  line: number;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * PHP class constant
 */
export interface PhpConstantInfo {
  /** Constant name */
  name: string;
  /** Visibility (PHP 7.1+) */
  visibility: PhpVisibility;
  /** Whether constant is final (PHP 8.1+) */
  isFinal: boolean;
  /** Constant value */
  value: string;
  /** Type hint if present (PHP 8.3+) */
  type: PhpTypeInfo | null;
  /** Docblock if present */
  docblock: DocblockInfo | null;
  /** Line number */
  line: number;
}

// ============================================================================
// Methods
// ============================================================================

/**
 * PHP method information
 */
export interface PhpMethodInfo {
  /** Method name */
  name: string;
  /** Visibility */
  visibility: PhpVisibility;
  /** Modifiers */
  modifiers: PhpMethodModifiers;
  /** Parameters */
  parameters: PhpParameterInfo[];
  /** Return type if present */
  returnType: PhpTypeInfo | null;
  /** Attributes on method */
  attributes: PhpAttribute[];
  /** Docblock if present */
  docblock: DocblockInfo | null;
  /** Method body (for analysis) */
  body: string | null;
  /** Line number where method starts */
  line: number;
  /** Line number where method ends */
  endLine: number;
}

// ============================================================================
// Classes
// ============================================================================

/**
 * PHP class information
 */
export interface PhpClassInfo {
  /** Class name (without namespace) */
  name: string;
  /** Fully qualified class name */
  fqn: string;
  /** Namespace */
  namespace: string | null;
  /** Parent class if extends */
  extends: string | null;
  /** Implemented interfaces */
  implements: string[];
  /** Used traits */
  traits: string[];
  /** Class modifiers */
  modifiers: PhpClassModifiers;
  /** Class constants */
  constants: PhpConstantInfo[];
  /** Properties */
  properties: PhpPropertyInfo[];
  /** Methods */
  methods: PhpMethodInfo[];
  /** Attributes on class */
  attributes: PhpAttribute[];
  /** Docblock if present */
  docblock: DocblockInfo | null;
  /** File path */
  file: string;
  /** Line number where class starts */
  line: number;
  /** Line number where class ends */
  endLine: number;
}

// ============================================================================
// Interfaces
// ============================================================================

/**
 * PHP interface information
 */
export interface PhpInterfaceInfo {
  /** Interface name */
  name: string;
  /** Fully qualified name */
  fqn: string;
  /** Namespace */
  namespace: string | null;
  /** Extended interfaces */
  extends: string[];
  /** Constants */
  constants: PhpConstantInfo[];
  /** Method signatures */
  methods: PhpMethodInfo[];
  /** Attributes */
  attributes: PhpAttribute[];
  /** Docblock */
  docblock: DocblockInfo | null;
  /** File path */
  file: string;
  /** Line number */
  line: number;
}

// ============================================================================
// Traits
// ============================================================================

/**
 * PHP trait information
 */
export interface PhpTraitInfo {
  /** Trait name */
  name: string;
  /** Fully qualified name */
  fqn: string;
  /** Namespace */
  namespace: string | null;
  /** Other traits used */
  uses: string[];
  /** Properties */
  properties: PhpPropertyInfo[];
  /** Methods */
  methods: PhpMethodInfo[];
  /** Attributes */
  attributes: PhpAttribute[];
  /** Docblock */
  docblock: DocblockInfo | null;
  /** File path */
  file: string;
  /** Line number */
  line: number;
}

// ============================================================================
// Enums (PHP 8.1+)
// ============================================================================

/**
 * PHP enum case
 */
export interface PhpEnumCase {
  /** Case name */
  name: string;
  /** Backed value for backed enums */
  value: string | number | null;
  /** Attributes */
  attributes: PhpAttribute[];
  /** Line number */
  line: number;
}

/**
 * PHP enum information
 */
export interface PhpEnumInfo {
  /** Enum name */
  name: string;
  /** Fully qualified name */
  fqn: string;
  /** Namespace */
  namespace: string | null;
  /** Backing type for backed enums (string or int) */
  backingType: 'string' | 'int' | null;
  /** Implemented interfaces */
  implements: string[];
  /** Used traits */
  traits: string[];
  /** Enum cases */
  cases: PhpEnumCase[];
  /** Methods */
  methods: PhpMethodInfo[];
  /** Attributes */
  attributes: PhpAttribute[];
  /** Docblock */
  docblock: DocblockInfo | null;
  /** File path */
  file: string;
  /** Line number */
  line: number;
}

// ============================================================================
// Functions
// ============================================================================

/**
 * PHP standalone function
 */
export interface PhpFunctionInfo {
  /** Function name */
  name: string;
  /** Fully qualified name */
  fqn: string;
  /** Namespace */
  namespace: string | null;
  /** Parameters */
  parameters: PhpParameterInfo[];
  /** Return type */
  returnType: PhpTypeInfo | null;
  /** Attributes */
  attributes: PhpAttribute[];
  /** Docblock */
  docblock: DocblockInfo | null;
  /** Function body */
  body: string | null;
  /** File path */
  file: string;
  /** Line number */
  line: number;
}

// ============================================================================
// File-Level Extraction Result
// ============================================================================

/**
 * Complete extraction result for a PHP file
 */
export interface PhpFileExtractionResult {
  /** File path */
  file: string;
  /** Namespace declaration */
  namespace: PhpNamespace | null;
  /** Use statements */
  useStatements: PhpUseStatement[];
  /** Classes defined in file */
  classes: PhpClassInfo[];
  /** Interfaces defined in file */
  interfaces: PhpInterfaceInfo[];
  /** Traits defined in file */
  traits: PhpTraitInfo[];
  /** Enums defined in file */
  enums: PhpEnumInfo[];
  /** Standalone functions */
  functions: PhpFunctionInfo[];
  /** File-level constants */
  constants: PhpConstantInfo[];
  /** Extraction confidence */
  confidence: number;
  /** Any extraction errors/warnings */
  errors: string[];
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Location information for any PHP construct
 */
export interface PhpLocation {
  file: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
}

/**
 * Generic extraction result wrapper
 */
export interface ExtractionResult<T> {
  items: T[];
  confidence: number;
  errors: string[];
}

// ============================================================================
// Built-in Type Constants
// ============================================================================

/** PHP built-in types */
export const PHP_BUILTIN_TYPES = [
  'string',
  'int',
  'float',
  'bool',
  'array',
  'object',
  'callable',
  'iterable',
  'mixed',
  'void',
  'never',
  'null',
  'false',
  'true',
  'self',
  'parent',
  'static',
] as const;

export type PhpBuiltinType = typeof PHP_BUILTIN_TYPES[number];

/**
 * Check if a type is a PHP built-in type
 */
export function isBuiltinType(type: string): type is PhpBuiltinType {
  return PHP_BUILTIN_TYPES.includes(type.toLowerCase() as PhpBuiltinType);
}
