# TTRC Store AI Gateway Architecture

## Overview

The TTRC Store AI Gateway provides high-resilience, cost-controlled, and task-specialized intelligence across five independent provider credentials (`Groq`, `OpenRouter #1`, `OpenRouter #2`, `Gemini`, `AIMLAPI`).

Rather than mechanically cascading every request through all providers in a linear chain, the gateway employs a **Task Router + Fallback + Budget Enforcement** pattern.

```
                  TTRC STORE AI GATEWAY
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
   TASK ROUTER          FALLBACK             BUDGET
        │                   │                   │
        ▼                   ▼                   ▼
┌────────────────────────────────────────────────────────┐
│ Groq  │  OpenRouter #1  │  OpenRouter #2  │ Gemini  │ AIMLAPI │
└────────────────────────────────────────────────────────┘
```

---

## 1. Task Routing & Specialized Allocation

| Task | Primary | Fallback 1 | Fallback 2 | Rationale |
| :--- | :--- | :--- | :--- | :--- |
| **Admin slug generation** | **Local code (Deterministic)** | — | — | 0ms latency, ₹0 cost, 100% predictable URL structures. |
| **SEO title/description** | **Groq** | OpenRouter | AIMLAPI | Sub-second generation with tight token constraints. |
| **Product short description** | **Groq** | OpenRouter | AIMLAPI | High throughput, concise marketing copy. |
| **Technical-spec extraction** | **OpenRouter** | Gemini | AIMLAPI | Strong reasoning over datasheets & complex hardware specs. |
| **PDF/datasheet/multimodal** | **Gemini** | OpenRouter multimodal | AIMLAPI multimodal | Native multimodal vision and document parsing. |
| **Customer support (RAG)** | **Groq** | OpenRouter | Gemini | Fast conversational latency (<400ms TTFT) with grounded context. |
| **Complex technical reasoning** | **OpenRouter** | Gemini | AIMLAPI | Deep architectural/engineering synthesis. |
| **Structured JSON generation** | **Groq** | OpenRouter | Gemini | Reliable JSON mode execution with Zod schema validation. |
| **Embeddings / Semantic Search** | **Gemini** | Dedicated provider | — | High-dimensional dense vector embeddings. |

---

## 2. Differentiated Error Handling & Fail-Fast Cascading

Blind retries across all providers are strictly prevented:

- **`429 / Rate Limit`**: Inspects provider `Retry-After` header (or applies default 15s cooldown), marks provider in cooldown, and immediately cascades to the next candidate in the task routing list.
- **`5xx / Server Error & Timeout`**: Applies brief 5s cooldown and cascades to the next candidate.
- **`401 / 403 Auth Error`**: Marks provider unhealthy with a **1-hour cooldown** to prevent authentication storming, then cascades to fallback.
- **`4xx Bad Request (Client Error)`**: **FAIL-FAST IMMEDIATELY**. If the prompt was rejected or malformed, the gateway immediately halts and returns an error without trying other providers, preventing request storms.
- **`Parse Error (Malformed JSON)`**: Strips markdown codeblock ticks (`\`\`\`json ... \`\`\``) and retries or cascades if validation fails.

---

## 3. Dynamic Model Registry & Environment Configuration

Model identifiers are dynamic and configurable via environment variables without requiring application redeployments:

```bash
# Model Registry Configuration
AI_GROQ_MODEL=llama-3.3-70b-versatile
AI_OPENROUTER_MODEL_PRIMARY=meta-llama/llama-3.3-70b-instruct
AI_OPENROUTER_MODEL_FALLBACK=google/gemini-2.0-flash-001
AI_OPENROUTER_MODEL_MULTIMODAL=google/gemini-2.0-flash-001
AI_GEMINI_MODEL=gemini-1.5-flash
AI_GEMINI_EMBEDDING_MODEL=text-embedding-004
AI_AIMLAPI_MODEL=meta-llama/Llama-3.3-70B-Instruct-Turbo
AI_AIMLAPI_MODEL_MULTIMODAL=meta-llama/Llama-3.2-11B-Vision-Instruct

# Quota & Budget Controls
AI_GROQ_DAILY_MAX_REQUESTS=2000
AI_GROQ_DAILY_MAX_TOKENS=500000
AI_OPENROUTER_DAILY_MAX_REQUESTS=1000
AI_OPENROUTER_DAILY_MAX_TOKENS=300000
AI_GEMINI_DAILY_MAX_REQUESTS=1500
AI_GEMINI_DAILY_MAX_TOKENS=1000000
AI_AIMLAPI_DAILY_MAX_REQUESTS=800
AI_AIMLAPI_DAILY_MAX_TOKENS=250000
```

---

## 4. Deterministic Slug Generation

Slugs are **never** generated via LLM calls. The local helper `generateDeterministicSlug(title)` transforms product titles algorithmically:

```typescript
export function generateDeterministicSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
```

---

## 5. Admin AI Enrichment Workflow & HSN Advisory Policy

The AI acts strictly as an **assistive layer**, never writing directly to MongoDB:

```
Admin Form Input
      │
      ▼
AI Suggestion (Groq/OpenRouter)
      │
      ▼
Zod Schema Validation
      │
      ▼
Admin Review UI (Review details, verify HSN)
      │
      ▼
Admin clicks "Save Product"
      │
      ▼
MongoDB Atlas
```

### HSN Tax Policy
- The AI produces a **suggested HSN** along with `confidence` (`high`, `medium`, `low`) and an engineering `reasoning`.
- The UI highlights this as **"AI Suggestion — Verify Before Saving"**.
- The AI is never the final tax authority; the admin must verify the HSN prior to publishing.

---

## 6. Customer Support RAG Grounding & Strict Invariants

The customer support endpoint (`POST /api/ai/customer-support`) performs dynamic RAG retrieval from MongoDB:
- Active Catalog Products & Technical Specifications (voltage, current, dimensions, material, stock status, bulk price tiers)
- Verified Compatibility Records (`ProductCompatibilityModel`)
- Store Policies (Free shipping threshold ₹999, COD limit ₹5,000 with ₹49 fee, GST/Bill of Supply policy, 7-day returns)

### Assistant Permissions Matrix

| Permission | Status | Rule / Enforcement |
| :--- | :--- | :--- |
| **Explain products & specs** | **Allowed** | Uses verified database values only. |
| **Recommend catalog items** | **Allowed** | Provides exact product name & link. |
| **Check compatibility** | **Grounded** | If database does not explicitly confirm compatibility, assistant replies: *"I don't have enough verified information to confirm compatibility for this exact configuration. Please contact TTRC support."* **Never hallucinates compatibility.** |
| **Explain shipping / COD** | **Allowed** | Grounded in store settings. |
| **Change prices / discounts** | **FORBIDDEN** | Read-only assistant; cannot create discount codes or modify cart. |
| **Change stock / orders** | **FORBIDDEN** | Cannot cancel orders, reserve inventory, or issue refunds. |
| **Expose internal costs** | **FORBIDDEN** | Query projection explicitly strips `cost_price`, `landed_cost`, `supplier`, and `internal_notes`. |
| **Expose customer data** | **FORBIDDEN** | No access to other customer identities or addresses. |
