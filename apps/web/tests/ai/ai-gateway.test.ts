import { describe, it, expect, beforeEach } from 'vitest';
import { getRouteForTask } from '@/lib/ai/provider-router';
import { ProductEnrichmentSchema } from '@/lib/ai/schemas/product-enrichment';
import { SupportResponseSchema } from '@/lib/ai/schemas/support-response';
import { MODEL_REGISTRY } from '@/lib/ai/model-registry';
import { isProviderAvailable, recordProviderFailure, recordProviderSuccess } from '@/lib/ai/provider-registry';

describe('TTRC Store AI Gateway & Router Test Suite', () => {
  beforeEach(() => {
    // Populate test environment provider keys
    process.env.GROQ_API_KEY = 'mock_groq_key';
    process.env.OPENROUTER_API_KEY = 'mock_openrouter_key';
    process.env.OPENROUTER_API_KEY_1 = 'mock_openrouter_key';
    process.env.OPENROUTER_API_KEY_2 = 'mock_openrouter_2_key';
    process.env.GEMINI_API_KEY = 'mock_gemini_key';
    process.env.AIMLAPI_API_KEY = 'mock_aimlapi_key';

    // Reset provider health states
    recordProviderSuccess('groq');
    recordProviderSuccess('openrouter');
    recordProviderSuccess('openrouter_2');
    recordProviderSuccess('gemini');
    recordProviderSuccess('aimlapi');
  });

  describe('Deterministic URL Slug Generation', () => {
    const slugify = (text: string) =>
      text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    it('generates exact normalized slug for CNKALUN Solenoid Valve', () => {
      const title = 'CNKALUN KL-F2 2-Way Brass Solenoid Valve';
      expect(slugify(title)).toBe('cnkalun-kl-f2-2-way-brass-solenoid-valve');
    });

    it('handles special characters, brackets, and multiple consecutive spaces', () => {
      const title = '  N20 12V 600RPM Micro Metal Gear Motor (High Torque!)  ';
      expect(slugify(title)).toBe('n20-12v-600rpm-micro-metal-gear-motor-high-torque');
    });

    it('preserves alphanumeric identifiers and numbers accurately', () => {
      const title = 'Robo Race 4WD Competition Chassis Kit v2.5';
      expect(slugify(title)).toBe('robo-race-4wd-competition-chassis-kit-v2-5');
    });
  });

  describe('Task Routing Matrix', () => {
    it('routes seo_enrichment with Groq prioritized first', () => {
      const route = getRouteForTask('seo_enrichment');
      expect(route.candidateProviders[0]).toBe('groq');
      expect(route.candidateProviders).toContain('openrouter');
    });

    it('routes spec_extraction with OpenRouter prioritized first', () => {
      const route = getRouteForTask('spec_extraction');
      expect(route.candidateProviders[0]).toBe('openrouter');
      expect(route.candidateProviders).toContain('gemini');
    });

    it('routes customer_support with Groq and OpenRouter candidates', () => {
      const route = getRouteForTask('customer_support');
      expect(route.candidateProviders[0]).toBe('groq');
      expect(route.candidateProviders).toContain('openrouter');
    });
  });

  describe('Provider Health & Cooldown Tracking', () => {
    it('cools down provider on RATE_LIMIT error', () => {
      recordProviderFailure({
        providerId: 'groq',
        type: 'RATE_LIMIT',
        status: 429,
        message: 'Too many requests',
        retryAfterMs: 30000,
      });

      expect(isProviderAvailable('groq')).toBe(false);

      // Other providers remain available
      expect(isProviderAvailable('openrouter')).toBe(true);
    });

    it('restores provider health upon recordProviderSuccess', () => {
      recordProviderFailure({
        providerId: 'gemini',
        type: 'SERVER_ERROR',
        status: 503,
        message: 'Service unavailable',
      });

      expect(isProviderAvailable('gemini')).toBe(false);

      recordProviderSuccess('gemini');
      expect(isProviderAvailable('gemini')).toBe(true);
    });
  });

  describe('AI Schema Validation', () => {
    it('validates conforming ProductEnrichment JSON payload', () => {
      const sample = {
        seoTitle: 'CNKALUN KL-F2 2-Way Brass Solenoid Valve | TTRC Store',
        seoDescription: 'High precision 2-way normally closed brass solenoid valve for fluid automation. India-wide delivery with GST tax invoice.',
        shortDescription: 'Industrial grade 2-way brass solenoid valve designed for reliable fluid and pneumatic automation.',
        longDescription: 'Engineered with forged brass body and corrosion resistant core for commercial espresso machines and liquid routing.',
        specs: [
          { key: 'Operating Voltage', value: '12V DC / 24V DC' },
          { key: 'Body Material', value: 'Forged Brass' },
        ],
        suggestedHsn: {
          code: '84818090',
          confidence: 'high',
          reasoning: 'Classified under valves for fluid routing and pneumatic transmission.',
        },
        applications: ['Fluid automation', 'Espresso machines', 'Water dispensing'],
      };

      const parsed = ProductEnrichmentSchema.safeParse(sample);
      expect(parsed.success).toBe(true);
    });

    it('rejects invalid HSN or missing mandatory fields', () => {
      const invalid = {
        seoTitle: 'Short',
        suggestedHsn: {
          code: 'invalid-alpha',
          confidence: 'high',
          reasoning: 'Invalid code',
        },
      };

      const parsed = ProductEnrichmentSchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
    });

    it('validates conforming SupportResponse schema', () => {
      const support = {
        reply: 'The Robo Race kit uses 12V DC motors with XT60 connectors for battery power.',
        confidence: 'high',
        recommendedProducts: [
          { name: 'Robo Race 4WD Kit', slug: 'robo-race-4wd-kit', reason: 'Direct kit match' },
        ],
        requiresHumanHandoff: false,
      };

      const parsed = SupportResponseSchema.safeParse(support);
      expect(parsed.success).toBe(true);
    });
  });

  describe('Model Registry Configuration', () => {
    it('exposes configurable models with robust defaults', () => {
      expect(MODEL_REGISTRY.groq.getModel()).toBeDefined();
      expect(MODEL_REGISTRY.openrouter.getModel()).toBeDefined();
      expect(MODEL_REGISTRY.gemini.getModel()).toBeDefined();
      expect(MODEL_REGISTRY.aimlapi.getModel()).toBeDefined();
    });
  });
});
