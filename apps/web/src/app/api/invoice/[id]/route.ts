import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { generateInvoiceHtml } from '@/lib/invoice/pdf-generator';
import { getSiteSettingsAction } from '@/actions/settings';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { connectToDatabase } from '@/lib/mongodb/client';
import { OrderModel } from '@/lib/mongodb/models';

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;
  const decodedId = decodeURIComponent(id);

  try {
    await connectToDatabase();

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(decodedId);
    const order = await OrderModel.findOne(
      isObjectId
        ? { $or: [{ _id: decodedId }, { order_number: decodedId }, { bill_number: decodedId }] }
        : { $or: [{ order_number: decodedId }, { bill_number: decodedId }] }
    ).lean();

    const denyResponse = () =>
      NextResponse.json(
        { error: 'Invoice not found or access denied.' },
        {
          status: 404,
          headers: {
            'Cache-Control': 'private, no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'X-Content-Type-Options': 'nosniff',
            'Referrer-Policy': 'no-referrer',
          },
        }
      );

    if (!order) {
      return denyResponse();
    }

    // 1. Session-based authorization (Order Owner or Admin/Staff)
    const auth = await getAuthenticatedUser();
    const isAuthenticated = !('error' in auth);
    const isOwner = isAuthenticated && Boolean(order.user_id && order.user_id === auth.user.id);
    const isAdmin = isAuthenticated && (auth.user.role === 'admin' || auth.user.role === 'staff');

    // 2. High-entropy guest token verification
    const url = new URL(request.url);
    const queryToken = url.searchParams.get('token');

    let isTokenAuthorized = false;
    if (queryToken && typeof queryToken === 'string' && queryToken.length >= 32) {
      const candidateHash = crypto.createHash('sha256').update(queryToken.trim()).digest('hex');
      if (order.guest_invoice_token_hash) {
        const storedBuf = Buffer.from(order.guest_invoice_token_hash, 'hex');
        const candidateBuf = Buffer.from(candidateHash, 'hex');
        if (storedBuf.length === candidateBuf.length && crypto.timingSafeEqual(storedBuf, candidateBuf)) {
          isTokenAuthorized = true;
        }
      }
    }

    // Strict Deny-by-Default: Identical response whether order exists or not
    if (!isOwner && !isAdmin && !isTokenAuthorized) {
      return denyResponse();
    }

    // Guest Token Lifecycle & Revocation:
    // If accessing via guest token, access is permanently revoked if order is cancelled, refunded,
    // or if the guest token has been explicitly marked as revoked.
    if (isTokenAuthorized && !isOwner && !isAdmin) {
      if (order.status === 'cancelled' || order.status === 'refunded' || (order as any).guest_invoice_token_revoked) {
        return denyResponse();
      }
    }

    const settings = await getSiteSettingsAction();

    // Date formatting: DD/MM/YYYY, hh:mm a (e.g. 14/10/2026, 01:02 pm)
    const orderDateObj = order.created_at ? new Date(order.created_at) : new Date();
    const datePart = orderDateObj.toLocaleDateString('en-GB'); // DD/MM/YYYY
    const timePart = orderDateObj.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).toLowerCase();
    const formattedDateTime = `${datePart}, ${timePart}`;

    const shipAddr = order.shipping_address || {};
    const formattedShippingAddress = [
      shipAddr.line1,
      shipAddr.line2,
      shipAddr.city,
      shipAddr.state ? `${shipAddr.state} - ${shipAddr.pincode || ''}` : shipAddr.pincode,
    ]
      .filter(Boolean)
      .join(', ');

    const billAddr = order.billing_address || shipAddr;
    const formattedBillingAddress = [
      billAddr.line1,
      billAddr.line2,
      billAddr.city,
      billAddr.state ? `${billAddr.state} - ${billAddr.pincode || ''}` : billAddr.pincode,
    ]
      .filter(Boolean)
      .join(', ');

    const billYear = orderDateObj.getFullYear();
    const fallbackSeq = (order.order_number || '00001').replace(/\D/g, '').padStart(5, '0');
    const billNumber = order.bill_number || `TTRC-BILL-${billYear}-${fallbackSeq}`;

    const resolvedStateCode = (order as any).state_code || (shipAddr.state === 'Tamil Nadu' ? '33' : '33');
    const placeOfSupply = shipAddr.state ? `${shipAddr.state} (${resolvedStateCode})` : 'Tamil Nadu (33)';

    const html = generateInvoiceHtml({
      invoiceNumber: billNumber,
      orderNumber: order.order_number,
      orderDate: formattedDateTime,
      paymentMethod: order.payment_method === 'cod' ? 'Cash on Delivery (COD)' : 'Razorpay (Online Payment)',
      paymentId: order.razorpay_payment_id || (order.payment_method === 'cod' ? 'COD-CONFIRMED' : 'ONLINE-VERIFIED'),
      gstEnabled: settings.gst_enabled,
      sellerName: 'TTRC',
      sellerAddress: 'Sri Vari Garden, 22, 3rd Cross, Kurumbapalayam, SSKulam, Sarcarsamakulam, Coimbatore, Tamil Nadu, 641107',
      sellerGstin: settings.gstin,
      customerName: billAddr.fullName || shipAddr.fullName || (isAuthenticated ? auth.user.fullName : 'Valued Customer'),
      customerPhone: billAddr.phone || shipAddr.phone || '',
      customerAddress: formattedBillingAddress || 'Customer Address',
      shippingName: shipAddr.fullName || (isAuthenticated ? auth.user.fullName : 'Valued Customer'),
      shippingPhone: shipAddr.phone || '',
      shippingAddress: formattedShippingAddress || formattedBillingAddress || 'Customer Address',
      stateCode: resolvedStateCode,
      placeOfSupply,
      items: ((order as any).items || []).map((item: any) => ({
        name: item.product_name,
        hsnCode: item.hsn_code || '8479',
        quantity: item.quantity,
        pricePaise: item.unit_price,
        gstPercent: Number(item.gst_percent || 18),
      })),
      shippingPaise: order.shipping_total ?? 5900,
      subtotalPaise: order.subtotal,
      discountPaise: order.discount_total || 0,
    });

    const docName = `Invoice-${billNumber}.html`;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="${docName}"`,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Referrer-Policy': 'no-referrer',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to generate invoice.' },
      {
        status: 500,
        headers: {
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Content-Type-Options': 'nosniff',
          'Referrer-Policy': 'no-referrer',
        },
      }
    );
  }
}
