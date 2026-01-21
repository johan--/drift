/**
 * Laravel Security Type Definitions
 *
 * @module security/laravel/types
 */

export interface CSRFUsageInfo {
  type: 'token' | 'field' | 'middleware' | 'except';
  file: string;
  line: number;
}

export interface MassAssignmentInfo {
  model: string;
  fillable: string[];
  guarded: string[];
  hasProtection: boolean;
  file: string;
  line: number;
}

export interface XSSUsageInfo {
  type: 'escaped' | 'unescaped' | 'raw';
  context: string;
  file: string;
  line: number;
}

export interface LaravelSecurityAnalysis {
  csrf: CSRFUsageInfo[];
  massAssignment: MassAssignmentInfo[];
  xss: XSSUsageInfo[];
  confidence: number;
}
