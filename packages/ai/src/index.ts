/**
 * @drift/ai - AI integration module for Drift
 *
 * This package provides AI capabilities:
 * - Provider abstraction (OpenAI, Anthropic, Ollama)
 * - BYOK (Bring Your Own Key) model
 * - Explain feature for violations
 * - Fix generation for pattern compliance
 * - Context building and sanitization
 */

// Export version
export const VERSION = '0.0.1';

// Provider exports
export * from './providers/index.js';

// Type exports
export * from './types/index.js';
