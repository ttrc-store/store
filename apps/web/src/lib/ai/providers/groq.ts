import { MODEL_REGISTRY } from '../model-registry';
import { getProviderApiKey, AIProviderError } from '../provider-registry';

export async function callGroq(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options: {
    timeoutMs?: number;
    maxTokens?: number;
    responseFormatJson?: boolean;
  } = {}
): Promise<string> {
  const apiKey = getProviderApiKey('groq');
  if (!apiKey) {
    const err: AIProviderError = {
      providerId: 'groq',
      type: 'AUTH_ERROR',
      message: 'GROQ_API_KEY is not configured',
    };
    throw err;
  }

  const model = MODEL_REGISTRY.groq.getModel();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs || 4000);

  try {
    const response = await fetch(MODEL_REGISTRY.groq.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.2,
        max_tokens: options.maxTokens || 1200,
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
        providerId: 'groq',
        type: errorType,
        status: response.status,
        message: `Groq error (${response.status}): ${errText}`,
        retryAfterMs: retryAfterSec ? retryAfterSec * 1000 : undefined,
      };
      throw err;
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      throw {
        providerId: 'groq',
        type: 'PARSE_ERROR',
        message: 'Empty response content from Groq',
      } as AIProviderError;
    }

    return content;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error?.name === 'AbortError') {
      const timeoutErr: AIProviderError = {
        providerId: 'groq',
        type: 'TIMEOUT',
        message: `Groq request timed out after ${options.timeoutMs || 4000}ms`,
      };
      throw timeoutErr;
    }
    throw error;
  }
}
