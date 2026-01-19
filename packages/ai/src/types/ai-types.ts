/**
 * AI-specific type definitions
 */

export type AIProviderType = 'openai' | 'anthropic' | 'ollama';

export interface AIConfig {
  /** Provider to use */
  provider: AIProviderType;
  /** Model to use */
  model?: string;
  /** Maximum tokens */
  maxTokens?: number;
  /** Temperature */
  temperature?: number;
}

export interface AIRequest {
  /** Request type */
  type: 'explain' | 'fix';
  /** Code to analyze */
  code: string;
  /** Context information */
  context: Record<string, unknown>;
}

export interface AIResponse {
  /** Response content */
  content: string;
  /** Token usage */
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
