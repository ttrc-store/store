import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/mongodb/client';
import { OrderModel, ProductModel, AuditLogModel, CheckoutSessionModel, CouponModel } from '@/lib/mongodb/models';
import { getNextSequenceId, generateBillNumber } from '@/lib/id-generator';
import { sendOrderConfirmation, sendPaymentConfirmation } from '@/lib/email/resend';

/**
 * Razorpay Webhook Handler.
 * - Verifies HMAC-SHA256 signature using timing-safe comparison
 * - Rejects requests if RAZORPAY_WEBHOOK_SECRET is missing
 * - Backed by MongoDB (OrderModel & AuditLogModel)
 * - Strict idempotency protection via event_id
 * - Financial verification: confirms paid amount matches authoritative order total
 */
export async function POST(request: Request) {
  try {
    const bodyText = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    // 1. Webhook secret validation
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.warn('[Razorpay Webhook] RAZORPAY_WEBHOOK_SECRET not configured.');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    // 2. Signature verification with timing-safe comparison
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(bodyText)
      .digest('hex');

    const sigBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expectedSignature);

    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      console.error('[Razorpay Webhook] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // 3. Parse payload
    const payload = JSON.parse(bodyText);
    const event: string = payload.event;
    const eventId: string = payload.event_id ?? `evt_${Date.now()}`;
    const paymentEntity = payload.payload?.payment?.entity;
    const refundEntity = payload.payload?.refund?.entity;

    await connectToDatabase();

    // 4. Idempotency check: skip already-processed events
    const existingLog = await AuditLogModel.findOne({
      action: `webhook.razorpay.${event}`,
      'metadata.event_id': eventId,
    });

    if (existingLog) {
      console.log(`[Razorpay Webhook] Event ${eventId} already processed (idempotent skip).`);
      return NextResponse.json({ status: 'ok', idempotent: true });
    }

    // 5. Process events
    switch (event) {
      case 'payment.captured': {
        const rpOrderId = paymentEntity?.order_id;
        const rpPaymentId = paymentEntity?.id;
        const amountPaise = paymentEntity?.amount;

        if (rpOrderId) {
          const order = await OrderModel.findOne({
            $or: [{ razorpay_order_id: rpOrderId }, { order_number: rpOrderId }],
          });

          if (order) {
            // Financial invariant verification: payment amount must EXACTLY match authoritative order total
            // Any discrepancy (underpayment OR unexpected overpayment) must be flagged and rejected from automated fulfillment
            if (typeof amountPaise === 'number' && amountPaise !== order.total) {
              const discrepancyType = amountPaise < order.total ? 'UNDERPAID' : 'OVERPAID';
              console.error(
                `[Razorpay Webhook] ⚠️ Financial Invariant Violation (${discrepancyType}): received ${amountPaise} paise, expected exact ${order.total} paise for order ${order.order_number}`
              );
              order.payment_status = 'failed';
              order.notes = `[Security Audit] Payment amount mismatch: gateway received ${amountPaise} paise, expected exact ${order.total} paise (${discrepancyType}). Order flagged for manual financial reconciliation.`;
              await order.save();
              break;
            }

            if (order.payment_status === 'paid') {
              console.log(`[Razorpay Webhook] ℹ️ Order ${order.order_number} is already marked as paid. Idempotent duplicate event handled safely.`);
              break;
            }

            order.payment_status = 'paid';
            order.status = 'processing';
            order.razorpay_payment_id = rpPaymentId;
            if (!order.bill_number) {
              order.bill_number = await generateBillNumber();
            }
            await order.save();
            console.log(`[Razorpay Webhook] ✅ Payment captured for order ${order.order_number} (Bill: ${order.bill_number})`);

            // Idempotent transactional email dispatch
            if (!order.confirmation_email_sent) {
              const recipientEmail = order.shipping_address?.email || order.guest_email;
              if (recipientEmail) {
                try {
                  await sendOrderConfirmation({
                    toEmail: recipientEmail,
                    customerName: order.shipping_address?.fullName || 'Customer',
                    orderNumber: order.order_number,
                    billNumber: order.bill_number,
                    totalAmountPaise: order.total,
                    paymentMethod: 'razorpay',
                    shippingAddress: order.shipping_address || {},
                    items: (order.items || []).map((i: any) => ({
                      name: i.product_name,
                      quantity: i.quantity,
                      pricePaise: i.unit_price,
                    })),
                  });

                  await sendPaymentConfirmation({
                    toEmail: recipientEmail,
                    customerName: order.shipping_address?.fullName || 'Customer',
                    orderNumber: order.order_number,
                    billNumber: order.bill_number,
                    paymentId: rpPaymentId,
                    amountPaise: amountPaise || order.total,
                    paymentMethod: 'razorpay',
                  });

                  order.confirmation_email_sent = true;
                  order.confirmation_email_sent_at = new Date();
                  await order.save();
                } catch (emailErr) {
                  console.warn('[Razorpay Webhook] Email dispatch failed (order remains paid):', emailErr);
                }
              }
            }
          } else {
            // Check if there is a staged CheckoutSession awaiting payment confirmation
            const session = await CheckoutSessionModel.findOne({ razorpay_order_id: rpOrderId });
            if (session && session.status !== 'completed') {
              for (const item of session.items) {
                await ProductModel.findByIdAndUpdate(item.product_id, {
                  $inc: { stock_quantity: -item.quantity },
                });
              }
              if (session.coupon_code) {
                await CouponModel.findOneAndUpdate(
                  { code: session.coupon_code.toUpperCase().trim() },
                  { $inc: { usage_count: 1 } }
                );
              }
              const newOrderNumber = await getNextSequenceId('ORD');
              const newBillNumber = await generateBillNumber();

              const guestInvoiceToken = crypto.randomBytes(32).toString('hex');
              const guestInvoiceTokenHash = crypto.createHash('sha256').update(guestInvoiceToken).digest('hex');

              const createdOrder = await OrderModel.create({
                order_number: newOrderNumber,
                user_id: session.user_id,
                guest_email: session.guest_email,
                status: 'processing',
                payment_status: 'paid',
                payment_method: 'razorpay',
                shipping_method: session.shipping_method,
                subtotal: session.subtotal,
                discount_total: session.discount_total,
                tax_total: session.tax_total,
                shipping_total: session.shipping_total,
                total: session.total,
                shipping_address: session.shipping_address,
                billing_address: session.billing_address || session.shipping_address,
                razorpay_order_id: rpOrderId,
                razorpay_payment_id: rpPaymentId,
                bill_number: newBillNumber,
                guest_invoice_token_hash: guestInvoiceTokenHash,
                notes: session.company_gst
                  ? `GST Invoice Request: ${session.company_gst.companyName} (GSTIN: ${session.company_gst.gstin})`
                  : undefined,
                items: session.items,
              });

              session.status = 'completed';
              session.order_id = createdOrder._id.toString();
              session.order_number = newOrderNumber;
              await session.save();

              console.log(`[Razorpay Webhook] ✅ Created and captured order ${newOrderNumber} from staged session (Bill: ${newBillNumber})`);

              const recipientEmail = createdOrder.shipping_address?.email || createdOrder.guest_email;
              if (recipientEmail) {
                try {
                  await sendOrderConfirmation({
                    toEmail: recipientEmail,
                    customerName: createdOrder.shipping_address?.fullName || 'Customer',
                    orderNumber: createdOrder.order_number,
                    billNumber: createdOrder.bill_number,
                    totalAmountPaise: createdOrder.total,
                    paymentMethod: 'razorpay',
                    shippingAddress: createdOrder.shipping_address || {},
                    items: (createdOrder.items || []).map((i: any) => ({
                      name: i.product_name,
                      quantity: i.quantity,
                      pricePaise: i.unit_price,
                    })),
                  });

                  await sendPaymentConfirmation({
                    toEmail: recipientEmail,
                    customerName: createdOrder.shipping_address?.fullName || 'Customer',
                    orderNumber: createdOrder.order_number,
                    billNumber: createdOrder.bill_number,
                    paymentId: rpPaymentId,
                    amountPaise: amountPaise || createdOrder.total,
                    paymentMethod: 'razorpay',
                  });

                  createdOrder.confirmation_email_sent = true;
                  createdOrder.confirmation_email_sent_at = new Date();
                  await createdOrder.save();
                } catch (emailErr) {
                  console.warn('[Razorpay Webhook] Email dispatch failed:', emailErr);
                }
              }
            } else {
              console.warn(`[Razorpay Webhook] No matching order or session found for ${rpOrderId}`);
            }
          }
        }
        break;
      }

      case 'payment.failed': {
        const rpOrderId = paymentEntity?.order_id;
        if (rpOrderId) {
          // Atomic transition: only transition if status is 'pending' and payment_status is 'pending'
          // This guarantees that delayed failure webhooks cannot reverse an already paid order,
          // and duplicate failure webhooks cannot double-restock inventory.
          const order = await OrderModel.findOneAndUpdate(
            {
              $or: [{ razorpay_order_id: rpOrderId }, { order_number: rpOrderId }],
              status: 'pending',
              payment_status: 'pending',
            },
            {
              $set: {
                status: 'cancelled',
                payment_status: 'failed',
              },
              $push: {
                // If notes was a string or array, maintain notes trace safely
              },
            },
            { new: false }
          );

          if (order) {
            order.notes = (order.notes ? order.notes + ' | ' : '') + 'Payment failed at gateway. Inventory automatically restocked.';
            await order.save();

            console.warn(`[Razorpay Webhook] ❌ Payment failed for pending order ${order.order_number}. Releasing reserved stock.`);
            for (const item of order.items) {
              await ProductModel.findByIdAndUpdate(item.product_id, {
                $inc: { stock_quantity: item.quantity },
              });
            }
            console.log(`[Razorpay Webhook] 🔄 Restocked inventory for order ${order.order_number} following failed payment.`);
          } else {
            console.log(`[Razorpay Webhook] Payment failed event received for ${rpOrderId}, but order is not in pending state (already paid, cancelled, or completed). Ignoring restock.`);
          }
        }
        break;
      }

      case 'refund.processed': {
        const refundId = refundEntity?.id;
        const rpPaymentId = refundEntity?.payment_id;

        if (rpPaymentId) {
          const order = await OrderModel.findOne({
            razorpay_payment_id: rpPaymentId,
          });
          if (order) {
            order.payment_status = 'refunded';
            order.status = 'refunded';
            await order.save();
            console.log(`[Razorpay Webhook] ✅ Refund processed for order ${order.order_number} (${refundId})`);
          }
        }
        break;
      }

      default:
        console.log(`[Razorpay Webhook] Unhandled event: ${event}`);
    }

    // 6. Record in AuditLogModel for idempotency and traceability
    await AuditLogModel.create({
      actor_id: 'system:razorpay',
      action: `webhook.razorpay.${event}`,
      entity: 'payment',
      entity_id: paymentEntity?.order_id || eventId,
      metadata: {
        event_id: eventId,
        event,
        amount: paymentEntity?.amount,
        payment_id: paymentEntity?.id,
        processed_at: new Date().toISOString(),
      },
    });

    return NextResponse.json({ status: 'ok', received: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown webhook error';
    console.error('[Razorpay Webhook Error]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
