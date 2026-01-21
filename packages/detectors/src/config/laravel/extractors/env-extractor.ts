/**
 * Laravel Env Extractor
 *
 * @module config/laravel/extractors/env-extractor
 */

import type { EnvUsageInfo, ConfigUsageInfo } from '../types.js';

const ENV_PATTERN = /env\s*\(\s*['"]([^'"]+)['"](?:\s*,\s*([^)]+))?\s*\)/g;
const CONFIG_PATTERN = /config\s*\(\s*['"]([^'"]+)['"](?:\s*,\s*([^)]+))?\s*\)/g;

export class EnvExtractor {
  extract(content: string, file: string): { envUsages: EnvUsageInfo[]; configUsages: ConfigUsageInfo[]; confidence: number } {
    const envUsages: EnvUsageInfo[] = [];
    const configUsages: ConfigUsageInfo[] = [];

    ENV_PATTERN.lastIndex = 0;
    let match;
    while ((match = ENV_PATTERN.exec(content)) !== null) {
      envUsages.push({
        key: match[1] || '',
        default: match[2]?.trim() || null,
        file,
        line: this.getLineNumber(content, match.index),
      });
    }

    CONFIG_PATTERN.lastIndex = 0;
    while ((match = CONFIG_PATTERN.exec(content)) !== null) {
      configUsages.push({
        key: match[1] || '',
        default: match[2]?.trim() || null,
        file,
        line: this.getLineNumber(content, match.index),
      });
    }

    const confidence = (envUsages.length > 0 || configUsages.length > 0) ? 0.9 : 0;
    return { envUsages, configUsages, confidence };
  }

  private getLineNumber(content: string, offset: number): number {
    return content.substring(0, offset).split('\n').length;
  }
}

export function createEnvExtractor(): EnvExtractor {
  return new EnvExtractor();
}
