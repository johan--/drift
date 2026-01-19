/**
 * Position Utilities
 *
 * Helper functions for working with LSP positions and ranges.
 */

import type { Position, Range } from 'vscode-languageserver';

/**
 * Create a Position
 */
export function createPosition(line: number, character: number): Position {
  return { line, character };
}

/**
 * Create a Range
 */
export function createRange(start: Position, end: Position): Range {
  return { start, end };
}

/**
 * Create a Range from coordinates
 */
export function createRangeFromCoords(
  startLine: number,
  startChar: number,
  endLine: number,
  endChar: number
): Range {
  return {
    start: { line: startLine, character: startChar },
    end: { line: endLine, character: endChar },
  };
}

/**
 * Check if a position is within a range
 */
export function isPositionInRange(position: Position, range: Range): boolean {
  const { line, character } = position;
  const { start, end } = range;

  if (line < start.line || line > end.line) {
    return false;
  }

  if (line === start.line && character < start.character) {
    return false;
  }

  if (line === end.line && character > end.character) {
    return false;
  }

  return true;
}

/**
 * Check if two ranges overlap
 */
export function rangesOverlap(a: Range, b: Range): boolean {
  // a ends before b starts
  if (a.end.line < b.start.line) {
    return false;
  }
  if (a.end.line === b.start.line && a.end.character < b.start.character) {
    return false;
  }

  // b ends before a starts
  if (b.end.line < a.start.line) {
    return false;
  }
  if (b.end.line === a.start.line && b.end.character < a.start.character) {
    return false;
  }

  return true;
}

/**
 * Check if range a contains range b
 */
export function rangeContains(a: Range, b: Range): boolean {
  return (
    isPositionInRange(b.start, a) &&
    isPositionInRange(b.end, a)
  );
}

/**
 * Compare two positions
 * Returns negative if a < b, positive if a > b, 0 if equal
 */
export function comparePositions(a: Position, b: Position): number {
  if (a.line !== b.line) {
    return a.line - b.line;
  }
  return a.character - b.character;
}

/**
 * Format a position for display
 */
export function formatPosition(position: Position): string {
  return `${position.line + 1}:${position.character + 1}`;
}

/**
 * Format a range for display
 */
export function formatRange(range: Range): string {
  if (range.start.line === range.end.line) {
    return `line ${range.start.line + 1}`;
  }
  return `lines ${range.start.line + 1}-${range.end.line + 1}`;
}
