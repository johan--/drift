/**
 * Laravel CSRF Extractor
 *
 * @module security/laravel/extractors/csrf-extractor
 */

import type { CSRFUsageInfo } from '../types.js';

const CSRF_TOKEN_PATTERN = /csrf_token\s*\(\s*\)|@csrf/g;
const CSRF_FIELD_PATTERN = /csrf_field\s*\(\s*\)/g;
const VERIFY_CSRF_PATTERN = /VerifyCsrfToken/g;
const EXCEPT_PATTERN = /protected\s+\$except\s*=\s*\[([^\]]+)\]/;

export class CSRFExtractor {
  extract(content: string, file: string): { usages: CSRFUsageInfo[]; confidence: number } {
    const usages: CSRFUsageInfo[] = [];

    CSRF_TOKEN_PATTERN.lastIndex = 0;
    let match;
    while ((match = CSRF_TOKEN_PATTERN.exec(content)) !== null) {
      usages.push({
        type: 'token',
        file,
        line: this.getLineNumber(content, match.index),
      });
    }

    CSRF_FIELD_PATTERN.lastIndex = 0;
    while ((match = CSRF_FIELD_PATTERN.exec(content)) !== null) {
      usages.push({
        type: 'field',
        file,
        line: this.getLineNumber(content, match.index),
      });
    }

    VERIFY_CSRF_PATTERN.lastIndex = 0;
    while ((match = VERIFY_CSRF_PATTERN.exec(content)) !== null) {
      usages.push({
        type: 'middleware',
        file,
        line: this.getLineNumber(content, match.index),
      });
    }

    const exceptMatch = content.match(EXCEPT_PATTERN);
    if (exceptMatch) {
      usages.push({
        type: 'except',
        file,
        line: this.getLineNumber(content, content.indexOf(exceptMatch[0])),
      });
    }

    return { usages, confidence: usages.length > 0 ? 0.9 : 0 };
  }

  private getLineNumber(content: string, offset: number): number {
    return content.substring(0, offset).split('\n').length;
  }
}

export function createCSRFExtractor(): CSRFExtractor {
  return new CSRFExtractor();
}
