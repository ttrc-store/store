import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

/**
 * Razorpay webhook handler.
 * - Verifies HMAC-SHA256 signature on every request
 * - Rejects requests if RAZORPAY_WEBHOOK_SECRET is not set (never falls through in production)
 * - Updates orders and payments tables based on event type
 * - Idempotent: uses razorpay_event_id to skip already-processed events
 */

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key || key === 'placeholder_service_role_key') {
    return null;
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(request: Request) {
  try {
    const bodyText = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    // 1. Webhook secret must be set in production
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('[Razorpay Webhook] RAZORPAY_WEBHOOK_SECRET is not configured. Rejecting request.');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // 2. Verify HMAC signature (always required)
    if (!signature) {
      console.error('[Razorpay Webhook] Missing x-razorpay-signature header');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(bodyText)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('[Razorpay Webhook] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // 3. Parse payload
    const payload = JSON.parse(bodyText);
    const event: string = payload.event;
    const eventId: string = payload.event_id ?? `evt_${Date.now()}`;
    const paymentEntity = payload.payload?.payment?.entity;
    const refundEntity = payload.payload?.refund?.entity;

    console.log(`[Razorpay Webhook] Event: ${event} | ID: ${eventId}`);

    const supabase = createAdminClient();
    if (!supabase) {
      console.error('[Razorpay Webhook] Supabase admin client unavailable — skipping DB update');
      return NextResponse.json({ status: 'ok', received: true });
    }

    // 4. Idempotency: skip already-processed events
    const { data: existingEvent } = await supabase
      .from('audit_logs')
      .select('id')
      .eq('action', `webhook.razorpay.${event}`)
      .filter('new_data->>event_id', 'eq', eventId)
      .maybeSingle();

    if (existingEvent) {
      console.log(`[Razorpay Webhook] Already processed event ${eventId}, skipping.`);
      return NextResponse.json({ status: 'ok', idempotent: true });
    }

    // 5. Handle events
    switch (event) {
      case 'payment.captured': {
        const rpOrderId = paymentEntity?.order_id;
        const rpPaymentId = paymentEntity?.id;
        const amountPaise = paymentEntity?.amount;
        const method = paymentEntity?.method;

        if (rpOrderId) {
          // Update order: mark as confirmed + store payment ID
          const { data: order } = await supabase
            .from('orders')
            .select('id, order_number')
            .eq('razorpay_order_id', rpOrderId)
            .maybeSingle();

          if (order) {
            await supabase
              .from('orders')
              .update({
                status: 'confirmed',
                razorpay_payment_id: rpPaymentId,
                updated_at: new Date().toISOString(),
              })
              .eq('id', order.id);

            // Update payment record
            await supabase
              .from('payments')
              .update({
                status: 'captured',
                razorpay_payment_id: rpPaymentId,
                method: method ?? 'razorpay',
                captured_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq('order_id', order.id);

            // Add timeline event
            await supabase.from('order_events').insert({
              order_id: order.id,
              event_type: 'payment_captured',
              actor_role: 'system',
              meta: {
                razorpay_payment_id: rpPaymentId,
                amount_paise: amountPaise,
                method,
              },
            });

            console.log(`[Razorpay Webhook] ✅ Payment captured for order ${order.order_number}`);
          } else {
            console.warn(`[Razorpay Webhook] ⚠️ No order found for Razorpay order ${rpOrderId}`);
          }
        }
        break;
      }

      case 'payment.failed': {
        const rpOrderId = paymentEntity?.order_id;
        const rpPaymentId = paymentEntity?.id;
        const errorCode = paymentEntity?.error_code;
        const errorDesc = paymentEntity?.error_description;

        if (rpOrderId) {
          const { data: order } = await supabase
            .from('orders')
            .select('id, order_number')
            .eq('razorpay_order_id', rpOrderId)
            .maybeSingle();

          if (order) {
            await supabase
              .from('orders')
              .update({
                status: 'payment_failed',
                updated_at: new Date().toISOString(),
              })
              .eq('id', order.id);

            await supabase
              .from('payments')
              .update({
                status: 'failed',
                razorpay_payment_id: rpPaymentId,
                updated_at: new Date().toISOString(),
              })
              .eq('order_id', order.id);

            await supabase.from('order_events').insert({
              order_id: order.id,
              event_type: 'payment_failed',
              actor_role: 'system',
              meta: { error_code: errorCode, error_description: errorDesc, razorpay_payment_id: rpPaymentId },
            });

            console.warn(`[Razorpay Webhook] ❌ Payment failed for order ${order.order_number}: ${errorDesc}`);
          }
        }
        break;
      }

      case 'refund.processed': {
        const refundId = refundEntity?.id;
        const rpPaymentId = refundEntity?.payment_id;
        const amountPaise = refundEntity?.amount;

        // Update refunds table
        if (refundId) {
          await supabase
            .from('refunds')
            .update({
              status: 'completed',
              updated_at: new Date().toISOString(),
            })
            .eq('razorpay_refund_id', refundId);

          // If there's no refund row (webhook came before we created it), create one
          const { data: existingRefund } = await supabase
            .from('refunds')
            .select('id')
            .eq('razorpay_refund_id', refundId)
            .maybeSingle();

          if (!existingRefund && rpPaymentId) {
            // Try to find the order from payment ID
            const { data: order } = await supabase
              .from('orders')
              .select('id')
              .eq('razorpay_payment_id', rpPaymentId)
              .maybeSingle();

            if (order) {
              await supabase.from('refunds').insert({
                order_id: order.id,
                amount_paise: amountPaise,
                status: 'completed',
                razorpay_refund_id: refundId,
                reason: 'Refund processed via Razorpay',
              });

              await supabase.from('order_events').insert({
                order_id: order.id,
                event_type: 'refund_processed',
                actor_role: 'system',
                meta: { razorpay_refund_id: refundId, amount_paise: amountPaise },
              });
            }
          }

          console.log(`[Razorpay Webhook] ✅ Refund processed: ${refundId} (₹${Math.round((amountPaise ?? 0) / 100)})`);
        }
        break;
      }

      case 'payment.authorized': {
        // For auto-captured payments, this can precede payment.captured
        console.log(`[Razorpay Webhook] Payment authorized: ${paymentEntity?.id}`);
        break;
      }

      default:
        console.log(`[Razorpay Webhook] Unhandled event type: ${event}`);
    }

    // 6. Record event in audit_logs for idempotency
    await supabase.from('audit_logs').insert({
      action: `webhook.razorpay.${event}`,
      table_name: 'payments',
      new_data: { event_id: eventId, event, processed_at: new Date().toISOString() },
    });

    return NextResponse.json({ status: 'ok', received: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown webhook error';
    console.error('[Razorpay Webhook Error]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
