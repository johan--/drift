# C++ Language Support Design

## Overview

Add comprehensive support for C++, enabling full call graph analysis, data flow mapping, pattern detection, and framework-aware extraction across C++ codebases. This follows Drift's established hybrid extraction pattern: tree-sitter (primary) with regex fallback for enterprise-grade coverage.

## Motivation

C++ remains the dominant language for game development (Unreal Engine), systems programming, embedded systems, high-frequency trading, and performance-critical applications. Enterprise customers building with Unreal Engine, Qt, or using C++ for backend services need Drift support. Current gap prevents:

- Mapping game engine handlers to data operations
- Tracing data flow through middleware and callback chains
- Detecting C++-specific patterns (RAII, smart pointers, templates)
- Understanding class hierarchies and virtual dispatch
- Analyzing database access patterns (SQLite, ODBC, custom ORMs)

## Goals

1. Parse C++ files with tree-sitter (primary) and regex fallback
2. Extract functions, methods, classes, structs, templates, and calls
3. Detect C++ framework patterns (Unreal Engine, Qt, Boost, STL)
4. Extract data access patterns (SQLite, ODBC, custom database layers)
5. Integrate with existing call graph and pattern detection (15 categories, 170+ patterns)
6. Support CLI and MCP interfaces
7. Test topology extraction for C++ testing frameworks (Google Test, Catch2)

## Non-Goals

- Full template metaprogramming analysis (basic detection only)
- Preprocessor macro expansion beyond common patterns
- Compile-time constexpr evaluation
- Platform-specific intrinsics analysis
- Assembly inline analysis


---

## Architecture

### Component Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      C++ Support Layer                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ C++ Tree-Sitter │  │  C++ Regex      │  │ C++ Data Access │  │
│  │ Extractor       │──│  Fallback       │──│  Extractor      │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│         │                    │                     │             │
│         ▼                    ▼                     ▼             │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              C++ Hybrid Extractor                            ││
│  │  (Combines AST + Regex with confidence tracking)             ││
│  └─────────────────────────────────────────────────────────────┘│
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │           Existing Call Graph + Pattern System               ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### File Structure

```
packages/core/src/
├── parsers/tree-sitter/
│   ├── cpp-loader.ts                     # Tree-sitter C++ grammar loader
│   └── tree-sitter-cpp-parser.ts         # C++-specific parser utilities
├── call-graph/extractors/
│   ├── cpp-extractor.ts                  # Main C++ extractor (tree-sitter)
│   ├── cpp-hybrid-extractor.ts           # Hybrid AST + regex extractor
│   ├── cpp-data-access-extractor.ts      # SQLite/ODBC detection
│   └── regex/
│       └── cpp-regex.ts                  # Regex fallback patterns
├── test-topology/extractors/
│   ├── cpp-test-extractor.ts             # C++ testing framework extractor
│   └── regex/
│       └── cpp-test-regex.ts             # Test regex fallback
├── unified-provider/
│   ├── normalization/
│   │   └── cpp-normalizer.ts             # C++-specific normalization
│   └── matching/
│       ├── sqlite-matcher.ts             # SQLite pattern matcher
│       └── qt-sql-matcher.ts             # Qt SQL pattern matcher
├── environment/extractors/
│   └── cpp-env-extractor.ts              # Environment variable extraction
├── constants/extractors/
│   ├── cpp-extractor.ts                  # Constants/enums extraction
│   └── regex/
│       └── cpp-regex.ts                  # Constants regex fallback

packages/cli/src/commands/
├── cpp.ts                                # drift cpp <subcommand>

packages/mcp/src/tools/analysis/
├── cpp.ts                                # drift_cpp MCP tool

packages/detectors/src/
├── api/cpp/
│   ├── unreal-detector.ts                # Unreal Engine patterns
│   ├── qt-detector.ts                    # Qt framework patterns
│   └── rest-sdk-detector.ts              # C++ REST SDK patterns
├── errors/cpp/
│   └── error-handling-detector.ts        # C++ error handling patterns
├── auth/cpp/
│   └── middleware-detector.ts            # Auth middleware patterns
└── memory/cpp/
    └── smart-pointer-detector.ts         # Smart pointer patterns
```


---

## Phase 1: Core Type Updates

### 1.1 CallGraphLanguage Type

Update `packages/core/src/call-graph/types.ts`:

```typescript
/**
 * Supported languages for call graph extraction
 */
export type CallGraphLanguage = 
  | 'python' 
  | 'typescript' 
  | 'javascript' 
  | 'java' 
  | 'csharp' 
  | 'php' 
  | 'go'
  | 'rust'
  | 'cpp';  // NEW
```

### 1.2 UnifiedLanguage Type

Update `packages/core/src/unified-provider/types.ts`:

```typescript
/**
 * Supported languages for unified extraction
 */
export type UnifiedLanguage = 
  | 'typescript' 
  | 'javascript' 
  | 'python' 
  | 'java' 
  | 'csharp' 
  | 'php' 
  | 'go'
  | 'rust'
  | 'cpp';  // NEW
```

### 1.3 File Extensions

```typescript
const CPP_EXTENSIONS = [
  '.cpp',    // C++ source
  '.cc',     // Alternative C++ source
  '.cxx',    // Alternative C++ source
  '.c++',    // Alternative C++ source
  '.hpp',    // C++ header
  '.hh',     // Alternative C++ header
  '.hxx',    // Alternative C++ header
  '.h',      // C/C++ header (context-dependent)
  '.ipp',    // Implementation header (templates)
  '.tpp',    // Template implementation
];
```

---

## Phase 2: Tree-Sitter Parser Setup

### 2.1 C++ Grammar Loader

```typescript
// packages/core/src/parsers/tree-sitter/cpp-loader.ts

/**
 * Tree-sitter C++ Loader
 *
 * Handles loading tree-sitter and tree-sitter-cpp with graceful fallback.
 * Provides functions to check availability and access the parser/language.
 *
 * @requirements C++ Language Support
 */

import { createRequire } from 'node:module';
import type { TreeSitterParser, TreeSitterLanguage } from './types.js';

const require = createRequire(import.meta.url);

let cppAvailable: boolean | null = null;
let cachedTreeSitter: (new () => TreeSitterParser) | null = null;
let cachedCppLanguage: TreeSitterLanguage | null = null;
let loadingError: string | null = null;

/**
 * Check if tree-sitter-cpp is available.
 */
export function isCppTreeSitterAvailable(): boolean {
  if (cppAvailable !== null) {
    return cppAvailable;
  }

  try {
    loadCppTreeSitter();
    cppAvailable = true;
  } catch (error) {
    cppAvailable = false;
    loadingError = error instanceof Error ? error.message : 'Unknown error loading tree-sitter-cpp';
    logDebug(`tree-sitter-cpp not available: ${loadingError}`);
  }

  return cppAvailable;
}

/**
 * Get the C++ language for tree-sitter.
 */
export function getCppLanguage(): TreeSitterLanguage {
  if (!isCppTreeSitterAvailable()) {
    throw new Error(`tree-sitter-cpp is not available: ${loadingError ?? 'unknown error'}`);
  }
  if (!cachedCppLanguage) {
    throw new Error('tree-sitter-cpp language not loaded');
  }
  return cachedCppLanguage;
}

/**
 * Create a new C++ parser instance.
 */
export function createCppParser(): TreeSitterParser {
  const Parser = getCppParserConstructor();
  const language = getCppLanguage();
  const parser = new Parser();
  parser.setLanguage(language);
  return parser;
}

/**
 * Get the tree-sitter Parser constructor.
 */
export function getCppParserConstructor(): new () => TreeSitterParser {
  if (!isCppTreeSitterAvailable()) {
    throw new Error(`tree-sitter-cpp is not available: ${loadingError ?? 'unknown error'}`);
  }
  if (!cachedTreeSitter) {
    throw new Error('tree-sitter not loaded');
  }
  return cachedTreeSitter;
}

/**
 * Get loading error if any.
 */
export function getCppLoadingError(): string | null {
  return loadingError;
}

/**
 * Reset cached state (for testing).
 */
export function resetCppTreeSitter(): void {
  cppAvailable = null;
  cachedTreeSitter = null;
  cachedCppLanguage = null;
  loadingError = null;
}

function loadCppTreeSitter(): void {
  const TreeSitter = require('tree-sitter');
  cachedTreeSitter = TreeSitter;
  const CppLanguage = require('tree-sitter-cpp');
  cachedCppLanguage = CppLanguage;
}

function logDebug(message: string): void {
  if (process.env.DEBUG?.includes('drift')) {
    console.debug(`[cpp-loader] ${message}`);
  }
}
```

### 2.2 Dependencies

Add to `packages/core/package.json`:

```json
{
  "dependencies": {
    "tree-sitter-cpp": "^0.22.0"
  }
}
```


---

## Phase 3: C++-Specific Types

### 3.1 C++ Type Definitions

```typescript
// packages/core/src/call-graph/extractors/cpp-types.ts

/**
 * C++-specific type definitions for call graph extraction
 */

export interface CppFunction {
  name: string;
  qualifiedName: string;           // namespace::Class::method or namespace::function
  parameters: CppParameter[];
  returnType?: string;
  templateParams?: CppTemplateParam[];
  isVirtual: boolean;
  isPureVirtual: boolean;
  isOverride: boolean;
  isFinal: boolean;
  isStatic: boolean;
  isConst: boolean;                // const member function
  isConstexpr: boolean;
  isInline: boolean;
  isNoexcept: boolean;
  isExported: boolean;             // Not in anonymous namespace
  visibility: CppVisibility;
  startLine: number;
  endLine: number;
  bodyStartLine: number;
  bodyEndLine: number;
}

export interface CppMethod extends CppFunction {
  className: string;
  isConstructor: boolean;
  isDestructor: boolean;
  isCopyConstructor: boolean;
  isMoveConstructor: boolean;
  isCopyAssignment: boolean;
  isMoveAssignment: boolean;
  isDefaulted: boolean;            // = default
  isDeleted: boolean;              // = delete
}

export type CppVisibility = 
  | 'public'
  | 'protected'
  | 'private';

export interface CppParameter {
  name: string;
  type: string;
  isConst: boolean;
  isReference: boolean;            // &
  isRvalueRef: boolean;            // &&
  isPointer: boolean;              // *
  defaultValue?: string;
}

export interface CppTemplateParam {
  name: string;
  kind: 'type' | 'non-type' | 'template';
  constraint?: string;             // C++20 concepts
  defaultValue?: string;
}

export interface CppClass {
  name: string;
  qualifiedName: string;
  isExported: boolean;
  visibility: CppVisibility;
  baseClasses: CppBaseClass[];
  methods: string[];
  fields: CppField[];
  templateParams?: CppTemplateParam[];
  isStruct: boolean;               // struct vs class
  isFinal: boolean;
  isAbstract: boolean;             // Has pure virtual methods
  startLine: number;
  endLine: number;
}

export interface CppBaseClass {
  name: string;
  visibility: CppVisibility;
  isVirtual: boolean;              // virtual inheritance
}

export interface CppField {
  name: string;
  type: string;
  visibility: CppVisibility;
  isStatic: boolean;
  isConst: boolean;
  isMutable: boolean;
  defaultValue?: string;
}

export interface CppEnum {
  name: string;
  isExported: boolean;
  isScoped: boolean;               // enum class vs enum
  underlyingType?: string;
  values: CppEnumValue[];
  startLine: number;
  endLine: number;
}

export interface CppEnumValue {
  name: string;
  value?: string;
}

export interface CppNamespace {
  name: string;
  isAnonymous: boolean;
  isInline: boolean;
  startLine: number;
  endLine: number;
}

export interface CppInclude {
  path: string;
  isSystem: boolean;               // <header> vs "header"
  line: number;
}

export interface CppCall {
  calleeName: string;
  receiver?: string;               // For method calls
  namespacePath?: string;          // For qualified calls
  fullExpression: string;
  line: number;
  column: number;
  argumentCount: number;
  isMethodCall: boolean;
  isVirtualCall: boolean;          // Through pointer/reference
  isOperatorCall: boolean;         // operator overload
  isTemplateCall: boolean;         // func<T>()
  isMacroCall: boolean;            // MACRO()
}

export interface CppMacroCall {
  name: string;
  fullExpression: string;
  line: number;
  column: number;
  argumentCount: number;
}
```


---

## Phase 4: Tree-Sitter Parser Implementation

### 4.1 C++ Tree-Sitter Parser

```typescript
// packages/core/src/parsers/tree-sitter/tree-sitter-cpp-parser.ts

/**
 * Tree-sitter C++ Parser
 *
 * C++ parsing using tree-sitter-cpp with semantic extraction.
 * Extracts includes, namespaces, classes, structs, functions,
 * methods, templates, and enums.
 *
 * @requirements C++ Language Support
 */

import { BaseParser } from '../base-parser.js';
import type { AST, ASTNode, Language, ParseResult, Position } from '../types.js';
import { isCppTreeSitterAvailable, createCppParser, getCppLoadingError } from './cpp-loader.js';
import type { TreeSitterNode, TreeSitterParser } from './types.js';

// ============================================
// Types
// ============================================

export interface CppIncludeInfo {
  path: string;
  isSystem: boolean;
  startPosition: Position;
  endPosition: Position;
}

export interface CppNamespaceInfo {
  name: string;
  isAnonymous: boolean;
  isInline: boolean;
  startPosition: Position;
  endPosition: Position;
}

export interface CppClassInfo {
  name: string;
  namespace: string | null;
  isStruct: boolean;
  isFinal: boolean;
  baseClasses: Array<{ name: string; visibility: string; isVirtual: boolean }>;
  templateParams: string[];
  methods: CppMethodInfo[];
  fields: CppFieldInfo[];
  constructors: CppConstructorInfo[];
  destructor: CppDestructorInfo | null;
  startPosition: Position;
  endPosition: Position;
}

export interface CppMethodInfo {
  name: string;
  returnType: string;
  parameters: CppParameterInfo[];
  visibility: 'public' | 'private' | 'protected';
  isVirtual: boolean;
  isPureVirtual: boolean;
  isOverride: boolean;
  isFinal: boolean;
  isStatic: boolean;
  isConst: boolean;
  isConstexpr: boolean;
  isNoexcept: boolean;
  isInline: boolean;
  templateParams: string[];
  startPosition: Position;
  endPosition: Position;
}

export interface CppParameterInfo {
  name: string;
  type: string;
  defaultValue: string | null;
  isConst: boolean;
  isReference: boolean;
  isPointer: boolean;
}

export interface CppFieldInfo {
  name: string;
  type: string;
  visibility: 'public' | 'private' | 'protected';
  isStatic: boolean;
  isConst: boolean;
  isMutable: boolean;
  defaultValue: string | null;
  startPosition: Position;
  endPosition: Position;
}

export interface CppConstructorInfo {
  parameters: CppParameterInfo[];
  visibility: 'public' | 'private' | 'protected';
  isExplicit: boolean;
  isDefaulted: boolean;
  isDeleted: boolean;
  initializerList: string[];
  startPosition: Position;
  endPosition: Position;
}

export interface CppDestructorInfo {
  visibility: 'public' | 'private' | 'protected';
  isVirtual: boolean;
  isDefaulted: boolean;
  isDeleted: boolean;
  startPosition: Position;
  endPosition: Position;
}

export interface CppFunctionInfo {
  name: string;
  namespace: string | null;
  returnType: string;
  parameters: CppParameterInfo[];
  isStatic: boolean;
  isInline: boolean;
  isConstexpr: boolean;
  isNoexcept: boolean;
  templateParams: string[];
  startPosition: Position;
  endPosition: Position;
}

export interface CppEnumInfo {
  name: string;
  namespace: string | null;
  isScoped: boolean;
  underlyingType: string | null;
  values: Array<{ name: string; value: string | null }>;
  startPosition: Position;
  endPosition: Position;
}

export interface CppTypedefInfo {
  name: string;
  targetType: string;
  isUsing: boolean;
  startPosition: Position;
  endPosition: Position;
}

export interface TreeSitterCppParseResult extends ParseResult {
  includes: CppIncludeInfo[];
  namespaces: CppNamespaceInfo[];
  classes: CppClassInfo[];
  functions: CppFunctionInfo[];
  enums: CppEnumInfo[];
  typedefs: CppTypedefInfo[];
  macroDefinitions: string[];
}

// ============================================
// Parser Implementation
// ============================================

export class TreeSitterCppParser extends BaseParser {
  readonly language: Language = 'cpp';
  readonly extensions: string[] = ['.cpp', '.cc', '.cxx', '.hpp', '.hh', '.hxx', '.h'];

  private parser: TreeSitterParser | null = null;
  private currentNamespace: string | null = null;
  private currentVisibility: 'public' | 'private' | 'protected' = 'private';

  constructor() {
    super();
  }

  static isAvailable(): boolean {
    return isCppTreeSitterAvailable();
  }

  static getLoadingError(): string | null {
    return getCppLoadingError();
  }

  private ensureParser(): TreeSitterParser {
    if (!this.parser) {
      if (!isCppTreeSitterAvailable()) {
        throw new Error(`C++ parser not available: ${getCppLoadingError() ?? 'unknown error'}`);
      }
      this.parser = createCppParser();
    }
    return this.parser;
  }

  parse(source: string, _filePath?: string): TreeSitterCppParseResult {
    try {
      const parser = this.ensureParser();
      const tree = parser.parse(source);

      this.currentNamespace = null;
      this.currentVisibility = 'private';

      const includes = this.extractIncludes(tree.rootNode);
      const namespaces = this.extractNamespaces(tree.rootNode);
      const classes = this.extractClasses(tree.rootNode);
      const functions = this.extractFunctions(tree.rootNode);
      const enums = this.extractEnums(tree.rootNode);
      const typedefs = this.extractTypedefs(tree.rootNode);
      const macroDefinitions = this.extractMacroDefinitions(tree.rootNode);

      return {
        ast: { rootNode: this.convertNode(tree.rootNode), text: source },
        language: 'cpp',
        errors: [],
        success: true,
        includes,
        namespaces,
        classes,
        functions,
        enums,
        typedefs,
        macroDefinitions,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown parse error';
      return {
        ast: null,
        language: 'cpp',
        errors: [{ message: errorMessage, position: { row: 0, column: 0 } }],
        success: false,
        includes: [],
        namespaces: [],
        classes: [],
        functions: [],
        enums: [],
        typedefs: [],
        macroDefinitions: [],
      };
    }
  }

  query(ast: AST, pattern: string): ASTNode[] {
    return this.findNodesByType(ast, pattern);
  }

  // ============================================
  // Extraction Methods
  // ============================================

  private extractIncludes(root: TreeSitterNode): CppIncludeInfo[] {
    const includes: CppIncludeInfo[] = [];
    
    this.findNodesOfType(root, 'preproc_include', (node) => {
      const pathNode = node.childForFieldName('path');
      if (pathNode) {
        const path = pathNode.text;
        const isSystem = path.startsWith('<');
        includes.push({
          path: path.replace(/^[<"]|[>"]$/g, ''),
          isSystem,
          startPosition: { row: node.startPosition.row, column: node.startPosition.column },
          endPosition: { row: node.endPosition.row, column: node.endPosition.column },
        });
      }
    });
    
    return includes;
  }

  private extractNamespaces(root: TreeSitterNode): CppNamespaceInfo[] {
    const namespaces: CppNamespaceInfo[] = [];
    
    this.findNodesOfType(root, 'namespace_definition', (node) => {
      const nameNode = node.childForFieldName('name');
      const isAnonymous = !nameNode;
      const isInline = node.children.some(c => c.text === 'inline');
      
      namespaces.push({
        name: nameNode?.text ?? '',
        isAnonymous,
        isInline,
        startPosition: { row: node.startPosition.row, column: node.startPosition.column },
        endPosition: { row: node.endPosition.row, column: node.endPosition.column },
      });
    });
    
    return namespaces;
  }

  private extractClasses(root: TreeSitterNode): CppClassInfo[] {
    const classes: CppClassInfo[] = [];
    
    // Extract class definitions
    this.findNodesOfType(root, 'class_specifier', (node) => {
      classes.push(this.parseClassSpecifier(node, false));
    });
    
    // Extract struct definitions
    this.findNodesOfType(root, 'struct_specifier', (node) => {
      classes.push(this.parseClassSpecifier(node, true));
    });
    
    return classes;
  }

  private parseClassSpecifier(node: TreeSitterNode, isStruct: boolean): CppClassInfo {
    const nameNode = node.childForFieldName('name');
    const name = nameNode?.text ?? '';
    
    const baseClasses: CppClassInfo['baseClasses'] = [];
    const baseListNode = node.children.find(c => c.type === 'base_class_clause');
    if (baseListNode) {
      for (const child of baseListNode.children) {
        if (child.type === 'base_class_specifier') {
          const baseName = child.childForFieldName('name')?.text ?? '';
          const visibility = this.extractBaseVisibility(child);
          const isVirtual = child.children.some(c => c.text === 'virtual');
          baseClasses.push({ name: baseName, visibility, isVirtual });
        }
      }
    }

    const templateParams = this.extractTemplateParams(node);
    const isFinal = node.children.some(c => c.text === 'final');
    
    const methods: CppMethodInfo[] = [];
    const fields: CppFieldInfo[] = [];
    const constructors: CppConstructorInfo[] = [];
    let destructor: CppDestructorInfo | null = null;

    const bodyNode = node.children.find(c => c.type === 'field_declaration_list');
    if (bodyNode) {
      this.currentVisibility = isStruct ? 'public' : 'private';
      this.parseClassBody(bodyNode, name, methods, fields, constructors, (d) => { destructor = d; });
    }

    return {
      name,
      namespace: this.currentNamespace,
      isStruct,
      isFinal,
      baseClasses,
      templateParams,
      methods,
      fields,
      constructors,
      destructor,
      startPosition: { row: node.startPosition.row, column: node.startPosition.column },
      endPosition: { row: node.endPosition.row, column: node.endPosition.column },
    };
  }

  private parseClassBody(
    node: TreeSitterNode,
    className: string,
    methods: CppMethodInfo[],
    fields: CppFieldInfo[],
    constructors: CppConstructorInfo[],
    setDestructor: (d: CppDestructorInfo) => void
  ): void {
    for (const child of node.children) {
      if (child.type === 'access_specifier') {
        const specifier = child.text.replace(':', '').trim();
        if (specifier === 'public' || specifier === 'private' || specifier === 'protected') {
          this.currentVisibility = specifier;
        }
      } else if (child.type === 'function_definition' || child.type === 'declaration') {
        this.parseClassMember(child, className, methods, fields, constructors, setDestructor);
      } else if (child.type === 'field_declaration') {
        this.parseFieldDeclaration(child, fields);
      }
    }
  }

  private parseClassMember(
    node: TreeSitterNode,
    className: string,
    methods: CppMethodInfo[],
    fields: CppFieldInfo[],
    constructors: CppConstructorInfo[],
    setDestructor: (d: CppDestructorInfo) => void
  ): void {
    const declaratorNode = node.childForFieldName('declarator');
    if (!declaratorNode) return;

    // Check if constructor
    if (declaratorNode.type === 'function_declarator') {
      const nameNode = declaratorNode.childForFieldName('declarator');
      const name = nameNode?.text ?? '';
      
      if (name === className) {
        constructors.push(this.parseConstructor(node));
        return;
      }
      
      if (name === `~${className}`) {
        setDestructor(this.parseDestructor(node));
        return;
      }
    }

    // Regular method
    methods.push(this.parseMethod(node));
  }

  private parseMethod(node: TreeSitterNode): CppMethodInfo {
    const typeNode = node.childForFieldName('type');
    const declaratorNode = node.childForFieldName('declarator');
    
    let name = '';
    let parameters: CppParameterInfo[] = [];
    
    if (declaratorNode?.type === 'function_declarator') {
      const nameNode = declaratorNode.childForFieldName('declarator');
      name = nameNode?.text ?? '';
      const paramsNode = declaratorNode.childForFieldName('parameters');
      if (paramsNode) {
        parameters = this.extractParameters(paramsNode);
      }
    }

    const isVirtual = node.children.some(c => c.text === 'virtual');
    const isStatic = node.children.some(c => c.text === 'static');
    const isInline = node.children.some(c => c.text === 'inline');
    const isConstexpr = node.children.some(c => c.text === 'constexpr');
    const isConst = declaratorNode?.children.some(c => c.text === 'const') ?? false;
    const isNoexcept = declaratorNode?.children.some(c => c.text === 'noexcept') ?? false;
    const isOverride = declaratorNode?.children.some(c => c.text === 'override') ?? false;
    const isFinal = declaratorNode?.children.some(c => c.text === 'final') ?? false;
    const isPureVirtual = node.text.includes('= 0');

    return {
      name,
      returnType: typeNode?.text ?? 'void',
      parameters,
      visibility: this.currentVisibility,
      isVirtual,
      isPureVirtual,
      isOverride,
      isFinal,
      isStatic,
      isConst,
      isConstexpr,
      isNoexcept,
      isInline,
      templateParams: this.extractTemplateParams(node),
      startPosition: { row: node.startPosition.row, column: node.startPosition.column },
      endPosition: { row: node.endPosition.row, column: node.endPosition.column },
    };
  }

  private parseConstructor(node: TreeSitterNode): CppConstructorInfo {
    const declaratorNode = node.childForFieldName('declarator');
    let parameters: CppParameterInfo[] = [];
    
    if (declaratorNode?.type === 'function_declarator') {
      const paramsNode = declaratorNode.childForFieldName('parameters');
      if (paramsNode) {
        parameters = this.extractParameters(paramsNode);
      }
    }

    const isExplicit = node.children.some(c => c.text === 'explicit');
    const isDefaulted = node.text.includes('= default');
    const isDeleted = node.text.includes('= delete');
    const initializerList = this.extractInitializerList(node);

    return {
      parameters,
      visibility: this.currentVisibility,
      isExplicit,
      isDefaulted,
      isDeleted,
      initializerList,
      startPosition: { row: node.startPosition.row, column: node.startPosition.column },
      endPosition: { row: node.endPosition.row, column: node.endPosition.column },
    };
  }

  private parseDestructor(node: TreeSitterNode): CppDestructorInfo {
    const isVirtual = node.children.some(c => c.text === 'virtual');
    const isDefaulted = node.text.includes('= default');
    const isDeleted = node.text.includes('= delete');

    return {
      visibility: this.currentVisibility,
      isVirtual,
      isDefaulted,
      isDeleted,
      startPosition: { row: node.startPosition.row, column: node.startPosition.column },
      endPosition: { row: node.endPosition.row, column: node.endPosition.column },
    };
  }

  private parseFieldDeclaration(node: TreeSitterNode, fields: CppFieldInfo[]): void {
    const typeNode = node.childForFieldName('type');
    const declaratorNode = node.childForFieldName('declarator');
    
    if (!declaratorNode) return;

    const name = declaratorNode.text.replace(/[*&\s]/g, '');
    const isStatic = node.children.some(c => c.text === 'static');
    const isConst = node.children.some(c => c.text === 'const');
    const isMutable = node.children.some(c => c.text === 'mutable');

    fields.push({
      name,
      type: typeNode?.text ?? 'auto',
      visibility: this.currentVisibility,
      isStatic,
      isConst,
      isMutable,
      defaultValue: null,
      startPosition: { row: node.startPosition.row, column: node.startPosition.column },
      endPosition: { row: node.endPosition.row, column: node.endPosition.column },
    });
  }

  private extractFunctions(root: TreeSitterNode): CppFunctionInfo[] {
    const functions: CppFunctionInfo[] = [];
    
    this.findNodesOfType(root, 'function_definition', (node) => {
      // Skip if inside a class
      if (this.isInsideClass(node)) return;
      
      const typeNode = node.childForFieldName('type');
      const declaratorNode = node.childForFieldName('declarator');
      
      if (!declaratorNode) return;

      let name = '';
      let parameters: CppParameterInfo[] = [];
      
      if (declaratorNode.type === 'function_declarator') {
        const nameNode = declaratorNode.childForFieldName('declarator');
        name = nameNode?.text ?? '';
        const paramsNode = declaratorNode.childForFieldName('parameters');
        if (paramsNode) {
          parameters = this.extractParameters(paramsNode);
        }
      }

      const isStatic = node.children.some(c => c.text === 'static');
      const isInline = node.children.some(c => c.text === 'inline');
      const isConstexpr = node.children.some(c => c.text === 'constexpr');
      const isNoexcept = declaratorNode.children.some(c => c.text === 'noexcept');

      functions.push({
        name,
        namespace: this.currentNamespace,
        returnType: typeNode?.text ?? 'void',
        parameters,
        isStatic,
        isInline,
        isConstexpr,
        isNoexcept,
        templateParams: this.extractTemplateParams(node),
        startPosition: { row: node.startPosition.row, column: node.startPosition.column },
        endPosition: { row: node.endPosition.row, column: node.endPosition.column },
      });
    });
    
    return functions;
  }

  private extractEnums(root: TreeSitterNode): CppEnumInfo[] {
    const enums: CppEnumInfo[] = [];
    
    this.findNodesOfType(root, 'enum_specifier', (node) => {
      const nameNode = node.childForFieldName('name');
      const isScoped = node.children.some(c => c.text === 'class' || c.text === 'struct');
      
      let underlyingType: string | null = null;
      const baseNode = node.children.find(c => c.type === 'type_identifier');
      if (baseNode) {
        underlyingType = baseNode.text;
      }

      const values: Array<{ name: string; value: string | null }> = [];
      const bodyNode = node.children.find(c => c.type === 'enumerator_list');
      if (bodyNode) {
        for (const child of bodyNode.children) {
          if (child.type === 'enumerator') {
            const enumName = child.childForFieldName('name')?.text ?? '';
            const enumValue = child.childForFieldName('value')?.text ?? null;
            values.push({ name: enumName, value: enumValue });
          }
        }
      }

      enums.push({
        name: nameNode?.text ?? '',
        namespace: this.currentNamespace,
        isScoped,
        underlyingType,
        values,
        startPosition: { row: node.startPosition.row, column: node.startPosition.column },
        endPosition: { row: node.endPosition.row, column: node.endPosition.column },
      });
    });
    
    return enums;
  }

  private extractTypedefs(root: TreeSitterNode): CppTypedefInfo[] {
    const typedefs: CppTypedefInfo[] = [];
    
    // Traditional typedef
    this.findNodesOfType(root, 'type_definition', (node) => {
      const typeNode = node.childForFieldName('type');
      const declaratorNode = node.childForFieldName('declarator');
      
      if (typeNode && declaratorNode) {
        typedefs.push({
          name: declaratorNode.text,
          targetType: typeNode.text,
          isUsing: false,
          startPosition: { row: node.startPosition.row, column: node.startPosition.column },
          endPosition: { row: node.endPosition.row, column: node.endPosition.column },
        });
      }
    });
    
    // Using alias
    this.findNodesOfType(root, 'alias_declaration', (node) => {
      const nameNode = node.childForFieldName('name');
      const typeNode = node.childForFieldName('type');
      
      if (nameNode && typeNode) {
        typedefs.push({
          name: nameNode.text,
          targetType: typeNode.text,
          isUsing: true,
          startPosition: { row: node.startPosition.row, column: node.startPosition.column },
          endPosition: { row: node.endPosition.row, column: node.endPosition.column },
        });
      }
    });
    
    return typedefs;
  }

  private extractMacroDefinitions(root: TreeSitterNode): string[] {
    const macros: string[] = [];
    
    this.findNodesOfType(root, 'preproc_def', (node) => {
      const nameNode = node.childForFieldName('name');
      if (nameNode) {
        macros.push(nameNode.text);
      }
    });
    
    this.findNodesOfType(root, 'preproc_function_def', (node) => {
      const nameNode = node.childForFieldName('name');
      if (nameNode) {
        macros.push(nameNode.text);
      }
    });
    
    return macros;
  }

  // ============================================
  // Helper Methods
  // ============================================

  private extractParameters(node: TreeSitterNode): CppParameterInfo[] {
    const params: CppParameterInfo[] = [];
    
    for (const child of node.children) {
      if (child.type === 'parameter_declaration') {
        const typeNode = child.childForFieldName('type');
        const declaratorNode = child.childForFieldName('declarator');
        const defaultNode = child.childForFieldName('default_value');
        
        const type = typeNode?.text ?? 'auto';
        const name = declaratorNode?.text?.replace(/[*&\s]/g, '') ?? '';
        const isConst = type.includes('const');
        const isReference = type.includes('&') && !type.includes('&&');
        const isPointer = type.includes('*');

        params.push({
          name,
          type,
          defaultValue: defaultNode?.text ?? null,
          isConst,
          isReference,
          isPointer,
        });
      }
    }
    
    return params;
  }

  private extractTemplateParams(node: TreeSitterNode): string[] {
    const params: string[] = [];
    
    let sibling = node.previousNamedSibling;
    if (sibling?.type === 'template_declaration') {
      const paramsNode = sibling.childForFieldName('parameters');
      if (paramsNode) {
        for (const child of paramsNode.children) {
          if (child.type === 'type_parameter_declaration' || 
              child.type === 'parameter_declaration') {
            const nameNode = child.childForFieldName('name');
            if (nameNode) {
              params.push(nameNode.text);
            }
          }
        }
      }
    }
    
    return params;
  }

  private extractInitializerList(node: TreeSitterNode): string[] {
    const initializers: string[] = [];
    
    const initListNode = node.children.find(c => c.type === 'field_initializer_list');
    if (initListNode) {
      for (const child of initListNode.children) {
        if (child.type === 'field_initializer') {
          const nameNode = child.childForFieldName('name');
          if (nameNode) {
            initializers.push(nameNode.text);
          }
        }
      }
    }
    
    return initializers;
  }

  private extractBaseVisibility(node: TreeSitterNode): string {
    for (const child of node.children) {
      if (child.text === 'public' || child.text === 'private' || child.text === 'protected') {
        return child.text;
      }
    }
    return 'private';
  }

  private isInsideClass(node: TreeSitterNode): boolean {
    let parent = node.parent;
    while (parent) {
      if (parent.type === 'class_specifier' || parent.type === 'struct_specifier') {
        return true;
      }
      parent = parent.parent;
    }
    return false;
  }

  private findNodesOfType(root: TreeSitterNode, type: string, callback: (node: TreeSitterNode) => void): void {
    const visit = (node: TreeSitterNode): void => {
      if (node.type === type) {
        callback(node);
      }
      for (const child of node.children) {
        visit(child);
      }
    };
    visit(root);
  }

  private convertNode(node: TreeSitterNode): ASTNode {
    return {
      type: node.type,
      text: node.text,
      startPosition: { row: node.startPosition.row, column: node.startPosition.column },
      endPosition: { row: node.endPosition.row, column: node.endPosition.column },
      children: node.children.map(c => this.convertNode(c)),
    };
  }
}
```


---

## Phase 5: Hybrid Extractor (AST Primary + Regex Fallback)

### 5.1 C++ Hybrid Extractor

```typescript
// packages/core/src/call-graph/extractors/cpp-hybrid-extractor.ts

/**
 * C++ Hybrid Extractor
 *
 * Combines tree-sitter (primary) with regex fallback for enterprise-grade
 * C++ code extraction. Follows the established pattern from other languages.
 *
 * @requirements C++ Language Support
 */

import { HybridExtractorBase } from './hybrid-extractor-base.js';
import { CppRegexExtractor } from './regex/cpp-regex.js';
import type { CallGraphLanguage, FileExtractionResult } from '../types.js';
import {
  isCppTreeSitterAvailable,
  createCppParser,
} from '../../parsers/tree-sitter/cpp-loader.js';
import type { TreeSitterParser, TreeSitterNode } from '../../parsers/tree-sitter/types.js';
import type { HybridExtractorConfig } from './types.js';

export class CppHybridExtractor extends HybridExtractorBase {
  readonly language: CallGraphLanguage = 'cpp';
  readonly extensions: string[] = ['.cpp', '.cc', '.cxx', '.hpp', '.hh', '.hxx', '.h'];
  protected regexExtractor = new CppRegexExtractor();

  private parser: TreeSitterParser | null = null;
  private currentNamespace: string | null = null;
  private currentClass: string | null = null;
  private currentVisibility: 'public' | 'private' | 'protected' = 'private';

  constructor(config?: HybridExtractorConfig) {
    super(config);
  }

  protected isTreeSitterAvailable(): boolean {
    return isCppTreeSitterAvailable();
  }

  protected extractWithTreeSitter(source: string, filePath: string): FileExtractionResult | null {
    if (!isCppTreeSitterAvailable()) {
      return null;
    }

    const result: FileExtractionResult = {
      file: filePath,
      language: this.language,
      functions: [],
      calls: [],
      imports: [],
      exports: [],
      classes: [],
      errors: [],
    };

    try {
      if (!this.parser) {
        this.parser = createCppParser();
      }

      const tree = this.parser.parse(source);
      this.currentNamespace = null;
      this.currentClass = null;
      this.currentVisibility = 'private';

      this.visitNode(tree.rootNode, result, source);

    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : 'Unknown parse error');
    }

    return result;
  }

  private visitNode(
    node: TreeSitterNode,
    result: FileExtractionResult,
    source: string
  ): void {
    switch (node.type) {
      case 'namespace_definition':
        this.extractNamespace(node, result, source);
        break;

      case 'class_specifier':
        this.extractClassSpecifier(node, result, source, false);
        break;

      case 'struct_specifier':
        this.extractClassSpecifier(node, result, source, true);
        break;

      case 'function_definition':
        if (!this.isInsideClass(node)) {
          this.extractFunctionDefinition(node, result, source);
        }
        break;

      case 'preproc_include':
        this.extractInclude(node, result);
        break;

      case 'call_expression':
        this.extractCallExpression(node, result);
        break;

      default:
        for (const child of node.children) {
          this.visitNode(child, result, source);
        }
    }
  }

  private extractNamespace(
    node: TreeSitterNode,
    result: FileExtractionResult,
    source: string
  ): void {
    const nameNode = node.childForFieldName('name');
    const previousNamespace = this.currentNamespace;
    
    if (nameNode) {
      this.currentNamespace = this.currentNamespace 
        ? `${this.currentNamespace}::${nameNode.text}`
        : nameNode.text;
    }

    const bodyNode = node.children.find(c => c.type === 'declaration_list');
    if (bodyNode) {
      for (const child of bodyNode.children) {
        this.visitNode(child, result, source);
      }
    }

    this.currentNamespace = previousNamespace;
  }

  private extractClassSpecifier(
    node: TreeSitterNode,
    result: FileExtractionResult,
    source: string,
    isStruct: boolean
  ): void {
    const nameNode = node.childForFieldName('name');
    if (!nameNode) return;

    const className = nameNode.text;
    const fullClassName = this.currentNamespace 
      ? `${this.currentNamespace}::${className}` 
      : className;

    const previousClass = this.currentClass;
    this.currentClass = fullClassName;
    this.currentVisibility = isStruct ? 'public' : 'private';

    // Extract base classes
    const baseClasses: string[] = [];
    const baseListNode = node.children.find(c => c.type === 'base_class_clause');
    if (baseListNode) {
      for (const child of baseListNode.children) {
        if (child.type === 'base_class_specifier') {
          const baseName = child.childForFieldName('name')?.text;
          if (baseName) baseClasses.push(baseName);
        }
      }
    }

    // Extract methods
    const methods: string[] = [];
    const bodyNode = node.children.find(c => c.type === 'field_declaration_list');
    if (bodyNode) {
      for (const child of bodyNode.children) {
        if (child.type === 'access_specifier') {
          const specifier = child.text.replace(':', '').trim();
          if (specifier === 'public' || specifier === 'private' || specifier === 'protected') {
            this.currentVisibility = specifier;
          }
        } else if (child.type === 'function_definition' || child.type === 'declaration') {
          const methodInfo = this.extractMethodFromClass(child, result, source, fullClassName);
          if (methodInfo) methods.push(methodInfo);
        }
      }
    }

    const isExported = this.currentVisibility === 'public' || 
                       !this.currentNamespace?.includes('::detail') &&
                       !this.currentNamespace?.includes('::internal');

    result.classes.push({
      name: className,
      startLine: node.startPosition.row + 1,
      endLine: node.endPosition.row + 1,
      baseClasses,
      methods,
      isExported,
    });

    this.currentClass = previousClass;
  }

  private extractMethodFromClass(
    node: TreeSitterNode,
    result: FileExtractionResult,
    source: string,
    className: string
  ): string | null {
    const declaratorNode = node.childForFieldName('declarator');
    if (!declaratorNode) return null;

    let name = '';
    let parameters: FileExtractionResult['functions'][0]['parameters'] = [];

    if (declaratorNode.type === 'function_declarator') {
      const nameNode = declaratorNode.childForFieldName('declarator');
      name = nameNode?.text ?? '';
      
      const paramsNode = declaratorNode.childForFieldName('parameters');
      if (paramsNode) {
        parameters = this.extractParameters(paramsNode);
      }
    }

    if (!name) return null;

    const typeNode = node.childForFieldName('type');
    const returnType = typeNode?.text ?? 'void';
    const bodyNode = node.childForFieldName('body');

    const isVirtual = node.children.some(c => c.text === 'virtual');
    const isStatic = node.children.some(c => c.text === 'static');
    const isConst = declaratorNode.children.some(c => c.text === 'const');
    const isOverride = declaratorNode.children.some(c => c.text === 'override');
    const isConstructor = name === className.split('::').pop();
    const isDestructor = name.startsWith('~');

    const qualifiedName = `${className}::${name}`;

    result.functions.push({
      name,
      qualifiedName,
      startLine: node.startPosition.row + 1,
      endLine: node.endPosition.row + 1,
      startColumn: node.startPosition.column,
      endColumn: node.endPosition.column,
      parameters,
      returnType,
      isMethod: true,
      isStatic,
      isExported: this.currentVisibility === 'public',
      isConstructor,
      isAsync: false,
      className,
      decorators: isVirtual ? ['virtual'] : [],
      bodyStartLine: bodyNode ? bodyNode.startPosition.row + 1 : node.startPosition.row + 1,
      bodyEndLine: bodyNode ? bodyNode.endPosition.row + 1 : node.endPosition.row + 1,
    });

    // Extract calls from method body
    if (bodyNode) {
      this.extractCallsFromBody(bodyNode, result);
    }

    return name;
  }

  private extractFunctionDefinition(
    node: TreeSitterNode,
    result: FileExtractionResult,
    source: string
  ): void {
    const typeNode = node.childForFieldName('type');
    const declaratorNode = node.childForFieldName('declarator');
    const bodyNode = node.childForFieldName('body');

    if (!declaratorNode) return;

    let name = '';
    let parameters: FileExtractionResult['functions'][0]['parameters'] = [];

    if (declaratorNode.type === 'function_declarator') {
      const nameNode = declaratorNode.childForFieldName('declarator');
      name = nameNode?.text ?? '';
      
      const paramsNode = declaratorNode.childForFieldName('parameters');
      if (paramsNode) {
        parameters = this.extractParameters(paramsNode);
      }
    }

    if (!name) return;

    const returnType = typeNode?.text ?? 'void';
    const isStatic = node.children.some(c => c.text === 'static');
    const isInline = node.children.some(c => c.text === 'inline');
    const isConstexpr = node.children.some(c => c.text === 'constexpr');

    const qualifiedName = this.currentNamespace 
      ? `${this.currentNamespace}::${name}` 
      : name;

    // Check if exported (not in anonymous namespace, not static in source file)
    const isExported = !this.currentNamespace?.includes('::') || 
                       !isStatic;

    result.functions.push({
      name,
      qualifiedName,
      startLine: node.startPosition.row + 1,
      endLine: node.endPosition.row + 1,
      startColumn: node.startPosition.column,
      endColumn: node.endPosition.column,
      parameters,
      returnType,
      isMethod: false,
      isStatic,
      isExported,
      isConstructor: false,
      isAsync: false,
      decorators: isConstexpr ? ['constexpr'] : [],
      bodyStartLine: bodyNode ? bodyNode.startPosition.row + 1 : node.startPosition.row + 1,
      bodyEndLine: bodyNode ? bodyNode.endPosition.row + 1 : node.endPosition.row + 1,
    });

    // Extract calls from function body
    if (bodyNode) {
      this.extractCallsFromBody(bodyNode, result);
    }
  }

  private extractInclude(node: TreeSitterNode, result: FileExtractionResult): void {
    const pathNode = node.childForFieldName('path');
    if (!pathNode) return;

    const path = pathNode.text;
    const isSystem = path.startsWith('<');
    const cleanPath = path.replace(/^[<"]|[>"]$/g, '');

    result.imports.push({
      source: cleanPath,
      names: [{
        imported: cleanPath,
        local: cleanPath.split('/').pop()?.replace(/\.\w+$/, '') ?? cleanPath,
        isDefault: false,
        isNamespace: true,
      }],
      line: node.startPosition.row + 1,
      isTypeOnly: false,
    });
  }

  private extractCallExpression(node: TreeSitterNode, result: FileExtractionResult): void {
    const funcNode = node.childForFieldName('function');
    const argsNode = node.childForFieldName('arguments');

    if (!funcNode) return;

    let calleeName: string;
    let receiver: string | undefined;
    let isMethodCall = false;

    if (funcNode.type === 'field_expression') {
      // Method call: obj.method() or obj->method()
      const objectNode = funcNode.childForFieldName('argument');
      const fieldNode = funcNode.childForFieldName('field');
      
      if (objectNode && fieldNode) {
        receiver = objectNode.text;
        calleeName = fieldNode.text;
        isMethodCall = true;
      } else {
        calleeName = funcNode.text;
      }
    } else if (funcNode.type === 'qualified_identifier') {
      // Qualified call: Namespace::Class::method()
      calleeName = funcNode.text;
      const parts = calleeName.split('::');
      if (parts.length > 1) {
        receiver = parts.slice(0, -1).join('::');
        calleeName = parts[parts.length - 1]!;
      }
    } else if (funcNode.type === 'template_function') {
      // Template call: func<T>()
      const nameNode = funcNode.childForFieldName('name');
      calleeName = nameNode?.text ?? funcNode.text;
    } else if (funcNode.type === 'identifier') {
      calleeName = funcNode.text;
    } else {
      calleeName = funcNode.text;
    }

    let argumentCount = 0;
    if (argsNode) {
      for (const child of argsNode.children) {
        if (child.type !== '(' && child.type !== ')' && child.type !== ',') {
          argumentCount++;
        }
      }
    }

    result.calls.push({
      calleeName,
      receiver,
      fullExpression: node.text,
      line: node.startPosition.row + 1,
      column: node.startPosition.column,
      argumentCount,
      isMethodCall,
      isConstructorCall: /^[A-Z]/.test(calleeName) && !receiver,
    });
  }

  private extractCallsFromBody(node: TreeSitterNode, result: FileExtractionResult): void {
    const visit = (n: TreeSitterNode): void => {
      if (n.type === 'call_expression') {
        this.extractCallExpression(n, result);
      }
      for (const child of n.children) {
        visit(child);
      }
    };

    for (const child of node.children) {
      visit(child);
    }
  }

  private extractParameters(node: TreeSitterNode): FileExtractionResult['functions'][0]['parameters'] {
    const params: FileExtractionResult['functions'][0]['parameters'] = [];

    for (const child of node.children) {
      if (child.type === 'parameter_declaration') {
        const typeNode = child.childForFieldName('type');
        const declaratorNode = child.childForFieldName('declarator');
        const defaultNode = child.childForFieldName('default_value');

        const type = typeNode?.text ?? 'auto';
        const name = declaratorNode?.text?.replace(/[*&\s]/g, '') ?? '';

        params.push({
          name,
          type,
          hasDefault: defaultNode !== null,
          isRest: type.includes('...'),
        });
      }
    }

    return params;
  }

  private isInsideClass(node: TreeSitterNode): boolean {
    let parent = node.parent;
    while (parent) {
      if (parent.type === 'class_specifier' || parent.type === 'struct_specifier') {
        return true;
      }
      parent = parent.parent;
    }
    return false;
  }
}

export function createCppHybridExtractor(config?: HybridExtractorConfig): CppHybridExtractor {
  return new CppHybridExtractor(config);
}
```


### 5.2 C++ Regex Fallback

```typescript
// packages/core/src/call-graph/extractors/regex/cpp-regex.ts

/**
 * C++ Regex Extractor
 *
 * Fallback regex-based extraction for when tree-sitter is unavailable.
 * Provides reasonable coverage for common C++ patterns.
 *
 * @requirements C++ Language Support
 */

import { BaseRegexExtractor } from './base-regex-extractor.js';
import type {
  CallGraphLanguage,
  FunctionExtraction,
  CallExtraction,
  ImportExtraction,
  ClassExtraction,
} from '../../types.js';

export class CppRegexExtractor extends BaseRegexExtractor {
  readonly language: CallGraphLanguage = 'cpp';
  readonly extensions: string[] = ['.cpp', '.cc', '.cxx', '.hpp', '.hh', '.hxx', '.h'];

  // ==========================================================================
  // Function Extraction
  // ==========================================================================

  protected extractFunctions(
    cleanSource: string,
    originalSource: string,
    _filePath: string
  ): FunctionExtraction[] {
    const functions: FunctionExtraction[] = [];
    const seen = new Set<string>();

    // Pattern 1: Regular function definitions
    // returnType functionName(params) { or returnType functionName(params) const {
    const funcPattern = /^(?:(?:static|inline|constexpr|virtual|explicit)\s+)*(\w+(?:\s*[*&]+)?)\s+(\w+)\s*\(([^)]*)\)\s*(?:const\s*)?(?:noexcept\s*)?(?:override\s*)?(?:final\s*)?\s*\{/gm;
    let match;

    while ((match = funcPattern.exec(cleanSource)) !== null) {
      const returnType = match[1]!;
      const name = match[2]!;
      const paramsStr = match[3] || '';
      const startLine = this.getLineNumber(originalSource, match.index);
      const key = `${name}:${startLine}`;

      if (seen.has(key)) continue;
      seen.add(key);

      const endIndex = this.findBlockEnd(cleanSource, match.index);
      const endLine = this.getLineNumber(originalSource, endIndex);

      functions.push(this.createFunction({
        name,
        startLine,
        endLine,
        parameters: this.parseCppParameters(paramsStr),
        returnType,
        isMethod: false,
        isStatic: match[0].includes('static'),
        isExported: true,
        isConstructor: false,
        decorators: [],
      }));
    }

    // Pattern 2: Class method definitions (outside class body)
    // returnType ClassName::methodName(params) {
    const methodPattern = /^(?:(?:static|inline|constexpr)\s+)*(\w+(?:\s*[*&]+)?)\s+(\w+)::(\w+)\s*\(([^)]*)\)\s*(?:const\s*)?(?:noexcept\s*)?\s*\{/gm;

    while ((match = methodPattern.exec(cleanSource)) !== null) {
      const returnType = match[1]!;
      const className = match[2]!;
      const name = match[3]!;
      const paramsStr = match[4] || '';
      const startLine = this.getLineNumber(originalSource, match.index);
      const key = `${className}::${name}:${startLine}`;

      if (seen.has(key)) continue;
      seen.add(key);

      const endIndex = this.findBlockEnd(cleanSource, match.index);
      const endLine = this.getLineNumber(originalSource, endIndex);

      functions.push(this.createFunction({
        name,
        qualifiedName: `${className}::${name}`,
        startLine,
        endLine,
        parameters: this.parseCppParameters(paramsStr),
        returnType,
        isMethod: true,
        isStatic: match[0].includes('static'),
        isExported: true,
        isConstructor: name === className,
        className,
        decorators: [],
      }));
    }

    return functions;
  }

  private parseCppParameters(paramsStr: string): FunctionExtraction['parameters'] {
    if (!paramsStr.trim()) return [];

    const params: FunctionExtraction['parameters'] = [];
    const parts = this.splitParams(paramsStr);

    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;

      // Pattern: type name or type name = default
      const paramMatch = trimmed.match(/^(.+?)\s+(\w+)(?:\s*=\s*(.+))?$/);
      if (paramMatch) {
        params.push({
          name: paramMatch[2]!,
          type: paramMatch[1]!.trim(),
          hasDefault: !!paramMatch[3],
          isRest: trimmed.includes('...'),
        });
      } else {
        // Just type (unnamed parameter)
        params.push({
          name: '_',
          type: trimmed,
          hasDefault: false,
          isRest: trimmed.includes('...'),
        });
      }
    }

    return params;
  }

  // ==========================================================================
  // Class Extraction
  // ==========================================================================

  protected extractClasses(
    cleanSource: string,
    originalSource: string,
    _filePath: string
  ): ClassExtraction[] {
    const classes: ClassExtraction[] = [];

    // Pattern: class ClassName : public BaseClass {
    const classPattern = /(?:class|struct)\s+(\w+)(?:\s*:\s*(?:public|protected|private)?\s*(\w+(?:\s*,\s*(?:public|protected|private)?\s*\w+)*))?\s*\{/g;
    let match;

    while ((match = classPattern.exec(cleanSource)) !== null) {
      const name = match[1]!;
      const startLine = this.getLineNumber(originalSource, match.index);
      const endIndex = this.findBlockEnd(cleanSource, match.index);
      const endLine = this.getLineNumber(originalSource, endIndex);

      // Extract base classes
      const baseClasses: string[] = [];
      if (match[2]) {
        const bases = match[2].split(',');
        for (const base of bases) {
          const baseName = base.replace(/(?:public|protected|private)\s*/g, '').trim();
          if (baseName) baseClasses.push(baseName);
        }
      }

      // Extract method names from class body
      const classBody = cleanSource.slice(match.index, endIndex);
      const methods = this.extractMethodNames(classBody);

      classes.push(this.createClass({
        name,
        startLine,
        endLine,
        baseClasses,
        methods,
        isExported: true,
      }));
    }

    return classes;
  }

  private extractMethodNames(classBody: string): string[] {
    const methods: string[] = [];
    
    // Match method declarations
    const methodPattern = /(?:virtual\s+)?(?:\w+(?:\s*[*&]+)?)\s+(\w+)\s*\([^)]*\)\s*(?:const\s*)?(?:override\s*)?(?:final\s*)?(?:=\s*0)?;/g;
    let match;

    while ((match = methodPattern.exec(classBody)) !== null) {
      const name = match[1]!;
      if (!methods.includes(name)) {
        methods.push(name);
      }
    }

    return methods;
  }

  // ==========================================================================
  // Import Extraction
  // ==========================================================================

  protected extractImports(
    cleanSource: string,
    originalSource: string,
    _filePath: string
  ): ImportExtraction[] {
    const imports: ImportExtraction[] = [];

    // Pattern: #include <header> or #include "header"
    const includePattern = /#include\s*([<"])([^>"]+)[>"]/g;
    let match;

    while ((match = includePattern.exec(cleanSource)) !== null) {
      const isSystem = match[1] === '<';
      const path = match[2]!;
      const line = this.getLineNumber(originalSource, match.index);

      imports.push(this.createImport({
        source: path,
        names: [{
          imported: path,
          local: path.split('/').pop()?.replace(/\.\w+$/, '') ?? path,
          isDefault: false,
          isNamespace: true,
        }],
        line,
        isTypeOnly: false,
      }));
    }

    return imports;
  }

  // ==========================================================================
  // Call Extraction
  // ==========================================================================

  protected extractCalls(
    cleanSource: string,
    originalSource: string,
    _filePath: string
  ): CallExtraction[] {
    const calls: CallExtraction[] = [];

    // Pattern 1: Regular function calls: func(args)
    const callPattern = /(\w+)\s*\(/g;
    let match;

    while ((match = callPattern.exec(cleanSource)) !== null) {
      const name = match[1]!;
      const line = this.getLineNumber(originalSource, match.index);

      // Skip keywords
      if (['if', 'while', 'for', 'switch', 'catch', 'sizeof', 'typeof', 'decltype'].includes(name)) {
        continue;
      }

      calls.push(this.createCall({
        calleeName: name,
        fullExpression: match[0],
        line,
        column: match.index - cleanSource.lastIndexOf('\n', match.index) - 1,
        argumentCount: 0,
        isMethodCall: false,
        isConstructorCall: /^[A-Z]/.test(name),
      }));
    }

    // Pattern 2: Method calls: obj.method(args) or obj->method(args)
    const methodCallPattern = /(\w+)(?:\.|->)(\w+)\s*\(/g;

    while ((match = methodCallPattern.exec(cleanSource)) !== null) {
      const receiver = match[1]!;
      const name = match[2]!;
      const line = this.getLineNumber(originalSource, match.index);

      calls.push(this.createCall({
        calleeName: name,
        receiver,
        fullExpression: match[0],
        line,
        column: match.index - cleanSource.lastIndexOf('\n', match.index) - 1,
        argumentCount: 0,
        isMethodCall: true,
        isConstructorCall: false,
      }));
    }

    // Pattern 3: Qualified calls: Namespace::Class::method(args)
    const qualifiedCallPattern = /(\w+(?:::\w+)+)\s*\(/g;

    while ((match = qualifiedCallPattern.exec(cleanSource)) !== null) {
      const fullName = match[1]!;
      const parts = fullName.split('::');
      const name = parts.pop()!;
      const receiver = parts.join('::');
      const line = this.getLineNumber(originalSource, match.index);

      calls.push(this.createCall({
        calleeName: name,
        receiver,
        fullExpression: match[0],
        line,
        column: match.index - cleanSource.lastIndexOf('\n', match.index) - 1,
        argumentCount: 0,
        isMethodCall: true,
        isConstructorCall: /^[A-Z]/.test(name),
      }));
    }

    return calls;
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  private splitParams(paramsStr: string): string[] {
    const parts: string[] = [];
    let current = '';
    let depth = 0;

    for (const char of paramsStr) {
      if (char === '(' || char === '<' || char === '[' || char === '{') depth++;
      else if (char === ')' || char === '>' || char === ']' || char === '}') depth--;
      else if (char === ',' && depth === 0) {
        parts.push(current.trim());
        current = '';
        continue;
      }
      current += char;
    }
    if (current.trim()) parts.push(current.trim());

    return parts;
  }
}
```


---

## Phase 6: Unified C++ Analyzer

### 6.1 C++ Analyzer Class

```typescript
// packages/core/src/cpp/cpp-analyzer.ts

/**
 * C++ Analyzer
 *
 * Main analyzer for C++ projects. Uses a unified architecture with:
 * - Primary: Tree-sitter AST parsing via CppHybridExtractor
 * - Fallback: Regex patterns when tree-sitter unavailable
 *
 * Provides comprehensive analysis of:
 * - Classes, structs, and inheritance hierarchies
 * - Virtual functions and polymorphism
 * - Template usage patterns
 * - Memory management (smart pointers, RAII)
 * - Framework patterns (Unreal, Qt, Boost)
 * - Data access patterns (SQLite, ODBC)
 *
 * @license Apache-2.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { createCppHybridExtractor, type CppHybridExtractor } from '../call-graph/extractors/cpp-hybrid-extractor.js';
import { TreeSitterCppParser } from '../parsers/tree-sitter/tree-sitter-cpp-parser.js';
import type { FunctionExtraction, ClassExtraction, CallExtraction } from '../call-graph/types.js';

// ============================================================================
// Types
// ============================================================================

export interface CppAnalyzerOptions {
  rootDir: string;
  verbose?: boolean;
  includePatterns?: string[];
  excludePatterns?: string[];
}

export interface CppAnalysisResult {
  projectName: string | null;
  cppStandard: string | null;
  detectedFrameworks: string[];
  stats: CppAnalysisStats;
  functions: FunctionExtraction[];
  classes: ClassExtraction[];
  calls: CallExtraction[];
}

export interface CppAnalysisStats {
  fileCount: number;
  headerCount: number;
  sourceCount: number;
  functionCount: number;
  classCount: number;
  structCount: number;
  templateCount: number;
  linesOfCode: number;
  testFileCount: number;
  analysisTimeMs: number;
}

export interface CppClassInfo {
  name: string;
  file: string;
  line: number;
  isStruct: boolean;
  baseClasses: string[];
  virtualMethods: string[];
  hasVirtualDestructor: boolean;
}

export interface CppClassHierarchyResult {
  classes: CppClassInfo[];
  inheritanceTree: Map<string, string[]>;
}

export interface CppMemoryPattern {
  type: 'unique_ptr' | 'shared_ptr' | 'weak_ptr' | 'raw_pointer' | 'new' | 'delete' | 'malloc' | 'free';
  file: string;
  line: number;
  context: string;
}

export interface CppMemoryResult {
  patterns: CppMemoryPattern[];
  stats: {
    uniquePtrCount: number;
    sharedPtrCount: number;
    weakPtrCount: number;
    rawPointerCount: number;
    newCount: number;
    deleteCount: number;
    mallocCount: number;
    freeCount: number;
  };
  issues: CppMemoryIssue[];
}

export interface CppMemoryIssue {
  type: string;
  file: string;
  line: number;
  message: string;
  suggestion?: string;
}

export interface CppTemplateInfo {
  name: string;
  file: string;
  line: number;
  kind: 'class' | 'function' | 'alias';
  parameters: string[];
  specializations: number;
}

export interface CppTemplateResult {
  templates: CppTemplateInfo[];
  stats: {
    classTemplates: number;
    functionTemplates: number;
    aliasTemplates: number;
    totalSpecializations: number;
  };
}

export interface CppVirtualInfo {
  className: string;
  methodName: string;
  file: string;
  line: number;
  isPureVirtual: boolean;
  isOverride: boolean;
}

export interface CppVirtualResult {
  virtualMethods: CppVirtualInfo[];
  abstractClasses: string[];
  stats: {
    virtualMethodCount: number;
    pureVirtualCount: number;
    overrideCount: number;
    abstractClassCount: number;
  };
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: Partial<CppAnalyzerOptions> = {
  verbose: false,
  includePatterns: ['**/*.cpp', '**/*.cc', '**/*.cxx', '**/*.hpp', '**/*.hh', '**/*.hxx', '**/*.h'],
  excludePatterns: ['**/build/**', '**/cmake-build-*/**', '**/node_modules/**', '**/.git/**', '**/third_party/**', '**/vendor/**'],
};

// ============================================================================
// C++ Analyzer Implementation
// ============================================================================

export class CppAnalyzer {
  private config: CppAnalyzerOptions;
  private extractor: CppHybridExtractor;
  private astParser: TreeSitterCppParser;

  constructor(options: CppAnalyzerOptions) {
    this.config = { ...DEFAULT_CONFIG, ...options } as CppAnalyzerOptions;
    this.extractor = createCppHybridExtractor();
    this.astParser = new TreeSitterCppParser();
  }

  /**
   * Full project analysis
   */
  async analyze(): Promise<CppAnalysisResult> {
    const startTime = Date.now();

    const cppFiles = await this.findCppFiles();
    const projectInfo = await this.detectProjectInfo();

    const allFunctions: FunctionExtraction[] = [];
    const allClasses: ClassExtraction[] = [];
    const allCalls: CallExtraction[] = [];
    const detectedFrameworks = new Set<string>();

    let linesOfCode = 0;
    let headerCount = 0;
    let sourceCount = 0;
    let testFileCount = 0;
    let templateCount = 0;

    for (const file of cppFiles) {
      const source = await fs.promises.readFile(file, 'utf-8');
      const relPath = path.relative(this.config.rootDir, file);
      linesOfCode += source.split('\n').length;

      const isHeader = /\.(h|hpp|hh|hxx)$/.test(file);
      if (isHeader) headerCount++;
      else sourceCount++;

      const isTestFile = file.includes('/test') || file.includes('_test.') || file.includes('Test.');
      if (isTestFile) testFileCount++;

      // Extract code structure using hybrid extractor
      const result = this.extractor.extract(source, relPath);

      // Detect frameworks from includes
      for (const imp of result.imports) {
        const framework = this.detectFramework(imp.source);
        if (framework) detectedFrameworks.add(framework);
      }

      // Count templates
      templateCount += (source.match(/template\s*</g) || []).length;

      allFunctions.push(...result.functions);
      allClasses.push(...result.classes);
      allCalls.push(...result.calls);
    }

    const analysisTimeMs = Date.now() - startTime;

    // Count structs vs classes
    const structCount = allClasses.filter(c => c.name.startsWith('struct_')).length;
    const classCount = allClasses.length - structCount;

    return {
      projectName: projectInfo.projectName,
      cppStandard: projectInfo.cppStandard,
      detectedFrameworks: Array.from(detectedFrameworks),
      stats: {
        fileCount: cppFiles.length,
        headerCount,
        sourceCount,
        functionCount: allFunctions.length,
        classCount,
        structCount,
        templateCount,
        linesOfCode,
        testFileCount,
        analysisTimeMs,
      },
      functions: allFunctions,
      classes: allClasses,
      calls: allCalls,
    };
  }

  /**
   * Analyze class hierarchy and inheritance
   */
  async analyzeClassHierarchy(): Promise<CppClassHierarchyResult> {
    const cppFiles = await this.findCppFiles();
    const classes: CppClassInfo[] = [];
    const inheritanceTree = new Map<string, string[]>();

    for (const file of cppFiles) {
      const source = await fs.promises.readFile(file, 'utf-8');
      const relPath = path.relative(this.config.rootDir, file);

      const parseResult = this.astParser.parse(source);

      for (const cls of parseResult.classes) {
        const virtualMethods = cls.methods
          .filter(m => m.isVirtual || m.isPureVirtual)
          .map(m => m.name);

        const hasVirtualDestructor = cls.destructor?.isVirtual ?? false;

        classes.push({
          name: cls.name,
          file: relPath,
          line: cls.startPosition.row + 1,
          isStruct: cls.isStruct,
          baseClasses: cls.baseClasses.map(b => b.name),
          virtualMethods,
          hasVirtualDestructor,
        });

        // Build inheritance tree
        for (const base of cls.baseClasses) {
          const existing = inheritanceTree.get(base.name) ?? [];
          existing.push(cls.name);
          inheritanceTree.set(base.name, existing);
        }
      }
    }

    return { classes, inheritanceTree };
  }

  /**
   * Analyze memory management patterns
   */
  async analyzeMemory(): Promise<CppMemoryResult> {
    const cppFiles = await this.findCppFiles();
    const patterns: CppMemoryPattern[] = [];
    const issues: CppMemoryIssue[] = [];

    let uniquePtrCount = 0;
    let sharedPtrCount = 0;
    let weakPtrCount = 0;
    let rawPointerCount = 0;
    let newCount = 0;
    let deleteCount = 0;
    let mallocCount = 0;
    let freeCount = 0;

    for (const file of cppFiles) {
      const source = await fs.promises.readFile(file, 'utf-8');
      const relPath = path.relative(this.config.rootDir, file);
      const lines = source.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!;
        const lineNum = i + 1;

        // Smart pointers
        if (/std::unique_ptr|make_unique/.test(line)) {
          uniquePtrCount++;
          patterns.push({ type: 'unique_ptr', file: relPath, line: lineNum, context: line.trim() });
        }
        if (/std::shared_ptr|make_shared/.test(line)) {
          sharedPtrCount++;
          patterns.push({ type: 'shared_ptr', file: relPath, line: lineNum, context: line.trim() });
        }
        if (/std::weak_ptr/.test(line)) {
          weakPtrCount++;
          patterns.push({ type: 'weak_ptr', file: relPath, line: lineNum, context: line.trim() });
        }

        // Raw memory operations
        if (/\bnew\s+\w/.test(line) && !/make_unique|make_shared/.test(line)) {
          newCount++;
          patterns.push({ type: 'new', file: relPath, line: lineNum, context: line.trim() });
          
          // Check if not assigned to smart pointer
          if (!/unique_ptr|shared_ptr/.test(line)) {
            issues.push({
              type: 'raw-new',
              file: relPath,
              line: lineNum,
              message: 'Raw new without smart pointer wrapper',
              suggestion: 'Consider using std::make_unique or std::make_shared',
            });
          }
        }
        if (/\bdelete\s/.test(line)) {
          deleteCount++;
          patterns.push({ type: 'delete', file: relPath, line: lineNum, context: line.trim() });
        }
        if (/\bmalloc\s*\(/.test(line)) {
          mallocCount++;
          patterns.push({ type: 'malloc', file: relPath, line: lineNum, context: line.trim() });
          issues.push({
            type: 'c-style-allocation',
            file: relPath,
            line: lineNum,
            message: 'C-style malloc in C++ code',
            suggestion: 'Consider using new/smart pointers or std::vector',
          });
        }
        if (/\bfree\s*\(/.test(line)) {
          freeCount++;
          patterns.push({ type: 'free', file: relPath, line: lineNum, context: line.trim() });
        }

        // Raw pointer declarations (simplified detection)
        if (/\w+\s*\*\s+\w+\s*[=;]/.test(line) && !/const\s+char\s*\*/.test(line)) {
          rawPointerCount++;
        }
      }
    }

    return {
      patterns,
      stats: {
        uniquePtrCount,
        sharedPtrCount,
        weakPtrCount,
        rawPointerCount,
        newCount,
        deleteCount,
        mallocCount,
        freeCount,
      },
      issues,
    };
  }

  /**
   * Analyze template usage
   */
  async analyzeTemplates(): Promise<CppTemplateResult> {
    const cppFiles = await this.findCppFiles();
    const templates: CppTemplateInfo[] = [];

    let classTemplates = 0;
    let functionTemplates = 0;
    let aliasTemplates = 0;

    for (const file of cppFiles) {
      const source = await fs.promises.readFile(file, 'utf-8');
      const relPath = path.relative(this.config.rootDir, file);
      const lines = source.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!;
        const lineNum = i + 1;

        // Template class/struct
        if (/template\s*<[^>]*>\s*(?:class|struct)\s+(\w+)/.test(line)) {
          const match = line.match(/template\s*<([^>]*)>\s*(?:class|struct)\s+(\w+)/);
          if (match) {
            classTemplates++;
            templates.push({
              name: match[2]!,
              file: relPath,
              line: lineNum,
              kind: 'class',
              parameters: this.parseTemplateParams(match[1]!),
              specializations: 0,
            });
          }
        }

        // Template function
        if (/template\s*<[^>]*>\s*(?:\w+\s+)+(\w+)\s*\(/.test(line)) {
          const match = line.match(/template\s*<([^>]*)>\s*(?:\w+\s+)+(\w+)\s*\(/);
          if (match) {
            functionTemplates++;
            templates.push({
              name: match[2]!,
              file: relPath,
              line: lineNum,
              kind: 'function',
              parameters: this.parseTemplateParams(match[1]!),
              specializations: 0,
            });
          }
        }

        // Template alias (using)
        if (/template\s*<[^>]*>\s*using\s+(\w+)/.test(line)) {
          const match = line.match(/template\s*<([^>]*)>\s*using\s+(\w+)/);
          if (match) {
            aliasTemplates++;
            templates.push({
              name: match[2]!,
              file: relPath,
              line: lineNum,
              kind: 'alias',
              parameters: this.parseTemplateParams(match[1]!),
              specializations: 0,
            });
          }
        }
      }
    }

    return {
      templates,
      stats: {
        classTemplates,
        functionTemplates,
        aliasTemplates,
        totalSpecializations: 0,
      },
    };
  }

  /**
   * Analyze virtual functions and polymorphism
   */
  async analyzeVirtual(): Promise<CppVirtualResult> {
    const cppFiles = await this.findCppFiles();
    const virtualMethods: CppVirtualInfo[] = [];
    const abstractClasses = new Set<string>();

    for (const file of cppFiles) {
      const source = await fs.promises.readFile(file, 'utf-8');
      const relPath = path.relative(this.config.rootDir, file);

      const parseResult = this.astParser.parse(source);

      for (const cls of parseResult.classes) {
        let hasAbstractMethod = false;

        for (const method of cls.methods) {
          if (method.isVirtual || method.isPureVirtual || method.isOverride) {
            virtualMethods.push({
              className: cls.name,
              methodName: method.name,
              file: relPath,
              line: method.startPosition.row + 1,
              isPureVirtual: method.isPureVirtual,
              isOverride: method.isOverride,
            });

            if (method.isPureVirtual) {
              hasAbstractMethod = true;
            }
          }
        }

        if (hasAbstractMethod) {
          abstractClasses.add(cls.name);
        }
      }
    }

    return {
      virtualMethods,
      abstractClasses: Array.from(abstractClasses),
      stats: {
        virtualMethodCount: virtualMethods.length,
        pureVirtualCount: virtualMethods.filter(v => v.isPureVirtual).length,
        overrideCount: virtualMethods.filter(v => v.isOverride).length,
        abstractClassCount: abstractClasses.size,
      },
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private async findCppFiles(): Promise<string[]> {
    const results: string[] = [];
    const excludePatterns = this.config.excludePatterns ?? [];

    const walk = async (dir: string): Promise<void> => {
      let entries;
      try {
        entries = await fs.promises.readdir(dir, { withFileTypes: true });
      } catch {
        return;
      }

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(this.config.rootDir, fullPath);

        const shouldExclude = excludePatterns.some(pattern => {
          if (pattern.includes('*')) {
            const regex = new RegExp('^' + pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*') + '$');
            return regex.test(relativePath);
          }
          return relativePath.includes(pattern.replace(/\*\*/g, ''));
        });

        if (shouldExclude) continue;

        if (entry.isDirectory()) {
          await walk(fullPath);
        } else if (entry.isFile() && /\.(cpp|cc|cxx|hpp|hh|hxx|h)$/.test(entry.name)) {
          results.push(fullPath);
        }
      }
    };

    await walk(this.config.rootDir);
    return results;
  }

  private async detectProjectInfo(): Promise<{ projectName: string | null; cppStandard: string | null }> {
    // Try CMakeLists.txt
    const cmakePath = path.join(this.config.rootDir, 'CMakeLists.txt');
    try {
      const content = await fs.promises.readFile(cmakePath, 'utf-8');
      const projectMatch = content.match(/project\s*\(\s*(\w+)/i);
      const stdMatch = content.match(/CMAKE_CXX_STANDARD\s+(\d+)/i);
      return {
        projectName: projectMatch?.[1] ?? null,
        cppStandard: stdMatch ? `C++${stdMatch[1]}` : null,
      };
    } catch {
      // Try other build systems
    }

    // Try meson.build
    const mesonPath = path.join(this.config.rootDir, 'meson.build');
    try {
      const content = await fs.promises.readFile(mesonPath, 'utf-8');
      const projectMatch = content.match(/project\s*\(\s*'(\w+)'/i);
      return {
        projectName: projectMatch?.[1] ?? null,
        cppStandard: null,
      };
    } catch {
      // No build system found
    }

    return { projectName: null, cppStandard: null };
  }

  private detectFramework(includePath: string): string | null {
    const frameworks: Record<string, string> = {
      'Engine.h': 'unreal-engine',
      'CoreMinimal.h': 'unreal-engine',
      'UObject': 'unreal-engine',
      'Qt': 'qt',
      'QObject': 'qt',
      'QWidget': 'qt',
      'boost/': 'boost',
      'SFML/': 'sfml',
      'SDL': 'sdl',
      'glfw': 'glfw',
      'vulkan': 'vulkan',
      'opengl': 'opengl',
      'opencv': 'opencv',
      'eigen': 'eigen',
      'gtest': 'google-test',
      'catch2': 'catch2',
      'doctest': 'doctest',
    };

    for (const [pattern, name] of Object.entries(frameworks)) {
      if (includePath.toLowerCase().includes(pattern.toLowerCase())) {
        return name;
      }
    }

    return null;
  }

  private parseTemplateParams(paramsStr: string): string[] {
    const params: string[] = [];
    const parts = paramsStr.split(',');
    
    for (const part of parts) {
      const trimmed = part.trim();
      // Extract parameter name from "typename T" or "class T" or "int N"
      const match = trimmed.match(/(?:typename|class|int|size_t|auto)\s+(\w+)/);
      if (match) {
        params.push(match[1]!);
      }
    }
    
    return params;
  }
}

/**
 * Factory function
 */
export function createCppAnalyzer(options: CppAnalyzerOptions): CppAnalyzer {
  return new CppAnalyzer(options);
}
```


---

## Phase 7: CLI Integration

### 7.1 C++ CLI Command

```typescript
// packages/cli/src/commands/cpp.ts

/**
 * C++ Command - drift cpp
 *
 * Analyze C++ projects: classes, templates, memory, virtual functions.
 *
 * @requirements C++ Language Support
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { createCppAnalyzer } from 'driftdetect-core';
import { createSpinner } from '../ui/spinner.js';

export interface CppOptions {
  format?: 'text' | 'json';
  verbose?: boolean;
  framework?: string;
}

/**
 * Create the C++ command
 */
export function createCppCommand(): Command {
  const cpp = new Command('cpp')
    .description('C++ language analysis commands');

  // drift cpp status
  cpp
    .command('status [path]')
    .description('Show C++ project analysis summary')
    .option('-f, --format <format>', 'Output format: text, json', 'text')
    .option('-v, --verbose', 'Enable verbose output')
    .action(async (targetPath: string | undefined, options: CppOptions) => {
      await statusAction(targetPath, options);
    });

  // drift cpp classes
  cpp
    .command('classes [path]')
    .description('Analyze class hierarchy and inheritance')
    .option('-f, --format <format>', 'Output format: text, json', 'text')
    .option('-v, --verbose', 'Enable verbose output')
    .action(async (targetPath: string | undefined, options: CppOptions) => {
      await classesAction(targetPath, options);
    });

  // drift cpp memory
  cpp
    .command('memory [path]')
    .description('Analyze memory management patterns (smart pointers, RAII)')
    .option('-f, --format <format>', 'Output format: text, json', 'text')
    .option('-v, --verbose', 'Enable verbose output')
    .action(async (targetPath: string | undefined, options: CppOptions) => {
      await memoryAction(targetPath, options);
    });

  // drift cpp templates
  cpp
    .command('templates [path]')
    .description('Analyze template usage patterns')
    .option('-f, --format <format>', 'Output format: text, json', 'text')
    .option('-v, --verbose', 'Enable verbose output')
    .action(async (targetPath: string | undefined, options: CppOptions) => {
      await templatesAction(targetPath, options);
    });

  // drift cpp virtual
  cpp
    .command('virtual [path]')
    .description('Analyze virtual functions and polymorphism')
    .option('-f, --format <format>', 'Output format: text, json', 'text')
    .option('-v, --verbose', 'Enable verbose output')
    .action(async (targetPath: string | undefined, options: CppOptions) => {
      await virtualAction(targetPath, options);
    });

  return cpp;
}

/**
 * Status subcommand
 */
async function statusAction(targetPath: string | undefined, options: CppOptions): Promise<void> {
  const rootDir = targetPath ?? process.cwd();
  const format = options.format ?? 'text';
  const isTextFormat = format === 'text';

  const spinner = isTextFormat ? createSpinner('Analyzing C++ project...') : null;
  spinner?.start();

  try {
    const analyzer = createCppAnalyzer({ rootDir, verbose: options.verbose ?? false });
    const result = await analyzer.analyze();

    spinner?.stop();

    if (format === 'json') {
      console.log(JSON.stringify({
        project: {
          name: result.projectName,
          cppStandard: result.cppStandard,
          frameworks: result.detectedFrameworks,
        },
        stats: result.stats,
      }, null, 2));
      return;
    }

    // Text output
    console.log();
    console.log(chalk.bold('📊 C++ Project Status'));
    console.log(chalk.gray('═'.repeat(60)));
    console.log();

    if (result.projectName) {
      console.log(`  Project: ${chalk.cyan(result.projectName)}`);
    }
    if (result.cppStandard) {
      console.log(`  Standard: ${chalk.cyan(result.cppStandard)}`);
    }
    console.log();

    if (result.detectedFrameworks.length > 0) {
      console.log(chalk.bold('Detected Frameworks'));
      console.log(chalk.gray('─'.repeat(40)));
      for (const fw of result.detectedFrameworks) {
        console.log(`  • ${fw}`);
      }
      console.log();
    }

    console.log(chalk.bold('Statistics'));
    console.log(chalk.gray('─'.repeat(40)));
    console.log(`  Files: ${chalk.cyan(result.stats.fileCount)} (${result.stats.headerCount} headers, ${result.stats.sourceCount} sources)`);
    console.log(`  Functions: ${chalk.cyan(result.stats.functionCount)}`);
    console.log(`  Classes: ${chalk.cyan(result.stats.classCount)}`);
    console.log(`  Structs: ${chalk.cyan(result.stats.structCount)}`);
    console.log(`  Templates: ${chalk.cyan(result.stats.templateCount)}`);
    console.log(`  Lines of Code: ${chalk.cyan(result.stats.linesOfCode.toLocaleString())}`);
    console.log(`  Test Files: ${chalk.cyan(result.stats.testFileCount)}`);
    console.log(`  Analysis Time: ${chalk.gray(`${result.stats.analysisTimeMs.toFixed(0)}ms`)}`);
    console.log();

    console.log(chalk.gray('─'.repeat(60)));
    console.log(chalk.bold('📌 Next Steps:'));
    console.log(chalk.gray(`  • drift cpp classes     ${chalk.white('View class hierarchy')}`));
    console.log(chalk.gray(`  • drift cpp memory      ${chalk.white('Analyze memory patterns')}`));
    console.log(chalk.gray(`  • drift cpp templates   ${chalk.white('View template usage')}`));
    console.log(chalk.gray(`  • drift cpp virtual     ${chalk.white('Analyze virtual functions')}`));
    console.log();

  } catch (error) {
    spinner?.stop();
    if (format === 'json') {
      console.log(JSON.stringify({ error: String(error) }));
    } else {
      console.log(chalk.red(`\n❌ Error: ${error}`));
    }
  }
}

/**
 * Classes subcommand
 */
async function classesAction(targetPath: string | undefined, options: CppOptions): Promise<void> {
  const rootDir = targetPath ?? process.cwd();
  const format = options.format ?? 'text';
  const isTextFormat = format === 'text';

  const spinner = isTextFormat ? createSpinner('Analyzing class hierarchy...') : null;
  spinner?.start();

  try {
    const analyzer = createCppAnalyzer({ rootDir, verbose: options.verbose ?? false });
    const result = await analyzer.analyzeClassHierarchy();

    spinner?.stop();

    if (format === 'json') {
      console.log(JSON.stringify({
        total: result.classes.length,
        classes: result.classes,
        inheritanceTree: Object.fromEntries(result.inheritanceTree),
      }, null, 2));
      return;
    }

    console.log();
    console.log(chalk.bold('🏗️  C++ Class Hierarchy'));
    console.log(chalk.gray('─'.repeat(60)));
    console.log();

    if (result.classes.length === 0) {
      console.log(chalk.gray('No classes found'));
      console.log();
      return;
    }

    console.log(`Total Classes: ${chalk.cyan(result.classes.length)}`);
    console.log();

    // Group by base class
    const rootClasses = result.classes.filter(c => c.baseClasses.length === 0);
    const derivedClasses = result.classes.filter(c => c.baseClasses.length > 0);

    if (rootClasses.length > 0) {
      console.log(chalk.bold('Root Classes (no base):'));
      for (const cls of rootClasses.slice(0, 20)) {
        const typeLabel = cls.isStruct ? chalk.gray('struct') : chalk.blue('class');
        const virtualLabel = cls.virtualMethods.length > 0 ? chalk.yellow(' [virtual]') : '';
        console.log(`  ${typeLabel} ${chalk.white(cls.name)}${virtualLabel}`);
        console.log(chalk.gray(`    ${cls.file}:${cls.line}`));
      }
      if (rootClasses.length > 20) {
        console.log(chalk.gray(`  ... and ${rootClasses.length - 20} more`));
      }
      console.log();
    }

    if (derivedClasses.length > 0) {
      console.log(chalk.bold('Derived Classes:'));
      for (const cls of derivedClasses.slice(0, 20)) {
        const bases = cls.baseClasses.join(', ');
        console.log(`  ${chalk.white(cls.name)} : ${chalk.cyan(bases)}`);
        console.log(chalk.gray(`    ${cls.file}:${cls.line}`));
      }
      if (derivedClasses.length > 20) {
        console.log(chalk.gray(`  ... and ${derivedClasses.length - 20} more`));
      }
      console.log();
    }

    // Virtual destructor warnings
    const missingVirtualDestructor = result.classes.filter(
      c => c.virtualMethods.length > 0 && !c.hasVirtualDestructor
    );
    if (missingVirtualDestructor.length > 0) {
      console.log(chalk.bold(chalk.yellow('⚠️  Missing Virtual Destructors:')));
      for (const cls of missingVirtualDestructor.slice(0, 10)) {
        console.log(`  ${chalk.white(cls.name)} has virtual methods but no virtual destructor`);
      }
      console.log();
    }

  } catch (error) {
    spinner?.stop();
    if (format === 'json') {
      console.log(JSON.stringify({ error: String(error) }));
    } else {
      console.log(chalk.red(`\n❌ Error: ${error}`));
    }
  }
}

/**
 * Memory subcommand
 */
async function memoryAction(targetPath: string | undefined, options: CppOptions): Promise<void> {
  const rootDir = targetPath ?? process.cwd();
  const format = options.format ?? 'text';
  const isTextFormat = format === 'text';

  const spinner = isTextFormat ? createSpinner('Analyzing memory patterns...') : null;
  spinner?.start();

  try {
    const analyzer = createCppAnalyzer({ rootDir, verbose: options.verbose ?? false });
    const result = await analyzer.analyzeMemory();

    spinner?.stop();

    if (format === 'json') {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    console.log();
    console.log(chalk.bold('🧠 C++ Memory Management'));
    console.log(chalk.gray('─'.repeat(60)));
    console.log();

    console.log(chalk.bold('Smart Pointers:'));
    console.log(`  std::unique_ptr: ${chalk.green(result.stats.uniquePtrCount)}`);
    console.log(`  std::shared_ptr: ${chalk.blue(result.stats.sharedPtrCount)}`);
    console.log(`  std::weak_ptr: ${chalk.cyan(result.stats.weakPtrCount)}`);
    console.log();

    console.log(chalk.bold('Raw Memory:'));
    console.log(`  new: ${chalk.yellow(result.stats.newCount)}`);
    console.log(`  delete: ${chalk.yellow(result.stats.deleteCount)}`);
    console.log(`  malloc: ${chalk.red(result.stats.mallocCount)}`);
    console.log(`  free: ${chalk.red(result.stats.freeCount)}`);
    console.log(`  Raw pointers: ${chalk.gray(result.stats.rawPointerCount)}`);
    console.log();

    if (result.issues.length > 0) {
      console.log(chalk.bold(chalk.yellow('⚠️  Issues:')));
      for (const issue of result.issues.slice(0, 15)) {
        console.log(`  ${chalk.yellow('•')} ${issue.message}`);
        console.log(chalk.gray(`    ${issue.file}:${issue.line}`));
        if (issue.suggestion) {
          console.log(chalk.gray(`    → ${issue.suggestion}`));
        }
      }
      if (result.issues.length > 15) {
        console.log(chalk.gray(`  ... and ${result.issues.length - 15} more issues`));
      }
      console.log();
    }

    // Score
    const smartPtrTotal = result.stats.uniquePtrCount + result.stats.sharedPtrCount;
    const rawTotal = result.stats.newCount + result.stats.mallocCount;
    const score = smartPtrTotal > 0 ? Math.round((smartPtrTotal / (smartPtrTotal + rawTotal)) * 100) : 0;
    
    console.log(chalk.bold('Memory Safety Score:'));
    const scoreColor = score >= 80 ? chalk.green : score >= 50 ? chalk.yellow : chalk.red;
    console.log(`  ${scoreColor(`${score}%`)} smart pointer usage`);
    console.log();

  } catch (error) {
    spinner?.stop();
    if (format === 'json') {
      console.log(JSON.stringify({ error: String(error) }));
    } else {
      console.log(chalk.red(`\n❌ Error: ${error}`));
    }
  }
}

/**
 * Templates subcommand
 */
async function templatesAction(targetPath: string | undefined, options: CppOptions): Promise<void> {
  const rootDir = targetPath ?? process.cwd();
  const format = options.format ?? 'text';
  const isTextFormat = format === 'text';

  const spinner = isTextFormat ? createSpinner('Analyzing templates...') : null;
  spinner?.start();

  try {
    const analyzer = createCppAnalyzer({ rootDir, verbose: options.verbose ?? false });
    const result = await analyzer.analyzeTemplates();

    spinner?.stop();

    if (format === 'json') {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    console.log();
    console.log(chalk.bold('📐 C++ Templates'));
    console.log(chalk.gray('─'.repeat(60)));
    console.log();

    console.log(`Class Templates: ${chalk.cyan(result.stats.classTemplates)}`);
    console.log(`Function Templates: ${chalk.cyan(result.stats.functionTemplates)}`);
    console.log(`Alias Templates: ${chalk.cyan(result.stats.aliasTemplates)}`);
    console.log();

    if (result.templates.length > 0) {
      console.log(chalk.bold('Templates:'));
      for (const tmpl of result.templates.slice(0, 20)) {
        const kindColor = tmpl.kind === 'class' ? chalk.blue : 
                          tmpl.kind === 'function' ? chalk.green : chalk.magenta;
        const params = tmpl.parameters.length > 0 ? `<${tmpl.parameters.join(', ')}>` : '';
        console.log(`  ${kindColor(tmpl.kind.padEnd(8))} ${chalk.white(tmpl.name)}${chalk.gray(params)}`);
        console.log(chalk.gray(`    ${tmpl.file}:${tmpl.line}`));
      }
      if (result.templates.length > 20) {
        console.log(chalk.gray(`  ... and ${result.templates.length - 20} more`));
      }
      console.log();
    }

  } catch (error) {
    spinner?.stop();
    if (format === 'json') {
      console.log(JSON.stringify({ error: String(error) }));
    } else {
      console.log(chalk.red(`\n❌ Error: ${error}`));
    }
  }
}

/**
 * Virtual subcommand
 */
async function virtualAction(targetPath: string | undefined, options: CppOptions): Promise<void> {
  const rootDir = targetPath ?? process.cwd();
  const format = options.format ?? 'text';
  const isTextFormat = format === 'text';

  const spinner = isTextFormat ? createSpinner('Analyzing virtual functions...') : null;
  spinner?.start();

  try {
    const analyzer = createCppAnalyzer({ rootDir, verbose: options.verbose ?? false });
    const result = await analyzer.analyzeVirtual();

    spinner?.stop();

    if (format === 'json') {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    console.log();
    console.log(chalk.bold('🔄 C++ Virtual Functions'));
    console.log(chalk.gray('─'.repeat(60)));
    console.log();

    console.log(`Virtual Methods: ${chalk.cyan(result.stats.virtualMethodCount)}`);
    console.log(`Pure Virtual: ${chalk.yellow(result.stats.pureVirtualCount)}`);
    console.log(`Overrides: ${chalk.green(result.stats.overrideCount)}`);
    console.log(`Abstract Classes: ${chalk.magenta(result.stats.abstractClassCount)}`);
    console.log();

    if (result.abstractClasses.length > 0) {
      console.log(chalk.bold('Abstract Classes:'));
      for (const cls of result.abstractClasses.slice(0, 10)) {
        console.log(`  • ${chalk.magenta(cls)}`);
      }
      console.log();
    }

    if (result.virtualMethods.length > 0 && options.verbose) {
      console.log(chalk.bold('Virtual Methods:'));
      for (const method of result.virtualMethods.slice(0, 20)) {
        const pureLabel = method.isPureVirtual ? chalk.yellow(' = 0') : '';
        const overrideLabel = method.isOverride ? chalk.green(' override') : '';
        console.log(`  ${chalk.white(method.className)}::${chalk.cyan(method.methodName)}${pureLabel}${overrideLabel}`);
        console.log(chalk.gray(`    ${method.file}:${method.line}`));
      }
      if (result.virtualMethods.length > 20) {
        console.log(chalk.gray(`  ... and ${result.virtualMethods.length - 20} more`));
      }
      console.log();
    }

  } catch (error) {
    spinner?.stop();
    if (format === 'json') {
      console.log(JSON.stringify({ error: String(error) }));
    } else {
      console.log(chalk.red(`\n❌ Error: ${error}`));
    }
  }
}
```


---

## Phase 8: MCP Tool Integration

### 8.1 C++ MCP Tool

```typescript
// packages/mcp/src/tools/analysis/cpp.ts

/**
 * C++ Analysis MCP Tool
 *
 * Analyze C++ projects: classes, templates, memory, virtual functions.
 *
 * @license Apache-2.0
 */

import { createCppAnalyzer, type CppAnalyzerOptions } from 'driftdetect-core';

// ============================================================================
// Types
// ============================================================================

export type CppAction =
  | 'status'        // Project status overview
  | 'classes'       // Class hierarchy analysis
  | 'memory'        // Memory management patterns
  | 'templates'     // Template usage analysis
  | 'virtual';      // Virtual function analysis

export interface CppArgs {
  action: CppAction;
  path?: string;
  limit?: number;
}

export interface ToolContext {
  projectRoot: string;
}

// ============================================================================
// Tool Implementation
// ============================================================================

export async function executeCppTool(
  args: CppArgs,
  context: ToolContext
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const projectPath = args.path ?? context.projectRoot;
  const limit = args.limit ?? 50;

  const options: CppAnalyzerOptions = {
    rootDir: projectPath,
    verbose: false,
  };

  const analyzer = createCppAnalyzer(options);

  let result: unknown;

  switch (args.action) {
    case 'status': {
      const analysisResult = await analyzer.analyze();
      result = formatStatusResult(analysisResult);
      break;
    }

    case 'classes': {
      const classResult = await analyzer.analyzeClassHierarchy();
      result = formatClassesResult(classResult, limit);
      break;
    }

    case 'memory': {
      const memoryResult = await analyzer.analyzeMemory();
      result = formatMemoryResult(memoryResult, limit);
      break;
    }

    case 'templates': {
      const templateResult = await analyzer.analyzeTemplates();
      result = formatTemplatesResult(templateResult, limit);
      break;
    }

    case 'virtual': {
      const virtualResult = await analyzer.analyzeVirtual();
      result = formatVirtualResult(virtualResult, limit);
      break;
    }

    default:
      throw new Error(`Unknown action: ${args.action}`);
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}

// ============================================================================
// Result Formatters
// ============================================================================

function formatStatusResult(
  result: Awaited<ReturnType<ReturnType<typeof createCppAnalyzer>['analyze']>>
): object {
  return {
    project: {
      name: result.projectName ?? 'unknown',
      cppStandard: result.cppStandard ?? 'unknown',
      frameworks: result.detectedFrameworks,
    },
    stats: {
      files: result.stats.fileCount,
      headers: result.stats.headerCount,
      sources: result.stats.sourceCount,
      functions: result.stats.functionCount,
      classes: result.stats.classCount,
      structs: result.stats.structCount,
      templates: result.stats.templateCount,
      linesOfCode: result.stats.linesOfCode,
      testFiles: result.stats.testFileCount,
    },
    analysisTimeMs: result.stats.analysisTimeMs,
  };
}

function formatClassesResult(
  result: Awaited<ReturnType<ReturnType<typeof createCppAnalyzer>['analyzeClassHierarchy']>>,
  limit: number
): object {
  return {
    summary: {
      totalClasses: result.classes.length,
      rootClasses: result.classes.filter(c => c.baseClasses.length === 0).length,
      derivedClasses: result.classes.filter(c => c.baseClasses.length > 0).length,
      withVirtualMethods: result.classes.filter(c => c.virtualMethods.length > 0).length,
    },
    classes: result.classes.slice(0, limit).map(c => ({
      name: c.name,
      file: c.file,
      line: c.line,
      isStruct: c.isStruct,
      baseClasses: c.baseClasses,
      virtualMethods: c.virtualMethods,
      hasVirtualDestructor: c.hasVirtualDestructor,
    })),
    inheritanceTree: Object.fromEntries(result.inheritanceTree),
    truncated: result.classes.length > limit,
  };
}

function formatMemoryResult(
  result: Awaited<ReturnType<ReturnType<typeof createCppAnalyzer>['analyzeMemory']>>,
  limit: number
): object {
  const smartPtrTotal = result.stats.uniquePtrCount + result.stats.sharedPtrCount;
  const rawTotal = result.stats.newCount + result.stats.mallocCount;
  const safetyScore = smartPtrTotal > 0 ? Math.round((smartPtrTotal / (smartPtrTotal + rawTotal)) * 100) : 0;

  return {
    summary: {
      smartPointers: {
        uniquePtr: result.stats.uniquePtrCount,
        sharedPtr: result.stats.sharedPtrCount,
        weakPtr: result.stats.weakPtrCount,
      },
      rawMemory: {
        new: result.stats.newCount,
        delete: result.stats.deleteCount,
        malloc: result.stats.mallocCount,
        free: result.stats.freeCount,
        rawPointers: result.stats.rawPointerCount,
      },
      safetyScore,
    },
    patterns: result.patterns.slice(0, limit).map(p => ({
      type: p.type,
      file: p.file,
      line: p.line,
      context: p.context.slice(0, 100),
    })),
    issues: result.issues.slice(0, limit).map(i => ({
      type: i.type,
      file: i.file,
      line: i.line,
      message: i.message,
      suggestion: i.suggestion,
    })),
    truncated: result.patterns.length > limit || result.issues.length > limit,
  };
}

function formatTemplatesResult(
  result: Awaited<ReturnType<ReturnType<typeof createCppAnalyzer>['analyzeTemplates']>>,
  limit: number
): object {
  return {
    summary: {
      classTemplates: result.stats.classTemplates,
      functionTemplates: result.stats.functionTemplates,
      aliasTemplates: result.stats.aliasTemplates,
      total: result.templates.length,
    },
    templates: result.templates.slice(0, limit).map(t => ({
      name: t.name,
      kind: t.kind,
      parameters: t.parameters,
      file: t.file,
      line: t.line,
    })),
    truncated: result.templates.length > limit,
  };
}

function formatVirtualResult(
  result: Awaited<ReturnType<ReturnType<typeof createCppAnalyzer>['analyzeVirtual']>>,
  limit: number
): object {
  return {
    summary: {
      virtualMethods: result.stats.virtualMethodCount,
      pureVirtual: result.stats.pureVirtualCount,
      overrides: result.stats.overrideCount,
      abstractClasses: result.stats.abstractClassCount,
    },
    abstractClasses: result.abstractClasses,
    virtualMethods: result.virtualMethods.slice(0, limit).map(v => ({
      className: v.className,
      methodName: v.methodName,
      file: v.file,
      line: v.line,
      isPureVirtual: v.isPureVirtual,
      isOverride: v.isOverride,
    })),
    truncated: result.virtualMethods.length > limit,
  };
}

// ============================================================================
// Tool Definition
// ============================================================================

export const cppToolDefinition = {
  name: 'drift_cpp',
  description: `Analyze C++ projects for patterns, classes, memory management, and templates.

Actions:
- status: Project overview with stats and detected frameworks
- classes: Class hierarchy and inheritance analysis
- memory: Memory management patterns (smart pointers, RAII, raw allocations)
- templates: Template usage analysis (class, function, alias templates)
- virtual: Virtual function and polymorphism analysis`,
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['status', 'classes', 'memory', 'templates', 'virtual'],
        description: 'Analysis action to perform',
      },
      path: {
        type: 'string',
        description: 'Project path (defaults to current project)',
      },
      limit: {
        type: 'number',
        description: 'Maximum items to return (default: 50)',
      },
    },
    required: ['action'],
  },
};
```


---

## Phase 9: Framework Detectors

### 9.1 Unreal Engine Detector

```typescript
// packages/detectors/src/api/cpp/unreal-detector.ts

/**
 * Unreal Engine Pattern Detector
 *
 * Detects Unreal Engine specific patterns:
 * - UCLASS, USTRUCT, UENUM macros
 * - UPROPERTY, UFUNCTION declarations
 * - Blueprint integration patterns
 * - Gameplay framework patterns
 *
 * @requirements C++ Language Support
 */

import { BaseDetector } from '../../base-detector.js';
import type { DetectionContext, DetectionResult, PatternMatch } from '../../types.js';

export class UnrealEngineDetector extends BaseDetector {
  readonly id = 'api/unreal-engine';
  readonly category = 'api';
  readonly subcategory = 'game-framework';
  readonly supportedLanguages = ['cpp'] as const;

  async detect(context: DetectionContext): Promise<DetectionResult> {
    const matches: PatternMatch[] = [];
    const source = context.source;
    const lines = source.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const lineNum = i + 1;

      // UCLASS macro
      if (/UCLASS\s*\(/.test(line)) {
        matches.push({
          pattern: 'unreal-uclass',
          file: context.filePath,
          line: lineNum,
          column: line.indexOf('UCLASS'),
          snippet: line.trim(),
          confidence: 1.0,
          metadata: { framework: 'unreal-engine', type: 'class-declaration' },
        });
      }

      // USTRUCT macro
      if (/USTRUCT\s*\(/.test(line)) {
        matches.push({
          pattern: 'unreal-ustruct',
          file: context.filePath,
          line: lineNum,
          column: line.indexOf('USTRUCT'),
          snippet: line.trim(),
          confidence: 1.0,
          metadata: { framework: 'unreal-engine', type: 'struct-declaration' },
        });
      }

      // UENUM macro
      if (/UENUM\s*\(/.test(line)) {
        matches.push({
          pattern: 'unreal-uenum',
          file: context.filePath,
          line: lineNum,
          column: line.indexOf('UENUM'),
          snippet: line.trim(),
          confidence: 1.0,
          metadata: { framework: 'unreal-engine', type: 'enum-declaration' },
        });
      }

      // UPROPERTY macro
      if (/UPROPERTY\s*\(/.test(line)) {
        const specifiers = this.extractSpecifiers(line, 'UPROPERTY');
        matches.push({
          pattern: 'unreal-uproperty',
          file: context.filePath,
          line: lineNum,
          column: line.indexOf('UPROPERTY'),
          snippet: line.trim(),
          confidence: 1.0,
          metadata: { 
            framework: 'unreal-engine', 
            type: 'property-declaration',
            specifiers,
          },
        });
      }

      // UFUNCTION macro
      if (/UFUNCTION\s*\(/.test(line)) {
        const specifiers = this.extractSpecifiers(line, 'UFUNCTION');
        matches.push({
          pattern: 'unreal-ufunction',
          file: context.filePath,
          line: lineNum,
          column: line.indexOf('UFUNCTION'),
          snippet: line.trim(),
          confidence: 1.0,
          metadata: { 
            framework: 'unreal-engine', 
            type: 'function-declaration',
            specifiers,
            isBlueprintCallable: specifiers.includes('BlueprintCallable'),
            isBlueprintImplementable: specifiers.includes('BlueprintImplementableEvent'),
          },
        });
      }

      // Actor/Component patterns
      if (/:\s*public\s+(?:AActor|UActorComponent|USceneComponent)/.test(line)) {
        matches.push({
          pattern: 'unreal-actor-component',
          file: context.filePath,
          line: lineNum,
          column: 0,
          snippet: line.trim(),
          confidence: 0.95,
          metadata: { framework: 'unreal-engine', type: 'gameplay-class' },
        });
      }

      // Gameplay ability system
      if (/UGameplayAbility|UAttributeSet|UAbilitySystemComponent/.test(line)) {
        matches.push({
          pattern: 'unreal-gas',
          file: context.filePath,
          line: lineNum,
          column: 0,
          snippet: line.trim(),
          confidence: 0.95,
          metadata: { framework: 'unreal-engine', type: 'gameplay-ability-system' },
        });
      }
    }

    return {
      detectorId: this.id,
      matches,
      metadata: {
        framework: 'unreal-engine',
        totalMatches: matches.length,
      },
    };
  }

  private extractSpecifiers(line: string, macro: string): string[] {
    const match = line.match(new RegExp(`${macro}\\s*\\(([^)]+)\\)`));
    if (!match) return [];
    return match[1]!.split(',').map(s => s.trim());
  }
}
```

### 9.2 Qt Framework Detector

```typescript
// packages/detectors/src/api/cpp/qt-detector.ts

/**
 * Qt Framework Pattern Detector
 *
 * Detects Qt specific patterns:
 * - Q_OBJECT macro
 * - Signals and slots
 * - Q_PROPERTY declarations
 * - Qt container usage
 *
 * @requirements C++ Language Support
 */

import { BaseDetector } from '../../base-detector.js';
import type { DetectionContext, DetectionResult, PatternMatch } from '../../types.js';

export class QtFrameworkDetector extends BaseDetector {
  readonly id = 'api/qt-framework';
  readonly category = 'api';
  readonly subcategory = 'gui-framework';
  readonly supportedLanguages = ['cpp'] as const;

  async detect(context: DetectionContext): Promise<DetectionResult> {
    const matches: PatternMatch[] = [];
    const source = context.source;
    const lines = source.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const lineNum = i + 1;

      // Q_OBJECT macro
      if (/\bQ_OBJECT\b/.test(line)) {
        matches.push({
          pattern: 'qt-qobject',
          file: context.filePath,
          line: lineNum,
          column: line.indexOf('Q_OBJECT'),
          snippet: line.trim(),
          confidence: 1.0,
          metadata: { framework: 'qt', type: 'qobject-declaration' },
        });
      }

      // Q_PROPERTY macro
      if (/Q_PROPERTY\s*\(/.test(line)) {
        matches.push({
          pattern: 'qt-property',
          file: context.filePath,
          line: lineNum,
          column: line.indexOf('Q_PROPERTY'),
          snippet: line.trim(),
          confidence: 1.0,
          metadata: { framework: 'qt', type: 'property-declaration' },
        });
      }

      // Signals section
      if (/^\s*signals\s*:/.test(line) || /Q_SIGNALS\s*:/.test(line)) {
        matches.push({
          pattern: 'qt-signals',
          file: context.filePath,
          line: lineNum,
          column: 0,
          snippet: line.trim(),
          confidence: 1.0,
          metadata: { framework: 'qt', type: 'signals-section' },
        });
      }

      // Slots section
      if (/^\s*(?:public|private|protected)\s+slots\s*:/.test(line) || /Q_SLOTS\s*:/.test(line)) {
        matches.push({
          pattern: 'qt-slots',
          file: context.filePath,
          line: lineNum,
          column: 0,
          snippet: line.trim(),
          confidence: 1.0,
          metadata: { framework: 'qt', type: 'slots-section' },
        });
      }

      // Connect statement
      if (/\bconnect\s*\(/.test(line) && /SIGNAL|SLOT|&\w+::/.test(line)) {
        matches.push({
          pattern: 'qt-connect',
          file: context.filePath,
          line: lineNum,
          column: line.indexOf('connect'),
          snippet: line.trim(),
          confidence: 0.95,
          metadata: { framework: 'qt', type: 'signal-slot-connection' },
        });
      }

      // Qt widget inheritance
      if (/:\s*public\s+Q(?:Widget|MainWindow|Dialog|Frame)/.test(line)) {
        matches.push({
          pattern: 'qt-widget',
          file: context.filePath,
          line: lineNum,
          column: 0,
          snippet: line.trim(),
          confidence: 0.95,
          metadata: { framework: 'qt', type: 'widget-class' },
        });
      }

      // Qt containers
      if (/\bQ(?:List|Vector|Map|Hash|Set|String|StringList)\b/.test(line)) {
        matches.push({
          pattern: 'qt-container',
          file: context.filePath,
          line: lineNum,
          column: 0,
          snippet: line.trim(),
          confidence: 0.9,
          metadata: { framework: 'qt', type: 'container-usage' },
        });
      }
    }

    return {
      detectorId: this.id,
      matches,
      metadata: {
        framework: 'qt',
        totalMatches: matches.length,
      },
    };
  }
}
```

### 9.3 Smart Pointer Detector

```typescript
// packages/detectors/src/memory/cpp/smart-pointer-detector.ts

/**
 * Smart Pointer Pattern Detector
 *
 * Detects C++ memory management patterns:
 * - std::unique_ptr usage
 * - std::shared_ptr usage
 * - std::weak_ptr usage
 * - Raw pointer issues
 * - RAII patterns
 *
 * @requirements C++ Language Support
 */

import { BaseDetector } from '../../base-detector.js';
import type { DetectionContext, DetectionResult, PatternMatch } from '../../types.js';

export class SmartPointerDetector extends BaseDetector {
  readonly id = 'memory/smart-pointers';
  readonly category = 'memory';
  readonly subcategory = 'ownership';
  readonly supportedLanguages = ['cpp'] as const;

  async detect(context: DetectionContext): Promise<DetectionResult> {
    const matches: PatternMatch[] = [];
    const source = context.source;
    const lines = source.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const lineNum = i + 1;

      // std::unique_ptr
      if (/std::unique_ptr\s*</.test(line) || /\bmake_unique\s*</.test(line)) {
        matches.push({
          pattern: 'cpp-unique-ptr',
          file: context.filePath,
          line: lineNum,
          column: 0,
          snippet: line.trim(),
          confidence: 1.0,
          metadata: { type: 'smart-pointer', ownership: 'unique' },
        });
      }

      // std::shared_ptr
      if (/std::shared_ptr\s*</.test(line) || /\bmake_shared\s*</.test(line)) {
        matches.push({
          pattern: 'cpp-shared-ptr',
          file: context.filePath,
          line: lineNum,
          column: 0,
          snippet: line.trim(),
          confidence: 1.0,
          metadata: { type: 'smart-pointer', ownership: 'shared' },
        });
      }

      // std::weak_ptr
      if (/std::weak_ptr\s*</.test(line)) {
        matches.push({
          pattern: 'cpp-weak-ptr',
          file: context.filePath,
          line: lineNum,
          column: 0,
          snippet: line.trim(),
          confidence: 1.0,
          metadata: { type: 'smart-pointer', ownership: 'weak' },
        });
      }

      // Raw new without smart pointer (potential issue)
      if (/\bnew\s+\w/.test(line) && !/make_unique|make_shared|unique_ptr|shared_ptr/.test(line)) {
        matches.push({
          pattern: 'cpp-raw-new',
          file: context.filePath,
          line: lineNum,
          column: line.indexOf('new'),
          snippet: line.trim(),
          confidence: 0.85,
          metadata: { 
            type: 'raw-allocation', 
            severity: 'warning',
            suggestion: 'Consider using std::make_unique or std::make_shared',
          },
        });
      }

      // delete (manual memory management)
      if (/\bdelete\s/.test(line)) {
        matches.push({
          pattern: 'cpp-delete',
          file: context.filePath,
          line: lineNum,
          column: line.indexOf('delete'),
          snippet: line.trim(),
          confidence: 0.9,
          metadata: { 
            type: 'manual-deallocation',
            severity: 'info',
          },
        });
      }

      // C-style malloc/free (discouraged in modern C++)
      if (/\bmalloc\s*\(/.test(line)) {
        matches.push({
          pattern: 'cpp-malloc',
          file: context.filePath,
          line: lineNum,
          column: line.indexOf('malloc'),
          snippet: line.trim(),
          confidence: 0.95,
          metadata: { 
            type: 'c-style-allocation',
            severity: 'warning',
            suggestion: 'Consider using new/smart pointers or std::vector',
          },
        });
      }

      // RAII pattern (resource in constructor)
      if (/:\s*\w+\s*\([^)]*\)\s*\{/.test(line) && /file|socket|handle|resource|lock|mutex/i.test(line)) {
        matches.push({
          pattern: 'cpp-raii',
          file: context.filePath,
          line: lineNum,
          column: 0,
          snippet: line.trim(),
          confidence: 0.7,
          metadata: { type: 'raii-pattern' },
        });
      }
    }

    return {
      detectorId: this.id,
      matches,
      metadata: {
        totalMatches: matches.length,
      },
    };
  }
}
```


---

## Phase 10: Type System Integration

### 10.1 Language Type Updates

Add 'cpp' to all relevant type definitions:

```typescript
// packages/core/src/call-graph/types.ts
export type CallGraphLanguage = 
  | 'python' | 'typescript' | 'javascript' | 'java' 
  | 'csharp' | 'php' | 'go' | 'rust' | 'cpp';

// packages/core/src/unified-provider/types.ts
export type UnifiedLanguage = 
  | 'typescript' | 'javascript' | 'python' | 'java' 
  | 'csharp' | 'php' | 'go' | 'rust' | 'cpp';

// packages/core/src/speculative/types.ts
export type SupportedLanguage = 
  | 'typescript' | 'javascript' | 'python' | 'java' 
  | 'csharp' | 'php' | 'go' | 'rust' | 'cpp';

export const LANGUAGE_EXTENSIONS: Record<SupportedLanguage, string[]> = {
  // ... existing
  cpp: ['.cpp', '.cc', '.cxx', '.hpp', '.hh', '.hxx', '.h'],
};

// packages/core/src/environment/types.ts
export type EnvLanguage = 
  | 'typescript' | 'javascript' | 'python' | 'java' 
  | 'csharp' | 'php' | 'go' | 'rust' | 'cpp';

// packages/core/src/decisions/types.ts
export type DecisionLanguage = 
  | 'typescript' | 'javascript' | 'python' | 'java' 
  | 'csharp' | 'php' | 'go' | 'rust' | 'cpp';

// packages/core/src/constants/types.ts
export type ConstantLanguage = 
  | 'typescript' | 'javascript' | 'python' | 'java' 
  | 'csharp' | 'php' | 'go' | 'rust' | 'cpp';

// packages/core/src/constraints/types.ts
export type ConstraintLanguage = 
  | 'typescript' | 'javascript' | 'python' | 'java' 
  | 'csharp' | 'php' | 'go' | 'rust' | 'cpp';

export const CONSTRAINT_LANGUAGES: ConstraintLanguage[] = [
  'typescript', 'javascript', 'python', 'java', 
  'csharp', 'php', 'go', 'rust', 'cpp'
];

// packages/core/src/wrappers/types.ts
export type SupportedLanguage = 
  | 'typescript' | 'javascript' | 'python' | 'java' 
  | 'csharp' | 'php' | 'go' | 'rust' | 'cpp';
```

### 10.2 Wrapper Primitives Registry

```typescript
// packages/core/src/wrappers/primitives/registry.ts (additions)

// C++ Framework Primitives
const CPP_PRIMITIVES: FrameworkPrimitive[] = [
  // STL
  { name: 'std::vector', framework: 'stl', category: 'container' },
  { name: 'std::map', framework: 'stl', category: 'container' },
  { name: 'std::unordered_map', framework: 'stl', category: 'container' },
  { name: 'std::set', framework: 'stl', category: 'container' },
  { name: 'std::string', framework: 'stl', category: 'string' },
  { name: 'std::unique_ptr', framework: 'stl', category: 'memory' },
  { name: 'std::shared_ptr', framework: 'stl', category: 'memory' },
  { name: 'std::weak_ptr', framework: 'stl', category: 'memory' },
  { name: 'std::optional', framework: 'stl', category: 'utility' },
  { name: 'std::variant', framework: 'stl', category: 'utility' },
  { name: 'std::function', framework: 'stl', category: 'functional' },
  { name: 'std::thread', framework: 'stl', category: 'concurrency' },
  { name: 'std::mutex', framework: 'stl', category: 'concurrency' },
  { name: 'std::async', framework: 'stl', category: 'concurrency' },
  { name: 'std::future', framework: 'stl', category: 'concurrency' },
  
  // Boost
  { name: 'boost::asio', framework: 'boost', category: 'networking' },
  { name: 'boost::beast', framework: 'boost', category: 'http' },
  { name: 'boost::filesystem', framework: 'boost', category: 'filesystem' },
  { name: 'boost::program_options', framework: 'boost', category: 'cli' },
  { name: 'boost::spirit', framework: 'boost', category: 'parsing' },
  
  // Qt
  { name: 'QObject', framework: 'qt', category: 'core' },
  { name: 'QWidget', framework: 'qt', category: 'gui' },
  { name: 'QMainWindow', framework: 'qt', category: 'gui' },
  { name: 'QString', framework: 'qt', category: 'string' },
  { name: 'QList', framework: 'qt', category: 'container' },
  { name: 'QMap', framework: 'qt', category: 'container' },
  { name: 'QThread', framework: 'qt', category: 'concurrency' },
  { name: 'QNetworkAccessManager', framework: 'qt', category: 'networking' },
  { name: 'QSqlDatabase', framework: 'qt', category: 'database' },
  
  // Unreal Engine
  { name: 'AActor', framework: 'unreal', category: 'gameplay' },
  { name: 'UActorComponent', framework: 'unreal', category: 'gameplay' },
  { name: 'UObject', framework: 'unreal', category: 'core' },
  { name: 'FString', framework: 'unreal', category: 'string' },
  { name: 'TArray', framework: 'unreal', category: 'container' },
  { name: 'TMap', framework: 'unreal', category: 'container' },
  { name: 'TSharedPtr', framework: 'unreal', category: 'memory' },
  { name: 'TWeakPtr', framework: 'unreal', category: 'memory' },
  
  // Testing
  { name: 'TEST', framework: 'gtest', category: 'testing' },
  { name: 'TEST_F', framework: 'gtest', category: 'testing' },
  { name: 'EXPECT_EQ', framework: 'gtest', category: 'testing' },
  { name: 'ASSERT_EQ', framework: 'gtest', category: 'testing' },
  { name: 'TEST_CASE', framework: 'catch2', category: 'testing' },
  { name: 'REQUIRE', framework: 'catch2', category: 'testing' },
  { name: 'CHECK', framework: 'catch2', category: 'testing' },
  
  // Database
  { name: 'sqlite3', framework: 'sqlite', category: 'database' },
  { name: 'SQLHDBC', framework: 'odbc', category: 'database' },
];

// Add to registry
PRIMITIVES_BY_LANGUAGE.cpp = CPP_PRIMITIVES;
```

---

## Phase 11: Demo Project

### 11.1 Demo Project Structure

```
demo/cpp-backend/
├── CMakeLists.txt
├── src/
│   ├── main.cpp
│   ├── server/
│   │   ├── http_server.hpp
│   │   ├── http_server.cpp
│   │   └── router.hpp
│   ├── handlers/
│   │   ├── user_handler.hpp
│   │   ├── user_handler.cpp
│   │   └── health_handler.cpp
│   ├── models/
│   │   ├── user.hpp
│   │   └── response.hpp
│   ├── services/
│   │   ├── user_service.hpp
│   │   └── user_service.cpp
│   ├── database/
│   │   ├── connection.hpp
│   │   └── connection.cpp
│   └── utils/
│       ├── logger.hpp
│       └── config.hpp
├── include/
│   └── common.hpp
└── tests/
    ├── test_user_service.cpp
    └── test_handlers.cpp
```

---

## Phase 12: Testing Strategy

### 12.1 Unit Tests

```typescript
// packages/core/src/parsers/tree-sitter/__tests__/tree-sitter-cpp-parser.test.ts

import { describe, it, expect } from 'vitest';
import { TreeSitterCppParser } from '../tree-sitter-cpp-parser.js';

describe('TreeSitterCppParser', () => {
  const parser = new TreeSitterCppParser();

  describe('class extraction', () => {
    it('should extract class with base classes', () => {
      const source = `
        class Derived : public Base, protected Interface {
        public:
          void method();
        private:
          int field_;
        };
      `;
      const result = parser.parse(source);
      expect(result.classes).toHaveLength(1);
      expect(result.classes[0].name).toBe('Derived');
      expect(result.classes[0].baseClasses).toHaveLength(2);
    });

    it('should extract virtual methods', () => {
      const source = `
        class Base {
        public:
          virtual void method() = 0;
          virtual ~Base() = default;
        };
      `;
      const result = parser.parse(source);
      expect(result.classes[0].methods[0].isPureVirtual).toBe(true);
      expect(result.classes[0].destructor?.isVirtual).toBe(true);
    });
  });

  describe('template extraction', () => {
    it('should extract template class', () => {
      const source = `
        template<typename T, typename U = int>
        class Container {
          T value_;
        };
      `;
      const result = parser.parse(source);
      // Template detection via regex in analyzer
    });
  });

  describe('include extraction', () => {
    it('should extract system and local includes', () => {
      const source = `
        #include <iostream>
        #include <vector>
        #include "myheader.hpp"
      `;
      const result = parser.parse(source);
      expect(result.includes).toHaveLength(3);
      expect(result.includes[0].isSystem).toBe(true);
      expect(result.includes[2].isSystem).toBe(false);
    });
  });
});
```

### 12.2 Integration Tests

```typescript
// packages/core/src/cpp/__tests__/cpp-analyzer.test.ts

import { describe, it, expect, beforeAll } from 'vitest';
import { createCppAnalyzer } from '../cpp-analyzer.js';
import * as path from 'path';

describe('CppAnalyzer', () => {
  const demoPath = path.join(__dirname, '../../../../demo/cpp-backend');

  describe('analyze()', () => {
    it('should analyze demo project', async () => {
      const analyzer = createCppAnalyzer({ rootDir: demoPath });
      const result = await analyzer.analyze();

      expect(result.stats.fileCount).toBeGreaterThan(0);
      expect(result.functions.length).toBeGreaterThan(0);
      expect(result.classes.length).toBeGreaterThan(0);
    });
  });

  describe('analyzeMemory()', () => {
    it('should detect smart pointer usage', async () => {
      const analyzer = createCppAnalyzer({ rootDir: demoPath });
      const result = await analyzer.analyzeMemory();

      expect(result.stats.uniquePtrCount).toBeGreaterThanOrEqual(0);
      expect(result.stats.sharedPtrCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('analyzeClassHierarchy()', () => {
    it('should build inheritance tree', async () => {
      const analyzer = createCppAnalyzer({ rootDir: demoPath });
      const result = await analyzer.analyzeClassHierarchy();

      expect(result.classes.length).toBeGreaterThan(0);
    });
  });
});
```

---

## Implementation Checklist

### Phase 1: Core Types ✅
- [ ] Add 'cpp' to CallGraphLanguage
- [ ] Add 'cpp' to UnifiedLanguage
- [ ] Add 'cpp' to SupportedLanguage (speculative)
- [ ] Add 'cpp' to EnvLanguage
- [ ] Add 'cpp' to DecisionLanguage
- [ ] Add 'cpp' to ConstantLanguage
- [ ] Add 'cpp' to ConstraintLanguage
- [ ] Add 'cpp' to wrappers SupportedLanguage

### Phase 2: Parser Setup ✅
- [ ] Create cpp-loader.ts
- [ ] Add tree-sitter-cpp dependency
- [ ] Create tree-sitter-cpp-parser.ts

### Phase 3: Extractors ✅
- [ ] Create cpp-hybrid-extractor.ts
- [ ] Create cpp-regex.ts fallback
- [ ] Create cpp-data-access-extractor.ts

### Phase 4: Analyzer ✅
- [ ] Create cpp-analyzer.ts
- [ ] Implement analyze()
- [ ] Implement analyzeClassHierarchy()
- [ ] Implement analyzeMemory()
- [ ] Implement analyzeTemplates()
- [ ] Implement analyzeVirtual()

### Phase 5: CLI ✅
- [ ] Create cpp.ts command
- [ ] Implement status subcommand
- [ ] Implement classes subcommand
- [ ] Implement memory subcommand
- [ ] Implement templates subcommand
- [ ] Implement virtual subcommand
- [ ] Register in CLI index

### Phase 6: MCP ✅
- [ ] Create cpp.ts MCP tool
- [ ] Implement all actions
- [ ] Register in MCP tools index

### Phase 7: Detectors ✅
- [ ] Create unreal-detector.ts
- [ ] Create qt-detector.ts
- [ ] Create smart-pointer-detector.ts
- [ ] Register detectors in index

### Phase 8: Wrappers ✅
- [ ] Add C++ primitives to registry
- [ ] Initialize cpp in wrappersByLanguage

### Phase 9: Demo & Tests ✅
- [ ] Create demo/cpp-backend project
- [ ] Write parser unit tests
- [ ] Write analyzer integration tests
- [ ] Write CLI tests

### Phase 10: Documentation ✅
- [ ] Update Language-Support.md wiki
- [ ] Update CLI-Reference.md
- [ ] Update MCP-Tools-Reference.md

---

## Dependencies

```json
{
  "dependencies": {
    "tree-sitter-cpp": "^0.22.0"
  }
}
```

---

## Success Criteria

1. **Parser**: Tree-sitter parses C++ files with >95% accuracy
2. **Fallback**: Regex fallback handles common patterns when tree-sitter unavailable
3. **CLI**: All 5 subcommands work correctly
4. **MCP**: All 5 actions return valid JSON
5. **Detectors**: Unreal, Qt, and memory patterns detected
6. **Tests**: >90% code coverage, all tests passing
7. **Performance**: Analysis of 1000-file project completes in <30 seconds

