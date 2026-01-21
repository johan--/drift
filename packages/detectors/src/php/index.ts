/**
 * PHP Shared Utilities
 *
 * Core PHP parsing utilities used by all PHP framework detectors.
 * These extractors are framework-agnostic and can be composed
 * into Laravel, Symfony, WordPress, or other PHP framework detectors.
 *
 * @module php
 */

// Type definitions
export * from './types.js';

// Extractors
export { ClassExtractor, createClassExtractor } from './class-extractor.js';
export { MethodExtractor, createMethodExtractor } from './method-extractor.js';
export { AttributeExtractor, createAttributeExtractor } from './attribute-extractor.js';
export { DocblockExtractor, createDocblockExtractor } from './docblock-extractor.js';
