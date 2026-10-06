import { AITaskType, getRouteForTask, generateDeterministicSlug } from './provider-router';
import { executeProviderCascade } from './provider-cascade';
import { ProviderId } from './model-registry';
import { z } from 'zod';

export { generateDeterministicSlug };

export interface ExecuteAIOptions<T> {
  task: AITaskType;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  responseFormatJson?: boolean;
  schema?: z.ZodType<T>;
  customTimeoutMs?: number;
}

export interface AIGatewayResult<T> {
  data: T;
  providerUsed: ProviderId;
  attempts: Array<{ providerId: ProviderId; error?: string; errorType?: string }>;
  estimatedTokensUsed: number;
}

/**
 * TTRC Store Central AI Gateway
 *
 * Responsibilities:
 * 1. Validates incoming task request
 * 2. Selects optimal providers via Task Router
 * 3. Enforces provider health & budgets via Cascade Executor
 * 4. Differentiates rate-limits (429) vs auth errors vs client errors (4xx fail-fast)
 * 5. Cleans and validates structured JSON schemas (e.g. Zod)
 * 6. Records token usage and telemetry
 */
export async function executeAITask<T = string>(
  options: ExecuteAIOptions<T>
): Promise<AIGatewayResult<T>> {
  const route = getRouteForTask(options.task);
  const timeoutMs = options.customTimeoutMs || route.timeoutMs;

  const cascadeResult = await executeProviderCascade({
    task: options.task,
    candidateProviders: route.candidateProviders,
    messages: options.messages,
    timeoutMs,
    maxTokens: route.maxTokens,
    responseFormatJson: options.responseFormatJson || Boolean(options.schema),
  });

  // If a Zod schema or JSON format is requested, parse & validate
  if (options.schema) {
    // Strip markdown formatting ticks if returned (e.g. ```json ... ```)
    const cleanedJsonText = cascadeResult.rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    let parsed: any;
    try {
      parsed = JSON.parse(cleanedJsonText);
    } catch (parseError: any) {
      throw new Error(
        `Failed to parse JSON response from ${cascadeResult.providerUsed}: ${parseError.message}. Content was: ${cleanedJsonText.slice(0, 100)}...`
      );
    }

    const validated = options.schema.parse(parsed);

    return {
      data: validated,
      providerUsed: cascadeResult.providerUsed,
      attempts: cascadeResult.attempts,
      estimatedTokensUsed: cascadeResult.estimatedTokensUsed,
    };
  }

  return {
    data: cascadeResult.rawText as unknown as T,
    providerUsed: cascadeResult.providerUsed,
    attempts: cascadeResult.attempts,
    estimatedTokensUsed: cascadeResult.estimatedTokensUsed,
  };
}
