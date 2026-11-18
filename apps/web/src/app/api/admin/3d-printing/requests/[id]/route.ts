import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/client';
import { PrintRequestModel, PrintQuoteModel } from '@/lib/mongodb/models';
import { requireAdmin } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await context.params;
    await connectToDatabase();

    const request = await PrintRequestModel.findById(id);
    if (!request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const quotes = await PrintQuoteModel.find({ request_id: id }).sort({ version: -1 });

    return NextResponse.json({
      request,
      quotes,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Error fetching request details' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await context.params;
    const body = await req.json();
    await connectToDatabase();

    const request = await PrintRequestModel.findById(id);
    if (!request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (body.adminNotes !== undefined) {
      request.admin_notes = body.adminNotes;
    }

    if (body.assignedPrinterName !== undefined) {
      request.assigned_printer_name = body.assignedPrinterName;
    }

    if (body.assignedPrinterId !== undefined) {
      request.assigned_printer_id = body.assignedPrinterId;
    }

    // Quotation Status change
    if (body.quotationStatus && body.quotationStatus !== request.quotation_status) {
      const prev = request.quotation_status;
      request.quotation_status = body.quotationStatus;
      request.status_history.push({
        machine: 'quotation',
        from_status: prev,
        to_status: body.quotationStatus,
        changed_by: auth.user.email,
        timestamp: new Date(),
        notes: body.statusNotes || `Admin changed quotation status to ${body.quotationStatus}`,
      });
    }

    // Production Status change
    if (body.productionStatus && body.productionStatus !== request.production_status) {
      const prev = request.production_status;
      request.production_status = body.productionStatus;
      request.status_history.push({
        machine: 'production',
        from_status: prev,
        to_status: body.productionStatus,
        changed_by: auth.user.email,
        timestamp: new Date(),
        notes: body.statusNotes || `Admin changed production status to ${body.productionStatus}`,
      });
    }

    // Clarification query from admin to customer
    if (body.clarificationQuery) {
      request.clarification_thread.push({
        sender: 'admin',
        message: body.clarificationQuery,
        timestamp: new Date(),
      });
      const prev = request.quotation_status;
      request.quotation_status = 'NEEDS_CLARIFICATION';
      request.status_history.push({
        machine: 'quotation',
        from_status: prev,
        to_status: 'NEEDS_CLARIFICATION',
        changed_by: auth.user.email,
        timestamp: new Date(),
        notes: `Admin requested clarification: "${body.clarificationQuery.substring(0, 100)}..."`,
      });
    }

    await request.save();

    return NextResponse.json({ success: true, request });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Error updating print request' },
      { status: 500 }
    );
  }
}

