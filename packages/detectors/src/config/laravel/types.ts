/**
 * Laravel Config Type Definitions
 *
 * @module config/laravel/types
 */

export interface EnvUsageInfo {
  key: string;
  default: string | null;
  file: string;
  line: number;
}

export interface ConfigUsageInfo {
  key: string;
  default: string | null;
  file: string;
  line: number;
}

export interface LaravelConfigAnalysis {
  envUsages: EnvUsageInfo[];
  configUsages: ConfigUsageInfo[];
  confidence: number;
}
