/**
 * TTRC Store AI Model Registry
 * Maps providers to active models, allowing model rotation via environment variables
 * without modifying application business logic.
 *
 * Provider model catalogs evolve continuously (Groq, OpenRouter, Gemini, AIMLAPI);
 * this registry ensures runtime adaptability via .env configuration with robust defaults.
 */

export const MODEL_REGISTRY = {
  groq: {
    getModel: () => process.env.AI_GROQ_MODEL || 'openai/gpt-oss-120b',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
  },
  openrouter: {
    getModel: () => process.env.AI_OPENROUTER_MODEL_PRIMARY || 'meta-llama/llama-3.3-70b-instruct',
    getMultimodalModel: () => process.env.AI_OPENROUTER_MODEL_MULTIMODAL || 'google/gemini-2.0-flash-001',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
  },
  openrouter_2: {
    getModel: () => process.env.AI_OPENROUTER_MODEL_FALLBACK || 'google/gemini-2.0-flash-001',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
  },
  gemini: {
    getModel: () => process.env.AI_GEMINI_MODEL || 'gemini-flash-latest',
    getEmbeddingModel: () => process.env.AI_GEMINI_EMBEDDING_MODEL || 'text-embedding-004',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
  },
  aimlapi: {
    getModel: () => process.env.AI_AIMLAPI_MODEL || 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    getMultimodalModel: () => process.env.AI_AIMLAPI_MODEL_MULTIMODAL || 'meta-llama/Llama-3.2-11B-Vision-Instruct',
    endpoint: 'https://api.aimlapi.com/v1/chat/completions',
  },
} as const;

export type ProviderId = keyof typeof MODEL_REGISTRY;
