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
    const { notes } = await req.json();

    if (!notes || typeof notes !== 'string') {
      return NextResponse.json({ error: 'Revision notes are required.' }, { status: 400 });
    }

    await connectToDatabase();
    const request = await PrintRequestModel.findById(id);
    if (!request) {
      return NextResponse.json({ error: 'Request not found.' }, { status: 404 });
    }

    const prevStatus = request.quotation_status;
    request.quotation_status = 'REVISION_REQUESTED';
    request.status_history.push({
      machine: 'quotation',
      from_status: prevStatus,
      to_status: 'REVISION_REQUESTED',
      changed_by: request.customer.email,
      timestamp: new Date(),
      notes: `Customer requested revision: "${notes.trim().substring(0, 100)}..."`,
    });

    await request.save();

    return NextResponse.json({ success: true, request });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Error submitting revision request' },
      { status: 500 }
    );
  }
}
