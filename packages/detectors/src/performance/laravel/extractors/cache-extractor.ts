/**
 * Laravel Cache Extractor
 *
 * @module performance/laravel/extractors/cache-extractor
 */

import type { CacheUsageInfo } from '../types.js';

const CACHE_PATTERN = /Cache::(get|put|remember|forever|forget|flush)\s*\(\s*['"]?([^'")\s,]+)['"]?/g;
const CACHE_STORE_PATTERN = /Cache::store\s*\(\s*['"](\w+)['"]\s*\)\s*->(get|put|remember|forever|forget|flush)\s*\(\s*['"]?([^'")\s,]+)['"]?/g;

export class CacheExtractor {
  extract(content: string, file: string): { usages: CacheUsageInfo[]; confidence: number } {
    const usages: CacheUsageInfo[] = [];

    CACHE_PATTERN.lastIndex = 0;
    let match;
    while ((match = CACHE_PATTERN.exec(content)) !== null) {
      usages.push({
        method: match[1] as CacheUsageInfo['method'],
        key: match[2] || null,
        ttl: null,
        store: null,
        file,
        line: this.getLineNumber(content, match.index),
      });
    }

    CACHE_STORE_PATTERN.lastIndex = 0;
    while ((match = CACHE_STORE_PATTERN.exec(content)) !== null) {
      usages.push({
        method: match[2] as CacheUsageInfo['method'],
        key: match[3] || null,
        ttl: null,
        store: match[1] || null,
        file,
        line: this.getLineNumber(content, match.index),
      });
    }

    return { usages, confidence: usages.length > 0 ? 0.9 : 0 };
  }

  private getLineNumber(content: string, offset: number): number {
    return content.substring(0, offset).split('\n').length;
  }
}

export function createCacheExtractor(): CacheExtractor {
  return new CacheExtractor();
}
