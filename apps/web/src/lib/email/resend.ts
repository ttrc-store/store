/**
 * Centralized Transactional Email Dispatcher for TTRC Store
 * Powered by Resend REST API with Free-Tier Quota Management
 * 
 * Rules:
 * 1. Single shared client / dispatcher across all modules.
 * 2. Explicit category priorities (P0, P1, P2, P3).
 * 3. Atomic MongoDB quota tracking & priority threshold protection.
 * 4. Bounded retries for transient errors (429, 5xx), NO retry for permanent 4xx.
 * 5. Safe structured logging: NEVER log OTPs, passwords, hashes, or API keys.
 */

import {
  checkAndReserveQuota,
  recordQuotaOutcome,
  EmailPriorityCategory,
} from './quota-manager';
import {
  renderOtpEmail,
  renderOrderConfirmationEmail,
  renderPaymentConfirmationEmail,
  renderOrderStatusUpdateEmail,
  renderBackInStockEmail,
  renderSecurityAlertEmail,
  renderDesignTestEmail,
  OrderConfirmationPayload,
  PaymentConfirmationPayload,
  OrderStatusPayload,
  BackInStockPayload,
  SecurityAlertPayload,
} from './templates';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || process.env.FROM_EMAIL || 'TTRC Store <admin@ttrc.store>';

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  simulated?: boolean;
  suppressed?: boolean;
  category: EmailPriorityCategory;
}

// Mask email for safe privacy-preserving audit logs (e.g., "u***@example.com")
function maskEmail(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) return '***';
  const name = parts[0];
  const domain = parts[1];
  const maskedName = name.length > 2 ? `${name[0]}***${name[name.length - 1]}` : `${name[0]}***`;
  return `${maskedName}@${domain}`;
}

export interface EmailAttachment {
  filename: string;
  content: string; // base64-encoded string
}

/**
 * Bounded REST Dispatcher to Resend API
 */
async function dispatchWithRetry(
  to: string,
  subject: string,
  html: string,
  text: string,
  category: EmailPriorityCategory,
  headers?: Record<string, string>,
  attachments?: EmailAttachment[]
): Promise<SendEmailResult> {
  // 1. Quota Guard Check
  const quota = await checkAndReserveQuota(category);
  if (!quota.allowed) {
    await recordQuotaOutcome(category, 'suppressed');
    console.warn(
      `[Email Dispatcher] Suppressed email to ${maskEmail(to)} in category ${category}: ${quota.reason}`
    );
    return {
      success: false,
      suppressed: true,
      error: quota.reason,
      category,
    };
  }

  // 2. If API Key is absent or running in simulated dev/test
  const isTestOrSimulated =
    !RESEND_API_KEY ||
    process.env.NODE_ENV === 'test' ||
    process.env.SIMULATE_EMAIL_DISPATCH === 'true';

  if (isTestOrSimulated) {
    await recordQuotaOutcome(category, 'accepted');
    const logSubject = category === 'P0' ? '[Security Verification Code]' : subject;
    console.log(
      `[Email Dispatcher — Simulated] Category: ${category} | To: ${maskEmail(to)} | Subject: "${logSubject}"`
    );
    return {
      success: true,
      simulated: true,
      messageId: `sim_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      category,
    };
  }

  // 3. Live Dispatch with Bounded Retries (max 2 retries on 429/5xx)
  let attempts = 0;
  const maxRetries = 2;

  while (attempts <= maxRetries) {
    attempts++;
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [to],
          subject,
          html,
          text,
          ...(attachments && attachments.length > 0 ? { attachments } : {}),
        }),
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const messageId = data?.id || `msg_${Date.now()}`;
        await recordQuotaOutcome(category, 'accepted');
        console.log(
          `[Email Dispatcher — Delivered] Category: ${category} | To: ${maskEmail(to)} | ID: ${messageId}`
        );
        return {
          success: true,
          messageId,
          category,
        };
      }

      // Check for permanent errors (401, 403, 422) - do NOT retry
      if (res.status === 401 || res.status === 403 || res.status === 422) {
        const errorData = await res.json().catch(() => ({}));
        const errorMessage = errorData?.message || `Resend error HTTP ${res.status}`;
        await recordQuotaOutcome(category, 'failed');
        console.error(
          `[Email Dispatcher — Permanent Error] Category: ${category} | Status: ${res.status} | To: ${maskEmail(to)} | Detail: ${errorMessage}`
        );
        return {
          success: false,
          error: errorMessage,
          category,
        };
      }

      // Transient errors (429 Rate Limit or 5xx Server Error)
      if (res.status === 429 || res.status >= 500) {
        if (attempts <= maxRetries) {
          const backoffMs = attempts * 1000;
          console.warn(
            `[Email Dispatcher — Transient ${res.status}] Attempt ${attempts}/${maxRetries}. Retrying in ${backoffMs}ms...`
          );
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
          continue;
        }
      }

      // Other unhandled response
      const errText = await res.text().catch(() => '');
      await recordQuotaOutcome(category, 'failed');
      return {
        success: false,
        error: `Provider rejected dispatch: ${res.status} ${errText.substring(0, 100)}`,
        category,
      };
    } catch (networkErr: any) {
      if (attempts <= maxRetries) {
        const backoffMs = attempts * 1000;
        console.warn(
          `[Email Dispatcher — Network Error] Attempt ${attempts}/${maxRetries}. Retrying in ${backoffMs}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
        continue;
      }
      await recordQuotaOutcome(category, 'failed');
      console.error(
        `[Email Dispatcher — Network Failure] Category: ${category} | To: ${maskEmail(to)}:`,
        networkErr?.message
      );
      return {
        success: false,
        error: networkErr?.message || 'Network connection failed during email dispatch.',
        category,
      };
    }
  }

  await recordQuotaOutcome(category, 'failed');
  return {
    success: false,
    error: 'Exceeded maximum delivery retry attempts.',
    category,
  };
}

// ─── TYPED OPERATIONS ────────────────────────────────────────────────────────

/**
 * P0: Send Verification OTP for Registration
 */
export async function sendVerificationOtp(params: {
  toEmail: string;
  otp: string;
  expiresSeconds?: number;
}): Promise<SendEmailResult> {
  const rendered = renderOtpEmail({
    purpose: 'registration',
    otp: params.otp,
    expiresSeconds: params.expiresSeconds,
  });
  return dispatchWithRetry(params.toEmail, rendered.subject, rendered.html, rendered.text, 'P0');
}

/**
 * P0: Send Password Reset OTP
 */
export async function sendPasswordResetOtp(params: {
  toEmail: string;
  otp: string;
  expiresSeconds?: number;
}): Promise<SendEmailResult> {
  const rendered = renderOtpEmail({
    purpose: 'password_reset',
    otp: params.otp,
    expiresSeconds: params.expiresSeconds,
  });
  return dispatchWithRetry(params.toEmail, rendered.subject, rendered.html, rendered.text, 'P0');
}

/**
 * P0: Send Email Change Verification OTP
 */
export async function sendEmailChangeOtp(params: {
  toEmail: string;
  otp: string;
  expiresSeconds?: number;
}): Promise<SendEmailResult> {
  const rendered = renderOtpEmail({
    purpose: 'email_change',
    otp: params.otp,
    expiresSeconds: params.expiresSeconds,
  });
  return dispatchWithRetry(params.toEmail, rendered.subject, rendered.html, rendered.text, 'P0');
}

/**
 * P1: Send Order Confirmation Email
 */
export async function sendOrderConfirmation(
  payload: OrderConfirmationPayload,
  attachments?: EmailAttachment[]
): Promise<SendEmailResult> {
  const rendered = renderOrderConfirmationEmail(payload);
  return dispatchWithRetry(
    payload.toEmail,
    rendered.subject,
    rendered.html,
    rendered.text,
    'P1',
    undefined,
    attachments
  );
}

/**
 * P1: Send Payment Confirmation Email
 */
export async function sendPaymentConfirmation(
  payload: PaymentConfirmationPayload,
  attachments?: EmailAttachment[]
): Promise<SendEmailResult> {
  const rendered = renderPaymentConfirmationEmail(payload);
  return dispatchWithRetry(
    payload.toEmail,
    rendered.subject,
    rendered.html,
    rendered.text,
    'P1',
    undefined,
    attachments
  );
}


/**
 * P1: Send Order Status Update / Shipment Dispatched Email
 */
export async function sendOrderStatusUpdate(payload: OrderStatusPayload): Promise<SendEmailResult> {
  const rendered = renderOrderStatusUpdateEmail(payload);
  return dispatchWithRetry(payload.toEmail, rendered.subject, rendered.html, rendered.text, 'P1');
}

/**
 * P2: Send Back-in-Stock Notification Email
 */
export async function sendBackInStockNotification(payload: BackInStockPayload): Promise<SendEmailResult> {
  const rendered = renderBackInStockEmail(payload);
  return dispatchWithRetry(payload.toEmail, rendered.subject, rendered.html, rendered.text, 'P2');
}

/**
 * P1: Send Security Notification Alert
 */
export async function sendSecurityNotification(payload: SecurityAlertPayload): Promise<SendEmailResult> {
  const rendered = renderSecurityAlertEmail(payload);
  return dispatchWithRetry(payload.toEmail, rendered.subject, rendered.html, rendered.text, 'P1');
}

// ─── BACKWARD-COMPATIBILITY EXPORTS FOR EXISTING CODE ────────────────────────

export interface OrderEmailPayload {
  toEmail: string;
  customerName: string;
  orderNumber: string;
  totalAmountRupees: string;
  trackingUrl?: string;
  courierName?: string;
  paymentMethod?: string;
}

export async function sendOrderConfirmationEmail(payload: OrderEmailPayload) {
  // Convert rupees string (e.g., "₹1,499.00") to integer paise
  const numericRupees = parseFloat(payload.totalAmountRupees.replace(/[^0-9.]/g, '')) || 0;
  const totalAmountPaise = Math.round(numericRupees * 100);

  return sendOrderConfirmation({
    toEmail: payload.toEmail,
    customerName: payload.customerName,
    orderNumber: payload.orderNumber,
    totalAmountPaise,
    paymentMethod: payload.paymentMethod || 'razorpay',
    shippingAddress: {},
  });
}

export async function sendShipmentDispatchedEmail(payload: OrderEmailPayload) {
  return sendOrderStatusUpdate({
    toEmail: payload.toEmail,
    customerName: payload.customerName,
    orderNumber: payload.orderNumber,
    status: 'shipped',
    courierName: payload.courierName,
    trackingUrl: payload.trackingUrl,
  });
}

export interface BackInStockEmailPayload {
  toEmail: string;
  productName: string;
  productSlug: string;
  priceRupees: string;
  unsubscribeUrl: string;
}

export async function sendBackInStockEmail(payload: BackInStockEmailPayload) {
  return sendBackInStockNotification({
    toEmail: payload.toEmail,
    productName: payload.productName,
    productSlug: payload.productSlug,
    priceRupees: payload.priceRupees,
    unsubscribeUrl: payload.unsubscribeUrl,
  });
}

/**
 * Standard Sample Design Test Email Dispatcher
 * Sends a single test email verifying responsive layout, fonts, logo, and footer.
 */
export async function sendDesignTestEmail(toEmail: string): Promise<SendEmailResult> {
  const rendered = renderDesignTestEmail();
  return dispatchWithRetry(
    toEmail,
    rendered.subject,
    rendered.html,
    rendered.text,
    'P2'
  );
}

