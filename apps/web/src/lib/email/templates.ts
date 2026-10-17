/**
 * TTRC Store Branded Transactional Email Templates
 * Theme: Unified Ecommerce Theme
 * - Primary violet: #844AFB
 * - Deep purple: #6721F2
 * - Navy-purple: #1E0D45
 * - Black / Dark ink: #050507
 * - Off-white canvas: #FDFDFD
 * - Lavender: #EEE8FA
 * - Soft lavender: #AF87F8
 * - Neutral gray: #6D6A6A
 *
 * Typography:
 * - Headings: Space Grotesk, safe sans-serif fallback
 * - Body: Plus Jakarta Sans, safe sans-serif fallback
 *
 * Mandatory Signature:
 * Thanks & Regards,
 * Team TTRC
 * Think it. Build it. Make it. Move it.
 * https://www.ttrc.store/
 */

const LOGO_URL = 'https://www.ttrc.store/brand/ttrc-logo.png';
const COMPANY_NAME = 'Tamizh Tech Robotics Company (TTRC Store)';
const SUPPORT_EMAIL = 'support@ttrc.store';
const STORE_URL = 'https://www.ttrc.store';

export interface EmailRenderResult {
  subject: string;
  html: string;
  text: string;
}

/**
 * Shared Ecommerce Email Base Layout
 */
function baseLayout(title: string, innerHtml: string, isSecuritySensitive = false): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap');
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #FDFDFD; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #050507; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FDFDFD; padding: 36px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #FFFFFF; border: 1px solid #EEE8FA; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(30, 13, 69, 0.06);">
          
          <!-- Top Brand Header Bar -->
          <tr>
            <td style="background-color: #FFFFFF; padding: 22px 28px; border-top: 4px solid #844AFB; border-bottom: 1px solid #EEE8FA;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="left" valign="middle">
                    <a href="${STORE_URL}/" target="_blank" style="text-decoration: none; display: inline-block;">
                      <span style="font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 18px; font-weight: 800; letter-spacing: 1.5px; color: #1E0D45;">
                        TTRC <span style="color: #844AFB;">STORE</span>
                      </span>
                    </a>
                  </td>
                  <td align="right" valign="middle">
                    <span style="font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; font-weight: 700; color: #6721F2; background-color: #EEE8FA; padding: 5px 12px; border-radius: 12px; letter-spacing: 0.3px; display: inline-block;">
                      Robotics &amp; STEM
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Body Content -->
          <tr>
            <td style="padding: 32px 28px 24px 28px;">
              ${innerHtml}
            </td>
          </tr>

          <!-- Mandatory Footer with TTRC Logo & Signature -->
          <tr>
            <td style="background-color: #FDFDFD; padding: 24px 28px 28px 28px; border-top: 1px solid #EEE8FA;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="left" valign="top">
                    <!-- Official TTRC Logo Asset -->
                    <div style="margin-bottom: 16px;">
                      <a href="${STORE_URL}/" target="_blank" style="text-decoration: none; display: inline-block;">
                        <img src="${LOGO_URL}" alt="TTRC Store" width="160" style="display: block; width: 160px; max-width: 100%; height: auto; border: 0;" />
                      </a>
                    </div>

                    <!-- Mandatory Team Signature -->
                    <div style="font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; color: #1E0D45; font-weight: 700; line-height: 1.4;">
                      Thanks &amp; Regards,
                    </div>
                    <div style="font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; color: #844AFB; font-weight: 800; line-height: 1.4;">
                      Team TTRC
                    </div>
                    <div style="font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; color: #6D6A6A; font-weight: 600; letter-spacing: 0.4px; margin: 4px 0 10px 0;">
                      Think it. Build it. Make it. Move it.
                    </div>
                    
                    <!-- Store Link, Location & Phone -->
                    <div style="font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; color: #6D6A6A; line-height: 1.6; margin-top: 6px;">
                      <div><a href="${STORE_URL}/" target="_blank" style="color: #844AFB; text-decoration: none; font-weight: 600;">https://www.ttrc.store/</a></div>
                      <div style="color: #6D6A6A; margin-top: 4px;">Coimbatore, Tamil Nadu &bull; Pan-India Express Robotics Delivery</div>
                      <div style="margin-top: 8px;">
                        <a href="tel:+917904902978" style="color: #1E0D45; text-decoration: none; font-weight: 700; font-family: 'Space Grotesk', sans-serif;">+91 7904902978</a>
                      </div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

const MANDATORY_TEXT_FOOTER = `Thanks & Regards,
Team TTRC
Think it. Build it. Make it. Move it.
https://www.ttrc.store/
Coimbatore, Tamil Nadu • Pan-India Express Robotics Delivery

+91 7904902978`;

/**
 * 1. OTP Verification Email (Registration, Password Reset, Email Change)
 */
export function renderOtpEmail(params: {
  purpose: 'registration' | 'password_reset' | 'email_change';
  otp: string;
  expiresSeconds?: number;
}): EmailRenderResult {
  const { purpose, otp, expiresSeconds = 120 } = params;

  let heading = 'Verify Your Email Address';
  let intro = 'Thank you for choosing TTRC Store. Use the 6-digit one-time password below to complete your email verification:';
  let subject = 'TTRC Store — Your Verification Code';

  if (purpose === 'password_reset') {
    heading = 'Reset Your Account Password';
    intro = 'We received a request to reset your TTRC Store account password. Use the 6-digit one-time password below to proceed:';
    subject = 'TTRC Store — Password Reset Code';
  } else if (purpose === 'email_change') {
    heading = 'Confirm New Email Address';
    intro = 'We received a request to update your account email on TTRC Store. Use the 6-digit verification code below:';
    subject = 'TTRC Store — Email Change Verification';
  }

  const htmlContent = `
    <h1 style="font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 22px; font-weight: 800; color: #1E0D45; margin: 0 0 12px 0; line-height: 1.3;">
      ${heading}
    </h1>
    <p style="font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; color: #6D6A6A; line-height: 1.6; margin: 0 0 24px 0;">
      ${intro}
    </p>

    <!-- OTP Code Box with Violet Palette -->
    <div style="background-color: #EEE8FA; border: 2px dashed #844AFB; border-radius: 12px; padding: 22px 16px; text-align: center; margin: 0 0 24px 0;">
      <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #6721F2; margin-bottom: 8px;">
        One-Time Verification Code
      </div>
      <div style="font-family: 'Space Grotesk', 'SF Mono', Consolas, Menlo, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #844AFB; margin: 0;">
        ${otp}
      </div>
    </div>

    <!-- Expiry Notice -->
    <div style="background-color: #FDFDFD; border: 1px solid #EEE8FA; border-radius: 8px; padding: 12px 16px; margin: 0 0 20px 0;">
      <p style="margin: 0; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; color: #1E0D45; font-weight: 600;">
        ⏱️ Strict Expiry: <span style="color: #6721F2;">This code expires in 2 minutes (${expiresSeconds} seconds)</span>.
      </p>
    </div>

    <!-- Security Advisory -->
    <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; color: #6D6A6A; line-height: 1.6; margin: 0;">
      <strong>Security Notice:</strong> Never share this code with anyone. TTRC Store staff will never ask for your code. If you did not make this request, you can safely ignore this email.
    </p>
  `;

  const text = `${heading}

${intro}

VERIFICATION CODE: ${otp}

Strict Expiry: This code expires in 2 minutes (${expiresSeconds} seconds).
Security Notice: Never share this code. If you did not make this request, please ignore this email.

—
${MANDATORY_TEXT_FOOTER}`;

  return {
    subject,
    html: baseLayout(heading, htmlContent, true),
    text,
  };
}

/**
 * 2. Order Confirmation Email
 */
export interface OrderEmailItem {
  name: string;
  quantity: number;
  pricePaise: number;
}

export interface OrderConfirmationPayload {
  toEmail: string;
  customerName: string;
  orderNumber: string;
  billNumber?: string;
  totalAmountPaise: number;
  paymentMethod: string;
  shippingAddress: {
    fullName?: string;
    line1?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  items?: OrderEmailItem[];
}

export function renderOrderConfirmationEmail(payload: OrderConfirmationPayload): EmailRenderResult {
  const amountFormatted = `₹${(payload.totalAmountPaise / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
  })}`;
  const subject = `Order Confirmed: ${payload.orderNumber} — TTRC Store`;

  const itemsHtml = payload.items && payload.items.length > 0
    ? `
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 18px 0; border-collapse: collapse;">
        <thead>
          <tr style="border-bottom: 2px solid #EEE8FA;">
            <th align="left" style="padding: 10px 0; font-family: 'Space Grotesk', sans-serif; font-size: 12px; color: #6D6A6A; text-transform: uppercase; letter-spacing: 0.5px;">Item</th>
            <th align="center" style="padding: 10px 8px; font-family: 'Space Grotesk', sans-serif; font-size: 12px; color: #6D6A6A; text-transform: uppercase; letter-spacing: 0.5px;">Qty</th>
            <th align="right" style="padding: 10px 0; font-family: 'Space Grotesk', sans-serif; font-size: 12px; color: #6D6A6A; text-transform: uppercase; letter-spacing: 0.5px;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${payload.items
            .map(
              (item) => `
            <tr style="border-bottom: 1px solid #EEE8FA;">
              <td align="left" style="padding: 12px 0; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; color: #050507; font-weight: 500;">${item.name}</td>
              <td align="center" style="padding: 12px 8px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; color: #6D6A6A;">${item.quantity}</td>
              <td align="right" style="padding: 12px 0; font-family: 'Space Grotesk', sans-serif; font-size: 13px; color: #1E0D45; font-weight: 700;">₹${((item.pricePaise * item.quantity) / 100).toFixed(2)}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    `
    : '';

  const htmlContent = `
    <h1 style="font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 22px; font-weight: 800; color: #1E0D45; margin: 0 0 10px 0;">
      Order Confirmed!
    </h1>
    <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14px; color: #6D6A6A; line-height: 1.6; margin: 0 0 20px 0;">
      Hi ${payload.customerName}, thank you for your order! We have received your order <strong>${payload.orderNumber}</strong>${payload.billNumber ? ` (Receipt: ${payload.billNumber})` : ''} and are preparing your hardware components for dispatch.
    </p>

    <!-- Order Summary Card -->
    <div style="background-color: #EEE8FA; border-radius: 12px; padding: 18px 20px; margin: 0 0 20px 0;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
          <td style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; color: #6D6A6A; padding-bottom: 6px;">Order Number:</td>
          <td align="right" style="font-family: 'Space Grotesk', sans-serif; font-size: 13px; color: #1E0D45; font-weight: 700; padding-bottom: 6px;">${payload.orderNumber}</td>
        </tr>
        <tr>
          <td style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; color: #6D6A6A; padding-bottom: 6px;">Total Amount:</td>
          <td align="right" style="font-family: 'Space Grotesk', sans-serif; font-size: 15px; color: #844AFB; font-weight: 800; padding-bottom: 6px;">${amountFormatted}</td>
        </tr>
        <tr>
          <td style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; color: #6D6A6A;">Payment Method:</td>
          <td align="right" style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; color: #1E0D45; text-transform: uppercase; font-weight: 600;">${payload.paymentMethod}</td>
        </tr>
      </table>
    </div>

    ${itemsHtml}

    ${payload.shippingAddress.line1 ? `
      <div style="margin: 20px 0; padding: 16px; border: 1px solid #EEE8FA; border-radius: 10px; background-color: #FDFDFD;">
        <div style="font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #6721F2; margin-bottom: 6px; letter-spacing: 0.5px;">Delivery Address</div>
        <p style="margin: 0; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; color: #050507; line-height: 1.5;">
          ${payload.shippingAddress.fullName || payload.customerName}<br />
          ${payload.shippingAddress.line1}<br />
          ${payload.shippingAddress.city || ''}, ${payload.shippingAddress.state || ''} - ${payload.shippingAddress.pincode || ''}
        </p>
      </div>
    ` : ''}

    <!-- CTA Button -->
    <div style="text-align: center; margin: 28px 0 10px 0;">
      <a href="${STORE_URL}/orders/${encodeURIComponent(payload.orderNumber)}" style="display: inline-block; background-color: #844AFB; color: #FFFFFF; font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 10px; text-decoration: none; box-shadow: 0 4px 12px rgba(132, 74, 251, 0.25);">
        Track Order Status &rarr;
      </a>
    </div>
  `;

  const text = `Order Confirmed: ${payload.orderNumber}

Hi ${payload.customerName},
Your order ${payload.orderNumber} for ${amountFormatted} has been placed successfully and is being prepared for shipment.

Track online: ${STORE_URL}/orders/${encodeURIComponent(payload.orderNumber)}

—
${MANDATORY_TEXT_FOOTER}`;

  return {
    subject,
    html: baseLayout('Order Confirmed', htmlContent),
    text,
  };
}

/**
 * 3. Payment Confirmation Email
 */
export interface PaymentConfirmationPayload {
  toEmail: string;
  customerName: string;
  orderNumber: string;
  billNumber?: string;
  paymentId: string;
  amountPaise: number;
  paymentMethod: string;
}

export function renderPaymentConfirmationEmail(payload: PaymentConfirmationPayload): EmailRenderResult {
  const amountFormatted = `₹${(payload.amountPaise / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
  })}`;
  const subject = `Payment Received: ${payload.orderNumber} (${amountFormatted}) — TTRC Store`;

  const htmlContent = `
    <h1 style="font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 22px; font-weight: 800; color: #1E0D45; margin: 0 0 10px 0;">
      Payment Verified &amp; Received
    </h1>
    <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14px; color: #6D6A6A; line-height: 1.6; margin: 0 0 20px 0;">
      Hi ${payload.customerName}, your payment of <strong>${amountFormatted}</strong> for order <strong>${payload.orderNumber}</strong> has been successfully authorized and verified.
    </p>

    <div style="background-color: #EEE8FA; border-radius: 12px; padding: 18px 20px; margin: 0 0 20px 0;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
          <td style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; color: #6D6A6A; padding: 5px 0;">Transaction / Payment ID:</td>
          <td align="right" style="font-family: 'Space Grotesk', monospace; font-size: 13px; color: #1E0D45; font-weight: 700; padding: 5px 0;">${payload.paymentId}</td>
        </tr>
        <tr>
          <td style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; color: #6D6A6A; padding: 5px 0;">Order Reference:</td>
          <td align="right" style="font-family: 'Space Grotesk', sans-serif; font-size: 13px; color: #1E0D45; font-weight: 700; padding: 5px 0;">${payload.orderNumber}</td>
        </tr>
        ${payload.billNumber ? `
        <tr>
          <td style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; color: #6D6A6A; padding: 5px 0;">Receipt / Bill Number:</td>
          <td align="right" style="font-family: 'Space Grotesk', sans-serif; font-size: 13px; color: #1E0D45; font-weight: 700; padding: 5px 0;">${payload.billNumber}</td>
        </tr>` : ''}
        <tr>
          <td style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; color: #6D6A6A; padding: 5px 0;">Total Amount Paid:</td>
          <td align="right" style="font-family: 'Space Grotesk', sans-serif; font-size: 16px; font-weight: 800; color: #844AFB; padding: 5px 0;">${amountFormatted}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin: 24px 0;">
      <a href="${STORE_URL}/orders/${encodeURIComponent(payload.orderNumber)}" style="display: inline-block; background-color: #844AFB; color: #FFFFFF; font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 10px; text-decoration: none; box-shadow: 0 4px 12px rgba(132, 74, 251, 0.25);">
        Download Tax Invoice &rarr;
      </a>
    </div>
  `;

  const text = `Payment Received for Order ${payload.orderNumber}

Hi ${payload.customerName},
Your payment of ${amountFormatted} (Transaction ID: ${payload.paymentId}) has been verified.
View receipt: ${STORE_URL}/orders/${encodeURIComponent(payload.orderNumber)}

—
${MANDATORY_TEXT_FOOTER}`;

  return {
    subject,
    html: baseLayout('Payment Received', htmlContent),
    text,
  };
}

/**
 * 4. Order Status Update / Shipment Dispatched Email
 */
export interface OrderStatusPayload {
  toEmail: string;
  customerName: string;
  orderNumber: string;
  status: string;
  courierName?: string;
  trackingNumber?: string;
  trackingUrl?: string;
}

export function renderOrderStatusUpdateEmail(payload: OrderStatusPayload): EmailRenderResult {
  const isShipped = payload.status === 'shipped';
  const heading = isShipped ? 'Your Order is On Its Way!' : `Order Update: ${payload.orderNumber}`;
  const subject = isShipped
    ? `Dispatched: ${payload.orderNumber} via ${payload.courierName || 'Express Courier'}`
    : `Update on Order ${payload.orderNumber}: Status is ${payload.status.toUpperCase()}`;

  const htmlContent = `
    <h1 style="font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 22px; font-weight: 800; color: #1E0D45; margin: 0 0 10px 0;">
      ${heading}
    </h1>
    <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14px; color: #6D6A6A; line-height: 1.6; margin: 0 0 20px 0;">
      Hi ${payload.customerName}, ${isShipped
        ? `your robotics order <strong>${payload.orderNumber}</strong> has been handed over to <strong>${payload.courierName || 'our express courier partner'}</strong>.`
        : `your order <strong>${payload.orderNumber}</strong> status is now <strong>${payload.status.toUpperCase()}</strong>.`
      }
    </p>

    ${payload.trackingNumber ? `
      <div style="background-color: #EEE8FA; border-radius: 12px; padding: 18px 20px; margin: 0 0 24px 0;">
        <div style="font-family: 'Space Grotesk', sans-serif; font-size: 11px; color: #6721F2; text-transform: uppercase; font-weight: 700; margin-bottom: 4px; letter-spacing: 0.5px;">Tracking Number (AWB)</div>
        <div style="font-family: 'Space Grotesk', monospace; font-size: 18px; font-weight: 800; color: #1E0D45;">${payload.trackingNumber}</div>
        ${payload.courierName ? `<div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; color: #6D6A6A; margin-top: 6px;">Carrier: ${payload.courierName}</div>` : ''}
      </div>
    ` : ''}

    ${payload.trackingUrl ? `
      <div style="text-align: center; margin: 24px 0;">
        <a href="${payload.trackingUrl}" style="display: inline-block; background-color: #844AFB; color: #FFFFFF; font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 10px; text-decoration: none; box-shadow: 0 4px 12px rgba(132, 74, 251, 0.25);">
          Track Courier Shipment &rarr;
        </a>
      </div>
    ` : ''}
  `;

  const text = `${heading}

Hi ${payload.customerName},
Your order ${payload.orderNumber} status is now: ${payload.status.toUpperCase()}.
${payload.trackingNumber ? `Tracking Number: ${payload.trackingNumber}` : ''}
${payload.trackingUrl ? `Track package: ${payload.trackingUrl}` : ''}

—
${MANDATORY_TEXT_FOOTER}`;

  return {
    subject,
    html: baseLayout(heading, htmlContent),
    text,
  };
}

/**
 * 5. Back-in-Stock Notification Email
 */
export interface BackInStockPayload {
  toEmail: string;
  productName: string;
  productSlug: string;
  priceRupees: string;
  unsubscribeUrl: string;
}

export function renderBackInStockEmail(payload: BackInStockPayload): EmailRenderResult {
  const subject = `Back in Stock: ${payload.productName} is now available at TTRC Store`;
  const productUrl = `${STORE_URL}/product/${encodeURIComponent(payload.productSlug)}`;

  const htmlContent = `
    <h1 style="font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 22px; font-weight: 800; color: #1E0D45; margin: 0 0 10px 0;">
      Good news! It's back in stock.
    </h1>
    <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14px; color: #6D6A6A; line-height: 1.6; margin: 0 0 20px 0;">
      The robotics hardware you requested is now replenished and ready for express delivery:
    </p>

    <div style="background-color: #EEE8FA; border: 1px solid #AF87F8; border-radius: 12px; padding: 22px; text-align: center; margin: 0 0 24px 0;">
      <h2 style="font-family: 'Space Grotesk', sans-serif; font-size: 18px; font-weight: 800; color: #1E0D45; margin: 0 0 8px 0;">${payload.productName}</h2>
      <div style="font-family: 'Space Grotesk', sans-serif; font-size: 22px; font-weight: 800; color: #844AFB; margin: 0 0 16px 0;">${payload.priceRupees}</div>
      <a href="${productUrl}" style="display: inline-block; background-color: #844AFB; color: #FFFFFF; font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 10px; text-decoration: none; box-shadow: 0 4px 12px rgba(132, 74, 251, 0.25);">
        View &amp; Order Now &rarr;
      </a>
    </div>

    <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; color: #6D6A6A; line-height: 1.5; margin: 0;">
      Stock is allocated on a first-come, first-served basis. If you no longer wish to receive notifications for this item, you can <a href="${payload.unsubscribeUrl}" style="color: #844AFB; text-decoration: underline;">unsubscribe here</a>.
    </p>
  `;

  const text = `Back in Stock: ${payload.productName}

Good news! The item you requested is now back in stock at ${payload.priceRupees}.
Order now: ${productUrl}

Unsubscribe: ${payload.unsubscribeUrl}

—
${MANDATORY_TEXT_FOOTER}`;

  return {
    subject,
    html: baseLayout('Back in Stock Alert', htmlContent),
    text,
  };
}

/**
 * 6. Security Alert Email
 */
export interface SecurityAlertPayload {
  toEmail: string;
  customerName: string;
  actionTitle: string;
  description: string;
  timestamp?: string;
}

export function renderSecurityAlertEmail(payload: SecurityAlertPayload): EmailRenderResult {
  const subject = `Security Alert: ${payload.actionTitle} — TTRC Store`;

  const htmlContent = `
    <h1 style="font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 22px; font-weight: 800; color: #1E0D45; margin: 0 0 10px 0;">
      Security Notification
    </h1>
    <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14px; color: #6D6A6A; line-height: 1.6; margin: 0 0 20px 0;">
      Hi ${payload.customerName}, this is a confirmation that <strong>${payload.actionTitle}</strong> occurred on your TTRC Store account.
    </p>

    <div style="background-color: #EEE8FA; border-left: 4px solid #844AFB; border-radius: 4px 8px 8px 4px; padding: 16px 20px; margin: 0 0 20px 0;">
      <p style="margin: 0; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; color: #1E0D45; line-height: 1.5;">${payload.description}</p>
      ${payload.timestamp ? `<div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11px; color: #6D6A6A; margin-top: 6px;">Time: ${payload.timestamp}</div>` : ''}
    </div>

    <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; color: #6D6A6A; line-height: 1.6; margin: 0;">
      If you made this change, no action is needed. If you did NOT authorize this change, please immediately reset your password and contact our security desk at <a href="mailto:${SUPPORT_EMAIL}" style="color: #844AFB; font-weight: 600;">${SUPPORT_EMAIL}</a>.
    </p>
  `;

  const text = `Security Alert: ${payload.actionTitle}

Hi ${payload.customerName},
${payload.description}
${payload.timestamp ? `Time: ${payload.timestamp}` : ''}

If you did not authorize this, contact ${SUPPORT_EMAIL} immediately.

—
${MANDATORY_TEXT_FOOTER}`;

  return {
    subject,
    html: baseLayout('Security Alert', htmlContent, true),
    text,
  };
}

/**
 * 7. Standard Sample Design Test Email
 * Used to verify branded HTML template, plain-text fallback, footer, and logo rendering.
 */
export function renderDesignTestEmail(): EmailRenderResult {
  const subject = 'TTRC Store — Email Design Test';

  const htmlContent = `
    <!-- Top Pill Badge -->
    <div style="margin-bottom: 14px;">
      <span style="font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 700; color: #6721F2; background-color: #EEE8FA; padding: 4px 10px; border-radius: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
        Ecommerce Design System Test
      </span>
    </div>

    <h1 style="font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 24px; font-weight: 800; color: #1E0D45; margin: 0 0 12px 0; line-height: 1.3;">
      Unified Ecommerce Email Theme
    </h1>

    <p style="font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; color: #6D6A6A; line-height: 1.6; margin: 0 0 20px 0;">
      This is a standardized design verification message sent from the TTRC Store transactional email pipeline. It validates responsive HTML layout, font rendering, brand color consistency, the official footer logo, and the mandatory signature block.
    </p>

    <!-- Disclaimer Alert Box -->
    <div style="background-color: #EEE8FA; border-left: 4px solid #844AFB; border-radius: 4px 10px 10px 4px; padding: 16px 20px; margin: 0 0 24px 0;">
      <div style="font-family: 'Space Grotesk', sans-serif; font-size: 12px; font-weight: 700; color: #6721F2; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
        Notice &bull; Non-Production Verification
      </div>
      <p style="margin: 0; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; color: #1E0D45; line-height: 1.5;">
        This is an automated <strong>system test email</strong>. This is not an actual order confirmation, payment receipt, password reset, or account verification request. No real customer workflow was triggered.
      </p>
    </div>

    <!-- Features Grid Preview -->
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 0 0 24px 0; border: 1px solid #EEE8FA; border-radius: 12px; overflow: hidden; background-color: #FDFDFD;">
      <tr>
        <td style="padding: 16px; border-bottom: 1px solid #EEE8FA;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td style="font-family: 'Space Grotesk', sans-serif; font-size: 13px; font-weight: 700; color: #1E0D45;">Palette Standard:</td>
              <td align="right" style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; color: #844AFB; font-weight: 700;">Violet (#844AFB) &bull; Lavender (#EEE8FA)</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 16px; border-bottom: 1px solid #EEE8FA;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td style="font-family: 'Space Grotesk', sans-serif; font-size: 13px; font-weight: 700; color: #1E0D45;">Typography:</td>
              <td align="right" style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; color: #050507; font-weight: 600;">Space Grotesk &bull; Plus Jakarta Sans</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 16px;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td style="font-family: 'Space Grotesk', sans-serif; font-size: 13px; font-weight: 700; color: #1E0D45;">Delivery Engine:</td>
              <td align="right" style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; color: #050507; font-weight: 600;">Resend REST API (admin@ttrc.store)</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Call to Action Button -->
    <div style="text-align: center; margin: 24px 0 12px 0;">
      <a href="${STORE_URL}/" target="_blank" style="display: inline-block; background-color: #844AFB; color: #FFFFFF; font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 14px; padding: 12px 32px; border-radius: 10px; text-decoration: none; box-shadow: 0 4px 14px rgba(132, 74, 251, 0.3);">
        Explore TTRC Store &rarr;
      </a>
    </div>
  `;

  const text = `TTRC Store — Email Design Test

This is a standardized design verification message sent from the TTRC Store transactional email pipeline. It validates responsive HTML layout, font rendering, brand color consistency, the official footer logo, and the mandatory signature block.

NOTICE: This is an automated system test email and NOT an actual order confirmation, payment receipt, password reset, or account verification request.

Features Verified:
- Palette Standard: Violet (#844AFB) & Lavender (#EEE8FA)
- Typography: Space Grotesk & Plus Jakarta Sans
- Delivery Engine: Resend REST API (admin@ttrc.store)

Visit store: ${STORE_URL}/

—
${MANDATORY_TEXT_FOOTER}`;

  return {
    subject,
    html: baseLayout('Email Design Test', htmlContent),
    text,
  };
}
