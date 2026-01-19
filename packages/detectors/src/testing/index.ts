/**
 * Testing detectors module exports
 *
 * Detects testing patterns including:
 * - Test file naming conventions
 * - Test co-location patterns
 * - Test structure patterns
 * - Mock patterns
 * - Fixture patterns
 * - Describe naming patterns
 * - Setup/teardown patterns
 *
 * @requirements 14.1-14.7 - Testing patterns
 */

// Test File Naming Detector
export {
  type TestFileNamingPatternType,
  type TestFileNamingPatternInfo,
  type TestFileNamingAnalysis,
  TEST_SUFFIX_PATTERN,
  SPEC_SUFFIX_PATTERN,
  TESTS_DIRECTORY_PATTERN,
  TEST_DIRECTORY_PATTERN,
  detectTestFileNaming,
  analyzeTestFileNaming,
  TestFileNamingDetector,
  createTestFileNamingDetector,
} from './file-naming.js';

// Test Co-location Detector
export {
  type CoLocationPatternType,
  type CoLocationPatternInfo,
  type CoLocationAnalysis,
  isTestFile,
  getSourceFileForTest,
  detectCoLocationPattern,
  analyzeCoLocation,
  TestCoLocationDetector,
  createTestCoLocationDetector,
} from './co-location.js';

// Test Structure Detector
export {
  type TestStructurePatternType,
  type TestStructurePatternInfo,
  type TestStructureAnalysis,
  AAA_COMMENT_PATTERNS,
  GIVEN_WHEN_THEN_PATTERNS,
  IT_SHOULD_PATTERNS,
  TEST_FUNCTION_PATTERNS,
  DESCRIBE_BLOCK_PATTERNS,
  shouldExcludeFile as shouldExcludeTestStructureFile,
  detectAAAPattern,
  detectGivenWhenThen,
  detectItShould,
  detectTestFunctions,
  detectDescribeBlocks,
  analyzeTestStructure,
  TestStructureDetector,
  createTestStructureDetector,
} from './test-structure.js';

// Mock Patterns Detector
export {
  type MockPatternType,
  type MockPatternInfo,
  type MockAnalysis,
  JEST_MOCK_PATTERNS,
  VITEST_MOCK_PATTERNS,
  SINON_STUB_PATTERNS,
  SINON_SPY_PATTERNS,
  MANUAL_MOCK_PATTERNS,
  MOCK_IMPLEMENTATION_PATTERNS,
  shouldExcludeFile as shouldExcludeMockFile,
  detectJestMocks,
  detectVitestMocks,
  detectSinonStubs,
  detectSinonSpies,
  detectManualMocks,
  analyzeMockPatterns,
  MockPatternsDetector,
  createMockPatternsDetector,
} from './mock-patterns.js';

// Fixture Patterns Detector
export {
  type FixturePatternType,
  type FixturePatternInfo,
  type FixtureAnalysis,
  FACTORY_FUNCTION_PATTERNS,
  BUILDER_PATTERN_PATTERNS,
  FIXTURE_FILE_PATTERNS,
  TEST_DATA_PATTERNS,
  FAKER_USAGE_PATTERNS,
  shouldExcludeFile as shouldExcludeFixtureFile,
  detectFactoryFunctions,
  detectBuilderPatterns,
  detectFixtureFiles,
  detectTestData,
  detectFakerUsage,
  analyzeFixturePatterns,
  FixturePatternsDetector,
  createFixturePatternsDetector,
} from './fixture-patterns.js';

// Describe Naming Detector
export {
  type DescribeNamingPatternType,
  type DescribeNamingPatternInfo,
  type DescribeNamingAnalysis,
  COMPONENT_NAME_PATTERNS,
  FUNCTION_NAME_PATTERNS,
  METHOD_GROUP_PATTERNS,
  FEATURE_GROUP_PATTERNS,
  shouldExcludeFile as shouldExcludeDescribeFile,
  extractDescribeBlocks,
  analyzeDescribeNaming,
  DescribeNamingDetector,
  createDescribeNamingDetector,
} from './describe-naming.js';

// Setup/Teardown Detector
export {
  type SetupTeardownPatternType,
  type SetupTeardownPatternInfo,
  type SetupTeardownAnalysis,
  BEFORE_EACH_PATTERNS,
  AFTER_EACH_PATTERNS,
  BEFORE_ALL_PATTERNS,
  AFTER_ALL_PATTERNS,
  SETUP_FUNCTION_PATTERNS,
  CLEANUP_FUNCTION_PATTERNS,
  shouldExcludeFile as shouldExcludeSetupFile,
  detectBeforeEach,
  detectAfterEach,
  detectBeforeAll,
  detectAfterAll,
  detectSetupFunctions,
  detectCleanupFunctions,
  analyzeSetupTeardown,
  SetupTeardownDetector,
  createSetupTeardownDetector,
} from './setup-teardown.js';

// Import factory functions for createAllTestingDetectors
import { createTestFileNamingDetector } from './file-naming.js';
import { createTestCoLocationDetector } from './co-location.js';
import { createTestStructureDetector } from './test-structure.js';
import { createMockPatternsDetector } from './mock-patterns.js';
import { createFixturePatternsDetector } from './fixture-patterns.js';
import { createDescribeNamingDetector } from './describe-naming.js';
import { createSetupTeardownDetector } from './setup-teardown.js';

// Convenience factory for all testing detectors
export function createAllTestingDetectors() {
  return {
    fileNaming: createTestFileNamingDetector(),
    coLocation: createTestCoLocationDetector(),
    testStructure: createTestStructureDetector(),
    mockPatterns: createMockPatternsDetector(),
    fixturePatterns: createFixturePatternsDetector(),
    describeNaming: createDescribeNamingDetector(),
    setupTeardown: createSetupTeardownDetector(),
  };
}
