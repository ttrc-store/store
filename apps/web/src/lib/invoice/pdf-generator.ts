/**
 * GST Tax Invoice Generator
 * Formats GST-compliant Tax Invoices for Tamizh Tech e-commerce orders in India.
 */

import { calculateGstFromInclusive, formatRupees } from '@ttrc/shared';

export interface InvoiceItemPayload {
  name: string;
  hsnCode: string;
  quantity: number;
  pricePaise: number; // inclusive price per unit
  gstPercent: 5 | 12 | 18 | 28;
}

export interface InvoicePayload {
  invoiceNumber: string; // e.g. TTRC/25-26/000123 or TTRC/REC/25-26/000123
  orderNumber: string;
  orderDate: string;
  paymentMethod: string;
  paymentId?: string;
  gstEnabled?: boolean;

  // Seller Details
  sellerName: string;
  sellerAddress: string;
  sellerGstin?: string;

  // Customer Details
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  stateCode: string; // 33 = Tamil Nadu

  items: InvoiceItemPayload[];
  shippingPaise: number;
}

/**
 * Convert number in rupees to English words format.
 */

export function convertAmountToWords(totalRupees: number): string {
  if (totalRupees === 0) return 'Zero Rupees Only';
  return `${totalRupees.toLocaleString('en-IN')} Rupees Only`;
}

/**
 * Generate printable HTML invoice string.
 */

export function generateInvoiceHtml(data: InvoicePayload): string {
  const isGstEnabled = data.gstEnabled ?? false;
  const isIntraState = data.stateCode === '33'; // Tamil Nadu

  let _totalTaxablePaise = 0;
  let _totalCgstPaise = 0;
  let _totalSgstPaise = 0;
  let _totalIgstPaise = 0;
  let totalAmountPaise = 0;

  const itemRowsHtml = data.items.map((item, idx) => {
    const lineInclusivePaise = item.pricePaise * item.quantity;
    totalAmountPaise += lineInclusivePaise;

    if (isGstEnabled) {
      const gst = calculateGstFromInclusive(lineInclusivePaise, item.gstPercent, !isIntraState);
      _totalTaxablePaise += gst.taxableAmountPaise;
      _totalCgstPaise += gst.cgstPaise;
      _totalSgstPaise += gst.sgstPaise;
      _totalIgstPaise += gst.igstPaise;

      return `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${idx + 1}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">${item.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-family: monospace;">${item.hsnCode}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatRupees(gst.taxableAmountPaise)}</td>
          ${
            isIntraState
              ? `
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${item.gstPercent / 2}% (${formatRupees(gst.cgstPaise)})</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${item.gstPercent / 2}% (${formatRupees(gst.sgstPaise)})</td>
          `
              : `
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${item.gstPercent}% (${formatRupees(gst.igstPaise)})</td>
          `
          }
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold;">${formatRupees(lineInclusivePaise)}</td>
        </tr>
      `;
    } else {
      // Bill of Supply mode (No GST columns)
      return `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${idx + 1}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">${item.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatRupees(item.pricePaise)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold;">${formatRupees(lineInclusivePaise)}</td>
        </tr>
      `;
    }
  }).join('');

  totalAmountPaise += data.shippingPaise;

  const docTitle = isGstEnabled ? 'TAX INVOICE' : 'BILL OF SUPPLY / SALE RECEIPT';
  const numberLabel = isGstEnabled ? 'Invoice #' : 'Receipt #';
  const gstinRow = isGstEnabled && data.sellerGstin ? `<div><strong>GSTIN:</strong> ${data.sellerGstin}</div>` : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${docTitle} - ${data.invoiceNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; color: #000; margin: 0; padding: 24px; font-size: 12px; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #E3132A; padding-bottom: 12px; margin-bottom: 20px; }
        .title { font-size: 20px; font-weight: bold; color: #E3132A; }
        .grid { display: flex; justify-content: space-between; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th { background: #f4f4f5; text-align: left; padding: 8px; border-bottom: 2px solid #d4d4d8; font-size: 11px; }
        .total-box { margin-top: 20px; text-align: right; font-size: 14px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="title">TAMIZH TECH</div>
          <div>${data.sellerAddress}</div>
          ${gstinRow}
        </div>
        <div style="text-align: right;">
          <div style="font-size: 16px; font-weight: bold;">${docTitle}</div>
          <div><strong>${numberLabel}</strong> ${data.invoiceNumber}</div>
          <div><strong>Order #:</strong> ${data.orderNumber}</div>
          <div><strong>Date:</strong> ${data.orderDate}</div>
        </div>
      </div>

      <div class="grid">
        <div>
          <strong>Billed & Shipped To:</strong><br>
          ${data.customerName}<br>
          ${data.customerAddress}<br>
          Phone: ${data.customerPhone}<br>
          State Code: ${data.stateCode}
        </div>
        <div style="text-align: right;">
          <strong>Payment Method:</strong> ${data.paymentMethod}<br>
          <strong>Payment ID:</strong> ${data.paymentId || 'N/A'}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Item Description</th>
            ${isGstEnabled ? '<th>HSN</th>' : ''}
            <th style="text-align: center;">Qty</th>
            ${
              isGstEnabled
                ? `<th style="text-align: right;">Taxable (₹)</th>
                   ${isIntraState ? '<th style="text-align: right;">CGST</th><th style="text-align: right;">SGST</th>' : '<th style="text-align: right;">IGST</th>'}`
                : '<th style="text-align: right;">Unit Price (₹)</th>'
            }
            <th style="text-align: right;">Total (₹)</th>
          </tr>
        </thead>
        <tbody>
          ${itemRowsHtml}
        </tbody>
      </table>

      <div class="total-box">
        <div>Grand Total: ${formatRupees(totalAmountPaise)}</div>
        <div style="font-size: 11px; font-weight: normal; color: #52525b; margin-top: 4px;">
          Amount in words: ${convertAmountToWords(Math.round(totalAmountPaise / 100))}
        </div>
      </div>

      <div style="margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 12px; font-size: 10px; color: #71717a; text-align: center;">
        This is a computer-generated ${docTitle.toLowerCase()}. No signature required. Thank you for shopping with Tamizh Tech (ttrc.store).
      </div>
    </body>
    </html>
  `;
}
