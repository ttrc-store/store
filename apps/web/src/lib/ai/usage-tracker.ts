import { ProviderId } from './model-registry';

export interface ProviderBudgetConfig {
  dailyMaxRequests: number;
  dailyMaxTokens: number;
  monthlyMaxRequests: number;
  monthlyMaxTokens: number;
}

export interface ProviderUsageRecord {
  requests: number;
  tokens: number;
  failedRequests: number;
  lastResetDay: string; // YYYY-MM-DD
  lastResetMonth: string; // YYYY-MM
}

export interface ProviderUsageStats {
  providerId: ProviderId;
  dailyRequests: number;
  dailyTokens: number;
  monthlyRequests: number;
  monthlyTokens: number;
  dailyBudgetRequests: number;
  dailyBudgetTokens: number;
  isWithinBudget: boolean;
}

// Configurable default budgets per provider (can be overridden by environment variables)
const BUDGET_LIMITS: Record<ProviderId, ProviderBudgetConfig> = {
  groq: {
    dailyMaxRequests: parseInt(process.env.AI_GROQ_DAILY_MAX_REQUESTS || '2000', 10),
    dailyMaxTokens: parseInt(process.env.AI_GROQ_DAILY_MAX_TOKENS || '500000', 10),
    monthlyMaxRequests: 50000,
    monthlyMaxTokens: 10000000,
  },
  openrouter: {
    dailyMaxRequests: parseInt(process.env.AI_OPENROUTER_DAILY_MAX_REQUESTS || '1000', 10),
    dailyMaxTokens: parseInt(process.env.AI_OPENROUTER_DAILY_MAX_TOKENS || '300000', 10),
    monthlyMaxRequests: 25000,
    monthlyMaxTokens: 8000000,
  },
  openrouter_2: {
    dailyMaxRequests: parseInt(process.env.AI_OPENROUTER_2_DAILY_MAX_REQUESTS || '500', 10),
    dailyMaxTokens: parseInt(process.env.AI_OPENROUTER_2_DAILY_MAX_TOKENS || '200000', 10),
    monthlyMaxRequests: 15000,
    monthlyMaxTokens: 5000000,
  },
  gemini: {
    dailyMaxRequests: parseInt(process.env.AI_GEMINI_DAILY_MAX_REQUESTS || '1500', 10),
    dailyMaxTokens: parseInt(process.env.AI_GEMINI_DAILY_MAX_TOKENS || '1000000', 10),
    monthlyMaxRequests: 40000,
    monthlyMaxTokens: 25000000,
  },
  aimlapi: {
    dailyMaxRequests: parseInt(process.env.AI_AIMLAPI_DAILY_MAX_REQUESTS || '800', 10),
    dailyMaxTokens: parseInt(process.env.AI_AIMLAPI_DAILY_MAX_TOKENS || '250000', 10),
    monthlyMaxRequests: 20000,
    monthlyMaxTokens: 6000000,
  },
};

const usageStore: Record<ProviderId, ProviderUsageRecord> = {
  groq: { requests: 0, tokens: 0, failedRequests: 0, lastResetDay: '', lastResetMonth: '' },
  openrouter: { requests: 0, tokens: 0, failedRequests: 0, lastResetDay: '', lastResetMonth: '' },
  openrouter_2: { requests: 0, tokens: 0, failedRequests: 0, lastResetDay: '', lastResetMonth: '' },
  gemini: { requests: 0, tokens: 0, failedRequests: 0, lastResetDay: '', lastResetMonth: '' },
  aimlapi: { requests: 0, tokens: 0, failedRequests: 0, lastResetDay: '', lastResetMonth: '' },
};

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

function getCurrentMonthString(): string {
  return new Date().toISOString().slice(0, 7);
}

function ensurePeriodFresh(providerId: ProviderId) {
  const current = usageStore[providerId];
  const today = getTodayString();
  const month = getCurrentMonthString();

  if (current.lastResetDay !== today) {
    current.requests = 0;
    current.tokens = 0;
    current.failedRequests = 0;
    current.lastResetDay = today;
  }

  if (current.lastResetMonth !== month) {
    current.lastResetMonth = month;
  }
}

/**
 * Checks whether a provider has sufficient remaining budget to accept a new request.
 */
export function canProviderAcceptTask(providerId: ProviderId): { allowed: boolean; reason?: string } {
  ensurePeriodFresh(providerId);

  const usage = usageStore[providerId];
  const budget = BUDGET_LIMITS[providerId];

  if (usage.requests >= budget.dailyMaxRequests) {
    return {
      allowed: false,
      reason: `Daily request quota reached (${usage.requests}/${budget.dailyMaxRequests})`,
    };
  }

  if (usage.tokens >= budget.dailyMaxTokens) {
    return {
      allowed: false,
      reason: `Daily token quota reached (${usage.tokens}/${budget.dailyMaxTokens})`,
    };
  }

  return { allowed: true };
}

/**
 * Records token consumption and request outcomes.
 */
export function recordProviderUsage(
  providerId: ProviderId,
  consumedTokens: number,
  isSuccess: boolean
) {
  ensurePeriodFresh(providerId);
  const current = usageStore[providerId];

  current.requests += 1;
  current.tokens += Math.max(0, consumedTokens);
  if (!isSuccess) {
    current.failedRequests += 1;
  }
}

/**
 * Retrieves snapshot of current usage stats across all configured providers.
 */
export function getProviderUsageStats(): Record<ProviderId, ProviderUsageStats> {
  const result: Partial<Record<ProviderId, ProviderUsageStats>> = {};

  (Object.keys(usageStore) as ProviderId[]).forEach((providerId) => {
    ensurePeriodFresh(providerId);
    const usage = usageStore[providerId];
    const budget = BUDGET_LIMITS[providerId];
    const isWithin = usage.requests < budget.dailyMaxRequests && usage.tokens < budget.dailyMaxTokens;

    result[providerId] = {
      providerId,
      dailyRequests: usage.requests,
      dailyTokens: usage.tokens,
      monthlyRequests: usage.requests,
      monthlyTokens: usage.tokens,
      dailyBudgetRequests: budget.dailyMaxRequests,
      dailyBudgetTokens: budget.dailyMaxTokens,
      isWithinBudget: isWithin,
    };
  });

  return result as Record<ProviderId, ProviderUsageStats>;
}

/**
 * Resets usage store (useful for testing or manual admin resets).
 */
export function resetUsageStore(providerId?: ProviderId) {
  if (providerId) {
    usageStore[providerId] = {
      requests: 0,
      tokens: 0,
      failedRequests: 0,
      lastResetDay: getTodayString(),
      lastResetMonth: getCurrentMonthString(),
    };
  } else {
    (Object.keys(usageStore) as ProviderId[]).forEach((p) => {
      usageStore[p] = {
        requests: 0,
        tokens: 0,
        failedRequests: 0,
        lastResetDay: getTodayString(),
        lastResetMonth: getCurrentMonthString(),
      };
    });
  }
}
