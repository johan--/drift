/**
 * Documentation Detectors - Documentation pattern detection
 * @requirements 21.1-21.5 - Documentation pattern detection
 */

export { JsdocPatternsDetector, createJsdocPatternsDetector, analyzeJsdocPatterns, shouldExcludeFile as shouldExcludeJsdoc, detectJsdocBlock, detectParamTag, detectReturnsTag, detectExampleTag, detectDeprecatedTag, detectSeeTag, detectThrowsTag, detectTypeTag, JSDOC_BLOCK_PATTERNS, PARAM_TAG_PATTERNS, RETURNS_TAG_PATTERNS, EXAMPLE_TAG_PATTERNS as JSDOC_EXAMPLE_TAG_PATTERNS } from './jsdoc-patterns.js';
export type { JsdocPatternType, JsdocViolationType, JsdocPatternInfo, JsdocViolationInfo, JsdocAnalysis } from './jsdoc-patterns.js';

export { ReadmeStructureDetector, createReadmeStructureDetector, analyzeReadmeStructure, shouldExcludeFile as shouldExcludeReadme, detectTitle, detectDescription, detectInstallation, detectUsage, detectApiSection, detectContributing, detectLicense, detectBadges, detectTableOfContents, TITLE_PATTERNS, INSTALLATION_PATTERNS, USAGE_PATTERNS, LICENSE_PATTERNS } from './readme-structure.js';
export type { ReadmePatternType, ReadmeViolationType, ReadmePatternInfo, ReadmeViolationInfo, ReadmeAnalysis } from './readme-structure.js';

export { TodoPatternsDetector, createTodoPatternsDetector, analyzeTodoPatterns, shouldExcludeFile as shouldExcludeTodo, detectTodo, detectFixme, detectHack, detectXxx, detectBug, detectNote, detectOptimize, detectReview, TODO_PATTERNS, FIXME_PATTERNS, HACK_PATTERNS, BUG_PATTERNS } from './todo-patterns.js';
export type { TodoPatternType, TodoViolationType, TodoPatternInfo, TodoViolationInfo, TodoAnalysis } from './todo-patterns.js';

export { DeprecationDetector, createDeprecationDetector, analyzeDeprecation, shouldExcludeFile as shouldExcludeDeprecation, detectJsdocDeprecated, detectDecoratorDeprecated, detectConsoleWarn, detectDeprecationNotice, detectLegacyMarker, JSDOC_DEPRECATED_PATTERNS, DECORATOR_DEPRECATED_PATTERNS, DEPRECATION_NOTICE_PATTERNS } from './deprecation.js';
export type { DeprecationPatternType, DeprecationViolationType, DeprecationPatternInfo, DeprecationViolationInfo, DeprecationAnalysis } from './deprecation.js';

export { ExampleCodeDetector, createExampleCodeDetector, analyzeExampleCode, shouldExcludeFile as shouldExcludeExampleCode, detectCodeBlock, detectInlineCode, detectExampleTag as detectExampleCodeTag, detectUsageExample, detectSnippet, detectDemoCode, CODE_BLOCK_PATTERNS, INLINE_CODE_PATTERNS, EXAMPLE_TAG_PATTERNS } from './example-code.js';
export type { ExampleCodePatternType, ExampleCodeViolationType, ExampleCodePatternInfo, ExampleCodeViolationInfo, ExampleCodeAnalysis } from './example-code.js';

// Factory Function
import { JsdocPatternsDetector } from './jsdoc-patterns.js';
import { ReadmeStructureDetector } from './readme-structure.js';
import { TodoPatternsDetector } from './todo-patterns.js';
import { DeprecationDetector } from './deprecation.js';
import { ExampleCodeDetector } from './example-code.js';

export type DocumentationDetector = JsdocPatternsDetector | ReadmeStructureDetector | TodoPatternsDetector | DeprecationDetector | ExampleCodeDetector;

export function createDocumentationDetectors(): DocumentationDetector[] {
  return [new JsdocPatternsDetector(), new ReadmeStructureDetector(), new TodoPatternsDetector(), new DeprecationDetector(), new ExampleCodeDetector()];
}
