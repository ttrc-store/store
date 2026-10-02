import { NextResponse } from 'next/server';
import { generateInvoiceHtml } from '@/lib/invoice/pdf-generator';
import { getSiteSettingsAction } from '@/actions/settings';

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;
  const decodedId = decodeURIComponent(id);

  const settings = await getSiteSettingsAction();

  // Generate invoice data for order based on site_settings.gst_enabled
  const html = generateInvoiceHtml({
    invoiceNumber: settings.gst_enabled ? `TTRC/25-26/${decodedId.replace(/\D/g, '').padStart(6, '0')}` : `TTRC/REC/25-26/${decodedId.replace(/\D/g, '').padStart(6, '0')}`,
    orderNumber: decodedId,
    orderDate: 'Sep 21, 2026',
    paymentMethod: 'Cash on Delivery (COD)',
    paymentId: 'COD-CONFIRMED',
    gstEnabled: settings.gst_enabled,
    sellerName: settings.company_name,
    sellerAddress: '12/42 Peelamedu, Coimbatore, Tamil Nadu — 641004',
    sellerGstin: settings.gstin,
    customerName: 'Karthik Raja',
    customerPhone: '+91 98765 43210',
    customerAddress: '12/42 Tamizh Tech Robotics Club, Peelamedu, Coimbatore - 641004',
    stateCode: '33',
    items: [
      { name: 'Robo Race Chassis Kit - Pro Edition', hsnCode: '84715000', quantity: 1, pricePaise: 249900, gstPercent: 18 },
      { name: 'N20 Micro Motor 300 RPM', hsnCode: '85016290', quantity: 2, pricePaise: 35000, gstPercent: 18 },
      { name: '3S 11.1V 2200mAh LiPo Battery', hsnCode: '85076000', quantity: 1, pricePaise: 185000, gstPercent: 18 },
    ],
    shippingPaise: 0,
  });

  const docName = settings.gst_enabled ? `Tax-Invoice-${decodedId}.html` : `Bill-of-Supply-${decodedId}.html`;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="${docName}"`,
    },
  });
}
