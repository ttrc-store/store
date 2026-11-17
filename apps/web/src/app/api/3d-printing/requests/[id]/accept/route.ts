import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/client';
import {
  PrintRequestModel,
  PrintQuoteModel,
  CheckoutSessionModel,
} from '@/lib/mongodb/models';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await connectToDatabase();

    const request = await PrintRequestModel.findById(id);
    if (!request) {
      return NextResponse.json({ error: 'Request not found.' }, { status: 404 });
    }

    if (request.quotation_status !== 'QUOTE_SENT') {
      return NextResponse.json(
        { error: 'Only requests in QUOTE_SENT state can be accepted.' },
        { status: 400 }
      );
    }

    const quote = await PrintQuoteModel.findOne({ request_id: id }).sort({ version: -1 });
    if (!quote) {
      return NextResponse.json({ error: 'Official quotation record not found.' }, { status: 404 });
    }

    // Update statuses
    request.quotation_status = 'ACCEPTED';
    request.production_status = 'PAYMENT_PENDING';
    request.active_quote_id = quote._id.toString();

    request.status_history.push({
      machine: 'quotation',
      from_status: 'QUOTE_SENT',
      to_status: 'ACCEPTED',
      changed_by: request.customer.email,
      timestamp: new Date(),
      notes: `Customer accepted quotation ${quote.quote_number} (Total: ₹${(quote.breakdown.total_paise / 100).toFixed(2)})`,
    });

    request.status_history.push({
      machine: 'production',
      from_status: 'NOT_STARTED',
      to_status: 'PAYMENT_PENDING',
      changed_by: 'system',
      timestamp: new Date(),
      notes: 'Payment checkout initiated.',
    });

    // Create Checkout Session in Store
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const quantity = request.configuration.quantity || 1;
    const subtotal = quote.breakdown.material_cost_paise + quote.breakdown.machine_cost_paise + quote.breakdown.labour_cost_paise + quote.breakdown.finishing_cost_paise;
    const unitPrice = Math.round(subtotal / quantity);

    const session = await CheckoutSessionModel.create({
      user_id: request.user_id,
      guest_email: request.customer.email,
      status: 'pending',
      items: [
        {
          product_id: `3dp_${request.request_number}`,
          product_name: `Custom 3D Print: ${request.file.original_filename} (${request.configuration.material}, ${request.configuration.color})`,
          sku: `3DP-${request.configuration.material}-${request.request_number}`,
          unit_price: unitPrice,
          quantity,
          total_price: subtotal,
          gst_percent: 18,
          hsn_code: '8477',
          is_spare_part: false,
        },
      ],
      subtotal,
      discount_total: 0,
      tax_total: quote.breakdown.tax_paise,
      shipping_total: quote.breakdown.shipping_cost_paise + quote.breakdown.packaging_cost_paise,
      total: quote.breakdown.total_paise,
      shipping_address: {
        fullName: request.customer.name,
        phone: request.customer.mobile,
        line1: request.customer.delivery_address || 'Address pending verification',
        city: request.customer.city,
        state: 'Tamil Nadu',
        pincode: '600001',
      },
      expires_at: expiresAt,
    });

    await request.save();

    return NextResponse.json({
      success: true,
      request,
      checkoutUrl: `/checkout?session_id=${session._id.toString()}`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Error accepting quotation.' },
      { status: 500 }
    );
  }
}
