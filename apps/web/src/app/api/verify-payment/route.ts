import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { verifyRazorpaySignature, isRazorpayConfigured, getRazorpayClient } from '@/lib/razorpay';
import { connectToDatabase } from '@/lib/mongodb/client';
import { OrderModel, AuditLogModel, CheckoutSessionModel, ProductModel, CouponModel } from '@/lib/mongodb/models';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { getNextSequenceId, generateBillNumber } from '@/lib/id-generator';
import { sendOrderConfirmation, sendPaymentConfirmation } from '@/lib/email/resend';

/**
 * POST /api/verify-payment
 * Secure Payment Signature & Authorization Verification.
 *
 * Security Invariants:
 * 1. Customer Authentication required (for user-bound orders).
 * 2. Order Ownership required (Customer A cannot verify or manipulate Customer B's order).
 * 3. Exact Order ID Binding: razorpay_order_id must match the value persisted on the order record.
 * 4. Cryptographic Proof: Timing-safe HMAC-SHA256 signature verification.
 * 5. Gateway Verification: Fetches payment directly from Razorpay API to verify:
 *    - Status is 'captured' (or captured on the spot if 'authorized')
 *    - Amount EXACTLY matches authoritative order/session total in paise
 *    - Currency is 'INR'
 *    - Payment's order_id matches razorpay_order_id
 * 6. Idempotency: Duplicate calls for an already-paid order return success without double-processing.
 * 7. Staged Order Creation: If no Order exists yet, create Order and Bill ONLY upon verified payment!
 */
export async function POST(request: Request) {
  try {
    if (!isRazorpayConfigured()) {
      return NextResponse.json(
        { error: 'Razorpay payment gateway is not configured on this server.' },
        { status: 500 }
      );
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
    }

    const orderId = body.razorpay_order_id || body.order_id || body.orderId;
    const paymentId = body.razorpay_payment_id || body.payment_id || body.paymentId;
    const signature = body.razorpay_signature || body.signature;
    const orderNumber = body.orderNumber || body.order_number;
    const guestEmail = body.guestEmail ? String(body.guestEmail).toLowerCase().trim() : undefined;
    const isDevTest = body.isDevTest === true;

    // Developer test mode verification (isolated to development environment only)
    const isProd = process.env.NODE_ENV === 'production';
    if (isDevTest) {
      if (isProd) {
        return NextResponse.json(
          { error: 'Developer test verification is disabled in production.' },
          { status: 403 }
        );
      }

      const isValid = verifyRazorpaySignature({
        orderId,
        paymentId,
        signature,
      });

      if (!isValid) {
        return NextResponse.json(
          { error: 'Test verification failed: signature mismatch.' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        verified: true,
        message: 'Developer test payment signature verified successfully.',
        order_id: orderId,
        payment_id: paymentId,
      });
    }

    // 1. Validate required fields
    if (!orderId || !paymentId || !signature) {
      return NextResponse.json(
        {
          error: 'Missing required payment verification fields: razorpay_order_id, razorpay_payment_id, and razorpay_signature are required.',
          received: {
            hasOrderId: Boolean(orderId),
            hasPaymentId: Boolean(paymentId),
            hasSignature: Boolean(signature),
          },
        },
        { status: 400 }
      );
    }

    const auth = await getAuthenticatedUser();
    const user = !('error' in auth) ? auth.user : null;

    await connectToDatabase();

    // 2. Check if an Order record already exists in database
    let order = await OrderModel.findOne({
      $or: [
        ...(orderNumber ? [{ order_number: orderNumber }, { _id: orderNumber }] : []),
        { razorpay_order_id: orderId },
      ],
    });

    if (order) {
      // Enforce customer ownership or guest ownership (IDOR defense)
      if (order.user_id) {
        if (!user) {
          return NextResponse.json(
            { error: 'Unauthorized: Authentication required.' },
            { status: 401 }
          );
        }
        if (order.user_id !== user.id && user.role !== 'admin') {
          return NextResponse.json(
            { error: 'Unauthorized: You can only verify payment for your own orders.' },
            { status: 403 }
          );
        }
      } else if (order.guest_email) {
        if (!guestEmail || order.guest_email.toLowerCase() !== guestEmail) {
          return NextResponse.json(
            { error: 'Unauthorized: Guest email does not match order record.' },
            { status: 403 }
          );
        }
      }

      // Enforce that Razorpay order ID matches the order's registered ID
      if (order.razorpay_order_id && order.razorpay_order_id !== orderId) {
        console.warn(
          `[verify-payment] Order ID mismatch: received ${orderId}, expected ${order.razorpay_order_id} for order ${order.order_number}`
        );
        return NextResponse.json(
          { error: 'Payment verification failed: Razorpay order ID mismatch.' },
          { status: 400 }
        );
      }

      // Idempotency check: Already paid orders return 200 immediately
      if (order.payment_status === 'paid') {
        return NextResponse.json({
          success: true,
          verified: true,
          idempotent: true,
          message: 'Payment has already been verified for this order.',
          orderNumber: order.order_number,
          order_id: orderId,
          payment_id: paymentId,
        });
      }

      // 3. Cryptographic signature check for existing order
      const isValidSignature = verifyRazorpaySignature({
        orderId,
        paymentId,
        signature,
      });

      if (!isValidSignature) {
        console.warn(`[verify-payment] Signature mismatch for Razorpay order ${orderId}`);
        return NextResponse.json(
          {
            success: false,
            verified: false,
            error: 'Payment verification failed: signature mismatch.',
          },
          { status: 400 }
        );
      }

      // 4. Server-side payment status and financial verification via Razorpay API
      let paymentEntity: any = null;
      try {
        const razorpay = getRazorpayClient();
        paymentEntity = await razorpay.payments.fetch(paymentId);
      } catch (apiErr: any) {
        console.error('[verify-payment] Error fetching payment from Razorpay API:', apiErr);
        return NextResponse.json(
          { error: 'Failed to verify payment with payment gateway.' },
          { status: 502 }
        );
      }

      if (!paymentEntity) {
        return NextResponse.json({ error: 'Payment entity not found on gateway.' }, { status: 404 });
      }

      if (paymentEntity.order_id !== orderId) {
        return NextResponse.json(
          { error: 'Payment does not match the expected Razorpay order.' },
          { status: 400 }
        );
      }

      if (paymentEntity.currency !== 'INR') {
        return NextResponse.json(
          { error: 'Payment currency mismatch: expected INR.' },
          { status: 400 }
        );
      }

      if (paymentEntity.amount !== order.total) {
        return NextResponse.json(
          { error: 'Payment amount mismatch: gateway amount does not match order total.' },
          { status: 400 }
        );
      }

      if (paymentEntity.status === 'authorized') {
        const razorpay = getRazorpayClient();
        paymentEntity = await razorpay.payments.capture(paymentId, order.total, 'INR');
      }

      if (paymentEntity.status !== 'captured') {
        return NextResponse.json(
          { error: `Payment is not captured. Current status: ${paymentEntity.status}` },
          { status: 400 }
        );
      }

      order.payment_status = 'paid';
      order.status = 'processing';
      order.payment_method = 'razorpay';
      order.razorpay_order_id = orderId;
      order.razorpay_payment_id = paymentId;
      order.razorpay_signature = signature;
      if (!order.bill_number) {
        order.bill_number = await generateBillNumber();
      }
      await order.save();

      await AuditLogModel.create({
        actor_id: user?.id || `guest:${order.guest_email || 'anonymous'}`,
        action: 'payment.verified.razorpay',
        entity: 'order',
        entity_id: order._id.toString(),
        metadata: {
          orderNumber: order.order_number,
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
          amountPaise: paymentEntity.amount,
          status: paymentEntity.status,
          verifiedAt: new Date().toISOString(),
        },
      });

      if (!order.confirmation_email_sent) {
        const recipientEmail = order.shipping_address?.email || order.guest_email || user?.email;
        if (recipientEmail) {
          try {
            await sendOrderConfirmation({
              toEmail: recipientEmail,
              customerName: order.shipping_address?.fullName || user?.fullName || 'Customer',
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
              customerName: order.shipping_address?.fullName || user?.fullName || 'Customer',
              orderNumber: order.order_number,
              billNumber: order.bill_number,
              paymentId,
              amountPaise: paymentEntity.amount,
              paymentMethod: 'razorpay',
            });

            order.confirmation_email_sent = true;
            order.confirmation_email_sent_at = new Date();
            await order.save();
          } catch (emailErr) {
            console.warn('[verify-payment] Email dispatch failed:', emailErr);
          }
        }
      }

      return NextResponse.json({
        success: true,
        verified: true,
        orderNumber: order.order_number,
        billNumber: order.bill_number,
      });
    }

    // 5. Staged Checkout Session: ONLY generate Order and Bill upon verified payment!
    const isValidSignature = verifyRazorpaySignature({
      orderId,
      paymentId,
      signature,
    });

    if (!isValidSignature) {
      console.warn(`[verify-payment] Signature mismatch for Razorpay order ${orderId}`);
      return NextResponse.json(
        {
          success: false,
          verified: false,
          error: 'Payment verification failed: signature mismatch.',
        },
        { status: 400 }
      );
    }

    const session = await CheckoutSessionModel.findOne({ razorpay_order_id: orderId });
    if (!session) {
      return NextResponse.json(
        { error: 'Checkout session or order not found for this payment.' },
        { status: 404 }
      );
    }

    if (session.status === 'completed' && session.order_number) {
      return NextResponse.json({
        success: true,
        verified: true,
        idempotent: true,
        orderNumber: session.order_number,
      });
    }

    let paymentEntity: any = null;
    try {
      const razorpay = getRazorpayClient();
      paymentEntity = await razorpay.payments.fetch(paymentId);
    } catch (apiErr: any) {
      console.error('[verify-payment] Error fetching payment from Razorpay API:', apiErr);
      return NextResponse.json(
        { error: 'Failed to verify payment with payment gateway.' },
        { status: 502 }
      );
    }

    if (!paymentEntity) {
      return NextResponse.json({ error: 'Payment entity not found on gateway.' }, { status: 404 });
    }

    if (paymentEntity.order_id !== orderId) {
      return NextResponse.json(
        { error: 'Payment does not match the expected Razorpay order.' },
        { status: 400 }
      );
    }

    if (paymentEntity.currency !== 'INR') {
      return NextResponse.json(
        { error: 'Payment currency mismatch: expected INR.' },
        { status: 400 }
      );
    }

    if (paymentEntity.amount !== session.total) {
      return NextResponse.json(
        { error: 'Payment amount mismatch: gateway amount does not match session total.' },
        { status: 400 }
      );
    }

    if (paymentEntity.status === 'authorized') {
      const razorpay = getRazorpayClient();
      paymentEntity = await razorpay.payments.capture(paymentId, session.total, 'INR');
    }

    if (paymentEntity.status !== 'captured') {
      return NextResponse.json(
        { error: `Payment is not captured. Current status: ${paymentEntity.status}` },
        { status: 400 }
      );
    }

    // Atomically decrement stock from inventory
    for (const item of session.items) {
      await ProductModel.findByIdAndUpdate(item.product_id, {
        $inc: { stock_quantity: -item.quantity },
      });
    }

    // Increment coupon usage
    if (session.coupon_code) {
      await CouponModel.findOneAndUpdate(
        { code: session.coupon_code.toUpperCase().trim() },
        { $inc: { usage_count: 1 } }
      );
    }

    // Allocate official sequential Order Number and Bill Number
    const newOrderNumber = await getNextSequenceId('ORD');
    const newBillNumber = await generateBillNumber();

    const guestInvoiceToken = crypto.randomBytes(32).toString('hex');
    const guestInvoiceTokenHash = crypto.createHash('sha256').update(guestInvoiceToken).digest('hex');

    const createdOrder = await OrderModel.create({
      order_number: newOrderNumber,
      user_id: session.user_id || (user ? user.id : undefined),
      guest_email: session.guest_email || (!user && guestEmail ? guestEmail : undefined),
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
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
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

    await AuditLogModel.create({
      actor_id: user?.id || `guest:${createdOrder.guest_email || 'anonymous'}`,
      action: 'payment.verified.razorpay',
      entity: 'order',
      entity_id: createdOrder._id.toString(),
      metadata: {
        orderNumber: newOrderNumber,
        billNumber: newBillNumber,
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        amountPaise: paymentEntity.amount,
        status: paymentEntity.status,
        verifiedAt: new Date().toISOString(),
      },
    });

    const recipientEmail = createdOrder.shipping_address?.email || createdOrder.guest_email || user?.email;
    if (recipientEmail) {
      try {
        await sendOrderConfirmation({
          toEmail: recipientEmail,
          customerName: createdOrder.shipping_address?.fullName || user?.fullName || 'Customer',
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
          customerName: createdOrder.shipping_address?.fullName || user?.fullName || 'Customer',
          orderNumber: createdOrder.order_number,
          billNumber: createdOrder.bill_number,
          paymentId,
          amountPaise: paymentEntity.amount,
          paymentMethod: 'razorpay',
        });

        createdOrder.confirmation_email_sent = true;
        createdOrder.confirmation_email_sent_at = new Date();
        await createdOrder.save();
      } catch (emailErr) {
        console.warn('[verify-payment] Email dispatch failed:', emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      verified: true,
      orderNumber: newOrderNumber,
      billNumber: newBillNumber,
      order_id: orderId,
      payment_id: paymentId,
    });
  } catch (err: any) {
    console.error('[verify-payment] Error:', err);
    return NextResponse.json(
      { error: err?.message || 'Internal error during payment verification.' },
      { status: 500 }
    );
  }
}
