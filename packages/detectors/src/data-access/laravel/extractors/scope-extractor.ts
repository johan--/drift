/**
 * Laravel Scope Extractor
 *
 * Extracts Eloquent scope definitions from Laravel models.
 * Scopes are reusable query constraints.
 *
 * @module data-access/laravel/extractors/scope-extractor
 */

import type { ScopeInfo, ScopeExtractionResult } from '../types.js';

// ============================================================================
// Regex Patterns
// ============================================================================

/**
 * Local scope method (scopeXxx)
 */
const LOCAL_SCOPE_PATTERN = /public\s+function\s+scope(\w+)\s*\(([^)]*)\)/g;

/**
 * Global scope boot registration
 */
const GLOBAL_SCOPE_BOOT_PATTERN = /static::addGlobalScope\s*\(\s*['"](\w+)['"]/g;

/**
 * Global scope class application
 */
const GLOBAL_SCOPE_CLASS_PATTERN = /static::addGlobalScope\s*\(\s*new\s+(\w+)/g;

/**
 * Global scope trait usage
 */
const SCOPE_TRAIT_PATTERN = /use\s+([\w\\]+Scope)/g;

// Note: These patterns are defined for future use in scope removal detection
// const WITHOUT_SCOPE_PATTERN = /->withoutGlobalScope\s*\(\s*['"]?(\w+)['"]?\s*\)/g;
// const WITHOUT_SCOPES_PATTERN = /->withoutGlobalScopes\s*\(\s*\[?([^\])]*)\]?\s*\)/g;

// ============================================================================
// Extended Scope Info
// ============================================================================

/**
 * Global scope info
 */
export interface GlobalScopeInfo {
  /** Scope name or class */
  name: string;
  /** Whether it's a class-based scope */
  isClass: boolean;
  /** Line number */
  line: number;
}

/**
 * Extended scope extraction result
 */
export interface ExtendedScopeExtractionResult extends ScopeExtractionResult {
  /** Local scopes */
  localScopes: ScopeInfo[];
  /** Global scopes */
  globalScopes: GlobalScopeInfo[];
  /** Scope traits used */
  scopeTraits: string[];
}

// ============================================================================
// Scope Extractor
// ============================================================================

/**
 * Extracts Eloquent scope definitions
 */
export class ScopeExtractor {
  /**
   * Extract all scopes from content
   */
  extract(content: string, file: string): ExtendedScopeExtractionResult {
    const localScopes = this.extractLocalScopes(content, file);
    const globalScopes = this.extractGlobalScopes(content, file);
    const scopeTraits = this.extractScopeTraits(content);

    const allScopes = localScopes;
    const confidence = allScopes.length > 0 || globalScopes.length > 0 ? 0.9 : 0;

    return {
      scopes: allScopes,
      localScopes,
      globalScopes,
      scopeTraits,
      confidence,
    };
  }

  /**
   * Check if content contains scopes
   */
  hasScopes(content: string): boolean {
    return (
      content.includes('function scope') ||
      content.includes('addGlobalScope')
    );
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Extract local scope definitions
   */
  private extractLocalScopes(content: string, _file: string): ScopeInfo[] {
    const scopes: ScopeInfo[] = [];
    LOCAL_SCOPE_PATTERN.lastIndex = 0;

    let match;
    while ((match = LOCAL_SCOPE_PATTERN.exec(content)) !== null) {
      const name = match[1] || '';
      const paramsStr = match[2] || '';
      const line = this.getLineNumber(content, match.index);

      // Parse parameters (skip $query which is always first)
      const params = this.parseParameters(paramsStr);

      scopes.push({
        name: this.lcfirst(name),
        parameters: params,
        line,
      });
    }

    return scopes;
  }

  /**
   * Extract global scope registrations
   */
  private extractGlobalScopes(content: string, _file: string): GlobalScopeInfo[] {
    const scopes: GlobalScopeInfo[] = [];

    // String-based global scopes
    GLOBAL_SCOPE_BOOT_PATTERN.lastIndex = 0;
    let match;
    while ((match = GLOBAL_SCOPE_BOOT_PATTERN.exec(content)) !== null) {
      scopes.push({
        name: match[1] || '',
        isClass: false,
        line: this.getLineNumber(content, match.index),
      });
    }

    // Class-based global scopes
    GLOBAL_SCOPE_CLASS_PATTERN.lastIndex = 0;
    while ((match = GLOBAL_SCOPE_CLASS_PATTERN.exec(content)) !== null) {
      scopes.push({
        name: match[1] || '',
        isClass: true,
        line: this.getLineNumber(content, match.index),
      });
    }

    return scopes;
  }

  /**
   * Extract scope traits
   */
  private extractScopeTraits(content: string): string[] {
    const traits: string[] = [];
    SCOPE_TRAIT_PATTERN.lastIndex = 0;

    let match;
    while ((match = SCOPE_TRAIT_PATTERN.exec(content)) !== null) {
      if (match[1]) {
        traits.push(match[1]);
      }
    }

    return traits;
  }

  /**
   * Parse scope parameters
   */
  private parseParameters(paramsStr: string): string[] {
    return paramsStr
      .split(',')
      .slice(1) // Skip $query
      .map(p => {
        const paramMatch = p.trim().match(/\$(\w+)/);
        return paramMatch ? paramMatch[1] || '' : '';
      })
      .filter(Boolean);
  }

  /**
   * Lowercase first character
   */
  private lcfirst(str: string): string {
    return str.charAt(0).toLowerCase() + str.slice(1);
  }

  /**
   * Get line number from offset
   */
  private getLineNumber(content: string, offset: number): number {
    return content.substring(0, offset).split('\n').length;
  }
}

/**
 * Create a new scope extractor
 */
export function createScopeExtractor(): ScopeExtractor {
  return new ScopeExtractor();
}
