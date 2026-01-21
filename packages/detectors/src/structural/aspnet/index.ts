/**
 * ASP.NET Core Structural Detectors
 */

export {
  DIRegistrationDetector,
  createDIRegistrationDetector,
  type DIRegistrationInfo,
  type DIRegistrationAnalysis,
} from './di-registration-detector.js';

export {
  DIRegistrationSemanticDetector,
  createDIRegistrationSemanticDetector,
} from './di-registration-semantic.js';
