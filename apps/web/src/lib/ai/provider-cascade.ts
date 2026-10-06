import { ProviderId } from './model-registry';
import { recordProviderFailure, recordProviderSuccess, AIProviderError } from './provider-registry';
import { recordProviderUsage } from './usage-tracker';
import { callGroq } from './providers/groq';
import { callOpenRouter } from './providers/openrouter';
import { callGemini } from './providers/gemini';
import { callAimlApi } from './providers/aimlapi';

export interface CascadeOptions {
  task: string;
  candidateProviders: ProviderId[];
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  timeoutMs: number;
  maxTokens: number;
  responseFormatJson?: boolean;
}

export interface CascadeExecutionResult {
  rawText: string;
  providerUsed: ProviderId;
  attempts: Array<{ providerId: ProviderId; error?: string; errorType?: string }>;
  estimatedTokensUsed: number;
}

/**
 * Estimates token count from text using character heuristic (~4 characters per token)
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Executes an AI request across candidate providers with differentiated error handling.
 *
 * Error Strategy:
 * - 429 / Rate Limit: Record rate limit + retry-after cooldown, cascade to fallback.
 * - 5xx / Server Error: Record temporary cooldown, cascade to fallback.
 * - Timeout: Record failure, cascade to fallback.
 * - Auth Error (401/403): Mark provider unhealthy for 1 hour, cascade to fallback.
 * - Parse Error: Cascade to fallback.
 * - 4xx Bad Request (Invalid input, payload too large): FAIL FAST. Do not storm all providers.
 */
export async function executeProviderCascade(
  options: CascadeOptions
): Promise<CascadeExecutionResult> {
  const attempts: Array<{ providerId: ProviderId; error?: string; errorType?: string }> = [];
  const promptLength = options.messages.reduce((acc, m) => acc + m.content.length, 0);

  for (const providerId of options.candidateProviders) {
    try {
      let rawText: string;

      if (providerId === 'groq') {
        rawText = await callGroq(options.messages, {
          timeoutMs: options.timeoutMs,
          maxTokens: options.maxTokens,
          responseFormatJson: options.responseFormatJson,
        });
      } else if (providerId === 'openrouter') {
        rawText = await callOpenRouter(options.messages, {
          providerId: 'openrouter',
          timeoutMs: options.timeoutMs,
          maxTokens: options.maxTokens,
          responseFormatJson: options.responseFormatJson,
        });
      } else if (providerId === 'openrouter_2') {
        rawText = await callOpenRouter(options.messages, {
          providerId: 'openrouter_2',
          timeoutMs: options.timeoutMs,
          maxTokens: options.maxTokens,
          responseFormatJson: options.responseFormatJson,
        });
      } else if (providerId === 'gemini') {
        rawText = await callGemini(options.messages, {
          timeoutMs: options.timeoutMs,
          maxTokens: options.maxTokens,
          responseFormatJson: options.responseFormatJson,
        });
      } else if (providerId === 'aimlapi') {
        rawText = await callAimlApi(options.messages, {
          timeoutMs: options.timeoutMs,
          maxTokens: options.maxTokens,
          responseFormatJson: options.responseFormatJson,
        });
      } else {
        continue;
      }

      // Record success & usage
      recordProviderSuccess(providerId);
      const outputTokens = estimateTokens(rawText);
      const inputTokens = estimateTokens(options.messages.map((m) => m.content).join(' '));
      const totalEstimatedTokens = inputTokens + outputTokens;

      recordProviderUsage(providerId, totalEstimatedTokens, true);

      return {
        rawText,
        providerUsed: providerId,
        attempts,
        estimatedTokensUsed: totalEstimatedTokens,
      };
    } catch (err: any) {
      const error: AIProviderError =
        err && typeof err === 'object' && 'type' in err
          ? (err as AIProviderError)
          : {
              providerId,
              type: 'SERVER_ERROR',
              message: err?.message || 'Unknown provider error',
            };

      recordProviderFailure(error);
      recordProviderUsage(providerId, 0, false);
      attempts.push({
        providerId,
        error: error.message,
        errorType: error.type,
      });

      // 4xx Bad Request: DO NOT CASCADE. Fail immediately to prevent request storms.
      if (error.type === 'BAD_REQUEST') {
        console.warn(
          `[AI Gateway Cascade] 4xx Bad Request on ${providerId} for task '${options.task}'. Halting cascade immediately.`,
          error.message
        );
        throw new Error(
          `Request rejected as invalid by ${providerId} (4xx client error). Halting retry cascade: ${error.message}`
        );
      }

      console.warn(
        `[AI Gateway Cascade] ${providerId} encountered ${error.type} for task '${options.task}'. Trying fallback... Detail: ${error.message}`
      );
    }
  }

  const attemptSummary = attempts.map((a) => `${a.providerId} (${a.errorType}): ${a.error}`).join(' | ');
  throw new Error(`All candidate AI providers failed for task '${options.task}'. Attempts: [${attemptSummary}]`);
}
