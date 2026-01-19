/**
 * Component detectors module exports
 *
 * Detects UI component patterns including file structure,
 * props patterns, duplicates, and more.
 *
 * @requirements 8.1-8.8 - Component pattern detection
 */

// Component Structure Detector
export {
  ComponentStructureDetector,
  createComponentStructureDetector,
  // Types
  type ComponentStructureType,
  type ComponentFileInfo,
  type ComponentFileType,
  type DetectedComponent,
  type ComponentStructureAnalysis,
  // Helper functions
  getComponentFileType,
  extractComponentName,
  isComponentFile,
  isComponentFolder,
  getComponentFolderFiles,
  determineStructureType,
  findRelatedFiles,
  detectComponents,
  analyzeComponentStructure,
  suggestRestructure,
  // Constants
  COMPONENT_EXTENSIONS,
  COMPONENT_FILE_PATTERNS,
  COMPONENT_FOLDER_INDICATORS,
} from './component-structure.js';

// Props Patterns Detector
export {
  PropsPatternDetector,
  createPropsPatternDetector,
  // Types
  type PropsDestructuringPattern,
  type DefaultPropsPattern,
  type PropsSpreadingPattern,
  type PropsTypePattern,
  type ComponentPropsInfo,
  type PropsPatternAnalysis,
  // Helper functions
  isReactComponent,
  getComponentName,
  detectDestructuringPattern,
  detectDefaultPropsPattern,
  detectSpreadingPattern,
  detectTypePattern,
  extractPropNames,
  extractPropsWithDefaults,
  getPropsTypeName,
  usesFCType,
  analyzeComponentProps,
  analyzePropsPatterns,
  generatePropsSuggestion,
  // Constants
  FC_TYPE_PATTERNS,
  PROPS_TYPE_NAME_PATTERNS,
} from './props-patterns.js';

// Duplicate Detection
export {
  DuplicateDetector,
  createDuplicateDetector,
  // Types
  type DuplicateType,
  type DuplicatePair,
  type ComponentInfo,
  type DuplicateDifference,
  type NormalizedNode,
  type DuplicateAnalysis,
  type DuplicateDetectionConfig,
  // Helper functions
  normalizeASTNode,
  hashNormalizedNode,
  countNodes,
  calculateASTSimilarity,
  calculateTextSimilarity,
  determineDuplicateType,
  isReactComponentNode,
  extractComponentNameFromNode,
  extractComponentInfo,
  findDifferences,
  hasOnlyIdentifierDifferences,
  compareComponents,
  analyzeDuplicates,
  generateRefactoringSuggestion,
  // Constants
  DEFAULT_DUPLICATE_CONFIG,
  IDENTIFIER_NODE_TYPES,
  LITERAL_NODE_TYPES,
} from './duplicate-detection.js';

// Near Duplicate Detection (Semantic Similarity)
export {
  NearDuplicateDetector,
  createNearDuplicateDetector,
  // Types
  type AbstractionType,
  type SemanticFeatures,
  type PropFeature,
  type StateFeature,
  type HookFeature,
  type EventHandlerFeature,
  type JSXElementFeature,
  type ConditionalPattern,
  type DataPattern,
  type NearDuplicatePair,
  type SimilarityBreakdown,
  type AbstractionSuggestion,
  type NearDuplicateAnalysis,
  type AbstractionGroup,
  type NearDuplicateConfig,
  type SimilarityWeights,
  // Helper functions
  isReactComponentNode as isReactComponentNodeNearDup,
  extractComponentName as extractComponentNameNearDup,
  extractProps,
  extractState,
  extractHooks,
  extractEventHandlers,
  extractJSXElements,
  extractConditionalPatterns,
  extractDataPatterns,
  extractSemanticFeatures,
  calculatePropsSimilarity,
  calculateStateSimilarity,
  calculateHooksSimilarity,
  calculateEventHandlersSimilarity,
  calculateJSXSimilarity,
  calculateConditionalSimilarity,
  calculateDataPatternsSimilarity,
  calculateSemanticSimilarity,
  calculateOverallSimilarity,
  determineAbstractionType,
  generateAbstractionSuggestions,
  compareComponentsSemanticly,
  analyzeNearDuplicates,
  generateRefactoringSuggestionMessage,
  // Constants
  DEFAULT_NEAR_DUPLICATE_CONFIG,
  REACT_HOOKS,
  EVENT_HANDLER_PATTERNS,
} from './near-duplicate.js';

// State Patterns Detector
export {
  StatePatternDetector,
  createStatePatternDetector,
  // Types
  type LocalStatePattern,
  type GlobalStatePattern,
  type StateIssueType,
  type StateUsageInfo,
  type ComponentStateInfo,
  type StateIssue,
  type StatePatternAnalysis,
  type StatePatternConfig,
  // Helper functions
  isReactComponent as isReactComponentState,
  getComponentName as getComponentNameState,
  detectUseState,
  detectUseReducer,
  detectUseRef,
  detectLocalState,
  detectUseContext,
  detectRedux,
  detectZustand,
  detectJotai,
  detectRecoil,
  detectReactQuery,
  detectSWR,
  detectMobX,
  detectValtio,
  detectGlobalState,
  detectPropDrilling,
  detectStateIssues,
  calculateComplexityScore,
  extractPropsFromComponent,
  analyzeComponentState,
  analyzeStatePatterns,
  // Constants
  DEFAULT_STATE_PATTERN_CONFIG,
  LOCAL_PATTERN_DESCRIPTIONS,
  GLOBAL_PATTERN_DESCRIPTIONS,
  REDUX_HOOKS,
  ZUSTAND_PATTERNS,
  JOTAI_HOOKS,
  RECOIL_HOOKS,
  REACT_QUERY_HOOKS,
  SWR_HOOKS,
  MOBX_PATTERNS,
  VALTIO_HOOKS,
} from './state-patterns.js';

// Composition Detector
export {
  CompositionDetector,
  createCompositionDetector,
  // Types
  type CompositionPattern,
  type CompositionAntiPattern,
  type CompositionUsageInfo,
  type CompositionDetails,
  type ComponentCompositionInfo,
  type CompositionAntiPatternInfo,
  type CompositionAnalysis,
  type CompositionConfig,
  // Helper functions
  isReactComponent as isReactComponentComposition,
  getComponentName as getComponentNameComposition,
  detectChildrenProp,
  acceptsChildrenProp,
  detectRenderProps,
  detectHOC,
  extractHOCNames,
  detectCompoundComponent,
  isCompoundComponentPart,
  detectSlotBasedComposition,
  detectProviderConsumer,
  countNestedProviders,
  detectControlledPattern,
  detectUncontrolledPattern,
  hasMixedControlledPatterns,
  detectAntiPatterns,
  analyzeComponentComposition,
  analyzeCompositionPatterns,
  // Constants
  DEFAULT_COMPOSITION_CONFIG,
  HOC_PATTERNS,
  RENDER_PROP_NAMES,
  CONTROLLED_PROP_PATTERNS,
  UNCONTROLLED_PROP_PATTERNS,
} from './composition.js';

// Ref Forwarding Detector
export {
  RefForwardingDetector,
  createRefForwardingDetector,
  // Types
  type RefForwardingPattern,
  type RefForwardingIssue,
  type RefUsageInfo,
  type ComponentRefInfo,
  type RefIssue,
  type RefForwardingAnalysis,
  type RefForwardingConfig,
  // Helper functions
  isReactComponent as isReactComponentRef,
  getComponentName as getComponentNameRef,
  detectForwardRef,
  isWrappedWithForwardRef,
  detectUseImperativeHandle,
  hasImperativeWithoutForwardRef,
  detectUseRef as detectUseRefForwarding,
  isRefUsed,
  detectRefPropToDom,
  detectRefPropToChild,
  detectCallbackRef,
  detectRefMerging,
  detectMissingForwardRef,
  detectRefIssues,
  collectRefUsages,
  analyzeComponentRefs,
  analyzeRefForwardingPatterns,
  getPatternDescription,
  getIssueDescription,
  // Constants
  DEFAULT_REF_FORWARDING_CONFIG,
  REF_HOOKS,
  DOM_ELEMENTS_WITH_REFS,
} from './ref-forwarding.js';
