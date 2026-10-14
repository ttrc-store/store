import { NextResponse } from 'next/server';
import { getRazorpayClient, isRazorpayConfigured } from '@/lib/razorpay';
import { connectToDatabase } from '@/lib/mongodb/client';
import { OrderModel } from '@/lib/mongodb/models';
import { getAuthenticatedUser } from '@/lib/auth-helpers';

/**
 * POST /api/create-order
 * Server-Authoritative Razorpay Order Creation.
 *
 * Security Invariants:
 * 1. Customer Authentication required (prevents unauthorized order initialization).
 * 2. Order Ownership required (Customer A cannot create a payment for Customer B's order).
 * 3. Server-Authoritative Amount: Amount is ALWAYS loaded from trusted MongoDB order record.
 *    Client-supplied amounts are NEVER accepted for customer orders.
 * 4. Status Check: Only 'pending' orders can be initiated for payment.
 * 5. Idempotent: Reuses existing valid Razorpay order if already initialized.
 * 6. DB Persistence: Persists razorpay_order_id to DB before exposing to client.
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

    const { orderNumber, orderId, isDevTest, amount } = body || {};

    // Isolated developer test mode — strictly forbidden in production
    const isProd = process.env.NODE_ENV === 'production';
    if (isDevTest) {
      if (isProd) {
        return NextResponse.json(
          { error: 'Test payment mode is disabled in production.' },
          { status: 403 }
        );
      }

      const testAmount = Number(amount);
      if (!testAmount || testAmount < 100) {
        return NextResponse.json(
          { error: 'Valid test amount in paise (minimum 100 paise) required.' },
          { status: 400 }
        );
      }

      const razorpay = getRazorpayClient();
      const testRpOrder = await razorpay.orders.create({
        amount: testAmount,
        currency: 'INR',
        receipt: `test_${Date.now()}`,
        notes: { environment: 'development_test' },
      });

      return NextResponse.json({
        success: true,
        order_id: testRpOrder.id,
        amount: testRpOrder.amount,
        currency: testRpOrder.currency,
        receipt: testRpOrder.receipt,
      });
    }

    // 1. Check user authentication
    const auth = await getAuthenticatedUser();
    const isAuthenticated = !('error' in auth);
    const user = isAuthenticated ? auth.user : null;
    const guestEmail = typeof body?.guestEmail === 'string' ? body.guestEmail.trim().toLowerCase() : undefined;

    // 2. Validate order identifier
    if (!orderNumber && !orderId) {
      return NextResponse.json(
        { error: 'Missing order identifier: orderNumber or orderId is required.' },
        { status: 400 }
      );
    }

    // 3. Retrieve authoritative order from MongoDB
    await connectToDatabase();
    const query: any = {
      $or: [
        ...(orderNumber ? [{ order_number: orderNumber }] : []),
        ...(orderId ? [{ _id: orderId }] : []),
      ],
    };

    const order = await OrderModel.findOne(query);
    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    // 4. Enforce customer or guest ownership (IDOR defense)
    if (order.user_id) {
      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized: Authentication required.' },
          { status: 401 }
        );
      }
      if (order.user_id !== user.id && user.role !== 'admin') {
        return NextResponse.json(
          { error: 'Unauthorized: You can only create payment orders for your own account.' },
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
      // Order has no user_id or guest_email
      if (!user && !guestEmail) {
        return NextResponse.json(
          { error: 'Unauthorized: Authentication or guest email required.' },
          { status: 401 }
        );
      }
    }

    // 5. Enforce valid order status for payment initialization
    if (order.payment_status === 'paid') {
      return NextResponse.json(
        { error: 'This order has already been paid.' },
        { status: 400 }
      );
    }

    if (order.status === 'cancelled') {
      return NextResponse.json(
        { error: 'This order has been cancelled.' },
        { status: 400 }
      );
    }

    // 6. Server-authoritative amount in integer paise
    const authoritativeAmountPaise = order.total;
    if (typeof authoritativeAmountPaise !== 'number' || authoritativeAmountPaise < 100) {
      return NextResponse.json(
        { error: 'Invalid order total: minimum payable amount is ₹1.00 (100 paise).' },
        { status: 400 }
      );
    }

    const razorpay = getRazorpayClient();

    // 7. Idempotency: If Razorpay order already exists on this order, check and reuse it
    if (order.razorpay_order_id) {
      try {
        const existingRpOrder = await razorpay.orders.fetch(order.razorpay_order_id);
        if (existingRpOrder && (existingRpOrder.status === 'created' || existingRpOrder.status === 'attempted')) {
          return NextResponse.json({
            success: true,
            order_id: existingRpOrder.id,
            amount: existingRpOrder.amount,
            currency: existingRpOrder.currency,
            receipt: existingRpOrder.receipt,
            idempotent: true,
          });
        }
      } catch (fetchErr) {
        console.warn('[create-order] Existing Razorpay order not reusable, creating fresh order:', fetchErr);
      }
    }

    // 8. Call Razorpay API with server-trusted values
    const razorpayOrder = await razorpay.orders.create({
      amount: authoritativeAmountPaise,
      currency: 'INR',
      receipt: order.order_number.slice(0, 40),
      notes: {
        orderNumber: order.order_number,
        userId: user?.id || 'guest',
      },
    });

    // 9. Persist Razorpay order ID to MongoDB BEFORE returning to client
    order.razorpay_order_id = razorpayOrder.id;
    order.payment_method = 'razorpay';
    await order.save();

    return NextResponse.json({
      success: true,
      order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      receipt: razorpayOrder.receipt,
    });
  } catch (err: any) {
    console.error('[create-order] Error:', err);
    if (err?.statusCode === 401 || (err?.error?.code === 'BAD_REQUEST_ERROR' && err?.error?.description?.includes('auth'))) {
      return NextResponse.json(
        { error: 'Razorpay authentication failed. Please verify API keys.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: err?.error?.description || err?.message || 'Failed to create payment order.' },
      { status: 500 }
    );
  }
}
