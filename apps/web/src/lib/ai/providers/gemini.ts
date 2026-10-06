import { MODEL_REGISTRY } from '../model-registry';
import { getProviderApiKey, AIProviderError } from '../provider-registry';

export async function callGemini(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options: {
    timeoutMs?: number;
    maxTokens?: number;
    responseFormatJson?: boolean;
  } = {}
): Promise<string> {
  const apiKey = getProviderApiKey('gemini');
  if (!apiKey) {
    const err: AIProviderError = {
      providerId: 'gemini',
      type: 'AUTH_ERROR',
      message: 'GEMINI_API_KEY is not configured',
    };
    throw err;
  }

  const model = MODEL_REGISTRY.gemini.getModel();
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs || 6000);

  // Separate system instruction from user/model turns
  const systemMsg = messages.find((m) => m.role === 'system');
  const chatTurns = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  const requestBody: any = {
    contents: chatTurns.length > 0 ? chatTurns : [{ role: 'user', parts: [{ text: systemMsg?.content || '' }] }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: options.maxTokens || 1500,
    },
  };

  if (systemMsg && chatTurns.length > 0) {
    requestBody.systemInstruction = {
      parts: [{ text: systemMsg.content }],
    };
  }

  if (options.responseFormatJson) {
    requestBody.generationConfig.responseMimeType = 'application/json';
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      let errorType: AIProviderError['type'] = 'SERVER_ERROR';

      if (response.status === 429) {
        errorType = 'RATE_LIMIT';
      } else if (response.status === 401 || (response.status === 400 && errText.includes('API_KEY_INVALID'))) {
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
        providerId: 'gemini',
        type: errorType,
        status: response.status,
        message: `Gemini error (${response.status}): ${errText}`,
        retryAfterMs: retryAfterSec ? retryAfterSec * 1000 : undefined,
      };
      throw err;
    }

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw {
        providerId: 'gemini',
        type: 'PARSE_ERROR',
        message: 'Empty response candidate from Gemini',
      } as AIProviderError;
    }

    return candidateText;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error?.name === 'AbortError') {
      const timeoutErr: AIProviderError = {
        providerId: 'gemini',
        type: 'TIMEOUT',
        message: `Gemini request timed out after ${options.timeoutMs || 6000}ms`,
      };
      throw timeoutErr;
    }
    throw error;
  }
}
