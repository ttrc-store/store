/**
 * Pure Node.js Standard PDF 1.4 Invoice Generator for TTRC Store
 * Produces valid PDF documents compatible with Adobe Acrobat, Gmail, Preview, Chrome.
 */

export interface InvoicePdfData {
  invoiceNumber: string;
  orderNumber: string;
  orderDate: string;
  paymentId: string;
  paymentMethod: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  sellerName?: string;
  sellerAddress?: string;
  items: Array<{
    name: string;
    hsn: string;
    quantity: number;
    unitPriceRupees: number;
    taxPercent: number;
    totalRupees: number;
  }>;
  subtotalRupees: number;
  cgstRupees?: number;
  sgstRupees?: number;
  igstRupees?: number;
  shippingRupees: number;
  grandTotalRupees: number;
  amountInWords: string;
}

export function generateInvoicePdfBuffer(data: InvoicePdfData): Buffer {
  const objects: string[] = [];

  function addObject(content: string): number {
    objects.push(content);
    return objects.length; // 1-based index
  }

  // Escape special PDF string characters: \ ( )
  function escapePdfString(str: string): string {
    return (str || '').replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  }

  // We will build a single page A4 (595.28 x 841.89 points)
  // PDF Origin is bottom-left (0,0). Top-left is (0, 842).
  const pageHeight = 842;
  const pageWidth = 595;
  const margin = 40;

  const streamCommands: string[] = [];

  // Helper for text rendering
  function drawText(text: string, x: number, yFromTop: number, font = 'F1', size = 10, r = 0.08, g = 0.08, b = 0.1) {
    const y = pageHeight - yFromTop;
    streamCommands.push(`
      ${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg
      BT
      /${font} ${size} Tf
      1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm
      (${escapePdfString(text)}) Tj
      ET
    `.trim());
  }

  // Helper for drawing rectangles
  function drawRect(x: number, yFromTop: number, w: number, h: number, r = 0.95, g = 0.95, b = 0.96, isFill = true) {
    const y = pageHeight - yFromTop - h;
    streamCommands.push(`
      ${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} ${isFill ? 'rg' : 'RG'}
      ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re
      ${isFill ? 'f' : 'S'}
    `.trim());
  }

  // Helper for drawing lines
  function drawLine(x1: number, y1FromTop: number, x2: number, y2FromTop: number, r = 0.85, g = 0.85, b = 0.88, lineWidth = 1) {
    const y1 = pageHeight - y1FromTop;
    const y2 = pageHeight - y2FromTop;
    streamCommands.push(`
      ${lineWidth} w
      ${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} RG
      ${x1.toFixed(2)} ${y1.toFixed(2)} m
      ${x2.toFixed(2)} ${y2.toFixed(2)} l
      S
    `.trim());
  }

  // --- 1. Top Decorative Brand Bar ---
  drawRect(0, 0, pageWidth, 8, 0.518, 0.290, 0.984); // #844AFB

  // --- 2. Header Section ---
  drawText('TTRC STORE', margin, 50, 'F2', 20, 0.118, 0.051, 0.271); // #1E0D45
  drawText('TAX INVOICE / SALE RECEIPT', pageWidth - margin - 200, 48, 'F2', 13, 0.518, 0.290, 0.984);
  drawText(`Invoice No: ${data.invoiceNumber}`, pageWidth - margin - 200, 64, 'F2', 10, 0.08, 0.08, 0.1);
  drawText(`Date: ${data.orderDate}`, pageWidth - margin - 200, 78, 'F1', 9, 0.42, 0.42, 0.42);
  drawText(`Order ID: ${data.orderNumber}`, pageWidth - margin - 200, 92, 'F1', 9, 0.42, 0.42, 0.42);

  drawText('Tamizh Tech Robotics Company', margin, 70, 'F2', 10, 0.2, 0.2, 0.2);
  drawText('Sri Vari Garden, Kurumbapalayam, Coimbatore - 641107', margin, 84, 'F1', 9, 0.42, 0.42, 0.42);
  drawText('Tamil Nadu, India | Web: https://www.ttrc.store', margin, 98, 'F1', 9, 0.42, 0.42, 0.42);
  drawText('Email: support@ttrc.store | Phone: +91 7904902978', margin, 112, 'F1', 9, 0.42, 0.42, 0.42);

  drawLine(margin, 126, pageWidth - margin, 126, 0.9, 0.9, 0.92, 1);

  // --- 3. Bill To / Payment Details Cards ---
  const cardY = 140;
  const colW = (pageWidth - (margin * 2) - 16) / 2;

  // Left card: Bill To
  drawRect(margin, cardY, colW, 80, 0.98, 0.98, 0.99, true);
  drawRect(margin, cardY, colW, 80, 0.9, 0.9, 0.93, false);
  drawText('BILL TO / RECIPIENT', margin + 12, cardY + 18, 'F2', 9, 0.4, 0.4, 0.45);
  drawText(data.customerName, margin + 12, cardY + 34, 'F2', 11, 0.08, 0.08, 0.1);
  drawText(data.customerPhone ? `Phone: ${data.customerPhone}` : '', margin + 12, cardY + 48, 'F1', 9, 0.42, 0.42, 0.42);
  drawText(data.customerAddress ? data.customerAddress.substring(0, 48) : 'Tamil Nadu, India', margin + 12, cardY + 62, 'F1', 9, 0.42, 0.42, 0.42);

  // Right card: Payment Info
  const rightCardX = margin + colW + 16;
  drawRect(rightCardX, cardY, colW, 80, 0.98, 0.98, 0.99, true);
  drawRect(rightCardX, cardY, colW, 80, 0.9, 0.9, 0.93, false);
  drawText('PAYMENT INFORMATION', rightCardX + 12, cardY + 18, 'F2', 9, 0.4, 0.4, 0.45);
  drawText(`Payment Method: ${data.paymentMethod}`, rightCardX + 12, cardY + 34, 'F2', 10, 0.08, 0.08, 0.1);
  drawText(`Transaction ID: ${data.paymentId}`, rightCardX + 12, cardY + 48, 'F1', 9, 0.42, 0.42, 0.42);
  drawText('Status: VERIFIED & COMPLETED', rightCardX + 12, cardY + 62, 'F2', 9, 0.05, 0.6, 0.3); // Green

  // --- 4. Items Table ---
  const tableY = 236;
  const tableW = pageWidth - (margin * 2);
  // Table Header
  drawRect(margin, tableY, tableW, 24, 0.933, 0.910, 0.980); // #EEE8FA
  drawText('ITEM DESCRIPTION', margin + 10, tableY + 16, 'F2', 9, 0.118, 0.051, 0.271);
  drawText('HSN', margin + 260, tableY + 16, 'F2', 9, 0.118, 0.051, 0.271);
  drawText('QTY', margin + 320, tableY + 16, 'F2', 9, 0.118, 0.051, 0.271);
  drawText('RATE (INR)', margin + 370, tableY + 16, 'F2', 9, 0.118, 0.051, 0.271);
  drawText('AMOUNT (INR)', margin + 440, tableY + 16, 'F2', 9, 0.118, 0.051, 0.271);

  let currentY = tableY + 24;
  data.items.forEach((item, idx) => {
    const isAlt = idx % 2 === 1;
    if (isAlt) {
      drawRect(margin, currentY, tableW, 24, 0.99, 0.99, 1.0);
    }
    drawText(item.name.substring(0, 36), margin + 10, currentY + 16, 'F1', 9.5, 0.1, 0.1, 0.1);
    drawText(item.hsn || '8479', margin + 260, currentY + 16, 'F1', 9, 0.4, 0.4, 0.4);
    drawText(`${item.quantity}`, margin + 326, currentY + 16, 'F1', 9.5, 0.1, 0.1, 0.1);
    drawText(`Rs. ${item.unitPriceRupees.toFixed(2)}`, margin + 370, currentY + 16, 'F1', 9.5, 0.1, 0.1, 0.1);
    drawText(`Rs. ${item.totalRupees.toFixed(2)}`, margin + 440, currentY + 16, 'F2', 9.5, 0.1, 0.1, 0.1);
    drawLine(margin, currentY + 24, pageWidth - margin, currentY + 24, 0.92, 0.92, 0.94, 0.5);
    currentY += 24;
  });

  // --- 5. Totals Breakdown Section ---
  currentY += 12;
  const totalsX = margin + 300;
  const totalsW = pageWidth - margin - totalsX;

  drawText('Sub Total:', totalsX, currentY + 14, 'F1', 9.5, 0.4, 0.4, 0.4);
  drawText(`Rs. ${data.subtotalRupees.toFixed(2)}`, margin + 440, currentY + 14, 'F1', 9.5, 0.1, 0.1, 0.1);
  currentY += 18;

  if (data.shippingRupees > 0) {
    drawText('Shipping Charges:', totalsX, currentY + 14, 'F1', 9.5, 0.4, 0.4, 0.4);
    drawText(`Rs. ${data.shippingRupees.toFixed(2)}`, margin + 440, currentY + 14, 'F1', 9.5, 0.1, 0.1, 0.1);
    currentY += 18;
  }

  if (data.cgstRupees && data.cgstRupees > 0) {
    drawText('CGST (9%):', totalsX, currentY + 14, 'F1', 9, 0.4, 0.4, 0.4);
    drawText(`Rs. ${data.cgstRupees.toFixed(2)}`, margin + 440, currentY + 14, 'F1', 9, 0.1, 0.1, 0.1);
    currentY += 16;
  }
  if (data.sgstRupees && data.sgstRupees > 0) {
    drawText('SGST (9%):', totalsX, currentY + 14, 'F1', 9, 0.4, 0.4, 0.4);
    drawText(`Rs. ${data.sgstRupees.toFixed(2)}`, margin + 440, currentY + 14, 'F1', 9, 0.1, 0.1, 0.1);
    currentY += 16;
  }
  if (data.igstRupees && data.igstRupees > 0) {
    drawText('IGST (18%):', totalsX, currentY + 14, 'F1', 9, 0.4, 0.4, 0.4);
    drawText(`Rs. ${data.igstRupees.toFixed(2)}`, margin + 440, currentY + 14, 'F1', 9, 0.1, 0.1, 0.1);
    currentY += 16;
  }

  // Grand Total Highlight Box
  currentY += 6;
  drawRect(totalsX - 10, currentY, totalsW + 10, 28, 0.933, 0.910, 0.980, true);
  drawText('Total Paid:', totalsX, currentY + 19, 'F2', 11, 0.118, 0.051, 0.271);
  drawText(`Rs. ${data.grandTotalRupees.toFixed(2)}`, margin + 440, currentY + 19, 'F2', 13, 0.518, 0.290, 0.984);
  currentY += 38;

  // Amount in words
  drawText(`Amount in Words: ${data.amountInWords}`, margin, currentY, 'F1', 9, 0.35, 0.35, 0.35);

  // --- 6. Footer Signature Block ---
  const footerY = 700;
  drawLine(margin, footerY, pageWidth - margin, footerY, 0.9, 0.9, 0.92, 1);

  drawText('Thanks & Regards,', margin, footerY + 20, 'F2', 10, 0.118, 0.051, 0.271);
  drawText('Team TTRC', margin, footerY + 34, 'F2', 12, 0.518, 0.290, 0.984);
  drawText('Think it. Build it. Make it. Move it.', margin, footerY + 48, 'F1', 9, 0.42, 0.42, 0.42);
  drawText('https://www.ttrc.store/ | Coimbatore, Tamil Nadu', margin, footerY + 62, 'F1', 8.5, 0.42, 0.42, 0.42);
  drawText('Support: +91 7904902978', margin, footerY + 74, 'F2', 8.5, 0.118, 0.051, 0.271);

  drawText('For TTRC Store', pageWidth - margin - 150, footerY + 20, 'F1', 9.5, 0.4, 0.4, 0.4);
  drawText('[ Authorized Signatory ]', pageWidth - margin - 150, footerY + 54, 'F2', 10, 0.118, 0.051, 0.271);
  drawText('Computer Generated Invoice', pageWidth - margin - 150, footerY + 68, 'F1', 8, 0.5, 0.5, 0.5);

  // --- 7. Assemble PDF Structure ---
  const contentStream = streamCommands.join('\n');
  const streamLength = Buffer.byteLength(contentStream, 'utf-8');

  // Object 1: Catalog
  const catObjId = addObject(`<< /Type /Catalog /Pages 2 0 R >>`);

  // Object 2: Pages
  const pagesObjId = addObject(`<< /Type /Pages /Kids [ 3 0 R ] /Count 1 >>`);

  // Object 3: Page
  const pageObjId = addObject(`<<
  /Type /Page
  /Parent 2 0 R
  /MediaBox [ 0 0 ${pageWidth} ${pageHeight} ]
  /Contents 4 0 R
  /Resources <<
    /Font <<
      /F1 5 0 R
      /F2 6 0 R
    >>
  >>
>>`);

  // Object 4: Content Stream
  const streamObjId = addObject(`<< /Length ${streamLength} >>
stream
${contentStream}
endstream`);

  // Object 5: Standard Font Helvetica
  const font1ObjId = addObject(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`);

  // Object 6: Standard Font Helvetica-Bold
  const font2ObjId = addObject(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>`);

  // Build PDF Binary Buffer
  let pdfOutput = `%PDF-1.4\n%âãÏÓ\n`;
  const offsets: number[] = [0];

  objects.forEach((objContent, idx) => {
    const objNum = idx + 1;
    offsets.push(Buffer.byteLength(pdfOutput, 'binary'));
    pdfOutput += `${objNum} 0 obj\n${objContent}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdfOutput, 'binary');
  pdfOutput += `xref\n0 ${objects.length + 1}\n`;
  pdfOutput += `0000000000 65535 f \n`;

  for (let i = 1; i <= objects.length; i++) {
    const offStr = offsets[i].toString().padStart(10, '0');
    pdfOutput += `${offStr} 00000 n \n`;
  }

  pdfOutput += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(pdfOutput, 'binary');
}
