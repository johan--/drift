/**
 * PHP Docblock Extractor
 *
 * Extracts and parses PHPDoc blocks including:
 * - Summary and description
 * - @param, @return, @throws tags
 * - @var, @property tags
 * - Custom annotations
 *
 * @module php/docblock-extractor
 */

import type { DocblockInfo, DocblockTag } from './types.js';

// ============================================================================
// Regex Patterns
// ============================================================================

/**
 * Pattern to match complete docblocks
 */
const DOCBLOCK_PATTERN = /\/\*\*([\s\S]*?)\*\//g;

/**
 * Pattern to match individual tags
 */
const TAG_PATTERN = /@(\w+)(?:\s+(.*))?$/;

/**
 * Pattern to match @param tags specifically
 * @param type $variable description
 */
const PARAM_TAG_PATTERN = /@param\s+(\S+)\s+\$(\w+)(?:\s+(.*))?$/;

/**
 * Pattern to match @return tags
 * @return type description
 */
const RETURN_TAG_PATTERN = /@return\s+(\S+)(?:\s+(.*))?$/;

/**
 * Pattern to match @throws tags
 * @throws ExceptionType description
 */
const THROWS_TAG_PATTERN = /@throws\s+(\S+)(?:\s+(.*))?$/;

/**
 * Pattern to match @var tags
 * @var type description
 */
const VAR_TAG_PATTERN = /@var\s+(\S+)(?:\s+(.*))?$/;

/**
 * Pattern to match @property tags
 * @property type $name description
 */
const PROPERTY_TAG_PATTERN = /@property(?:-read|-write)?\s+(\S+)\s+\$(\w+)(?:\s+(.*))?$/;

// ============================================================================
// Docblock Extractor
// ============================================================================

/**
 * Extracts and parses PHPDoc blocks
 */
export class DocblockExtractor {
  /**
   * Extract all docblocks from content
   *
   * @param content - PHP source code
   * @returns Array of parsed docblocks with their positions
   */
  extractAll(content: string): Array<{ docblock: DocblockInfo; position: number }> {
    const results: Array<{ docblock: DocblockInfo; position: number }> = [];
    DOCBLOCK_PATTERN.lastIndex = 0;

    let match;
    while ((match = DOCBLOCK_PATTERN.exec(content)) !== null) {
      const line = this.getLineNumber(content, match.index);
      const docblock = this.parse(match[0], line);
      results.push({ docblock, position: match.index });
    }

    return results;
  }

  /**
   * Parse a single docblock string
   *
   * @param docblock - Raw docblock string including delimiters
   * @param startLine - Line number where docblock starts
   * @returns Parsed docblock info
   */
  parse(docblock: string, startLine: number = 1): DocblockInfo {
    // Remove delimiters and clean up
    const content = this.cleanDocblock(docblock);
    const lines = content.split('\n');

    const tags: DocblockTag[] = [];
    const descriptionLines: string[] = [];
    let summary = '';
    let inDescription = true;
    let currentLine = startLine;

    for (const line of lines) {
      const trimmed = line.trim();

      // Check if this is a tag line
      if (trimmed.startsWith('@')) {
        inDescription = false;
        const tag = this.parseTag(trimmed, currentLine);
        if (tag) {
          tags.push(tag);
        }
      } else if (inDescription && trimmed) {
        if (!summary) {
          summary = trimmed;
        } else {
          descriptionLines.push(trimmed);
        }
      }

      currentLine++;
    }

    return {
      summary,
      description: descriptionLines.join('\n'),
      tags,
      raw: docblock,
      line: startLine,
    };
  }

  /**
   * Extract docblock immediately before a position in content
   *
   * @param content - Full PHP content
   * @param position - Character position to look before
   * @returns Docblock if found, null otherwise
   */
  extractBefore(content: string, position: number): DocblockInfo | null {
    // Look backwards for docblock
    const before = content.substring(Math.max(0, position - 2000), position);
    
    // Find the last docblock before this position
    const matches = [...before.matchAll(/\/\*\*([\s\S]*?)\*\/\s*$/g)];
    
    if (matches.length > 0) {
      const lastMatch = matches[matches.length - 1];
      if (lastMatch) {
        const line = this.getLineNumber(content, position - before.length + (lastMatch.index || 0));
        return this.parse(lastMatch[0], line);
      }
    }

    return null;
  }

  /**
   * Get specific tags by name
   *
   * @param docblock - Parsed docblock
   * @param tagName - Tag name without @
   * @returns Array of matching tags
   */
  getTagsByName(docblock: DocblockInfo, tagName: string): DocblockTag[] {
    return docblock.tags.filter(tag => tag.name === tagName);
  }

  /**
   * Get @param tags
   */
  getParamTags(docblock: DocblockInfo): DocblockTag[] {
    return this.getTagsByName(docblock, 'param');
  }

  /**
   * Get @return tag
   */
  getReturnTag(docblock: DocblockInfo): DocblockTag | null {
    const returns = this.getTagsByName(docblock, 'return');
    return returns[0] || null;
  }

  /**
   * Get @throws tags
   */
  getThrowsTags(docblock: DocblockInfo): DocblockTag[] {
    return this.getTagsByName(docblock, 'throws');
  }

  /**
   * Check if docblock has a specific annotation
   */
  hasAnnotation(docblock: DocblockInfo, annotation: string): boolean {
    return docblock.tags.some(tag => tag.name === annotation);
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Clean docblock content by removing delimiters and asterisks
   */
  private cleanDocblock(docblock: string): string {
    return docblock
      // Remove opening delimiter
      .replace(/^\/\*\*\s*/, '')
      // Remove closing delimiter
      .replace(/\s*\*\/$/, '')
      // Remove leading asterisks from each line
      .split('\n')
      .map(line => line.replace(/^\s*\*\s?/, ''))
      .join('\n')
      .trim();
  }

  /**
   * Parse a single tag line
   */
  private parseTag(line: string, lineNumber: number): DocblockTag | null {
    // Try specific tag patterns first
    
    // @param type $variable description
    const paramMatch = line.match(PARAM_TAG_PATTERN);
    if (paramMatch) {
      return {
        name: 'param',
        type: paramMatch[1] || null,
        variable: paramMatch[2] || null,
        description: paramMatch[3]?.trim() || '',
        line: lineNumber,
      };
    }

    // @return type description
    const returnMatch = line.match(RETURN_TAG_PATTERN);
    if (returnMatch) {
      return {
        name: 'return',
        type: returnMatch[1] || null,
        variable: null,
        description: returnMatch[2]?.trim() || '',
        line: lineNumber,
      };
    }

    // @throws ExceptionType description
    const throwsMatch = line.match(THROWS_TAG_PATTERN);
    if (throwsMatch) {
      return {
        name: 'throws',
        type: throwsMatch[1] || null,
        variable: null,
        description: throwsMatch[2]?.trim() || '',
        line: lineNumber,
      };
    }

    // @var type description
    const varMatch = line.match(VAR_TAG_PATTERN);
    if (varMatch) {
      return {
        name: 'var',
        type: varMatch[1] || null,
        variable: null,
        description: varMatch[2]?.trim() || '',
        line: lineNumber,
      };
    }

    // @property type $name description
    const propertyMatch = line.match(PROPERTY_TAG_PATTERN);
    if (propertyMatch) {
      const tagName = line.includes('-read') ? 'property-read' : 
                      line.includes('-write') ? 'property-write' : 'property';
      return {
        name: tagName,
        type: propertyMatch[1] || null,
        variable: propertyMatch[2] || null,
        description: propertyMatch[3]?.trim() || '',
        line: lineNumber,
      };
    }

    // Generic tag pattern
    const genericMatch = line.match(TAG_PATTERN);
    if (genericMatch) {
      return {
        name: genericMatch[1] || '',
        type: null,
        variable: null,
        description: genericMatch[2]?.trim() || '',
        line: lineNumber,
      };
    }

    return null;
  }

  /**
   * Get line number from character offset
   */
  private getLineNumber(content: string, offset: number): number {
    return content.substring(0, offset).split('\n').length;
  }
}

/**
 * Create a new docblock extractor instance
 */
export function createDocblockExtractor(): DocblockExtractor {
  return new DocblockExtractor();
}
