import { MODEL_REGISTRY, ProviderId } from '../model-registry';
import { getProviderApiKey, AIProviderError } from '../provider-registry';

export async function callOpenRouter(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options: {
    providerId?: 'openrouter' | 'openrouter_2';
    timeoutMs?: number;
    maxTokens?: number;
    responseFormatJson?: boolean;
  } = {}
): Promise<string> {
  const providerId: ProviderId = options.providerId || 'openrouter';
  const apiKey = getProviderApiKey(providerId);

  if (!apiKey) {
    const err: AIProviderError = {
      providerId,
      type: 'AUTH_ERROR',
      message: `${providerId} API key is not configured`,
    };
    throw err;
  }

  const model =
    providerId === 'openrouter_2'
      ? MODEL_REGISTRY.openrouter_2.getModel()
      : MODEL_REGISTRY.openrouter.getModel();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs || 5000);

  try {
    const response = await fetch(MODEL_REGISTRY.openrouter.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://ttrc.store',
        'X-Title': 'TTRC Store E-Commerce Engine',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.2,
        max_tokens: options.maxTokens || 1500,
        response_format: options.responseFormatJson ? { type: 'json_object' } : undefined,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      let errorType: AIProviderError['type'] = 'SERVER_ERROR';

      if (response.status === 429) {
        errorType = 'RATE_LIMIT';
      } else if (response.status === 401) {
        errorType = 'AUTH_ERROR';
      } else if (response.status === 402 || (response.status === 403 && /fund|credit|quota/i.test(errText))) {
        errorType = 'QUOTA_EXCEEDED';
      } else if (response.status === 403) {
        errorType = 'AUTH_ERROR';
      } else if (response.status === 400) {
        errorType = 'BAD_REQUEST';
      } else if (response.status === 404) {
        errorType = 'SERVER_ERROR';
      }

      const retryAfterHeader = response.headers.get('retry-after');
      const retryAfterSec = retryAfterHeader ? parseInt(retryAfterHeader, 10) : undefined;

      const err: AIProviderError = {
        providerId,
        type: errorType,
        status: response.status,
        message: `OpenRouter error (${response.status}): ${errText}`,
        retryAfterMs: retryAfterSec ? retryAfterSec * 1000 : undefined,
      };
      throw err;
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      throw {
        providerId,
        type: 'PARSE_ERROR',
        message: 'Empty response content from OpenRouter',
      } as AIProviderError;
    }

    return content;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error?.name === 'AbortError') {
      const timeoutErr: AIProviderError = {
        providerId,
        type: 'TIMEOUT',
        message: `OpenRouter request timed out after ${options.timeoutMs || 5000}ms`,
      };
      throw timeoutErr;
    }
    throw error;
  }
}
