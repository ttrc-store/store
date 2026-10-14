import { NextResponse } from 'next/server';
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
      isObjectId ? { $or: [{ _id: decodedId }, { order_number: decodedId }, { bill_number: decodedId }] } : { $or: [{ order_number: decodedId }, { bill_number: decodedId }] }
    ).lean();

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Authorization: User owner, guest email match, or staff/admin
    const auth = await getAuthenticatedUser();
    const isAuthenticated = !('error' in auth);
    const url = new URL(request.url);
    const queryEmail = url.searchParams.get('email')?.toLowerCase().trim();

    const isOwner = isAuthenticated && order.user_id && order.user_id === auth.user.id;
    const isAdmin = isAuthenticated && (auth.user.role === 'admin' || auth.user.role === 'staff');
    const isGuestMatch = Boolean(
      order.guest_email &&
      queryEmail &&
      order.guest_email.toLowerCase() === queryEmail
    );

    // If order was created recently (within 24 hours), allow retrieval by direct order_number / bill_number link from checkout
    const orderAgeMs = Date.now() - new Date(order.created_at || Date.now()).getTime();
    const isRecentOrder = orderAgeMs < 24 * 60 * 60 * 1000;

    if (!isOwner && !isAdmin && !isGuestMatch && !isRecentOrder) {
      return NextResponse.json({ error: 'Forbidden: You are not authorized to view this invoice' }, { status: 403 });
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
      items: (order.items || []).map((item) => ({
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
      },
    });
  } catch (err: any) {
    console.error('[Invoice API Error]', err);
    return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 });
  }
}
