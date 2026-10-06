import { ProviderId } from './model-registry';
import { isProviderAvailable } from './provider-registry';

export type AITaskType =
  | 'seo_enrichment'
  | 'product_description'
  | 'spec_extraction'
  | 'pdf_datasheet_image'
  | 'customer_support'
  | 'complex_reasoning'
  | 'structured_json'
  | 'embeddings';

export interface TaskRouteConfig {
  task: AITaskType;
  preferenceList: ProviderId[];
  timeoutMs: number;
  maxTokens: number;
}

/**
 * Deterministic Local Slug Generator
 * Do NOT use an LLM for slugs. Pure algorithmic transformation ensures
 * 0ms latency, zero API costs, and 100% predictable URL structures.
 *
 * Example: "CNKALUN KL-F2 2-Way Brass Solenoid Valve" -> "cnkalun-kl-f2-2-way-brass-solenoid-valve"
 */
export function generateDeterministicSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Task-specialized Provider Allocation Table
 *
 * Task                            | Primary    | Fallback 1  | Fallback 2
 * --------------------------------|------------|-------------|------------
 * SEO title/description           | Groq       | OpenRouter  | AIMLAPI
 * Product short description       | Groq       | OpenRouter  | AIMLAPI
 * Technical-spec extraction       | OpenRouter | Gemini      | AIMLAPI
 * PDF/datasheet/image             | Gemini     | OpenRouter  | AIMLAPI
 * Customer support                | Groq       | OpenRouter  | Gemini
 * Complex technical reasoning     | OpenRouter | Gemini      | AIMLAPI
 * Structured JSON generation      | Groq       | OpenRouter  | Gemini
 * Embeddings                      | Gemini     | —           | —
 */
const TASK_ROUTING_TABLE: Record<AITaskType, TaskRouteConfig> = {
  seo_enrichment: {
    task: 'seo_enrichment',
    preferenceList: ['groq', 'openrouter', 'aimlapi'],
    timeoutMs: 3500,
    maxTokens: 1000,
  },
  product_description: {
    task: 'product_description',
    preferenceList: ['groq', 'openrouter', 'aimlapi'],
    timeoutMs: 4000,
    maxTokens: 1200,
  },
  spec_extraction: {
    task: 'spec_extraction',
    preferenceList: ['openrouter', 'gemini', 'aimlapi'],
    timeoutMs: 6000,
    maxTokens: 1800,
  },
  pdf_datasheet_image: {
    task: 'pdf_datasheet_image',
    preferenceList: ['gemini', 'openrouter', 'aimlapi'],
    timeoutMs: 7000,
    maxTokens: 2000,
  },
  customer_support: {
    task: 'customer_support',
    preferenceList: ['groq', 'openrouter', 'gemini'],
    timeoutMs: 4000,
    maxTokens: 900,
  },
  complex_reasoning: {
    task: 'complex_reasoning',
    preferenceList: ['openrouter', 'gemini', 'aimlapi'],
    timeoutMs: 7000,
    maxTokens: 2000,
  },
  structured_json: {
    task: 'structured_json',
    preferenceList: ['groq', 'openrouter', 'gemini'],
    timeoutMs: 5000,
    maxTokens: 1500,
  },
  embeddings: {
    task: 'embeddings',
    preferenceList: ['gemini'],
    timeoutMs: 5000,
    maxTokens: 1000,
  },
};

/**
 * Returns an ordered list of viable candidate providers for the requested task,
 * dynamically filtering out providers in cooldown, unconfigured keys, or over budget.
 */
export function getRouteForTask(task: AITaskType): {
  candidateProviders: ProviderId[];
  timeoutMs: number;
  maxTokens: number;
} {
  const config = TASK_ROUTING_TABLE[task];
  if (!config) {
    throw new Error(`Unknown AI task type: ${task}`);
  }

  // Filter available providers according to health, keys, and budgets
  const candidateProviders = config.preferenceList.filter((p) => isProviderAvailable(p));

  // If all preferred providers are temporarily cooling down, return any configured provider
  if (candidateProviders.length === 0) {
    const configuredFallbacks = config.preferenceList.filter((p) => {
      const key =
        p === 'groq'
          ? process.env.GROQ_API_KEY
          : p === 'openrouter'
          ? process.env.OPENROUTER_API_KEY_1 || process.env.OPENROUTER_API_KEY
          : p === 'openrouter_2'
          ? process.env.OPENROUTER_API_KEY_2 || process.env.OPENROUTER_API_KEY
          : p === 'gemini'
          ? process.env.GEMINI_API_KEY
          : process.env.AIMLAPI_API_KEY;
      return Boolean(key && key.trim().length > 0);
    });

    return {
      candidateProviders: configuredFallbacks.length > 0 ? configuredFallbacks : [config.preferenceList[0]],
      timeoutMs: config.timeoutMs,
      maxTokens: config.maxTokens,
    };
  }

  return {
    candidateProviders,
    timeoutMs: config.timeoutMs,
    maxTokens: config.maxTokens,
  };
}

export function getTaskRouteConfig(task: AITaskType): TaskRouteConfig {
  return TASK_ROUTING_TABLE[task];
}
