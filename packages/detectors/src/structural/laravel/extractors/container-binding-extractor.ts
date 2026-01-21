/**
 * Laravel Container Binding Extractor
 *
 * Extracts service container bindings from Laravel code.
 * Bindings define how dependencies are resolved.
 *
 * @module structural/laravel/extractors/container-binding-extractor
 */

import type { BindingInfo } from '../types.js';

// ============================================================================
// Regex Patterns
// ============================================================================

/**
 * App bind
 */
const APP_BIND_PATTERN = /\$this->app->bind\s*\(\s*([^,]+)\s*,\s*([^)]+)\)/g;

/**
 * App singleton
 */
const APP_SINGLETON_PATTERN = /\$this->app->singleton\s*\(\s*([^,]+)\s*,\s*([^)]+)\)/g;

/**
 * App scoped
 */
const APP_SCOPED_PATTERN = /\$this->app->scoped\s*\(\s*([^,]+)\s*,\s*([^)]+)\)/g;

/**
 * App instance
 */
const APP_INSTANCE_PATTERN = /\$this->app->instance\s*\(\s*([^,]+)\s*,\s*([^)]+)\)/g;

// Note: These patterns are defined for future use in alias and extend detection
// const APP_ALIAS_PATTERN = /\$this->app->alias\s*\(\s*([^,]+)\s*,\s*['"]([^'"]+)['"]\s*\)/g;
// const APP_EXTEND_PATTERN = /\$this->app->extend\s*\(\s*([^,]+)\s*,/g;

/**
 * App when contextual binding
 */
const CONTEXTUAL_BINDING_PATTERN = /\$this->app->when\s*\(\s*([^)]+)\s*\)\s*->needs\s*\(\s*([^)]+)\s*\)\s*->give\s*\(\s*([^)]+)\)/g;

/**
 * App tag
 */
const APP_TAG_PATTERN = /\$this->app->tag\s*\(\s*\[([^\]]+)\]\s*,\s*['"]([^'"]+)['"]\s*\)/g;

// ============================================================================
// Extended Types
// ============================================================================

/**
 * Contextual binding info
 */
export interface ContextualBindingInfo {
  /** Consumer class */
  consumer: string;
  /** Dependency needed */
  needs: string;
  /** Implementation given */
  gives: string;
  /** Line number */
  line: number;
}

/**
 * Tag info
 */
export interface TagInfo {
  /** Tag name */
  name: string;
  /** Tagged services */
  services: string[];
  /** Line number */
  line: number;
}

/**
 * Container binding extraction result
 */
export interface ContainerBindingExtractionResult {
  /** Regular bindings */
  bindings: BindingInfo[];
  /** Contextual bindings */
  contextualBindings: ContextualBindingInfo[];
  /** Tags */
  tags: TagInfo[];
  /** Confidence score */
  confidence: number;
}

// ============================================================================
// Container Binding Extractor
// ============================================================================

/**
 * Extracts Laravel service container bindings
 */
export class ContainerBindingExtractor {
  /**
   * Extract all bindings from content
   */
  extract(content: string, _file: string): ContainerBindingExtractionResult {
    const bindings = this.extractBindings(content);
    const contextualBindings = this.extractContextualBindings(content);
    const tags = this.extractTags(content);

    const confidence = bindings.length > 0 || contextualBindings.length > 0 ? 0.9 : 0;

    return {
      bindings,
      contextualBindings,
      tags,
      confidence,
    };
  }

  /**
   * Check if content contains bindings
   */
  hasBindings(content: string): boolean {
    return (
      content.includes('$this->app->bind') ||
      content.includes('$this->app->singleton') ||
      content.includes('$this->app->scoped') ||
      content.includes('$this->app->instance')
    );
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Extract all binding types
   */
  private extractBindings(content: string): BindingInfo[] {
    const bindings: BindingInfo[] = [];

    // Regular bindings
    bindings.push(...this.extractBindingType(content, APP_BIND_PATTERN, 'bind'));

    // Singletons
    bindings.push(...this.extractBindingType(content, APP_SINGLETON_PATTERN, 'singleton'));

    // Scoped
    bindings.push(...this.extractBindingType(content, APP_SCOPED_PATTERN, 'scoped'));

    // Instances
    bindings.push(...this.extractBindingType(content, APP_INSTANCE_PATTERN, 'instance'));

    return bindings;
  }

  /**
   * Extract bindings of a specific type
   */
  private extractBindingType(
    content: string,
    pattern: RegExp,
    type: BindingInfo['type']
  ): BindingInfo[] {
    const bindings: BindingInfo[] = [];
    pattern.lastIndex = 0;

    let match;
    while ((match = pattern.exec(content)) !== null) {
      const abstract = this.cleanBindingArg(match[1] || '');
      const concrete = this.cleanBindingArg(match[2] || '');
      const line = this.getLineNumber(content, match.index);

      bindings.push({
        abstract,
        concrete,
        type,
        line,
      });
    }

    return bindings;
  }

  /**
   * Extract contextual bindings
   */
  private extractContextualBindings(content: string): ContextualBindingInfo[] {
    const bindings: ContextualBindingInfo[] = [];
    CONTEXTUAL_BINDING_PATTERN.lastIndex = 0;

    let match;
    while ((match = CONTEXTUAL_BINDING_PATTERN.exec(content)) !== null) {
      const consumer = this.cleanBindingArg(match[1] || '');
      const needs = this.cleanBindingArg(match[2] || '');
      const gives = this.cleanBindingArg(match[3] || '');
      const line = this.getLineNumber(content, match.index);

      bindings.push({
        consumer,
        needs,
        gives,
        line,
      });
    }

    return bindings;
  }

  /**
   * Extract tags
   */
  private extractTags(content: string): TagInfo[] {
    const tags: TagInfo[] = [];
    APP_TAG_PATTERN.lastIndex = 0;

    let match;
    while ((match = APP_TAG_PATTERN.exec(content)) !== null) {
      const servicesStr = match[1] || '';
      const name = match[2] || '';
      const line = this.getLineNumber(content, match.index);

      const services = servicesStr
        .split(',')
        .map(s => this.cleanBindingArg(s.trim()))
        .filter(Boolean);

      tags.push({
        name,
        services,
        line,
      });
    }

    return tags;
  }

  /**
   * Clean binding argument
   */
  private cleanBindingArg(arg: string): string {
    return arg
      .trim()
      .replace(/^['"]|['"]$/g, '')
      .replace(/::class$/, '')
      .replace(/^\\/, '');
  }

  /**
   * Get line number from offset
   */
  private getLineNumber(content: string, offset: number): number {
    return content.substring(0, offset).split('\n').length;
  }
}

/**
 * Create a new container binding extractor
 */
export function createContainerBindingExtractor(): ContainerBindingExtractor {
  return new ContainerBindingExtractor();
}
