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
  const auth = await getAuthenticatedUser();
  if ('error' in auth) {
    return NextResponse.json({ error: 'Authentication required to view invoice' }, { status: 401 });
  }

  const { id } = await props.params;
  const decodedId = decodeURIComponent(id);

  try {
    await connectToDatabase();

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(decodedId);
    const order = await OrderModel.findOne(
      isObjectId ? { $or: [{ _id: decodedId }, { order_number: decodedId }] } : { order_number: decodedId }
    ).lean();

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // IDOR Authorization Check: Order owner or Admin/Staff only
    const isOwner = order.user_id && order.user_id === auth.user.id;
    const isAdmin = auth.user.role === 'admin' || auth.user.role === 'staff';
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden: You are not authorized to view this invoice' }, { status: 403 });
    }

    const settings = await getSiteSettingsAction();

    const formattedDate = order.created_at
      ? new Date(order.created_at).toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : new Date().toLocaleDateString('en-IN');

    const address = order.shipping_address || {};
    const formattedAddress = [
      address.line1,
      address.line2,
      address.city,
      address.state,
      address.pincode ? `PIN: ${address.pincode}` : '',
    ]
      .filter(Boolean)
      .join(', ');

    const html = generateInvoiceHtml({
      invoiceNumber: settings.gst_enabled
        ? `TTRC/25-26/${order.order_number.replace(/\D/g, '').padStart(6, '0')}`
        : `TTRC/REC/25-26/${order.order_number.replace(/\D/g, '').padStart(6, '0')}`,
      orderNumber: order.order_number,
      orderDate: formattedDate,
      paymentMethod: order.payment_method === 'cod' ? 'Cash on Delivery (COD)' : 'Razorpay (Online)',
      paymentId: order.razorpay_payment_id || (order.payment_method === 'cod' ? 'COD-CONFIRMED' : 'PENDING'),
      gstEnabled: settings.gst_enabled,
      sellerName: settings.company_name,
      sellerAddress: '12/42 Peelamedu, Coimbatore, Tamil Nadu — 641004',
      sellerGstin: settings.gstin,
      customerName: address.fullName || auth.user.fullName || 'Valued Customer',
      customerPhone: address.phone || '',
      customerAddress: formattedAddress || 'Customer Address',
      stateCode: '33',
      items: (order.items || []).map((item) => ({
        name: item.product_name,
        hsnCode: item.hsn_code || '8542',
        quantity: item.quantity,
        pricePaise: item.unit_price,
        gstPercent: (item.gst_percent || 18) as any,
      })),
      shippingPaise: order.shipping_total || 0,
    });

    const docName = settings.gst_enabled
      ? `Tax-Invoice-${order.order_number}.html`
      : `Bill-of-Supply-${order.order_number}.html`;

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
