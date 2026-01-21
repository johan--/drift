/**
 * Laravel Structural Type Definitions
 *
 * Types for Laravel DI and structural pattern detection.
 *
 * @module structural/laravel/types
 */

export interface ServiceProviderInfo {
  name: string;
  fqn: string;
  namespace: string | null;
  bindings: BindingInfo[];
  singletons: BindingInfo[];
  deferred: boolean;
  provides: string[];
  file: string;
  line: number;
}

export interface BindingInfo {
  abstract: string;
  concrete: string;
  type: 'bind' | 'singleton' | 'scoped' | 'instance';
  line: number;
}

export interface FacadeInfo {
  name: string;
  fqn: string;
  accessor: string;
  file: string;
  line: number;
}

export interface LaravelStructuralAnalysis {
  providers: ServiceProviderInfo[];
  facades: FacadeInfo[];
  confidence: number;
}
