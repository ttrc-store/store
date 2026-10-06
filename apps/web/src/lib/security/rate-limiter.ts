/**
 * Distributed Security Rate Limiter
 * 
 * Supports a 3-tier architecture:
 * 1. Tier 1: Upstash Redis REST (Sub-millisecond global serverless distributed rate limiting)
 * 2. Tier 2: MongoDB Atlas Distributed Store (Cross-instance consistency across Vercel regions)
 * 3. Tier 3: In-Memory Sliding Window (Zero-dependency fallback for local development & unit tests)
 */

import { connectToDatabase } from '@/lib/mongodb/client';
import { RateLimitModel } from '@/lib/mongodb/models';

export interface RateLimitOptions {
  key: string;
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetMs: number;
}

// In-Memory Fallback Store
interface MemoryRecord {
  count: number;
  resetAt: number;
}
const memoryStore = new Map<string, MemoryRecord>();

// Clean expired memory records periodically
if (typeof window === 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of memoryStore.entries()) {
      if (record.resetAt <= now) {
        memoryStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

/**
 * Synchronous in-memory rate check (useful for unit tests and local mocks)
 */
export function checkRateLimitSync(options: RateLimitOptions): RateLimitResult {
  const { key, limit, windowMs } = options;
  const now = Date.now();
  const record = memoryStore.get(key);

  if (!record || record.resetAt <= now) {
    memoryStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      success: true,
      limit,
      remaining: limit - 1,
      resetMs: windowMs,
    };
  }

  if (record.count >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      resetMs: Math.max(0, record.resetAt - now),
    };
  }

  record.count += 1;
  return {
    success: true,
    limit,
    remaining: limit - record.count,
    resetMs: Math.max(0, record.resetAt - now),
  };
}

/**
 * Tier 1: Upstash Redis REST Rate Limiter
 */
async function checkUpstashRedis(
  url: string,
  token: string,
  options: RateLimitOptions
): Promise<RateLimitResult | null> {
  const { key, limit, windowMs } = options;
  const redisKey = `rl:${key}`;

  try {
    const response = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['INCR', redisKey],
        ['PTTL', redisKey],
      ]),
      cache: 'no-store',
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (!Array.isArray(data) || data.length < 2) return null;

    const count = Number(data[0].result);
    let ttlMs = Number(data[1].result);

    // If key has no expiry, set it
    if (ttlMs < 0) {
      await fetch(`${url}/pexpire/${encodeURIComponent(redisKey)}/${windowMs}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      ttlMs = windowMs;
    }

    const resetMs = Math.max(0, ttlMs);
    const success = count <= limit;
    const remaining = Math.max(0, limit - count);

    return {
      success,
      limit,
      remaining,
      resetMs,
    };
  } catch (err) {
    console.warn('[Distributed RateLimiter] Upstash Redis check failed, falling back:', err);
    return null;
  }
}

/**
 * Tier 2: MongoDB Atlas Distributed Rate Limiter
 */
async function checkMongoRateLimit(options: RateLimitOptions): Promise<RateLimitResult | null> {
  const { key, limit, windowMs } = options;
  try {
    await connectToDatabase();
    const now = new Date();

    const record = await RateLimitModel.findOne({ key });

    if (!record || record.reset_at <= now) {
      const resetAt = new Date(Date.now() + windowMs);
      await RateLimitModel.findOneAndUpdate(
        { key },
        { count: 1, reset_at: resetAt },
        { upsert: true, returnDocument: 'after' }
      );
      return {
        success: true,
        limit,
        remaining: limit - 1,
        resetMs: windowMs,
      };
    }

    if (record.count >= limit) {
      return {
        success: false,
        limit,
        remaining: 0,
        resetMs: Math.max(0, record.reset_at.getTime() - Date.now()),
      };
    }

    record.count += 1;
    await record.save();

    return {
      success: true,
      limit,
      remaining: limit - record.count,
      resetMs: Math.max(0, record.reset_at.getTime() - Date.now()),
    };
  } catch (err) {
    console.warn('[Distributed RateLimiter] MongoDB rate check failed, falling back:', err);
    return null;
  }
}

/**
 * Main Distributed Rate Limiter entrypoint
 */
export async function checkRateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  // If running in Vitest or test runner without live services, use fast in-memory store
  if (process.env.NODE_ENV === 'test' && !process.env.TEST_DISTRIBUTED_RATELIMIT) {
    return checkRateLimitSync(options);
  }

  // Tier 1: Upstash Redis / Vercel KV REST
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (upstashUrl && upstashToken) {
    const redisResult = await checkUpstashRedis(upstashUrl, upstashToken, options);
    if (redisResult) return redisResult;
  }

  // Tier 2: MongoDB Atlas Distributed Store
  const mongoResult = await checkMongoRateLimit(options);
  if (mongoResult) return mongoResult;

  // Tier 3: In-Memory Fallback
  return checkRateLimitSync(options);
}
