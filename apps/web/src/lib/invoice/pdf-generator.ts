/**
 * TTRC Authoritative Tax Invoice Generator
 * Formats GST-compliant Tax Invoices matching ERP standard for TTRC Store.
 */

import fs from 'fs';
import path from 'path';

export interface InvoiceItemPayload {
  name: string;
  hsnCode: string;
  quantity: number;
  pricePaise: number; // Unit rate in paise
  gstPercent: number; // e.g. 5, 12, 18, 28
}

export interface InvoicePayload {
  invoiceNumber: string; // TTRC-BILL-2026-00001
  orderNumber: string;
  orderDate: string; // e.g. 14/10/2026, 01:02 pm
  paymentMethod: string;
  paymentId?: string;
  gstEnabled?: boolean;

  // Seller Details
  sellerName?: string;
  sellerAddress?: string;
  sellerGstin?: string;

  // Customer Details
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  shippingName?: string;
  shippingAddress?: string;
  shippingPhone?: string;
  stateCode: string; // 33 = Tamil Nadu
  placeOfSupply?: string;

  items: InvoiceItemPayload[];
  shippingPaise: number;
  subtotalPaise?: number;
  discountPaise?: number;
}

/**
 * Convert number in Indian rupees to standard English currency words format.
 * Example: 3710 -> "Indian Rupee Three Thousand Seven Hundred and Ten Only"
 */
export function convertAmountToIndianWords(rupees: number): string {
  if (rupees === 0) return 'Indian Rupee Zero Only';

  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n: number): string {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + inWords(n % 10000000) : '');
  }

  const integerPart = Math.floor(rupees);
  const words = inWords(integerPart).trim();
  return `Indian Rupee ${words} Only`;
}

function getBase64Image(relativePath: string): string {
  try {
    const candidatePaths = [
      path.join(process.cwd(), 'apps', 'web', relativePath),
      path.join(process.cwd(), relativePath),
    ];
    for (const fullPath of candidatePaths) {
      if (fs.existsSync(/*turbopackIgnore: true*/ fullPath)) {
        const ext = path.extname(fullPath).replace('.', '') || 'png';
        const base64 = fs.readFileSync(/*turbopackIgnore: true*/ fullPath).toString('base64');
        return `data:image/${ext};base64,${base64}`;
      }
    }
  } catch {
    // ignore
  }
  return '';
}

/**
 * Generate printable HTML invoice string matching ERP specification.
 */
export function generateInvoiceHtml(data: InvoicePayload): string {
  const isIntraState = data.stateCode === '33'; // Tamil Nadu

  // Load signature and logo as Base64 data URIs
  const signatureDataUri = getBase64Image('public/signature.png') || '/signature.png';
  const logoDataUri = getBase64Image('public/brand/ttrc-logo.png') || '/brand/ttrc-logo.png';

  let computedSubtotalPaise = 0;
  let totalCgstPaise = 0;
  let totalSgstPaise = 0;
  let totalIgstPaise = 0;
  let totalTaxPaise = 0;

  const itemRowsHtml = data.items.map((item, idx) => {
    const lineSubtotalPaise = item.pricePaise * item.quantity;
    computedSubtotalPaise += lineSubtotalPaise;

    const lineTaxPaise = Math.round((lineSubtotalPaise * (item.gstPercent || 18)) / 100);
    totalTaxPaise += lineTaxPaise;

    if (isIntraState) {
      const half = Math.round(lineTaxPaise / 2);
      totalCgstPaise += half;
      totalSgstPaise += (lineTaxPaise - half);
    } else {
      totalIgstPaise += lineTaxPaise;
    }

    const lineTotalAmountPaise = lineSubtotalPaise + lineTaxPaise;

    return `
      <tr>
        <td style="padding: 10px 8px; border: 1px solid #d1d5db; text-align: center; vertical-align: middle;">${idx + 1}</td>
        <td style="padding: 10px 10px; border: 1px solid #d1d5db; vertical-align: middle;">
          <div style="font-weight: 700; color: #111827;">${item.name}</div>
        </td>
        <td style="padding: 10px 8px; border: 1px solid #d1d5db; text-align: center; font-family: monospace; vertical-align: middle;">${item.hsnCode || '8479'}</td>
        <td style="padding: 10px 8px; border: 1px solid #d1d5db; text-align: center; font-weight: 600; vertical-align: middle;">${item.quantity}</td>
        <td style="padding: 10px 10px; border: 1px solid #d1d5db; text-align: right; vertical-align: middle;">₹${(item.pricePaise / 100).toFixed(2)}</td>
        <td style="padding: 10px 8px; border: 1px solid #d1d5db; text-align: right; vertical-align: middle;">${item.gstPercent}%</td>
        <td style="padding: 10px 10px; border: 1px solid #d1d5db; text-align: right; vertical-align: middle;">₹${(lineTaxPaise / 100).toFixed(2)}</td>
        <td style="padding: 10px 10px; border: 1px solid #d1d5db; text-align: right; font-weight: 700; color: #111827; vertical-align: middle;">₹${(lineTotalAmountPaise / 100).toFixed(2)}</td>
      </tr>
    `;
  }).join('');

  const subtotalPaise = data.subtotalPaise ?? computedSubtotalPaise;
  const shippingPaise = data.shippingPaise || 0;
  const discountPaise = data.discountPaise || 0;
  const grandTotalPaise = Math.max(0, subtotalPaise + shippingPaise + totalTaxPaise - discountPaise);
  const totalRupees = Math.round(grandTotalPaise / 100);
  const amountWords = convertAmountToIndianWords(totalRupees);

  const placeOfSupplyText = data.placeOfSupply || (isIntraState ? 'Tamil Nadu (33)' : `Inter-State (${data.stateCode})`);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tax Invoice - ${data.invoiceNumber}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #1f2937;
      background: #f8fafc;
      padding: 30px 20px;
      font-size: 12px;
      line-height: 1.45;
    }
    .invoice-card {
      max-width: 900px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      box-shadow: 0 4px 12px rgba(0,0,0,0.06);
      padding: 36px 40px;
      border-radius: 6px;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
    }
    .company-title {
      font-size: 18px;
      font-weight: 800;
      color: #111827;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .company-address {
      font-size: 11px;
      color: #4b5563;
      line-height: 1.4;
      max-width: 440px;
    }
    .doc-type {
      text-align: right;
      vertical-align: top;
    }
    .doc-title {
      font-size: 20px;
      font-weight: 800;
      color: #111827;
      letter-spacing: 0.5px;
    }
    .doc-subtitle {
      font-size: 11px;
      font-weight: 600;
      color: #b45309;
      margin-top: 2px;
    }
    .meta-bar {
      border: 1px solid #d1d5db;
      background-color: #f9fafb;
      padding: 9px 14px;
      margin: 16px 0 20px 0;
      font-size: 11px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-radius: 4px;
    }
    .meta-bar-item {
      color: #374151;
    }
    .meta-bar-item strong {
      color: #111827;
    }
    .address-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 22px;
    }
    .address-box {
      border: 1px solid #d1d5db;
      border-radius: 4px;
      overflow: hidden;
    }
    .address-box-header {
      background: #f3f4f6;
      padding: 6px 12px;
      font-weight: 800;
      font-size: 11px;
      color: #374151;
      border-bottom: 1px solid #d1d5db;
      letter-spacing: 0.5px;
    }
    .address-box-content {
      padding: 10px 12px;
      font-size: 11px;
      line-height: 1.45;
      color: #4b5563;
      min-height: 64px;
    }
    .address-box-content strong {
      color: #111827;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 11px;
    }
    .items-table th {
      background: #f3f4f6;
      border: 1px solid #d1d5db;
      padding: 8px 10px;
      font-size: 10px;
      font-weight: 800;
      color: #374151;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .lower-section {
      display: grid;
      grid-template-columns: 1.25fr 1fr;
      gap: 24px;
      margin-top: 10px;
    }
    .words-label {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      color: #374151;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }
    .words-value {
      font-size: 11px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 14px;
    }
    .paid-badge {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      padding: 8px 12px;
      border-radius: 4px;
      margin-bottom: 14px;
    }
    .paid-badge-title {
      font-size: 11px;
      font-weight: 800;
      color: #059669;
      letter-spacing: 0.5px;
    }
    .paid-badge-sub {
      font-size: 10px;
      color: #047857;
      margin-top: 1px;
    }
    .notes-label, .terms-label {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      color: #374151;
      margin-top: 10px;
      margin-bottom: 3px;
    }
    .notes-text {
      font-size: 10px;
      color: #4b5563;
      margin-bottom: 10px;
    }
    .terms-list {
      font-size: 9.5px;
      color: #6b7280;
      padding-left: 14px;
      line-height: 1.45;
    }
    .totals-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      font-size: 11px;
      margin-bottom: 16px;
    }
    .totals-table td {
      padding: 7px 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    .totals-table .val {
      text-align: right;
      font-weight: 600;
      color: #111827;
    }
    .totals-table .grand-total-row td {
      font-size: 13px;
      font-weight: 800;
      color: #111827;
      border-top: 1px solid #d1d5db;
      border-bottom: 1px solid #d1d5db;
      background: #fafafa;
      padding: 9px 12px;
    }
    .signature-area {
      text-align: center;
      padding-top: 10px;
    }
    .sig-for {
      font-size: 11px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 4px;
    }
    .sig-img {
      max-height: 65px;
      max-width: 190px;
      display: block;
      margin: 0 auto;
      object-fit: contain;
    }
    .sig-line {
      width: 170px;
      height: 1px;
      background: #9ca3af;
      margin: 4px auto 3px auto;
    }
    .sig-auth {
      font-size: 10px;
      color: #4b5563;
    }
    @media print {
      body {
        background: #ffffff;
        padding: 0;
      }
      .invoice-card {
        border: none;
        box-shadow: none;
        padding: 0;
        max-width: 100%;
      }
      @page {
        margin: 12mm;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <!-- Header: Company & Tax Invoice Title -->
    <table class="header-table">
      <tr>
        <td style="vertical-align: top; width: 65%;">
          <div style="display: flex; align-items: flex-start; gap: 14px;">
            <img src="${logoDataUri}" alt="TTRC" style="height: 48px; max-width: 140px; object-fit: contain;" />
            <div>
              <div class="company-title">TTRC</div>
              <div class="company-address">
                Sri Vari Garden, 22, 3rd Cross, Kurumbapalayam, SSKulam, Sarcarsamakulam, Coimbatore, Tamil Nadu, 641107<br>
                Phone: +91 81480 45030 | Email: contact@tamizhtech.in<br>
                Website: https://www.tamizhtech.in/
              </div>
            </div>
          </div>
        </td>
        <td class="doc-type">
          <div class="doc-title">TAX INVOICE</div>
          <div class="doc-subtitle">Original For Recipient</div>
        </td>
      </tr>
    </table>

    <!-- Metadata Bar -->
    <div class="meta-bar">
      <div class="meta-bar-item">
        <strong>Bill No :</strong> ${data.invoiceNumber}<br>
        <strong>Date :</strong> ${data.orderDate} IST
      </div>
      <div class="meta-bar-item" style="text-align: right;">
        <strong>Place Of Supply :</strong> ${placeOfSupplyText}
      </div>
    </div>

    <!-- Address Grid: BILL TO & SHIP TO -->
    <div class="address-grid">
      <div class="address-box">
        <div class="address-box-header">BILL TO</div>
        <div class="address-box-content">
          <strong>${data.customerName}</strong><br>
          ${data.customerAddress}<br>
          Phone: ${data.customerPhone || 'N/A'}
        </div>
      </div>
      <div class="address-box">
        <div class="address-box-header">SHIP TO</div>
        <div class="address-box-content">
          <strong>${data.shippingName || data.customerName}</strong><br>
          ${data.shippingAddress || data.customerAddress}<br>
          Phone: ${data.shippingPhone || data.customerPhone || 'N/A'}
        </div>
      </div>
    </div>

    <!-- Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 32px; text-align: center;">#</th>
          <th style="text-align: left;">ITEM &amp; DESCRIPTION</th>
          <th style="width: 72px; text-align: center;">HSN/SAC</th>
          <th style="width: 44px; text-align: center;">QTY</th>
          <th style="width: 80px; text-align: right;">RATE</th>
          <th style="width: 64px; text-align: right;">TAX %</th>
          <th style="width: 76px; text-align: right;">TAX AMT</th>
          <th style="width: 90px; text-align: right;">AMOUNT</th>
        </tr>
      </thead>
      <tbody>
        ${itemRowsHtml}
      </tbody>
    </table>

    <!-- Lower Section: Totals, Words, Notes & Signature -->
    <div class="lower-section">
      <!-- Left Column -->
      <div>
        <div class="words-label">TOTAL IN WORDS</div>
        <div class="words-value">${amountWords}</div>

        <div class="paid-badge">
          <div class="paid-badge-title">PAID IN FULL</div>
          <div class="paid-badge-sub">No outstanding amount remains on this invoice.</div>
        </div>

        <div class="notes-label">NOTES</div>
        <div class="notes-text">Thank you for your business with TTRC!</div>

        <div class="terms-label">TERMS &amp; CONDITIONS</div>
        <ol class="terms-list">
          <li>Payment is due upon receipt of invoice unless credit terms are explicitly agreed.</li>
          <li>Please mention Invoice Number in bank transfer or UPI payment remarks.</li>
          <li>Goods once sold are subject to standard warranty and inspection policies.</li>
          <li>Disputes, if any, shall be subject to Coimbatore jurisdiction.</li>
        </ol>
      </div>

      <!-- Right Column: Financial Totals & Signature -->
      <div>
        <table class="totals-table">
          <tr>
            <td>Sub Total</td>
            <td class="val">₹${(subtotalPaise / 100).toFixed(2)}</td>
          </tr>
          <tr>
            <td>Shipping charge</td>
            <td class="val">₹${(shippingPaise / 100).toFixed(2)}</td>
          </tr>
          ${
            isIntraState
              ? `
          <tr>
            <td>CGST (${data.items[0]?.gstPercent ? (data.items[0].gstPercent / 2) : '9'}%)</td>
            <td class="val">₹${(totalCgstPaise / 100).toFixed(2)}</td>
          </tr>
          <tr>
            <td>SGST (${data.items[0]?.gstPercent ? (data.items[0].gstPercent / 2) : '9'}%)</td>
            <td class="val">₹${(totalSgstPaise / 100).toFixed(2)}</td>
          </tr>
              `
              : `
          <tr>
            <td>IGST (${data.items[0]?.gstPercent || '18'}%)</td>
            <td class="val">₹${(totalIgstPaise / 100).toFixed(2)}</td>
          </tr>
              `
          }
          ${
            discountPaise > 0
              ? `
          <tr>
            <td style="color: #059669;">Discount</td>
            <td class="val" style="color: #059669;">- ₹${(discountPaise / 100).toFixed(2)}</td>
          </tr>
              `
              : ''
          }
          <tr class="grand-total-row">
            <td>Total</td>
            <td class="val">₹${(grandTotalPaise / 100).toFixed(2)}</td>
          </tr>
          <tr>
            <td>Payment Made</td>
            <td class="val">₹${(grandTotalPaise / 100).toFixed(2)}</td>
          </tr>
          <tr>
            <td>Balance Due</td>
            <td class="val">₹0.00</td>
          </tr>
        </table>

        <!-- Signature Block -->
        <div class="signature-area">
          <div class="sig-for">For TTRC</div>
          <img src="${signatureDataUri}" alt="Signature" class="sig-img" />
          <div class="sig-line"></div>
          <div class="sig-auth">Authorized Signature</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}
