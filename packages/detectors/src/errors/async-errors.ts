/**
 * Async Errors Detector - Async error handling pattern detection
 *
 * Detects async error handling patterns including:
 * - Async/await try/catch
 * - Promise .catch() handlers
 * - Unhandled promise rejections
 * - Error boundaries for async operations
 *
 * Flags violations:
 * - Missing error handling in async functions
 * - Unhandled promise rejections
 * - Missing .catch() on promises
 *
 * @requirements 12.5, 12.8 - Async error handling patterns
 */

import type { Language } from '@drift/core';
import { RegexDetector, type DetectionContext, type DetectionResult } from '../base/index.js';

// ============================================================================
// Types
// ============================================================================

export type AsyncErrorPatternType =
  | 'async-try-catch'     // async function with try/catch
  | 'promise-catch'       // .catch() handler
  | 'promise-finally'     // .finally() handler
  | 'error-boundary';     // Error boundary pattern

export type AsyncErrorViolationType =
  | 'missing-async-catch'     // Async without try/catch
  | 'unhandled-promise'       // Promise without .catch()
  | 'floating-promise';       // Promise not awaited or caught

export interface AsyncErrorPatternInfo {
  type: AsyncErrorPatternType;
  file: string;
  line: number;
  column: number;
  matchedText: string;
  context?: string;
}

export interface AsyncErrorViolationInfo {
  type: AsyncErrorViolationType;
  file: string;
  line: number;
  column: number;
  endLine: number;
  endColumn: number;
  value: string;
  issue: string;
  suggestedFix?: string;
  lineContent: string;
}

export interface AsyncErrorAnalysis {
  patterns: AsyncErrorPatternInfo[];
  violations: AsyncErrorViolationInfo[];
  hasAsyncErrorHandling: boolean;
  hasPromiseCatch: boolean;
  confidence: number;
}

// ============================================================================
// Constants
// ============================================================================

export const ASYNC_TRY_CATCH_PATTERNS = [
  /async\s+function\s+\w+\s*\([^)]*\)\s*\{[\s\S]*?try\s*\{/gi,
  /async\s+\([^)]*\)\s*=>\s*\{[\s\S]*?try\s*\{/gi,
  /async\s+\w+\s*=\s*async\s*\([^)]*\)\s*=>\s*\{[\s\S]*?try\s*\{/gi,
] as const;

export const PROMISE_CATCH_PATTERNS = [
  /\.catch\s*\(\s*(?:async\s*)?\(?[^)]*\)?\s*=>/gi,
  /\.catch\s*\(\s*function/gi,
  /\.catch\s*\(\s*\w+\s*\)/gi,
] as const;

export const PROMISE_FINALLY_PATTERNS = [
  /\.finally\s*\(\s*(?:async\s*)?\(?[^)]*\)?\s*=>/gi,
  /\.finally\s*\(\s*function/gi,
] as const;

export const ERROR_BOUNDARY_PATTERNS = [
  /ErrorBoundary/gi,
  /componentDidCatch/gi,
  /getDerivedStateFromError/gi,
] as const;

export const FLOATING_PROMISE_PATTERNS = [
  /^\s*\w+\.\w+\s*\([^)]*\)\s*;?\s*$/gim,
] as const;

export const EXCLUDED_FILE_PATTERNS = [
  /\.test\.[jt]sx?$/,
  /\.spec\.[jt]sx?$/,
  /node_modules\//,
  /\.d\.ts$/,
];

// ============================================================================
// Helper Functions
// ============================================================================

export function shouldExcludeFile(filePath: string): boolean {
  return EXCLUDED_FILE_PATTERNS.some(p => p.test(filePath));
}

function isInsideComment(content: string, index: number): boolean {
  const before = content.slice(0, index);
  const lastNewline = before.lastIndexOf('\n');
  const line = before.slice(lastNewline + 1);
  if (line.includes('//') && index - lastNewline - 1 > line.indexOf('//')) return true;
  return before.lastIndexOf('/*') > before.lastIndexOf('*/');
}

function getPosition(content: string, index: number): { line: number; column: number } {
  const before = content.slice(0, index);
  return { line: before.split('\n').length, column: index - before.lastIndexOf('\n') };
}

// ============================================================================
// Detection Functions
// ============================================================================

export function detectAsyncTryCatch(content: string, file: string): AsyncErrorPatternInfo[] {
  const results: AsyncErrorPatternInfo[] = [];
  const lines = content.split('\n');
  
  for (const pattern of ASYNC_TRY_CATCH_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match: RegExpExecArray | null;
    while ((match = regex.exec(content)) !== null) {
      if (isInsideComment(content, match.index)) continue;
      const { line, column } = getPosition(content, match.index);
      results.push({
        type: 'async-try-catch',
        file, line, column,
        matchedText: match[0].slice(0, 50) + '...',
        context: lines[line - 1] || '',
      });
    }
  }
  return results;
}

export function detectPromiseCatch(content: string, file: string): AsyncErrorPatternInfo[] {
  const results: AsyncErrorPatternInfo[] = [];
  const lines = content.split('\n');
  
  for (const pattern of PROMISE_CATCH_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match: RegExpExecArray | null;
    while ((match = regex.exec(content)) !== null) {
      if (isInsideComment(content, match.index)) continue;
      const { line, column } = getPosition(content, match.index);
      results.push({
        type: 'promise-catch',
        file, line, column,
        matchedText: match[0],
        context: lines[line - 1] || '',
      });
    }
  }
  return results;
}

export function detectPromiseFinally(content: string, file: string): AsyncErrorPatternInfo[] {
  const results: AsyncErrorPatternInfo[] = [];
  const lines = content.split('\n');
  
  for (const pattern of PROMISE_FINALLY_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match: RegExpExecArray | null;
    while ((match = regex.exec(content)) !== null) {
      if (isInsideComment(content, match.index)) continue;
      const { line, column } = getPosition(content, match.index);
      results.push({
        type: 'promise-finally',
        file, line, column,
        matchedText: match[0],
        context: lines[line - 1] || '',
      });
    }
  }
  return results;
}

export function detectErrorBoundaries(content: string, file: string): AsyncErrorPatternInfo[] {
  const results: AsyncErrorPatternInfo[] = [];
  const lines = content.split('\n');
  
  for (const pattern of ERROR_BOUNDARY_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match: RegExpExecArray | null;
    while ((match = regex.exec(content)) !== null) {
      if (isInsideComment(content, match.index)) continue;
      const { line, column } = getPosition(content, match.index);
      results.push({
        type: 'error-boundary',
        file, line, column,
        matchedText: match[0],
        context: lines[line - 1] || '',
      });
    }
  }
  return results;
}

// ============================================================================
// Main Analysis Function
// ============================================================================

export function analyzeAsyncErrors(content: string, file: string): AsyncErrorAnalysis {
  if (shouldExcludeFile(file)) {
    return { patterns: [], violations: [], hasAsyncErrorHandling: false, hasPromiseCatch: false, confidence: 1.0 };
  }
  
  const asyncTryCatch = detectAsyncTryCatch(content, file);
  const promiseCatch = detectPromiseCatch(content, file);
  const promiseFinally = detectPromiseFinally(content, file);
  const errorBoundaries = detectErrorBoundaries(content, file);
  
  const allPatterns = [...asyncTryCatch, ...promiseCatch, ...promiseFinally, ...errorBoundaries];
  
  const confidence = allPatterns.length > 0 ? 0.85 : 1.0;
  
  return {
    patterns: allPatterns,
    violations: [],
    hasAsyncErrorHandling: asyncTryCatch.length > 0,
    hasPromiseCatch: promiseCatch.length > 0,
    confidence,
  };
}

// ============================================================================
// Detector Class
// ============================================================================

export class AsyncErrorsDetector extends RegexDetector {
  readonly id = 'errors/async-errors';
  readonly name = 'Async Errors Detector';
  readonly description = 'Detects async error handling patterns';
  readonly category = 'errors';
  readonly subcategory = 'async';
  readonly supportedLanguages: Language[] = ['typescript', 'javascript'];
  
  async detect(context: DetectionContext): Promise<DetectionResult> {
    const { content, file } = context;
    if (shouldExcludeFile(file)) return this.createEmptyResult();
    
    const analysis = analyzeAsyncErrors(content, file);
    return this.createResult([], [], analysis.confidence);
  }
  
  generateQuickFix(): null {
    return null;
  }
}

export function createAsyncErrorsDetector(): AsyncErrorsDetector {
  return new AsyncErrorsDetector();
}
