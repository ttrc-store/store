import { NextResponse } from 'next/server';
import { verifyRazorpaySignature, isRazorpayConfigured, getRazorpayClient } from '@/lib/razorpay';
import { connectToDatabase } from '@/lib/mongodb/client';
import { OrderModel, AuditLogModel } from '@/lib/mongodb/models';
import { getAuthenticatedUser } from '@/lib/auth-helpers';

/**
 * POST /api/verify-payment
 * Secure Payment Signature & Authorization Verification.
 *
 * Security Invariants:
 * 1. Customer Authentication required.
 * 2. Order Ownership required (Customer A cannot verify or manipulate Customer B's order).
 * 3. Exact Order ID Binding: razorpay_order_id must match the value persisted on the order record.
 * 4. Cryptographic Proof: Timing-safe HMAC-SHA256 signature verification.
 * 5. Payment Invariant: Fetches payment directly from Razorpay API to verify:
 *    - Status is 'captured' (or captured on the spot if 'authorized')
 *    - Amount EXACTLY matches authoritative order.total in paise
 *    - Currency is 'INR'
 *    - Payment's order_id matches order.razorpay_order_id
 * 6. Idempotency: Duplicate calls for an already-paid order return success without double-processing.
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
    if (!orderId || !paymentId || !signature || !orderNumber) {
      return NextResponse.json(
        {
          error: 'Missing required payment verification fields: razorpay_order_id, razorpay_payment_id, razorpay_signature, and orderNumber are required.',
          received: {
            hasOrderId: Boolean(orderId),
            hasPaymentId: Boolean(paymentId),
            hasSignature: Boolean(signature),
            hasOrderNumber: Boolean(orderNumber),
          },
        },
        { status: 400 }
      );
    }

    // 2. Authenticate customer if logged in
    const auth = await getAuthenticatedUser();
    const user = !('error' in auth) ? auth.user : null;

    // 3. Retrieve internal order from MongoDB
    await connectToDatabase();
    const order = await OrderModel.findOne({
      $or: [{ order_number: orderNumber }, { _id: orderNumber }],
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found in database.' }, { status: 404 });
    }

    // 4. Enforce customer ownership or guest ownership (IDOR defense)
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
    } else {
      if (!user && !guestEmail) {
        return NextResponse.json(
          { error: 'Unauthorized: Authentication or guest email required.' },
          { status: 401 }
        );
      }
    }

    // 5. Idempotent check
    if (order.payment_status === 'paid') {
      if (order.razorpay_payment_id === paymentId) {
        return NextResponse.json({
          success: true,
          verified: true,
          idempotent: true,
          message: 'Payment has already been verified for this order.',
          order_id: orderId,
          payment_id: paymentId,
        });
      }
      return NextResponse.json(
        { error: 'This order has already been marked paid with another payment transaction.' },
        { status: 400 }
      );
    }

    // 6. Enforce that Razorpay order ID matches the order's registered ID
    if (!order.razorpay_order_id || order.razorpay_order_id !== orderId) {
      console.warn(
        `[verify-payment] Order ID mismatch: received ${orderId}, expected ${order.razorpay_order_id} for order ${order.order_number}`
      );
      return NextResponse.json(
        { error: 'Payment verification failed: Razorpay order ID mismatch.' },
        { status: 400 }
      );
    }

    // 7. Verify HMAC-SHA256 signature using timing-safe comparison
    const isValidSignature = verifyRazorpaySignature({
      orderId,
      paymentId,
      signature,
    });

    if (!isValidSignature) {
      console.warn(`[verify-payment] Signature mismatch for order ${order.order_number}`);
      return NextResponse.json(
        {
          success: false,
          verified: false,
          error: 'Payment verification failed: signature mismatch.',
        },
        { status: 400 }
      );
    }

    // 8. Server-side payment status and financial verification via Razorpay API
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

    // Financial invariant: Payment order_id must match
    if (paymentEntity.order_id !== orderId) {
      console.error(
        `[verify-payment] Payment ${paymentId} belongs to Razorpay order ${paymentEntity.order_id}, expected ${orderId}`
      );
      return NextResponse.json(
        { error: 'Payment does not match the expected Razorpay order.' },
        { status: 400 }
      );
    }

    // Financial invariant: Amount in paise must match authoritative order total
    if (paymentEntity.amount !== order.total) {
      console.error(
        `[verify-payment] ⚠️ Amount mismatch: gateway paid ${paymentEntity.amount} paise, order total is ${order.total} paise`
      );
      return NextResponse.json(
        { error: 'Payment amount mismatch: gateway amount does not match order total.' },
        { status: 400 }
      );
    }

    // Currency verification
    if (paymentEntity.currency !== 'INR') {
      return NextResponse.json(
        { error: 'Payment currency mismatch: expected INR.' },
        { status: 400 }
      );
    }

    // Payment capture status check
    if (paymentEntity.status === 'authorized') {
      try {
        const razorpay = getRazorpayClient();
        paymentEntity = await razorpay.payments.capture(paymentId, order.total, 'INR');
      } catch (captureErr: any) {
        console.error('[verify-payment] Auto-capture failed:', captureErr);
        return NextResponse.json(
          { error: 'Payment authorized but could not be captured. Please contact support.' },
          { status: 500 }
        );
      }
    }

    if (paymentEntity.status !== 'captured') {
      console.warn(`[verify-payment] Payment ${paymentId} status is '${paymentEntity.status}', expected 'captured'`);
      return NextResponse.json(
        { error: `Payment is not captured. Current status: ${paymentEntity.status}` },
        { status: 400 }
      );
    }

    // 9. Mark order as paid in MongoDB
    order.payment_status = 'paid';
    order.status = 'processing';
    order.payment_method = 'razorpay';
    order.razorpay_order_id = orderId;
    order.razorpay_payment_id = paymentId;
    order.razorpay_signature = signature;
    await order.save();

    // 10. Record audit log
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

    console.log(`[verify-payment] ✅ Authoritatively verified and marked order ${order.order_number} as PAID.`);

    return NextResponse.json({
      success: true,
      verified: true,
      message: 'Payment signature and capture authoritatively verified.',
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
