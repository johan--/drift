/**
 * Feature Flags Detector Tests
 *
 * Tests for feature flag pattern detection.
 *
 * @requirements 17.4 - Feature flag patterns
 */

import { describe, it, expect } from 'vitest';
import {
  FeatureFlagsDetector,
  createFeatureFlagsDetector,
  detectBooleanFlags,
  detectEnvFlags,
  detectFlagService,
  detectConditionalRender,
  detectABTest,
  detectRolloutPercentage,
  detectHardcodedFlagViolations,
  analyzeFeatureFlags,
  shouldExcludeFile,
} from './feature-flags.js';
import type { DetectionContext, P