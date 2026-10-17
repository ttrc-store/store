import { connectToDatabase } from '@/lib/mongodb/client';
import { EmailQuotaLedgerModel } from '@/lib/mongodb/models';

export type EmailPriorityCategory = 'P0' | 'P1' | 'P2' | 'P3';

export interface QuotaCheckResult {
  allowed: boolean;
  category: EmailPriorityCategory;
  reason?: string;
  suppressed?: boolean;
  warning?: string;
  dailyCount: number;
  dailyCap: number;
  monthlyCount: number;
  monthlyCap: number;
}

export interface QuotaSummary {
  dateKey: string;
  monthKey: string;
  dailyCount: number;
  dailyCap: number;
  dailyRemaining: number;
  monthlyCount: number;
  monthlyCap: number;
  monthlyRemaining: number;
  thresholdState: 'NORMAL' | 'WARNING_P3_SUPPRESSED' | 'ELEVATED_P2_PAUSED' | 'STRICT_RESERVE' | 'EXHAUSTED';
  byCategory: Record<EmailPriorityCategory, { attempts: number; accepted: number; failed: number; suppressed: number }>;
  providerUsage?: {
    status: 'AVAILABLE' | 'BLOCKED' | 'NOT_CONFIGURED';
    message?: string;
    details?: any;
    lastChecked?: string;
  };
}

// Configurable Internal Safety Limits (Buffers protect against account quota exhaustion)
// Resend published Free Plan: 100/day, 3,000/month.
function getDailyCap(): number {
  const envVal = process.env.EMAIL_DAILY_INTERNAL_CAP;
  return envVal ? parseInt(envVal, 10) : 90; // 10 email safety buffer
}

function getMonthlyCap(): number {
  const envVal = process.env.EMAIL_MONTHLY_INTERNAL_CAP;
  return envVal ? parseInt(envVal, 10) : 2700; // 300 email safety buffer
}

function getWarningThreshold(): number {
  const envVal = process.env.EMAIL_QUOTA_WARNING_THRESHOLD;
  return envVal ? parseFloat(envVal) : 0.7; // 70%
}

function getDateKeys(): { dateKey: string; monthKey: string } {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return {
    dateKey: `${year}-${month}-${day}`,
    monthKey: `${year}-${month}`,
  };
}

// In-Memory cache for Resend Usage API status
let cachedUsageResult: { data: any; expiresAt: number } | null = null;

/**
 * Checks and atomically checks quota thresholds before attempting to dispatch an email.
 * Applies priority gating:
 * - >= 70%: P3 (promotional / newsletters) is suppressed.
 * - >= 85%: P2 (back-in-stock alerts) is paused.
 * - >= 95%: Strict Reserve (only P0 OTP & P1 critical commerce allowed).
 * - >= 100%: Quota fully exhausted; all sending halted safely.
 */
export async function checkAndReserveQuota(
  category: EmailPriorityCategory
): Promise<QuotaCheckResult> {
  const dailyCap = getDailyCap();
  const monthlyCap = getMonthlyCap();
  const warningThreshold = getWarningThreshold();
  const { dateKey, monthKey } = getDateKeys();

  try {
    await connectToDatabase();

    // Sum all category accepted counts for today
    const dailyRecords = await EmailQuotaLedgerModel.find({ date_key: dateKey }).lean();
    const dailyCount = dailyRecords.reduce((sum, r) => sum + (r.accepted_count || 0), 0);

    // Sum all category accepted counts for this month
    const monthlyRecords = await EmailQuotaLedgerModel.find({ month_key: monthKey }).lean();
    const monthlyCount = monthlyRecords.reduce((sum, r) => sum + (r.accepted_count || 0), 0);

    const dailyRatio = dailyCount / dailyCap;
    const monthlyRatio = monthlyCount / monthlyCap;
    const maxRatio = Math.max(dailyRatio, monthlyRatio);

    // 1. Quota Exhaustion (>= 100% of internal cap)
    if (dailyCount >= dailyCap || monthlyCount >= monthlyCap) {
      console.warn(
        `[Email Quota Guard] 🛑 Internal email cap exhausted (Daily: ${dailyCount}/${dailyCap}, Monthly: ${monthlyCount}/${monthlyCap}). Blocking ${category} dispatch.`
      );
      return {
        allowed: false,
        category,
        reason: 'Daily or monthly email transmission capacity reached. Please retry later.',
        dailyCount,
        dailyCap,
        monthlyCount,
        monthlyCap,
      };
    }

    // 2. Strict Reserve (>= 95% cap): Only P0 and P1 eligible
    if (maxRatio >= 0.95 && category !== 'P0' && category !== 'P1') {
      console.warn(
        `[Email Quota Guard] ⚠️ Strict Reserve Active (${(maxRatio * 100).toFixed(0)}%). Deferring non-essential category: ${category}`
      );
      return {
        allowed: false,
        category,
        suppressed: true,
        reason: 'Email service is operating in strict reserve mode for essential security and payment verifications.',
        dailyCount,
        dailyCap,
        monthlyCount,
        monthlyCap,
      };
    }

    // 3. Elevated Load (>= 85% cap): Pause P2 (back-in-stock)
    if (maxRatio >= 0.85 && (category === 'P2' || category === 'P3')) {
      console.warn(
        `[Email Quota Guard] ⚠️ Elevated Quota Consumption (${(maxRatio * 100).toFixed(0)}%). Pausing ${category} emails.`
      );
      return {
        allowed: false,
        category,
        suppressed: true,
        reason: 'Non-critical notification deferred to preserve capacity for customer orders and verification.',
        dailyCount,
        dailyCap,
        monthlyCount,
        monthlyCap,
      };
    }

    // 4. Warning Threshold (>= 70% cap): Suppress P3 (promotional / marketing)
    if (maxRatio >= warningThreshold && category === 'P3') {
      console.warn(
        `[Email Quota Guard] ⚠️ Quota Warning Threshold Reached (${(maxRatio * 100).toFixed(0)}%). Suppressing P3 marketing email.`
      );
      return {
        allowed: false,
        category,
        suppressed: true,
        reason: 'Marketing email suppressed under transactional quota conservation policy.',
        dailyCount,
        dailyCap,
        monthlyCount,
        monthlyCap,
      };
    }

    return {
      allowed: true,
      category,
      dailyCount,
      dailyCap,
      monthlyCount,
      monthlyCap,
      warning:
        maxRatio >= warningThreshold
          ? `Operating at ${(maxRatio * 100).toFixed(0)}% of internal email allowance.`
          : undefined,
    };
  } catch (err) {
    console.warn('[Email Quota Guard] Failed to evaluate ledger, allowing P0/P1 by default:', err);
    // Fail-safe: allow critical P0/P1 during database check failure; reject non-essential P2/P3
    return {
      allowed: category === 'P0' || category === 'P1',
      category,
      dailyCount: 0,
      dailyCap,
      monthlyCount: 0,
      monthlyCap,
      reason: category === 'P0' || category === 'P1' ? undefined : 'Ledger unavailable; non-essential email deferred.',
    };
  }
}

/**
 * Records outcome of an attempted or completed email dispatch in the atomic ledger.
 */
export async function recordQuotaOutcome(
  category: EmailPriorityCategory,
  outcome: 'accepted' | 'failed' | 'suppressed'
): Promise<void> {
  const { dateKey, monthKey } = getDateKeys();
  const incField =
    outcome === 'accepted'
      ? { accepted_count: 1, attempt_count: 1 }
      : outcome === 'failed'
        ? { failed_count: 1, attempt_count: 1 }
        : { suppressed_count: 1 };

  try {
    await connectToDatabase();
    await EmailQuotaLedgerModel.findOneAndUpdate(
      { date_key: dateKey, category },
      {
        $setOnInsert: { month_key: monthKey, category },
        $inc: incField,
      },
      { upsert: true }
    );
  } catch (err) {
    console.error('[Email Quota Guard] Error recording quota outcome:', err);
  }
}

/**
 * Retrieves the current quota summary for operator and admin visibility.
 */
export async function getQuotaSummary(): Promise<QuotaSummary> {
  const { dateKey, monthKey } = getDateKeys();
  const dailyCap = getDailyCap();
  const monthlyCap = getMonthlyCap();

  const byCategory: Record<
    EmailPriorityCategory,
    { attempts: number; accepted: number; failed: number; suppressed: number }
  > = {
    P0: { attempts: 0, accepted: 0, failed: 0, suppressed: 0 },
    P1: { attempts: 0, accepted: 0, failed: 0, suppressed: 0 },
    P2: { attempts: 0, accepted: 0, failed: 0, suppressed: 0 },
    P3: { attempts: 0, accepted: 0, failed: 0, suppressed: 0 },
  };

  try {
    await connectToDatabase();
    const records = await EmailQuotaLedgerModel.find({ date_key: dateKey }).lean();
    let dailyCount = 0;

    for (const r of records) {
      if (r.category && byCategory[r.category as EmailPriorityCategory]) {
        byCategory[r.category as EmailPriorityCategory] = {
          attempts: r.attempt_count || 0,
          accepted: r.accepted_count || 0,
          failed: r.failed_count || 0,
          suppressed: r.suppressed_count || 0,
        };
        dailyCount += r.accepted_count || 0;
      }
    }

    const monthlyRecords = await EmailQuotaLedgerModel.find({ month_key: monthKey }).lean();
    const monthlyCount = monthlyRecords.reduce((sum, r) => sum + (r.accepted_count || 0), 0);

    const ratio = Math.max(dailyCount / dailyCap, monthlyCount / monthlyCap);
    let thresholdState: QuotaSummary['thresholdState'] = 'NORMAL';

    if (dailyCount >= dailyCap || monthlyCount >= monthlyCap) {
      thresholdState = 'EXHAUSTED';
    } else if (ratio >= 0.95) {
      thresholdState = 'STRICT_RESERVE';
    } else if (ratio >= 0.85) {
      thresholdState = 'ELEVATED_P2_PAUSED';
    } else if (ratio >= getWarningThreshold()) {
      thresholdState = 'WARNING_P3_SUPPRESSED';
    }

    const providerUsage = await fetchResendUsageApi();

    return {
      dateKey,
      monthKey,
      dailyCount,
      dailyCap,
      dailyRemaining: Math.max(0, dailyCap - dailyCount),
      monthlyCount,
      monthlyCap,
      monthlyRemaining: Math.max(0, monthlyCap - monthlyCount),
      thresholdState,
      byCategory,
      providerUsage,
    };
  } catch (err: any) {
    return {
      dateKey,
      monthKey,
      dailyCount: 0,
      dailyCap,
      dailyRemaining: dailyCap,
      monthlyCount: 0,
      monthlyCap,
      monthlyRemaining: monthlyCap,
      thresholdState: 'NORMAL',
      byCategory,
      providerUsage: {
        status: 'BLOCKED',
        message: err?.message || 'Database ledger unavailable.',
      },
    };
  }
}

/**
 * Queries the official Resend Usage API (GET https://api.resend.com/usage)
 * Caches results for 5 minutes.
 * Handles permission-restricted keys gracefully without breaking application flows.
 */
export async function fetchResendUsageApi(): Promise<QuotaSummary['providerUsage']> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return {
      status: 'NOT_CONFIGURED',
      message: 'RESEND_API_KEY is not configured.',
      lastChecked: new Date().toISOString(),
    };
  }

  const now = Date.now();
  if (cachedUsageResult && cachedUsageResult.expiresAt > now) {
    return cachedUsageResult.data;
  }

  try {
    const res = await fetch('https://api.resend.com/usage', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (res.status === 401 || res.status === 403) {
      const errJson = await res.json().catch(() => ({}));
      const isRestrictedKey =
        errJson?.name === 'restricted_api_key' ||
        errJson?.message?.includes('restricted to only send');

      const data: QuotaSummary['providerUsage'] = {
        status: 'BLOCKED',
        message: isRestrictedKey
          ? 'Resend Usage API requires a Full-Access Team Key. Current key is Sending-Only.'
          : 'Unauthorized to read Resend Usage API. Check API key permissions in Resend dashboard.',
        details: errJson,
        lastChecked: new Date().toISOString(),
      };

      cachedUsageResult = { data, expiresAt: now + 5 * 60 * 1000 };
      return data;
    }

    if (!res.ok) {
      const data: QuotaSummary['providerUsage'] = {
        status: 'BLOCKED',
        message: `Resend Usage API returned status HTTP ${res.status}.`,
        lastChecked: new Date().toISOString(),
      };
      cachedUsageResult = { data, expiresAt: now + 2 * 60 * 1000 };
      return data;
    }

    const usageJson = await res.json();
    const data: QuotaSummary['providerUsage'] = {
      status: 'AVAILABLE',
      message: 'Official Resend Usage API synchronized successfully.',
      details: usageJson,
      lastChecked: new Date().toISOString(),
    };

    cachedUsageResult = { data, expiresAt: now + 5 * 60 * 1000 };
    return data;
  } catch (err: any) {
    return {
      status: 'BLOCKED',
      message: `Failed to query Resend Usage API: ${err?.message || 'Network error'}`,
      lastChecked: new Date().toISOString(),
    };
  }
}
