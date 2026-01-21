/**
 * C# Type System Detectors
 */

export {
  RecordPatternsDetector,
  createRecordPatternsDetector,
  type RecordPatternInfo,
  type RecordPatternAnalysis,
} from './record-patterns-detector.js';

export {
  RecordPatternsSemanticDetector,
  createRecordPatternsSemanticDetector,
} from './record-patterns-semantic.js';
