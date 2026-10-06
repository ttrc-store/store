import { ProviderId } from './model-registry';
import { canProviderAcceptTask } from './usage-tracker';

export type AIErrorType =
  | 'AUTH_ERROR'
  | 'QUOTA_EXCEEDED'
  | 'RATE_LIMIT'
  | 'TIMEOUT'
  | 'SERVER_ERROR'
  | 'BAD_REQUEST'
  | 'PARSE_ERROR';

export interface AIProviderError {
  providerId: ProviderId;
  type: AIErrorType;
  status?: number;
  message: string;
  retryAfterMs?: number;
}

export interface ProviderControlConfig {
  providerId: ProviderId;
  enabled: boolean;
  priority: number; // 1 = highest
  defaultTimeoutMs: number;
  maxTokens: number;
}

export const PROVIDER_CONTROLS: Record<ProviderId, ProviderControlConfig> = {
  groq: {
    providerId: 'groq',
    enabled: true,
    priority: 1,
    defaultTimeoutMs: 3000,
    maxTokens: 1200,
  },
  openrouter: {
    providerId: 'openrouter',
    enabled: true,
    priority: 2,
    defaultTimeoutMs: 5000,
    maxTokens: 1500,
  },
  openrouter_2: {
    providerId: 'openrouter_2',
    enabled: true,
    priority: 3,
    defaultTimeoutMs: 5000,
    maxTokens: 1500,
  },
  gemini: {
    providerId: 'gemini',
    enabled: true,
    priority: 2,
    defaultTimeoutMs: 6000,
    maxTokens: 1500,
  },
  aimlapi: {
    providerId: 'aimlapi',
    enabled: true,
    priority: 4,
    defaultTimeoutMs: 6000,
    maxTokens: 1500,
  },
};

interface ProviderHealth {
  isHealthy: boolean;
  cooldownUntil: number;
  consecutiveFailures: number;
  lastError?: AIProviderError;
}

const healthStatus: Record<ProviderId, ProviderHealth> = {
  groq: { isHealthy: true, cooldownUntil: 0, consecutiveFailures: 0 },
  openrouter: { isHealthy: true, cooldownUntil: 0, consecutiveFailures: 0 },
  openrouter_2: { isHealthy: true, cooldownUntil: 0, consecutiveFailures: 0 },
  gemini: { isHealthy: true, cooldownUntil: 0, consecutiveFailures: 0 },
  aimlapi: { isHealthy: true, cooldownUntil: 0, consecutiveFailures: 0 },
};

export function getProviderApiKey(providerId: ProviderId): string | undefined {
  switch (providerId) {
    case 'groq':
      return process.env.GROQ_API_KEY;
    case 'openrouter':
      return process.env.OPENROUTER_API_KEY_1 || process.env.OPENROUTER_API_KEY;
    case 'openrouter_2':
      return process.env.OPENROUTER_API_KEY_2 || process.env.OPENROUTER_API_KEY;
    case 'gemini':
      return process.env.GEMINI_API_KEY;
    case 'aimlapi':
      return process.env.AIMLAPI_API_KEY;
  }
}

/**
 * Validates if provider is ready to serve:
 * 1. Has valid configured API key
 * 2. Is enabled in controls
 * 3. Not currently in an active error cooldown
 * 4. Has remaining quota in budget tracker
 */
export function isProviderAvailable(providerId: ProviderId): boolean {
  if (!PROVIDER_CONTROLS[providerId]?.enabled) return false;

  const key = getProviderApiKey(providerId);
  if (!key || key.trim().length === 0) return false;

  const health = healthStatus[providerId];
  if (!health.isHealthy && Date.now() < health.cooldownUntil) {
    return false;
  }

  const budgetCheck = canProviderAcceptTask(providerId);
  if (!budgetCheck.allowed) {
    return false;
  }

  return true;
}

export function recordProviderFailure(error: AIProviderError) {
  const health = healthStatus[error.providerId];
  health.lastError = error;
  health.consecutiveFailures += 1;

  if (error.type === 'AUTH_ERROR' || error.type === 'QUOTA_EXCEEDED') {
    // Bad API key or out of credits - disable provider for 1 hour to prevent cascading storms
    health.isHealthy = false;
    health.cooldownUntil = Date.now() + 60 * 60 * 1000;
    console.warn(`[AI Provider Registry] ${error.providerId} (${error.type}): Cooldown for 1h.`);
  } else if (error.type === 'RATE_LIMIT') {
    // Cooldown per provider Retry-After header or default 15s
    const cooldown = error.retryAfterMs || 15 * 1000;
    health.isHealthy = false;
    health.cooldownUntil = Date.now() + cooldown;
    console.warn(`[AI Provider Registry] ${error.providerId} rate-limited. Cooling down for ${cooldown}ms.`);
  } else if (error.type === 'SERVER_ERROR' || error.type === 'TIMEOUT') {
    // 5xx / timeout - brief 5s cooldown
    health.isHealthy = false;
    health.cooldownUntil = Date.now() + 5000;
  }
}

export function recordProviderSuccess(providerId: ProviderId) {
  healthStatus[providerId] = {
    isHealthy: true,
    cooldownUntil: 0,
    consecutiveFailures: 0,
  };
}

export function getProviderHealthSnapshot() {
  return healthStatus;
}
