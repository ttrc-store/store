import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/client';
import { PrintRequestModel } from '@/lib/mongodb/models';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { message } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message content is required.' }, { status: 400 });
    }

    await connectToDatabase();
    const request = await PrintRequestModel.findById(id);
    if (!request) {
      return NextResponse.json({ error: 'Request not found.' }, { status: 404 });
    }

    // Append clarification message
    request.clarification_thread.push({
      sender: 'customer',
      message: message.trim(),
      timestamp: new Date(),
    });

    // Loopback: Return from NEEDS_CLARIFICATION to UNDER_REVIEW
    const prevStatus = request.quotation_status;
    request.quotation_status = 'UNDER_REVIEW';
    request.status_history.push({
      machine: 'quotation',
      from_status: prevStatus,
      to_status: 'UNDER_REVIEW',
      changed_by: request.customer.email,
      timestamp: new Date(),
      notes: `Customer provided clarification: "${message.substring(0, 100)}..."`,
    });

    await request.save();

    return NextResponse.json({ success: true, request });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Error sending clarification' },
      { status: 500 }
    );
  }
}
