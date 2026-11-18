import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectToDatabase } from '@/lib/mongodb/client';
import {
  PrintRequestModel,
  PrintQuoteModel,
} from '@/lib/mongodb/models';
import { requireAdmin } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

const CreateQuoteSchema = z.object({
  requestId: z.string().min(1),
  materialCostPaise: z.number().int().min(0),
  machineCostPaise: z.number().int().min(0),
  labourCostPaise: z.number().int().min(0),
  supportCostPaise: z.number().int().min(0),
  finishingCostPaise: z.number().int().min(0),
  packagingCostPaise: z.number().int().min(0),
  shippingCostPaise: z.number().int().min(0),
  taxPaise: z.number().int().min(0),
  totalPaise: z.number().int().min(1),
  leadTimeDays: z.number().int().min(1).default(3),
  validityDays: z.number().int().min(1).default(14),
  technicalRemarks: z.string().default(''),
  assignedPrinterName: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const json = await req.json();
    const parsed = CreateQuoteSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid quotation payload', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    await connectToDatabase();

    const request = await PrintRequestModel.findById(data.requestId);
    if (!request) {
      return NextResponse.json({ error: 'Print request not found.' }, { status: 404 });
    }

    // Determine quotation version
    const existingQuotes = await PrintQuoteModel.find({ request_id: data.requestId }).sort({ version: -1 });
    const nextVersion = existingQuotes.length > 0 ? existingQuotes[0].version + 1 : 1;

    // Mark previous versions as superseded
    if (existingQuotes.length > 0) {
      await PrintQuoteModel.updateMany({ request_id: data.requestId }, { is_superseded: true });
    }

    const quoteNumber = `${request.request_number}-Q-V${nextVersion}`;
    const validUntil = new Date(Date.now() + data.validityDays * 24 * 60 * 60 * 1000);

    const quote = await PrintQuoteModel.create({
      quote_number: quoteNumber,
      request_id: data.requestId,
      version: nextVersion,
      breakdown: {
        material_cost_paise: data.materialCostPaise,
        machine_cost_paise: data.machineCostPaise,
        labour_cost_paise: data.labourCostPaise,
        support_cost_paise: data.supportCostPaise,
        finishing_cost_paise: data.finishingCostPaise,
        packaging_cost_paise: data.packagingCostPaise,
        shipping_cost_paise: data.shippingCostPaise,
        tax_paise: data.taxPaise,
        total_paise: data.totalPaise,
      },
      lead_time_days: data.leadTimeDays,
      valid_until: validUntil,
      technical_remarks: data.technicalRemarks,
      assigned_printer_name: data.assignedPrinterName,
      is_superseded: false,
      status: 'SENT',
      created_by: auth.user.email,
    });

    // Update Request status to QUOTE_SENT
    const prevStatus = request.quotation_status;
    request.quotation_status = 'QUOTE_SENT';
    request.active_quote_id = quote._id.toString();
    if (data.assignedPrinterName) {
      request.assigned_printer_name = data.assignedPrinterName;
    }

    request.status_history.push({
      machine: 'quotation',
      from_status: prevStatus,
      to_status: 'QUOTE_SENT',
      changed_by: auth.user.email,
      timestamp: new Date(),
      notes: `Admin issued official quote ${quoteNumber} totaling ₹${(data.totalPaise / 100).toFixed(2)}.`,
    });

    await request.save();

    return NextResponse.json({
      success: true,
      quote,
      request,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Error generating quotation' },
      { status: 500 }
    );
  }
}

