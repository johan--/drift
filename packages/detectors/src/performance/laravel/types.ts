/**
 * Laravel Performance Type Definitions
 *
 * @module performance/laravel/types
 */

export interface CacheUsageInfo {
  method: 'get' | 'put' | 'remember' | 'forever' | 'forget' | 'flush';
  key: string | null;
  ttl: number | null;
  store: string | null;
  file: string;
  line: number;
}

export interface QueueUsageInfo {
  type: 'dispatch' | 'push' | 'later' | 'chain' | 'batch';
  job: string | null;
  queue: string | null;
  delay: number | null;
  file: string;
  line: number;
}

export interface EagerLoadingInfo {
  model: string;
  relations: string[];
  file: string;
  line: number;
}

export interface LaravelPerformanceAnalysis {
  cache: CacheUsageInfo[];
  queue: QueueUsageInfo[];
  eagerLoading: EagerLoadingInfo[];
  confidence: number;
}
