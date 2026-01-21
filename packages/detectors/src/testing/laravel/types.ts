/**
 * Laravel Testing Type Definitions
 *
 * Types for Laravel testing pattern detection.
 *
 * @module testing/laravel/types
 */

// ============================================================================
// Test Case Types
// ============================================================================

/**
 * Test case class
 */
export interface TestCaseInfo {
  /** Test class name */
  name: string;
  /** Fully qualified name */
  fqn: string;
  /** Namespace */
  namespace: string | null;
  /** Parent class */
  extends: string;
  /** Test type */
  type: TestType;
  /** Test methods */
  methods: TestMethodInfo[];
  /** Traits used */
  traits: string[];
  /** File path */
  file: string;
  /** Line number */
  line: number;
}

/**
 * Test types
 */
export type TestType = 'unit' | 'feature' | 'browser' | 'integration';

/**
 * Test method
 */
export interface TestMethodInfo {
  /** Method name */
  name: string;
  /** Whether it uses data provider */
  hasDataProvider: boolean;
  /** Data provider name */
  dataProvider: string | null;
  /** Assertions used */
  assertions: string[];
  /** Line number */
  line: number;
}

// ============================================================================
// Factory Types
// ============================================================================

/**
 * Model factory
 */
export interface FactoryInfo {
  /** Factory class name */
  name: string;
  /** Model class */
  modelClass: string;
  /** States defined */
  states: FactoryStateInfo[];
  /** Relationships defined */
  relationships: FactoryRelationshipInfo[];
  /** File path */
  file: string;
  /** Line number */
  line: number;
}

/**
 * Factory state
 */
export interface FactoryStateInfo {
  /** State name */
  name: string;
  /** Line number */
  line: number;
}

/**
 * Factory relationship
 */
export interface FactoryRelationshipInfo {
  /** Relationship name */
  name: string;
  /** Related factory */
  factory: string | null;
  /** Line number */
  line: number;
}

// ============================================================================
// Mock Types
// ============================================================================

/**
 * Mock usage
 */
export interface MockUsageInfo {
  /** Mock type */
  type: 'mock' | 'spy' | 'partial' | 'fake';
  /** Class being mocked */
  targetClass: string;
  /** Method expectations */
  expectations: MockExpectationInfo[];
  /** File path */
  file: string;
  /** Line number */
  line: number;
}

/**
 * Mock expectation
 */
export interface MockExpectationInfo {
  /** Method name */
  method: string;
  /** Expected call count */
  times: number | null;
  /** Return value */
  returns: string | null;
  /** Line number */
  line: number;
}

// ============================================================================
// Extraction Results
// ============================================================================

/**
 * Test case extraction result
 */
export interface TestCaseExtractionResult {
  /** Test cases */
  testCases: TestCaseInfo[];
  /** Confidence score */
  confidence: number;
}

/**
 * Factory extraction result
 */
export interface FactoryExtractionResult {
  /** Factories */
  factories: FactoryInfo[];
  /** Confidence score */
  confidence: number;
}

/**
 * Mock extraction result
 */
export interface MockExtractionResult {
  /** Mock usages */
  mocks: MockUsageInfo[];
  /** Confidence score */
  confidence: number;
}

/**
 * Complete Laravel testing analysis
 */
export interface LaravelTestingAnalysis {
  /** Test case analysis */
  testCases: TestCaseExtractionResult;
  /** Factory analysis */
  factories: FactoryExtractionResult;
  /** Mock analysis */
  mocks: MockExtractionResult;
  /** Overall confidence */
  confidence: number;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Laravel test base classes
 */
export const LARAVEL_TEST_BASES = [
  'TestCase',
  'DuskTestCase',
  'BrowserKitTestCase',
] as const;

/**
 * PHPUnit assertions
 */
export const PHPUNIT_ASSERTIONS = [
  'assertTrue',
  'assertFalse',
  'assertEquals',
  'assertSame',
  'assertNotEquals',
  'assertNull',
  'assertNotNull',
  'assertEmpty',
  'assertNotEmpty',
  'assertCount',
  'assertContains',
  'assertInstanceOf',
  'assertArrayHasKey',
  'assertJson',
  'assertJsonStructure',
  'assertDatabaseHas',
  'assertDatabaseMissing',
  'assertAuthenticated',
  'assertGuest',
  'assertStatus',
  'assertRedirect',
  'assertSee',
  'assertDontSee',
] as const;
