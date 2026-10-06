import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateDeterministicSlug, getRouteForTask, getTaskRouteConfig } from '../provider-router';
import {
  isProviderAvailable,
  recordProviderFailure,
  recordProviderSuccess,
  getProviderHealthSnapshot,
} from '../provider-registry';
import {
  canProviderAcceptTask,
  recordProviderUsage,
  resetUsageStore,
  getProviderUsageStats,
} from '../usage-tracker';
import { executeProviderCascade } from '../provider-cascade';
import { executeAITask } from '../ai-gateway';
import { z } from 'zod';

// Mock the provider modules so tests don't make network calls
vi.mock('../providers/groq', () => ({
  callGroq: vi.fn(),
}));
vi.mock('../providers/openrouter', () => ({
  callOpenRouter: vi.fn(),
}));
vi.mock('../providers/gemini', () => ({
  callGemini: vi.fn(),
}));
vi.mock('../providers/aimlapi', () => ({
  callAimlApi: vi.fn(),
}));

import { callGroq } from '../providers/groq';
import { callOpenRouter } from '../providers/openrouter';
import { callGemini } from '../providers/gemini';
import { callAimlApi } from '../providers/aimlapi';

describe('TTRC Store AI Gateway & Task Router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetUsageStore();
    // Reset health
    recordProviderSuccess('groq');
    recordProviderSuccess('openrouter');
    recordProviderSuccess('openrouter_2');
    recordProviderSuccess('gemini');
    recordProviderSuccess('aimlapi');
  });

  describe('1. Deterministic Slug Generation (Local code, 0ms, No LLM)', () => {
    it('generates predictable kebab-case slug without calling any LLM', () => {
      const input = 'CNKALUN KL-F2 2-Way Brass Solenoid Valve';
      const slug = generateDeterministicSlug(input);
      expect(slug).toBe('cnkalun-kl-f2-2-way-brass-solenoid-valve');
    });

    it('handles special characters, punctuation, and leading/trailing dashes', () => {
      const input = '  Robo Race 4WD Chassis Kit (v2.0) — High Speed!  ';
      const slug = generateDeterministicSlug(input);
      expect(slug).toBe('robo-race-4wd-chassis-kit-v2-0-high-speed');
    });
  });

  describe('2. Task Router Specialized Allocation Table', () => {
    it('routes SEO enrichment to Groq -> OpenRouter -> AIMLAPI', () => {
      const config = getTaskRouteConfig('seo_enrichment');
      expect(config.preferenceList).toEqual(['groq', 'openrouter', 'aimlapi']);
    });

    it('routes Technical-spec extraction to OpenRouter -> Gemini -> AIMLAPI', () => {
      const config = getTaskRouteConfig('spec_extraction');
      expect(config.preferenceList).toEqual(['openrouter', 'gemini', 'aimlapi']);
    });

    it('routes PDF/datasheet/multimodal to Gemini -> OpenRouter -> AIMLAPI', () => {
      const config = getTaskRouteConfig('pdf_datasheet_image');
      expect(config.preferenceList).toEqual(['gemini', 'openrouter', 'aimlapi']);
    });

    it('routes Customer support to Groq -> OpenRouter -> Gemini', () => {
      const config = getTaskRouteConfig('customer_support');
      expect(config.preferenceList).toEqual(['groq', 'openrouter', 'gemini']);
    });

    it('routes Complex technical reasoning to OpenRouter -> Gemini -> AIMLAPI', () => {
      const config = getTaskRouteConfig('complex_reasoning');
      expect(config.preferenceList).toEqual(['openrouter', 'gemini', 'aimlapi']);
    });

    it('routes Structured JSON generation to Groq -> OpenRouter -> Gemini', () => {
      const config = getTaskRouteConfig('structured_json');
      expect(config.preferenceList).toEqual(['groq', 'openrouter', 'gemini']);
    });

    it('routes Embeddings to Gemini', () => {
      const config = getTaskRouteConfig('embeddings');
      expect(config.preferenceList).toEqual(['gemini']);
    });
  });

  describe('3. Differentiated Error Handling & Cascade', () => {
    it('cascades to fallback on 429 rate limit', async () => {
      // Groq fails with 429 Rate limit
      vi.mocked(callGroq).mockRejectedValueOnce({
        providerId: 'groq',
        type: 'RATE_LIMIT',
        status: 429,
        message: 'Rate limit exceeded: 30 RPM',
        retryAfterMs: 5000,
      });

      // OpenRouter succeeds as fallback
      vi.mocked(callOpenRouter).mockResolvedValueOnce('Valid OpenRouter response');

      const result = await executeProviderCascade({
        task: 'customer_support',
        candidateProviders: ['groq', 'openrouter'],
        messages: [{ role: 'user', content: 'What is the voltage?' }],
        timeoutMs: 4000,
        maxTokens: 500,
      });

      expect(result.providerUsed).toBe('openrouter');
      expect(result.rawText).toBe('Valid OpenRouter response');
      expect(result.attempts).toHaveLength(1);
      expect(result.attempts[0].providerId).toBe('groq');
      expect(result.attempts[0].errorType).toBe('RATE_LIMIT');
    });

    it('FAILS FAST on 4xx Bad Request without triggering request storm to other providers', async () => {
      // Groq rejects payload with 400 Bad Request
      vi.mocked(callGroq).mockRejectedValueOnce({
        providerId: 'groq',
        type: 'BAD_REQUEST',
        status: 400,
        message: 'Invalid payload: messages array empty',
      });

      // Verify cascade halts immediately and does not call OpenRouter or Gemini
      await expect(
        executeProviderCascade({
          task: 'customer_support',
          candidateProviders: ['groq', 'openrouter', 'gemini'],
          messages: [{ role: 'user', content: '' }],
          timeoutMs: 4000,
          maxTokens: 500,
        })
      ).rejects.toThrow(/Request rejected as invalid by groq \(4xx client error\)/);

      expect(callOpenRouter).not.toHaveBeenCalled();
      expect(callGemini).not.toHaveBeenCalled();
    });

    it('marks provider unhealthy on 401/403 Auth Error and cascades', async () => {
      vi.mocked(callGroq).mockRejectedValueOnce({
        providerId: 'groq',
        type: 'AUTH_ERROR',
        status: 401,
        message: 'Invalid API key provided',
      });

      vi.mocked(callOpenRouter).mockResolvedValueOnce('OpenRouter fallback answer');

      const result = await executeProviderCascade({
        task: 'seo_enrichment',
        candidateProviders: ['groq', 'openrouter'],
        messages: [{ role: 'user', content: 'Generate SEO' }],
        timeoutMs: 4000,
        maxTokens: 500,
      });

      expect(result.providerUsed).toBe('openrouter');
      // Groq is marked in cooldown
      const snapshot = getProviderHealthSnapshot();
      expect(snapshot.groq.isHealthy).toBe(false);
      expect(snapshot.groq.cooldownUntil).toBeGreaterThan(Date.now());
    });
  });

  describe('4. Usage Tracking & Budget Controls', () => {
    it('tracks token consumption and requests accurately', () => {
      recordProviderUsage('groq', 120, true);
      recordProviderUsage('groq', 250, true);

      const stats = getProviderUsageStats();
      expect(stats.groq.dailyRequests).toBe(2);
      expect(stats.groq.dailyTokens).toBe(370);
      expect(stats.groq.isWithinBudget).toBe(true);
    });

    it('enforces budget quota when maximum requests reached', () => {
      // Simulate exhausting requests
      for (let i = 0; i < 2000; i++) {
        recordProviderUsage('groq', 10, true);
      }

      const budgetCheck = canProviderAcceptTask('groq');
      expect(budgetCheck.allowed).toBe(false);
      expect(budgetCheck.reason).toContain('Daily request quota reached');
    });
  });

  describe('5. Schema Validation & Markdown Cleanup', () => {
    it('strips markdown codeblock ticks and validates with Zod schema', async () => {
      const mockMarkdownJson = `\`\`\`json
{
  "seoTitle": "CNKALUN Brass Valve | TTRC Store",
  "seoDescription": "Industrial 2-way brass solenoid valve.",
  "shortDescription": "Precision liquid flow control valve for robotics.",
  "longDescription": "Built with forged brass for commercial automation and espresso machines.",
  "specs": [{"key": "Voltage", "value": "220V AC"}],
  "suggestedHsn": {
    "code": "84818090",
    "confidence": "high",
    "reasoning": "Indian GST valve classification under heading 8481"
  },
  "applications": ["Fluid automation"]
}
\`\`\``;

      vi.mocked(callGroq).mockResolvedValueOnce(mockMarkdownJson);

      const TestSchema = z.object({
        seoTitle: z.string(),
        suggestedHsn: z.object({
          code: z.string(),
          confidence: z.enum(['high', 'medium', 'low']),
          reasoning: z.string(),
        }),
      });

      // Run executeProviderCascade directly or executeAITask with candidate providers
      const result = await executeProviderCascade({
        task: 'structured_json',
        candidateProviders: ['groq'],
        messages: [{ role: 'user', content: 'Generate specs' }],
        timeoutMs: 5000,
        maxTokens: 1000,
        responseFormatJson: true,
      });

      const cleaned = result.rawText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsed = JSON.parse(cleaned);
      const validated = TestSchema.parse(parsed);

      expect(validated.seoTitle).toBe('CNKALUN Brass Valve | TTRC Store');
      expect(validated.suggestedHsn.code).toBe('84818090');
      expect(validated.suggestedHsn.confidence).toBe('high');
    });
  });
});
