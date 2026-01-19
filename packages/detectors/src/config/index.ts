/**
 * Config detectors module exports
 *
 * Detects configuration patterns including:
 * - Environment variable naming
 * - Required vs optional config
 * - Default values
 * - Feature flags
 * - Config validation
 * - Environment detection
 *
 * @requirements 17 - Configuration pattern detection
 */

import { createEnvNamingDetector } from './env-naming.js';
import { createRequiredOptionalDetector } from './required-optional.js';
import { createDefaultValuesDetector } from './default-values.js';
import { createFeatureFlagsDetector } from './feature-flags.js';
import { createConfigValidationDetector } from './config-validation.js';
import { createEnvironmentDetectionDetector } from './environment-detection.js';

// Env Naming
export {
  EnvNamingDetector,
  createEnvNamingDetector,
  analyzeEnvNaming,
  shouldExcludeFile as shouldExcludeEnvNamingFile,
} from './env-naming.js';
export type {
  EnvNamingPatternType,
  EnvNamingViolationType,
  EnvNamingPatternInfo,
  EnvNamingViolationInfo,
  EnvNamingAnalysis,
} from './env-naming.js';

// Required Optional
export {
  RequiredOptionalDetector,
  createRequiredOptionalDetector,
  analyzeRequiredOptional,
  shouldExcludeFile as shouldExcludeRequiredOptionalFile,
} from './required-optional.js';
export type {
  RequiredOptionalPatternType,
  RequiredOptionalViolationType,
  RequiredOptionalPatternInfo,
  RequiredOptionalViolationInfo,
  RequiredOptionalAnalysis,
} from './required-optional.js';

// Default Values
export {
  DefaultValuesDetector,
  createDefaultValuesDetector,
  analyzeDefaultValues,
  shouldExcludeFile as shouldExcludeDefaultValuesFile,
} from './default-values.js';
export type {
  DefaultValuePatternType,
  DefaultValueViolationType,
  DefaultValuePatternInfo,
  DefaultValueViolationInfo,
  DefaultValueAnalysis,
} from './default-values.js';

// Feature Flags
export {
  FeatureFlagsDetector,
  createFeatureFlagsDetector,
  analyzeFeatureFlags,
  shouldExcludeFile as shouldExcludeFeatureFlagsFile,
} from './feature-flags.js';
export type {
  FeatureFlagPatternType,
  FeatureFlagViolationType,
  FeatureFlagPatternInfo,
  FeatureFlagViolationInfo,
  FeatureFlagAnalysis,
} from './feature-flags.js';

// Config Validation
export {
  ConfigValidationDetector,
  createConfigValidationDetector,
  analyzeConfigValidation,
  shouldExcludeFile as shouldExcludeConfigValidationFile,
} from './config-validation.js';
export type {
  ConfigValidationPatternType,
  ConfigValidationViolationType,
  ConfigValidationPatternInfo,
  ConfigValidationViolationInfo,
  ConfigValidationAnalysis,
} from './config-validation.js';

// Environment Detection
export {
  EnvironmentDetectionDetector,
  createEnvironmentDetectionDetector,
  analyzeEnvironmentDetection,
  shouldExcludeFile as shouldExcludeEnvironmentDetectionFile,
} from './environment-detection.js';
export type {
  EnvironmentDetectionPatternType,
  EnvironmentDetectionViolationType,
  EnvironmentDetectionPatternInfo,
  EnvironmentDetectionViolationInfo,
  EnvironmentDetectionAnalysis,
} from './environment-detection.js';

// Factory function to create all config detectors
export function createConfigDetectors() {
  return [
    createEnvNamingDetector(),
    createRequiredOptionalDetector(),
    createDefaultValuesDetector(),
    createFeatureFlagsDetector(),
    createConfigValidationDetector(),
    createEnvironmentDetectionDetector(),
  ];
}
