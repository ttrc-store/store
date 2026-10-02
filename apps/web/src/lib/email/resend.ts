/**
 * Resend Transactional Email Dispatcher
 * Sends order notifications, shipping tracking links, and payment updates via Resend API.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'TTRC Store <orders@ttrc.store>';

export interface OrderEmailPayload {
  toEmail: string;
  customerName: string;
  orderNumber: string;
  totalAmountRupees: string;
  trackingUrl?: string;
  courierName?: string;
}

/**
 * Dispatch transactional email via Resend API or console fallback.
 */
async function dispatchEmail(to: string, subject: string, htmlContent: string) {
  if (RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [to],
          subject,
          html: htmlContent,
        }),
      });

      if (res.ok) {
        console.log(`[Resend Email Sent] To: ${to}, Subject: ${subject}`);
        return { success: true };
      }
    } catch (err) {
      console.error('[Resend Email Error]', err);
    }
  }

  // Fallback log
  console.log(`[Email Dispatch Logged] To: ${to} | Subject: ${subject}`);
  return { success: true, simulated: true };
}

/**
 * Order Confirmation Email
 */
export async function sendOrderConfirmationEmail(payload: OrderEmailPayload) {
  const subject = `Order Confirmed: ${payload.orderNumber} - Tamizh Tech Store`;
  const html = `
    <div style="font-family: Arial, sans-serif; background: #FFFFFF; color: #111111; padding: 24px; border: 1px solid #E5E7EB; border-radius: 12px; max-width: 600px; margin: 0 auto;">
      <div style="margin-bottom: 20px;">
        <img src="https://ttrc.store/brand/ttrc-logo.png" alt="TTRC Store" height="38" style="display: block; object-fit: contain;" />
      </div>
      <h2 style="color: #6D28D9; margin-top: 0;">Thank You for Your Order!</h2>
      <p>Hi ${payload.customerName},</p>
      <p>Your order <strong>${payload.orderNumber}</strong> for <strong>${payload.totalAmountRupees}</strong> has been successfully placed and confirmed.</p>
      <p>We are preparing your robotics components for quality check &amp; shipment.</p>
      <a href="https://ttrc.store/orders/${encodeURIComponent(payload.orderNumber)}" style="display: inline-block; background: #6D28D9; color: #FFFFFF; font-weight: bold; padding: 12px 20px; border-radius: 8px; text-decoration: none;">Track Order Status</a>
    </div>
  `;
  return dispatchEmail(payload.toEmail, subject, html);
}

/**
 * Shipment Dispatched Email
 */
export async function sendShipmentDispatchedEmail(payload: OrderEmailPayload) {
  const subject = `Dispatched: ${payload.orderNumber} via ${payload.courierName || 'Courier'}`;
  const html = `
    <div style="font-family: Arial, sans-serif; background: #FFFFFF; color: #111111; padding: 24px; border: 1px solid #E5E7EB; border-radius: 12px; max-width: 600px; margin: 0 auto;">
      <div style="margin-bottom: 20px;">
        <img src="https://ttrc.store/brand/ttrc-logo.png" alt="TTRC Store" height="38" style="display: block; object-fit: contain;" />
      </div>
      <h2 style="color: #6D28D9; margin-top: 0;">Your Order is On Its Way!</h2>
      <p>Hi ${payload.customerName},</p>
      <p>Your order <strong>${payload.orderNumber}</strong> has been handed over to <strong>${payload.courierName || 'Shiprocket'}</strong>.</p>
      ${payload.trackingUrl ? `<p><a href="${payload.trackingUrl}" style="display: inline-block; background: #6D28D9; color: #FFFFFF; font-weight: bold; padding: 12px 20px; border-radius: 8px; text-decoration: none;">Track Shipment Package</a></p>` : ''}
    </div>
  `;
  return dispatchEmail(payload.toEmail, subject, html);
}
